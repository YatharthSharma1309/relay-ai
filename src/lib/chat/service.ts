import { db } from "@/lib/db";
import { getAiClient, getChatModel, isAiConfigured, isEmbeddingEnabled } from "@/lib/ai";
import { computeGroundingConfidence, type GroundingConfidence } from "@/lib/rag/confidence";
import { MAX_RAG_CHUNKS_FETCH } from "@/lib/rag/constants";
import { createEmbedding } from "@/lib/rag/embed";
import {
  buildRagPrompt,
  retrieveRelevantChunksWithMode,
  type ChunkWithScore,
} from "@/lib/rag/retrieve";
import {
  buildAgentSystemPrompt,
  getAgentSettings,
  type AgentSettings,
} from "@/lib/settings";

export type ChatSource = {
  documentTitle?: string;
  content: string;
};

export type PreparedChat = {
  conversationId: string;
  userMessageId: string;
  rankedChunks: ChunkWithScore[];
  sources: ChatSource[];
  retrievalMode: "vector" | "keyword";
  chunksMatched: number;
  confidence: GroundingConfidence;
  fallbackReply: string;
};

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "CONVERSATION_NOT_FOUND"
      | "INVALID_MESSAGE"
      | "AI_UNAVAILABLE"
      | "AI_FAILED",
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

async function touchConversation(conversationId: string) {
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function rollbackFailedTurn(
  conversationId: string,
  userMessageId: string,
) {
  await db.message.delete({ where: { id: userMessageId } }).catch(() => null);

  const remaining = await db.message.count({
    where: { conversationId },
  });

  if (remaining === 0) {
    await db.conversation.delete({ where: { id: conversationId } }).catch(() => null);
  }
}

async function retrieveChatContext(organizationId: string, message: string) {
  const chunks = await db.documentChunk.findMany({
    where: {
      document: {
        organizationId,
        status: "READY",
      },
    },
    take: MAX_RAG_CHUNKS_FETCH,
    orderBy: { chunkIndex: "asc" },
    include: {
      document: {
        select: { title: true },
      },
    },
  });

  let queryEmbedding: number[] | null = null;

  if (isEmbeddingEnabled()) {
    try {
      queryEmbedding = await createEmbedding(message);
    } catch (error) {
      console.error("Embedding failed, falling back to keyword retrieval:", error);
      queryEmbedding = null;
    }
  }

  const mappedChunks = chunks.map((chunk) => ({
    id: chunk.id,
    documentId: chunk.documentId,
    content: chunk.content,
    embedding: chunk.embedding,
    documentTitle: chunk.document.title,
  }));

  const { chunks: rankedChunks, mode: retrievalMode } =
    retrieveRelevantChunksWithMode(message, mappedChunks, queryEmbedding);

  const confidence = computeGroundingConfidence(rankedChunks, retrievalMode);

  const sources = rankedChunks.map((chunk) => ({
    documentTitle: chunk.documentTitle,
    content: chunk.content,
  }));

  let fallbackReply =
    "I could not find an answer in the knowledge base yet. Upload support documents or create a ticket for help.";

  if (rankedChunks.length === 0) {
    fallbackReply =
      "I could not find relevant information in your knowledge base. Try uploading FAQs or escalate to a support ticket.";
  } else if (!isAiConfigured()) {
    fallbackReply = `Based on your documentation:\n\n${rankedChunks[0].content.slice(0, 700)}`;
  }

  return {
    rankedChunks,
    sources,
    retrievalMode,
    chunksMatched: rankedChunks.length,
    confidence,
    fallbackReply,
  };
}

export async function prepareSandboxChatTurn(
  organizationId: string,
  message: string,
) {
  return retrieveChatContext(organizationId, message);
}

export async function prepareChatTurn(
  organizationId: string,
  message: string,
  conversationId: string | null,
  options?: {
    visitorId?: string | null;
    channel?: "ADMIN" | "WIDGET" | "HELP_CENTER";
  },
) {
  const visitorId = options?.visitorId ?? null;
  const channel = options?.channel ?? "ADMIN";

  let conversation = null;

  if (conversationId) {
    conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        ...(visitorId ? { visitorId } : {}),
      },
    });

    if (!conversation) {
      throw new ChatServiceError(
        "Conversation not found",
        "CONVERSATION_NOT_FOUND",
      );
    }
  } else {
    conversation = await db.conversation.create({
      data: {
        organizationId,
        title: message.slice(0, 80),
        visitorId,
        channel,
      },
    });
  }

  const userMessage = await db.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: message,
    },
  });

  await touchConversation(conversation.id);

  try {
    const context = await retrieveChatContext(organizationId, message);

    return {
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      ...context,
    } satisfies PreparedChat;
  } catch (error) {
    await rollbackFailedTurn(conversation.id, userMessage.id);
    throw error;
  }
}

async function resolveSystemPrompt(organizationId: string) {
  const settings = await getAgentSettings(organizationId);
  return buildAgentSystemPrompt(settings);
}

export async function generateChatReply(
  organizationId: string,
  message: string,
  rankedChunks: ChunkWithScore[],
  fallbackReply: string,
) {
  if (rankedChunks.length === 0) {
    return fallbackReply;
  }

  if (!isAiConfigured()) {
    return fallbackReply;
  }

  const client = getAiClient();
  const prompt = buildRagPrompt(message, rankedChunks);
  const systemPrompt = await resolveSystemPrompt(organizationId);

  try {
    const completion = await client!.chat.completions.create({
      model: getChatModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    return (
      completion.choices[0]?.message?.content?.trim() ??
      "I could not generate a response right now."
    );
  } catch {
    return `Based on your documentation:\n\n${rankedChunks[0].content.slice(0, 700)}`;
  }
}

export async function streamChatReply(
  organizationId: string,
  message: string,
  rankedChunks: ChunkWithScore[],
  fallbackReply: string,
) {
  if (rankedChunks.length === 0 || !isAiConfigured()) {
    return {
      stream: null,
      reply: fallbackReply,
    };
  }

  const client = getAiClient();
  const prompt = buildRagPrompt(message, rankedChunks);
  const systemPrompt = await resolveSystemPrompt(organizationId);

  try {
    const stream = await client!.chat.completions.create({
      model: getChatModel(),
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    return { stream, reply: null };
  } catch {
    return {
      stream: null,
      reply: `Based on your documentation:\n\n${rankedChunks[0].content.slice(0, 700)}`,
    };
  }
}

export async function saveAssistantMessage(
  conversationId: string,
  content: string,
  sources: ChatSource[],
) {
  const message = await db.message.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content,
      sources,
    },
  });

  await touchConversation(conversationId);

  return message;
}

export async function suggestTicketReply(
  organizationId: string,
  ticket: {
    title: string;
    description: string;
    conversation: {
      messages: Array<{ role: string; content: string }>;
    } | null;
  },
) {
  const transcript = ticket.conversation?.messages
    .filter((message) => message.role !== "SYSTEM")
    .map((message) => `${message.role.toLowerCase()}: ${message.content}`)
    .join("\n\n");

  const query = transcript
    ? `${ticket.title}\n\nLatest context:\n${transcript.slice(-1200)}`
    : ticket.title;

  let queryEmbedding: number[] | null = null;

  if (isEmbeddingEnabled()) {
    try {
      queryEmbedding = await createEmbedding(query.slice(0, 500));
    } catch (error) {
      console.error("Embedding failed for ticket suggest-reply:", error);
      queryEmbedding = null;
    }
  }

  const chunks = await db.documentChunk.findMany({
    where: {
      document: { organizationId, status: "READY" },
    },
    take: MAX_RAG_CHUNKS_FETCH,
    orderBy: { chunkIndex: "asc" },
    include: { document: { select: { title: true } } },
  });

  const { chunks: rankedChunks } = retrieveRelevantChunksWithMode(
    query,
    chunks.map((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      content: chunk.content,
      embedding: chunk.embedding,
      documentTitle: chunk.document.title,
    })),
    queryEmbedding,
  );

  if (!isAiConfigured()) {
    if (rankedChunks.length === 0) {
      return "Thanks for reaching out. I'm reviewing your request and will follow up shortly with next steps.";
    }
    return `Hi — thanks for your patience. Based on our docs:\n\n${rankedChunks[0].content.slice(0, 500)}`;
  }

  const client = getAiClient();
  const context =
    rankedChunks.length > 0
      ? rankedChunks
          .map(
            (chunk, index) =>
              `[Source ${index + 1}]\n${chunk.content.slice(0, 400)}`,
          )
          .join("\n\n")
      : "No matching documentation found.";

  try {
    const completion = await client!.chat.completions.create({
      model: getChatModel(),
      messages: [
        {
          role: "system",
          content:
            "You are a support agent drafting a helpful reply to a customer ticket. Be empathetic, concise, and grounded in the provided context and transcript.",
        },
        {
          role: "user",
          content: `Ticket: ${ticket.title}\n\nDescription:\n${ticket.description}\n\nTranscript:\n${transcript ?? "None"}\n\nKnowledge context:\n${context}\n\nDraft a reply the agent can send.`,
        },
      ],
      temperature: 0.3,
    });

    const suggestion = completion.choices[0]?.message?.content?.trim();
    if (!suggestion) {
      throw new ChatServiceError(
        "AI returned an empty suggestion",
        "AI_FAILED",
      );
    }

    return suggestion;
  } catch (error) {
    if (error instanceof ChatServiceError) {
      throw error;
    }

    throw new ChatServiceError(
      error instanceof Error ? error.message : "AI request failed",
      "AI_FAILED",
    );
  }
}

export type { AgentSettings };
