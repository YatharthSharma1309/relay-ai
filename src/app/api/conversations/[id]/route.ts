import { NextResponse } from "next/server";
import { withOrgMembership } from "@/lib/auth/api";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withOrgMembership(async ({ organization }) => {
    const { id } = await context.params;

    const conversation = await db.conversation.findFirst({
      where: { id, organizationId: organization.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ conversation });
  });
}
