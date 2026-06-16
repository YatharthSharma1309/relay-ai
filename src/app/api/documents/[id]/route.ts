import { NextResponse } from "next/server";
import { withAdminMembership } from "@/lib/auth/api";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  return withAdminMembership(async ({ organization }) => {
    const { id } = await context.params;

    const document = await db.document.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await db.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
