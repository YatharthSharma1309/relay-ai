import { NextResponse } from "next/server";
import { withOrgMembership } from "@/lib/auth/api";
import { ChatServiceError, suggestTicketReply } from "@/lib/chat/service";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  return withOrgMembership(async ({ organization }) => {
    const rateLimited = await checkRateLimit(
      `suggest-reply:${organization.id}`,
      20,
      60 * 60 * 1000,
    );
    if (rateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const { id } = await context.params;

    const ticket = await db.ticket.findFirst({
      where: { id, organizationId: organization.id },
      include: {
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

    try {
      const suggestion = await suggestTicketReply(organization.id, {
        title: ticket.title,
        description: ticket.description,
        conversation: ticket.conversation,
      });

      return NextResponse.json({ suggestion });
    } catch (error) {
      if (error instanceof ChatServiceError) {
        if (error.code === "AI_UNAVAILABLE") {
          return NextResponse.json({ error: error.message }, { status: 503 });
        }
        if (error.code === "AI_FAILED") {
          return NextResponse.json({ error: error.message }, { status: 502 });
        }
      }

      console.error(error);
      return NextResponse.json(
        { error: "Failed to generate reply suggestion" },
        { status: 500 },
      );
    }
  });
}
