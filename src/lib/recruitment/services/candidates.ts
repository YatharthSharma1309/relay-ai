import { db } from "@/lib/db";
import { appConfig } from "@/lib/recruitment/config";
import { RecruitmentError } from "@/lib/recruitment/errors";
import {
  displayNameFromFileName,
  extractTextFromBuffer,
  normalizeResumeText,
} from "@/lib/recruitment/parse-resume";
import { toCandidateDetailDTO, toCandidateDTO } from "@/lib/recruitment/serializers";
import { beginPendingHire } from "@/lib/recruitment/services/hire-safety";
import type { AllowedUploadMime } from "@/lib/recruitment/validators";
import type { CandidateDetailDTO, CandidateDTO, CandidateStatus } from "@/lib/recruitment/types";

export type UpdateCandidateResult = CandidateDetailDTO & {
  archivedCandidateCount?: number;
  pendingHireExpiresAt?: string;
  prunedCandidateCount?: number;
};

async function getCandidateForOrganization(
  candidateId: string,
  organizationId: string
) {
  return db.candidate.findFirst({
    where: { id: candidateId, job: { organizationId } },
    include: { job: true, analysis: true },
  });
}

async function getJobForOrganization(jobId: string, organizationId: string) {
  return db.job.findFirst({
    where: { id: jobId, organizationId },
  });
}

export async function createCandidateFromText(input: {
  organizationId: string;
  jobId: string;
  displayName: string;
  rawText: string;
  parseStatus?: "ok" | "manual";
}): Promise<CandidateDTO> {
  const job = await getJobForOrganization(input.jobId, input.organizationId);
  if (!job) {
    throw new RecruitmentError("Job not found.", 404, "JOB_NOT_FOUND");
  }

  const candidate = await db.candidate.create({
    data: {
      jobId: input.jobId,
      displayName: input.displayName,
      rawText: normalizeResumeText(input.rawText),
      parseStatus: input.parseStatus ?? "manual",
      filePath: null,
    },
    include: { analysis: true },
  });

  return toCandidateDTO(candidate);
}

export async function createCandidateFromUpload(input: {
  organizationId: string;
  jobId: string;
  fileName: string;
  mimeType: AllowedUploadMime;
  buffer: Buffer;
}): Promise<CandidateDTO> {
  const job = await getJobForOrganization(input.jobId, input.organizationId);
  if (!job) {
    throw new RecruitmentError("Job not found.", 404, "JOB_NOT_FOUND");
  }

  if (input.buffer.byteLength > appConfig.maxUploadBytes) {
    throw new RecruitmentError(
      `File exceeds ${Math.round(appConfig.maxUploadBytes / (1024 * 1024))}MB limit.`,
      413,
      "FILE_TOO_LARGE"
    );
  }

  let rawText = "";
  let parseStatus: "ok" | "failed" = "ok";

  try {
    rawText = await extractTextFromBuffer(input.buffer, input.mimeType);
    if (rawText.length < 50) {
      parseStatus = "failed";
      rawText = "Could not extract enough text from this file. Paste resume text manually or try another export.";
    }
  } catch {
    parseStatus = "failed";
    rawText =
      "Resume parsing failed. Paste resume text manually on the candidate page or re-upload a text-based PDF/DOCX.";
  }

  const candidate = await db.candidate.create({
    data: {
      jobId: input.jobId,
      displayName: displayNameFromFileName(input.fileName),
      fileName: input.fileName,
      mimeType: input.mimeType,
      filePath: null,
      rawText,
      parseStatus,
    },
    include: { analysis: true },
  });

  return toCandidateDTO(candidate);
}

export async function getCandidateDetail(
  organizationId: string,
  candidateId: string
): Promise<CandidateDetailDTO | null> {
  const candidate = await getCandidateForOrganization(candidateId, organizationId);
  if (!candidate) return null;
  return toCandidateDetailDTO(candidate);
}

export async function updateCandidate(input: {
  organizationId: string;
  candidateId: string;
  displayName?: string;
  rawText?: string;
  status?: CandidateStatus;
  notes?: string | null;
}): Promise<UpdateCandidateResult> {
  const existing = await getCandidateForOrganization(
    input.candidateId,
    input.organizationId
  );

  if (!existing) {
    throw new RecruitmentError("Candidate not found.", 404, "CANDIDATE_NOT_FOUND");
  }

  const candidate = await db.$transaction(async (tx) => {
    if (input.rawText !== undefined) {
      await tx.candidateAnalysis.deleteMany({
        where: { candidateId: input.candidateId },
      });
    }

    return tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.rawText !== undefined
          ? {
              rawText: normalizeResumeText(input.rawText),
              parseStatus: "manual",
            }
          : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      },
      include: { analysis: true },
    });
  });

  let archivedCandidateCount = 0;
  let pendingHireExpiresAt: string | undefined;

  if (input.status === "hired" && existing.status !== "hired") {
    const job = await db.job.findFirst({
      where: { id: existing.jobId, organizationId: input.organizationId },
      select: { pendingHireCandidateId: true },
    });

    if (
      job?.pendingHireCandidateId &&
      job.pendingHireCandidateId !== input.candidateId
    ) {
      throw new RecruitmentError(
        "Another hire decision is pending for this job. Undo or finalize it before hiring someone else.",
        409,
        "PENDING_HIRE_ACTIVE"
      );
    }

    const pending = await beginPendingHire({
      organizationId: input.organizationId,
      jobId: existing.jobId,
      hiredCandidateId: candidate.id,
      previousStatus: existing.status as CandidateStatus,
    });
    archivedCandidateCount = pending.archivedCount;
    pendingHireExpiresAt = pending.expiresAt.toISOString();
  }

  const detail = toCandidateDetailDTO(candidate);
  if (archivedCandidateCount > 0 || pendingHireExpiresAt) {
    return {
      ...detail,
      archivedCandidateCount,
      pendingHireExpiresAt,
    };
  }

  return detail;
}

export const updateCandidateResumeText = updateCandidate;

export async function deleteCandidate(
  organizationId: string,
  candidateId: string
): Promise<boolean> {
  const existing = await getCandidateForOrganization(candidateId, organizationId);
  if (!existing) return false;

  await db.candidate.delete({ where: { id: candidateId } });
  return true;
}
