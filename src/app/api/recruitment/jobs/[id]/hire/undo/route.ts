import { NextResponse } from "next/server";
import { withRecruitmentOrg } from "@/lib/recruitment/api-handler";
import { recordRecruitmentAuditEvent } from "@/lib/recruitment/services/audit";
import { undoPendingHire } from "@/lib/recruitment/services/hire-safety";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withRecruitmentOrg(async ({ organization, user }) => {
    const result = await undoPendingHire(organization.id, id);
    await recordRecruitmentAuditEvent({
      organizationId: organization.id,
      action: "hire.undo",
      entityType: "job",
      entityId: id,
      actorId: user.id,
      metadata: result,
    });
    return NextResponse.json(result);
  });
}
