import { NextResponse } from "next/server";
import { withRecruitmentOrg } from "@/lib/recruitment/api-handler";
import { RecruitmentError } from "@/lib/recruitment/errors";
import { recordRecruitmentAuditEvent } from "@/lib/recruitment/services/audit";
import {
  deleteCandidate,
  getCandidateDetail,
  updateCandidate,
} from "@/lib/recruitment/services/candidates";
import { updateCandidateSchema } from "@/lib/recruitment/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withRecruitmentOrg(async ({ organization }) => {
    const candidate = await getCandidateDetail(organization.id, id);
    if (!candidate) {
      throw new RecruitmentError("Candidate not found.", 404, "CANDIDATE_NOT_FOUND");
    }
    return NextResponse.json({ candidate });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withRecruitmentOrg(async ({ organization, user }) => {
    const body = await request.json();
    const parsed = updateCandidateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid candidate update payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const candidate = await updateCandidate({
      organizationId: organization.id,
      candidateId: id,
      ...parsed.data,
    });

    await recordRecruitmentAuditEvent({
      organizationId: organization.id,
      action: parsed.data.rawText ? "candidate.update_resume" : "candidate.update",
      entityType: "candidate",
      entityId: candidate.id,
      actorId: user.id,
      metadata: {
        jobId: candidate.jobId,
        status: parsed.data.status ?? null,
        changedResumeText: Boolean(parsed.data.rawText),
        archivedCandidateCount: candidate.archivedCandidateCount ?? 0,
        pendingHireExpiresAt: candidate.pendingHireExpiresAt ?? null,
      },
    });

    if (candidate.archivedCandidateCount && candidate.archivedCandidateCount > 0) {
      await recordRecruitmentAuditEvent({
        organizationId: organization.id,
        action: "job.archive_candidates_on_hire",
        entityType: "job",
        entityId: candidate.jobId,
        actorId: user.id,
        metadata: {
          jobId: candidate.jobId,
          hiredCandidateId: candidate.id,
          archivedCandidateCount: candidate.archivedCandidateCount,
          pendingHireExpiresAt: candidate.pendingHireExpiresAt ?? null,
        },
      });
    }

    return NextResponse.json({ candidate });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return withRecruitmentOrg(async ({ organization, user }) => {
    const existing = await getCandidateDetail(organization.id, id);
    if (!existing) {
      throw new RecruitmentError("Candidate not found.", 404, "CANDIDATE_NOT_FOUND");
    }

    const deleted = await deleteCandidate(organization.id, id);
    if (!deleted) {
      throw new RecruitmentError("Candidate not found.", 404, "CANDIDATE_NOT_FOUND");
    }

    await recordRecruitmentAuditEvent({
      organizationId: organization.id,
      action: "candidate.delete",
      entityType: "candidate",
      entityId: id,
      actorId: user.id,
      metadata: { jobId: existing.jobId },
    });

    return NextResponse.json({ ok: true });
  });
}
