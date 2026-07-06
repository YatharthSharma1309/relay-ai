import { NextResponse } from "next/server";
import { withRecruitmentOrg } from "@/lib/recruitment/api-handler";
import { recordRecruitmentAuditEvent } from "@/lib/recruitment/services/audit";
import { finalizePendingHire } from "@/lib/recruitment/services/hire-safety";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withRecruitmentOrg(async ({ organization, user }) => {
    const removedCount = await finalizePendingHire(organization.id, id);
    await recordRecruitmentAuditEvent({
      organizationId: organization.id,
      action: "hire.finalize",
      entityType: "job",
      entityId: id,
      actorId: user.id,
      metadata: { removedCount },
    });
    return NextResponse.json({ removedCount });
  });
}
