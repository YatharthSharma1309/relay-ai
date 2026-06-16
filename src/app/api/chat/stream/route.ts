import { authErrorResponse, requireOrgMembership } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/json";
import { createChatStreamResponse } from "@/lib/chat/stream-handler";
import { validateChatMessage } from "@/lib/chat/constants";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  let conversationId: string | null = null;

  try {
    const { organization } = await requireOrgMembership();

    if (await checkRateLimit(`admin-chat:${organization.id}`, 60, 60_000)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = await parseJsonBody<{
      message?: string;
      conversationId?: string;
      sandbox?: boolean;
    }>(request);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;
    const message = String(body.message ?? "").trim();
    conversationId = body.conversationId ? String(body.conversationId) : null;
    const sandbox = body.sandbox === true;

    const messageError = validateChatMessage(message);
    if (messageError) {
      return new Response(JSON.stringify({ error: messageError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return await createChatStreamResponse({
      organizationId: organization.id,
      message,
      conversationId,
      channel: "ADMIN",
      sandbox,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error(error);
    return new Response(
      JSON.stringify({
        error: "Chat stream failed. Check database and OpenRouter settings.",
        conversationId,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
