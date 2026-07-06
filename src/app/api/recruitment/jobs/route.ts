import { NextResponse } from "next/server";
import { withRecruitmentOrg } from "@/lib/recruitment/api-handler";
import { recordRecruitmentAuditEvent } from "@/lib/recruitment/services/audit";
import { createJob, listJobs } from "@/lib/recruitment/services/jobs";
import { createJobSchema } from "@/lib/recruitment/validators";

export async function GET() {
  return withRecruitmentOrg(async ({ organization }) => {
    const jobs = await listJobs(organization.id);
    return NextResponse.json({ jobs });
  });
}

export async function POST(request: Request) {
  return withRecruitmentOrg(async ({ organization, user }) => {
    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid job payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const job = await createJob(organization.id, parsed.data);
    await recordRecruitmentAuditEvent({
      organizationId: organization.id,
      action: "job.create",
      entityType: "job",
      entityId: job.id,
      actorId: user.id,
    });

    return NextResponse.json({ job }, { status: 201 });
  });
}
