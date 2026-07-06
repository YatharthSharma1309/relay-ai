export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { withRecruitmentOrg } from "@/lib/recruitment/api-handler";
import { RecruitmentError } from "@/lib/recruitment/errors";
import { recordRecruitmentAuditEvent } from "@/lib/recruitment/services/audit";
import { createCandidateFromUpload } from "@/lib/recruitment/services/candidates";
import { isAllowedUploadMime } from "@/lib/recruitment/validators";

export async function POST(request: Request) {
  return withRecruitmentOrg(async ({ organization, user }) => {
    if (
      await checkRateLimit(`recruitment-upload:${organization.id}`, 20, 60 * 1000)
    ) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Try again shortly." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const jobId = formData.get("jobId");
    const file = formData.get("file");

    if (typeof jobId !== "string" || !jobId.trim()) {
      throw new RecruitmentError("jobId is required.", 400, "MISSING_JOB_ID");
    }

    if (!(file instanceof File)) {
      throw new RecruitmentError("Resume file is required.", 400, "MISSING_FILE");
    }

    const mimeType = file.type || "";
    if (!isAllowedUploadMime(mimeType)) {
      throw new RecruitmentError(
        "Only PDF and DOCX files are supported.",
        400,
        "INVALID_FILE_TYPE",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const candidate = await createCandidateFromUpload({
      organizationId: organization.id,
      jobId: jobId.trim(),
      fileName: file.name,
      mimeType,
      buffer,
    });

    await recordRecruitmentAuditEvent({
      organizationId: organization.id,
      action: "candidate.upload",
      entityType: "candidate",
      entityId: candidate.id,
      actorId: user.id,
      metadata: {
        jobId: candidate.jobId,
        mimeType,
        parseStatus: candidate.parseStatus,
      },
    });

    return NextResponse.json({ candidate }, { status: 201 });
  });
}
