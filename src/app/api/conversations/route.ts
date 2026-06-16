import { NextResponse } from "next/server";
import { withOrgMembership } from "@/lib/auth/api";
import { db } from "@/lib/db";

export async function GET() {
  return withOrgMembership(async ({ organization }) => {
    const conversations = await db.conversation.findMany({
      where: {
        organizationId: organization.id,
        channel: "ADMIN",
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
  });
}
