import { db } from "@/lib/db";
import {
  ARCHIVED_STATUS,
  getHireGraceExpiresAt,
  isPendingHireExpired,
  isRestorableArchivedStatus,
} from "@/lib/recruitment/hire-safety";
import { getPruneCandidateIds } from "@/lib/recruitment/pipeline-confirmations";
import { RecruitmentError } from "@/lib/recruitment/errors";
import type { CandidateStatus } from "@/lib/recruitment/types";

export type PendingHireState = {
  candidateId: string;
  expiresAt: string;
  archivedCount: number;
  hiredDisplayName: string;
};

async function getJobForOrganization(jobId: string, organizationId: string) {
  return db.job.findFirst({
    where: { id: jobId, organizationId },
  });
}

async function deleteResumeFile(_filePath: string | null | undefined): Promise<void> {
  // no-op: resumes are processed in-memory only
}

async function permanentlyRemoveArchivedCandidates(
  jobId: string,
  hiredCandidateId: string
): Promise<number> {
  const archived = await db.candidate.findMany({
    where: {
      jobId,
      status: ARCHIVED_STATUS,
      id: { not: hiredCandidateId },
    },
    select: { id: true, filePath: true },
  });

  if (archived.length === 0) return 0;

  const pruneIds = getPruneCandidateIds(
    archived.map((candidate) => candidate.id),
    hiredCandidateId
  );

  await db.candidate.deleteMany({
    where: { id: { in: pruneIds } },
  });

  await Promise.all(archived.map((candidate) => deleteResumeFile(candidate.filePath)));

  return archived.length;
}

export async function archiveOtherCandidatesOnHire(
  jobId: string,
  hiredCandidateId: string
): Promise<number> {
  const others = await db.candidate.findMany({
    where: {
      jobId,
      id: { not: hiredCandidateId },
      status: { not: ARCHIVED_STATUS },
    },
  });

  if (others.length === 0) return 0;

  await db.$transaction(
    others.map((candidate) =>
      db.candidate.update({
        where: { id: candidate.id },
        data: {
          status: ARCHIVED_STATUS,
          statusBeforeArchive: candidate.status,
        },
      })
    )
  );

  return others.length;
}

export async function beginPendingHire(input: {
  organizationId: string;
  jobId: string;
  hiredCandidateId: string;
  previousStatus: CandidateStatus;
}): Promise<{ archivedCount: number; expiresAt: Date }> {
  const job = await getJobForOrganization(input.jobId, input.organizationId);
  if (!job) {
    throw new RecruitmentError("Job not found.", 404, "JOB_NOT_FOUND");
  }

  const expiresAt = getHireGraceExpiresAt();
  const archivedCount = await archiveOtherCandidatesOnHire(
    input.jobId,
    input.hiredCandidateId
  );

  await db.job.update({
    where: { id: input.jobId },
    data: {
      pendingHireCandidateId: input.hiredCandidateId,
      pendingHireExpiresAt: expiresAt,
      pendingHirePreviousStatus: input.previousStatus,
    },
  });

  return { archivedCount, expiresAt };
}

export async function getPendingHireState(
  organizationId: string,
  jobId: string
): Promise<PendingHireState | null> {
  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      candidates: {
        select: {
          id: true,
          displayName: true,
          status: true,
          statusBeforeArchive: true,
        },
      },
    },
  });

  if (!job?.pendingHireCandidateId || !job.pendingHireExpiresAt) {
    return null;
  }

  const hired = job.candidates.find(
    (candidate) => candidate.id === job.pendingHireCandidateId
  );

  if (!hired || hired.status !== "hired") {
    return null;
  }

  const archivedCount = job.candidates.filter(
    (candidate) => candidate.status === ARCHIVED_STATUS
  ).length;

  return {
    candidateId: job.pendingHireCandidateId,
    expiresAt: job.pendingHireExpiresAt.toISOString(),
    archivedCount,
    hiredDisplayName: hired.displayName,
  };
}

export async function clearPendingHireFields(jobId: string): Promise<void> {
  await db.job.update({
    where: { id: jobId },
    data: {
      pendingHireCandidateId: null,
      pendingHireExpiresAt: null,
      pendingHirePreviousStatus: null,
    },
  });
}

export async function undoPendingHire(
  organizationId: string,
  jobId: string
): Promise<{
  restoredCount: number;
  revertedCandidateId: string;
}> {
  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      candidates: {
        where: { status: ARCHIVED_STATUS },
      },
    },
  });

  if (!job?.pendingHireCandidateId || !job.pendingHireExpiresAt) {
    throw new RecruitmentError("No pending hire decision to undo.", 400, "NO_PENDING_HIRE");
  }

  if (isPendingHireExpired(job.pendingHireExpiresAt)) {
    throw new RecruitmentError(
      "The undo window has expired. Other candidates were finalized.",
      400,
      "HIRE_UNDO_EXPIRED"
    );
  }

  const previousStatus = job.pendingHirePreviousStatus;
  const revertStatus: CandidateStatus = isRestorableArchivedStatus(previousStatus)
    ? previousStatus
    : "interviewing";

  await db.$transaction([
    db.candidate.update({
      where: { id: job.pendingHireCandidateId },
      data: { status: revertStatus },
    }),
    ...job.candidates.map((candidate) =>
      db.candidate.update({
        where: { id: candidate.id },
        data: {
          status: isRestorableArchivedStatus(candidate.statusBeforeArchive)
            ? candidate.statusBeforeArchive
            : "new",
          statusBeforeArchive: null,
        },
      })
    ),
    db.job.update({
      where: { id: jobId },
      data: {
        pendingHireCandidateId: null,
        pendingHireExpiresAt: null,
        pendingHirePreviousStatus: null,
      },
    }),
  ]);

  return {
    restoredCount: job.candidates.length,
    revertedCandidateId: job.pendingHireCandidateId,
  };
}

export async function finalizePendingHire(
  organizationId: string,
  jobId: string
): Promise<number> {
  const job = await getJobForOrganization(jobId, organizationId);

  if (!job?.pendingHireCandidateId) {
    throw new RecruitmentError("No pending hire decision to finalize.", 400, "NO_PENDING_HIRE");
  }

  const removedCount = await permanentlyRemoveArchivedCandidates(
    jobId,
    job.pendingHireCandidateId
  );

  await clearPendingHireFields(jobId);

  return removedCount;
}

export async function processExpiredPendingHires(jobId?: string): Promise<number> {
  const now = new Date();
  const jobs = await db.job.findMany({
    where: {
      ...(jobId ? { id: jobId } : {}),
      pendingHireCandidateId: { not: null },
      pendingHireExpiresAt: { lte: now },
    },
    select: {
      id: true,
      pendingHireCandidateId: true,
    },
  });

  let totalRemoved = 0;

  for (const job of jobs) {
    if (!job.pendingHireCandidateId) continue;
    totalRemoved += await permanentlyRemoveArchivedCandidates(
      job.id,
      job.pendingHireCandidateId
    );
    await clearPendingHireFields(job.id);
  }

  return totalRemoved;
}
