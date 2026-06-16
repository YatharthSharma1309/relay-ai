import { NextResponse } from "next/server";
import { withOrgMembership } from "@/lib/auth/api";
import { parseJsonBody } from "@/lib/api/json";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { isTicketPriority, type TicketPriority } from "@/lib/tickets/constants";
export async function GET() {
  return withOrgMembership(async ({ organization }) => {
    const tickets = await db.ticket.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  });
}

export async function POST(request: Request) {
  return withOrgMembership(async ({ organization }) => {
    if (await checkRateLimit(`admin-tickets:${organization.id}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const priorityInput = String(body.priority ?? "MEDIUM");
    const conversationId = body.conversationId
      ? String(body.conversationId)
      : null;
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
        where: { id: conversationId, organizationId: organization.id },
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
  });
}
