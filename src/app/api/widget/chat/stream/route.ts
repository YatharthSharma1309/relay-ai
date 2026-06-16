import {
  getWidgetKeyFromRequest,
  resolveWidgetOrganization,
  widgetAuthErrorResponse,
} from "@/lib/auth/widget";
import { assertWidgetVisitor } from "@/lib/auth/widget-visitor";
import { parseJsonBody } from "@/lib/api/json";
import { validateChatMessage } from "@/lib/chat/constants";
import { createChatStreamResponse } from "@/lib/chat/stream-handler";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  let conversationId: string | null = null;

  try {
    const widgetKey = getWidgetKeyFromRequest(request);
    const organization = await resolveWidgetOrganization(widgetKey, request);

    const ip = getClientIp(request);
    if (
      (await checkRateLimit(`widget-chat:${organization.id}:${ip}`, 30, 60_000)) ||
      (await checkRateLimit(`widget-chat:${organization.id}`, 200, 60_000))
    ) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = await parseJsonBody<{
      message?: string;
      conversationId?: string;
      visitorId?: string;
      visitorToken?: string;
      channel?: string;
    }>(request);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;
    const message = String(body.message ?? "").trim();
    conversationId = body.conversationId ? String(body.conversationId) : null;
    const visitorId = assertWidgetVisitor(
      organization.id,
      body.visitorId,
      body.visitorToken,
    );
    const channelInput = String(body.channel ?? "WIDGET").toUpperCase();
    const channel =
      channelInput === "HELP_CENTER" ? "HELP_CENTER" : ("WIDGET" as const);

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
      visitorId,
      channel,
    });
  } catch (error) {
    const widgetResponse = widgetAuthErrorResponse(error);
    if (widgetResponse) return widgetResponse;

    console.error(error);
    return new Response(
      JSON.stringify({
        error: "Widget chat stream failed.",
        conversationId,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
