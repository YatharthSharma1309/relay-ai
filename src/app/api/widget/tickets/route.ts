import { NextResponse } from "next/server";
import {
  getWidgetKeyFromRequest,
  resolveWidgetOrganization,
  widgetAuthErrorResponse,
} from "@/lib/auth/widget";
import { assertWidgetVisitor } from "@/lib/auth/widget-visitor";
import { parseJsonBody } from "@/lib/api/json";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isTicketPriority, type TicketPriority } from "@/lib/tickets/constants";

export async function POST(request: Request) {
  try {
    const widgetKey = getWidgetKeyFromRequest(request);
    const organization = await resolveWidgetOrganization(widgetKey, request);

    const ip = getClientIp(request);
    if (
      (await checkRateLimit(`widget-tickets:${organization.id}:${ip}`, 10, 60 * 60 * 1000)) ||
      (await checkRateLimit(`widget-tickets:${organization.id}`, 50, 60 * 60 * 1000))
    ) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const priorityInput = String(body.priority ?? "HIGH");
    const conversationId = body.conversationId
      ? String(body.conversationId)
      : null;
    const visitorId = assertWidgetVisitor(
      organization.id,
      body.visitorId ? String(body.visitorId) : null,
      body.visitorToken ? String(body.visitorToken) : null,
    );
    const requesterEmail = body.requesterEmail
      ? String(body.requesterEmail).trim()
      : null;
    const requesterName = body.requesterName
      ? String(body.requesterName).trim()
      : null;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    if (!isTicketPriority(priorityInput)) {
      return NextResponse.json(
        { error: "Invalid ticket priority" },
        { status: 400 },
      );
    }

    const priority: TicketPriority = priorityInput;

    if (conversationId) {
      const conversation = await db.conversation.findFirst({
        where: {
          id: conversationId,
          organizationId: organization.id,
          visitorId,
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Linked conversation not found" },
          { status: 400 },
        );
      }

      if (title.startsWith("Escalation:")) {
        const existingEscalation = await db.ticket.findFirst({
          where: {
            organizationId: organization.id,
            conversationId,
            title: { startsWith: "Escalation:" },
            status: { in: ["OPEN", "IN_PROGRESS"] },
          },
        });

        if (existingEscalation) {
          return NextResponse.json({
            ticket: existingEscalation,
            duplicate: true,
          });
        }
      }
    }

    const ticket = await db.ticket.create({
      data: {
        organizationId: organization.id,
        title,
        description,
        priority,
        conversationId,
        requesterEmail,
        requesterName,
      },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    const widgetResponse = widgetAuthErrorResponse(error);
    if (widgetResponse) return widgetResponse;

    console.error(error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 },
    );
  }
}
