import { NextResponse } from "next/server";
import { authErrorResponse, requireOrgMembership } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/json";
import {
  ChatServiceError,
  generateChatReply,
  prepareChatTurn,
  prepareSandboxChatTurn,
  rollbackFailedTurn,
  saveAssistantMessage,
} from "@/lib/chat/service";
import { validateChatMessage } from "@/lib/chat/constants";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let conversationId: string | null = null;
  let userMessageId: string | null = null;
  let preparedConversationId: string | null = null;

  try {
    const { organization } = await requireOrgMembership();

    if (await checkRateLimit(`admin-chat:${organization.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const parsed = await parseJsonBody<{
      message?: string;
      conversationId?: string;
      sandbox?: boolean;
    }>(request);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;
    const message = String(body.message ?? "").trim();
    const sandbox = body.sandbox === true;
    conversationId = body.conversationId ? String(body.conversationId) : null;

    const messageError = validateChatMessage(message);
    if (messageError) {
      return NextResponse.json({ error: messageError }, { status: 400 });
    }

    if (sandbox) {
      const prepared = await prepareSandboxChatTurn(organization.id, message);
      const reply = await generateChatReply(
        organization.id,
        message,
        prepared.rankedChunks,
        prepared.fallbackReply,
      );

      return NextResponse.json({
        reply,
        sources: prepared.sources,
        retrievalMode: prepared.retrievalMode,
        chunksMatched: prepared.chunksMatched,
        confidence: prepared.confidence,
        sandbox: true,
      });
    }

    const prepared = await prepareChatTurn(
      organization.id,
      message,
      conversationId,
      { channel: "ADMIN" },
    );

    preparedConversationId = prepared.conversationId;
    userMessageId = prepared.userMessageId;
    conversationId = prepared.conversationId;

    const reply = await generateChatReply(
      organization.id,
      message,
      prepared.rankedChunks,
      prepared.fallbackReply,
    );

    const assistantMessage = await saveAssistantMessage(
      prepared.conversationId,
      reply,
      prepared.sources,
    );

    return NextResponse.json({
      conversationId: prepared.conversationId,
      messageId: assistantMessage.id,
      reply,
      sources: prepared.sources,
      retrievalMode: prepared.retrievalMode,
      chunksMatched: prepared.chunksMatched,
      confidence: prepared.confidence,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    if (userMessageId && preparedConversationId) {
      await rollbackFailedTurn(preparedConversationId, userMessageId);
    }

    if (
      error instanceof ChatServiceError &&
      error.code === "CONVERSATION_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: error.message, conversationId },
        { status: 404 },
      );
    }

    console.error(error);
    return NextResponse.json(
      {
        error: "Chat request failed. Check database and OpenRouter settings.",
        conversationId,
      },
      { status: 500 },
    );
  }
}
