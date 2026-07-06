import { db } from "@/lib/db";
import { stringifyStringArray } from "@/lib/recruitment/json";
import {
  getBestCandidate,
  getCandidateStats,
  toJobDTO,
  toJobDetailDTO,
} from "@/lib/recruitment/serializers";
import {
  getPendingHireState,
  processExpiredPendingHires,
} from "@/lib/recruitment/services/hire-safety";
import type { JobCriteria, JobDetailDTO, JobDTO } from "@/lib/recruitment/types";

type JobInput = JobCriteria & {
  title: string;
  description: string;
};

async function getJobForOrganization(jobId: string, organizationId: string) {
  return db.job.findFirst({
    where: { id: jobId, organizationId },
  });
}

export async function listJobs(organizationId: string): Promise<JobDTO[]> {
  await processExpiredPendingHires();

  const jobs = await db.job.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { candidates: true } },
      candidates: {
        include: { analysis: true },
      },
    },
  });

  return Promise.all(
    jobs.map(async (job) => {
      const pendingHire = job.pendingHireCandidateId
        ? await getPendingHireState(organizationId, job.id)
        : null;

      return toJobDTO(
        job,
        job._count.candidates,
        getCandidateStats(job.candidates),
        getBestCandidate(job.candidates),
        pendingHire
      );
    })
  );
}

export async function getJobDetail(
  organizationId: string,
  jobId: string
): Promise<JobDetailDTO | null> {
  await processExpiredPendingHires(jobId);

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      candidates: {
        include: { analysis: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) return null;

  const detail = toJobDetailDTO(job, job.candidates);
  const pendingHire = await getPendingHireState(organizationId, jobId);

  return {
    ...detail,
    pendingHire,
  };
}

export async function createJob(
  organizationId: string,
  input: JobInput
): Promise<JobDTO> {
  const job = await db.job.create({
    data: {
      organizationId,
      title: input.title,
      description: input.description,
      requiredSkills: stringifyStringArray(input.requiredSkills),
      preferredSkills: stringifyStringArray(input.preferredSkills),
      experienceLevel: input.experienceLevel ?? "",
      minYearsExperience: input.minYearsExperience,
      educationRequirements: stringifyStringArray(input.educationRequirements),
      certifications: stringifyStringArray(input.certifications),
      roleType: input.roleType ?? "",
    },
  });

  return toJobDTO(job, 0);
}

export async function updateJob(
  organizationId: string,
  jobId: string,
  input: JobInput
): Promise<JobDTO | null> {
  const existing = await getJobForOrganization(jobId, organizationId);
  if (!existing) return null;

  const job = await db.$transaction(async (tx) => {
    const updated = await tx.job.update({
      where: { id: jobId },
      data: {
        title: input.title,
        description: input.description,
        requiredSkills: stringifyStringArray(input.requiredSkills),
        preferredSkills: stringifyStringArray(input.preferredSkills),
        experienceLevel: input.experienceLevel ?? "",
        minYearsExperience: input.minYearsExperience,
        educationRequirements: stringifyStringArray(input.educationRequirements),
        certifications: stringifyStringArray(input.certifications),
        roleType: input.roleType ?? "",
      },
    });

    await tx.candidateAnalysis.deleteMany({
      where: { candidate: { jobId } },
    });

    return updated;
  });

  const candidateCount = await db.candidate.count({ where: { jobId } });
  return toJobDTO(job, candidateCount);
}

export async function deleteJob(
  organizationId: string,
  jobId: string
): Promise<boolean> {
  const existing = await getJobForOrganization(jobId, organizationId);
  if (!existing) return false;
  await db.job.delete({ where: { id: jobId } });
  return true;
}
