import {
  ChatServiceError,
  prepareChatTurn,
  prepareSandboxChatTurn,
  rollbackFailedTurn,
  saveAssistantMessage,
  streamChatReply,
} from "@/lib/chat/service";

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export type ChatStreamOptions = {
  organizationId: string;
  message: string;
  conversationId: string | null;
  visitorId?: string | null;
  channel?: "ADMIN" | "WIDGET" | "HELP_CENTER";
  sandbox?: boolean;
};

export async function createChatStreamResponse({
  organizationId,
  message,
  conversationId,
  visitorId,
  channel = "ADMIN",
  sandbox = false,
}: ChatStreamOptions) {
  let rollbackTarget: { conversationId: string; userMessageId: string } | null =
    null;

  try {
    const prepared = sandbox
      ? {
          conversationId: null,
          userMessageId: null,
          ...(await prepareSandboxChatTurn(organizationId, message)),
        }
      : await prepareChatTurn(organizationId, message, conversationId, {
          visitorId,
          channel,
        });

    if (!sandbox && prepared.conversationId && prepared.userMessageId) {
      rollbackTarget = {
        conversationId: prepared.conversationId,
        userMessageId: prepared.userMessageId,
      };
    }

    const { stream, reply: fallback } = await streamChatReply(
      organizationId,
      message,
      prepared.rankedChunks,
      prepared.fallbackReply,
    );

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              encodeSse("meta", {
                conversationId: prepared.conversationId,
                sources: prepared.sources,
                retrievalMode: prepared.retrievalMode,
                chunksMatched: prepared.chunksMatched,
                confidence: prepared.confidence,
              }),
            ),
          );

          let fullReply = fallback ?? "";

          if (stream) {
            fullReply = "";
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (!text) continue;
              fullReply += text;
              controller.enqueue(encoder.encode(encodeSse("token", { text })));
            }
          } else {
            for (const word of fullReply.split(" ")) {
              controller.enqueue(
                encoder.encode(encodeSse("token", { text: `${word} ` })),
              );
            }
          }

          if (!sandbox && prepared.conversationId) {
            const assistantMessage = await saveAssistantMessage(
              prepared.conversationId,
              fullReply,
              prepared.sources,
            );

            controller.enqueue(
              encoder.encode(
                encodeSse("done", {
                  messageId: assistantMessage.id,
                  reply: fullReply,
                }),
              ),
            );
          } else {
            controller.enqueue(
              encoder.encode(
                encodeSse("done", {
                  reply: fullReply,
                  sandbox: true,
                }),
              ),
            );
          }
          controller.close();
        } catch (streamError) {
          console.error(streamError);
          if (
            !sandbox &&
            prepared.conversationId &&
            prepared.userMessageId
          ) {
            await rollbackFailedTurn(
              prepared.conversationId,
              prepared.userMessageId,
            );
          }
          controller.enqueue(
            encoder.encode(
              encodeSse("error", {
                error:
                  streamError instanceof Error
                    ? streamError.message
                    : "Stream failed",
                conversationId: prepared.conversationId,
              }),
            ),
          );
          controller.close();
        }
      },
    });

    rollbackTarget = null;

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (rollbackTarget) {
      await rollbackFailedTurn(
        rollbackTarget.conversationId,
        rollbackTarget.userMessageId,
      );
    }

    if (
      error instanceof ChatServiceError &&
      error.code === "CONVERSATION_NOT_FOUND"
    ) {
      return new Response(
        JSON.stringify({ error: error.message, conversationId }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    throw error;
  }
}
