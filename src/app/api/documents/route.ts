import { NextResponse } from "next/server";
import { withOrgMembership } from "@/lib/auth/api";
import { db } from "@/lib/db";

export async function GET() {
  return withOrgMembership(async ({ organization }) => {
    const documents = await db.document.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  });
}
