import type { Candidate, CandidateAnalysis, Job } from "@/generated/prisma/client";
import { parseJsonObject, parseStringArray } from "@/lib/recruitment/json";
import { isArchivedStatus } from "@/lib/recruitment/hire-safety";
import type {
  AnalysisDTO,
  ActiveCandidateStatus,
  CandidateStats,
  CandidateDetailDTO,
  CandidateDTO,
  CandidateStatus,
  JobDetailDTO,
  JobDTO,
  ParseStatus,
  PendingHireDTO,
  ScoreBreakdown,
} from "@/lib/recruitment/types";

type CandidateWithAnalysis = Candidate & { analysis: CandidateAnalysis | null };

const emptyScoreBreakdown: ScoreBreakdown = {
  requiredSkills: 0,
  preferredSkills: 0,
  roleAlignment: 0,
  experience: 0,
  educationCertifications: 0,
  parseQuality: 0,
  penalties: 0,
  matchedRequiredSkills: [],
  matchedPreferredSkills: [],
  missingRequiredSkills: [],
  missingPreferredSkills: [],
  notes: [],
};

export function getCandidateStats(candidates: CandidateWithAnalysis[]): CandidateStats {
  const activeCandidates = candidates.filter(
    (candidate) => !isArchivedStatus(candidate.status)
  );
  const archivedCount = candidates.length - activeCandidates.length;
  const total = candidates.length;
  const resumeReady = activeCandidates.filter(
    (candidate) => candidate.parseStatus === "ok" || candidate.parseStatus === "manual"
  ).length;
  const parseFailed = activeCandidates.filter(
    (candidate) => candidate.parseStatus === "failed"
  ).length;
  const analyzed = activeCandidates.filter((candidate) => Boolean(candidate.analysis)).length;
  const statusCounts: Record<ActiveCandidateStatus, number> = {
    new: 0,
    shortlisted: 0,
    interviewing: 0,
    rejected: 0,
    hired: 0,
  };

  for (const candidate of activeCandidates) {
    const status = candidate.status as ActiveCandidateStatus;
    statusCounts[status] += 1;
  }

  return {
    total,
    activeTotal: activeCandidates.length,
    archivedCount,
    resumeReady,
    parseFailed,
    analyzed,
    pendingAnalysis: Math.max(0, resumeReady - analyzed),
    statusCounts,
  };
}

export function getBestCandidate(
  candidates: CandidateWithAnalysis[]
): CandidateDTO | null {
  const activeCandidates = candidates.filter(
    (candidate) => !isArchivedStatus(candidate.status)
  );
  const bestCandidate = activeCandidates.reduce<CandidateWithAnalysis | null>(
    (best, candidate) => {
      if (!candidate.analysis) return best;
      if (!best || candidate.analysis.matchScore > (best.analysis?.matchScore ?? -1)) {
        return candidate;
      }
      return best;
    },
    null
  );

  return bestCandidate ? toCandidateDTO(bestCandidate) : null;
}

export function toJobDTO(
  job: Job,
  candidateCount?: number,
  candidateStats?: CandidateStats,
  bestCandidate?: CandidateDTO | null,
  pendingHire?: PendingHireDTO | null
): JobDTO {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    requiredSkills: parseStringArray(job.requiredSkills),
    preferredSkills: parseStringArray(job.preferredSkills),
    experienceLevel: job.experienceLevel || null,
    minYearsExperience: job.minYearsExperience,
    educationRequirements: parseStringArray(job.educationRequirements),
    certifications: parseStringArray(job.certifications),
    roleType: job.roleType || null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    candidateCount,
    candidateStats,
    bestCandidate,
    pendingHire: pendingHire ?? null,
  };
}

export function toCandidateDTO(candidate: CandidateWithAnalysis): CandidateDTO {
  return {
    id: candidate.id,
    jobId: candidate.jobId,
    displayName: candidate.displayName,
    fileName: candidate.fileName,
    mimeType: candidate.mimeType,
    parseStatus: candidate.parseStatus as ParseStatus,
    status: candidate.status as CandidateStatus,
    notes: candidate.notes,
    createdAt: candidate.createdAt.toISOString(),
    hasAnalysis: Boolean(candidate.analysis),
    matchScore: candidate.analysis?.matchScore ?? null,
  };
}

export function toAnalysisDTO(analysis: CandidateAnalysis): AnalysisDTO {
  return {
    id: analysis.id,
    candidateId: analysis.candidateId,
    summary: analysis.summary,
    extractedSkills: parseStringArray(analysis.extractedSkills),
    matchScore: analysis.matchScore,
    scoreBreakdown: parseJsonObject<ScoreBreakdown>(
      analysis.scoreBreakdown,
      emptyScoreBreakdown
    ),
    matchRationale: analysis.matchRationale,
    missingSkills: parseStringArray(analysis.missingSkills),
    interviewQuestions: parseStringArray(analysis.interviewQuestions),
    analyzedAt: analysis.analyzedAt.toISOString(),
    modelId: analysis.modelId,
  };
}

export function toCandidateDetailDTO(
  candidate: CandidateWithAnalysis
): CandidateDetailDTO {
  return {
    ...toCandidateDTO(candidate),
    rawText: candidate.rawText,
    analysis: candidate.analysis ? toAnalysisDTO(candidate.analysis) : null,
  };
}

export function toJobDetailDTO(
  job: Job,
  candidates: CandidateWithAnalysis[]
): JobDetailDTO {
  return {
    ...toJobDTO(
      job,
      candidates.length,
      getCandidateStats(candidates),
      getBestCandidate(candidates)
    ),
    candidates: candidates
      .map(toCandidateDTO)
      .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1)),
  };
}
