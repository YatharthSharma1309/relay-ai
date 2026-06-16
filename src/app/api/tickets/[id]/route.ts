import { NextResponse } from "next/server";
import { withOrgMembership } from "@/lib/auth/api";
import { parseJsonBody } from "@/lib/api/json";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { isTicketStatus, type TicketStatus } from "@/lib/tickets/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withOrgMembership(async ({ organization }) => {
    const { id } = await context.params;

    const ticket = await db.ticket.findFirst({
      where: { id, organizationId: organization.id },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true } } },
        },
        conversation: {
          include: {
            messages: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withOrgMembership(async ({ organization }) => {
    const { id } = await context.params;

    if (await checkRateLimit(`ticket-update:${organization.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;
    const ticket = await db.ticket.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const statusInput = body.status ? String(body.status) : undefined;

    if (statusInput && !isTicketStatus(statusInput)) {
      return NextResponse.json(
        { error: "Invalid ticket status" },
        { status: 400 },
      );
    }

    let status: TicketStatus | undefined;

    if (statusInput) {
      status = statusInput as TicketStatus;
    }

    let resolvedAt: Date | null | undefined;
    if (status === "RESOLVED" || status === "CLOSED") {
      resolvedAt = new Date();
    } else if (status) {
      resolvedAt = null;
    }

    let assigneeId: string | null | undefined;

    if (body.assigneeId === null || body.assigneeId === "") {
      assigneeId = null;
    } else if (body.assigneeId) {
      const member = await db.organizationMember.findFirst({
        where: {
          organizationId: organization.id,
          userId: String(body.assigneeId),
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: "Assignee not found in organization" },
          { status: 400 },
        );
      }

      assigneeId = String(body.assigneeId);
    }

    const updated = await db.ticket.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(resolvedAt !== undefined ? { resolvedAt } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
      },
    });

    return NextResponse.json({ ticket: updated });
  });
}
