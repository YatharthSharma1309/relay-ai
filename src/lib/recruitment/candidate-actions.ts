import type { CandidateStatus, ParseStatus } from "@/lib/recruitment/types";

export type DecisionAction = {
  label: string;
  nextStatus: CandidateStatus;
  tone: "primary" | "secondary" | "danger";
};

export const pipelineActionsByStatus: Record<CandidateStatus, DecisionAction[]> = {
  new: [
    { label: "Shortlist", nextStatus: "shortlisted", tone: "primary" },
    { label: "Reject", nextStatus: "rejected", tone: "danger" },
  ],
  shortlisted: [
    { label: "Move to interviewing", nextStatus: "interviewing", tone: "primary" },
    { label: "Reject", nextStatus: "rejected", tone: "danger" },
  ],
  interviewing: [
    { label: "Hire", nextStatus: "hired", tone: "primary" },
    { label: "Reject", nextStatus: "rejected", tone: "danger" },
  ],
  hired: [],
  rejected: [{ label: "Reopen", nextStatus: "new", tone: "secondary" }],
  archived: [],
};

export const rowPrimaryAction: Record<
  CandidateStatus,
  { label: string; nextStatus: CandidateStatus } | null
> = {
  new: { label: "Shortlist", nextStatus: "shortlisted" },
  shortlisted: { label: "Interview", nextStatus: "interviewing" },
  interviewing: { label: "Hire", nextStatus: "hired" },
  hired: null,
  rejected: { label: "Reopen", nextStatus: "new" },
  archived: null,
};

export function canRejectCandidate(status: CandidateStatus): boolean {
  return status !== "hired" && status !== "rejected" && status !== "archived";
}

export function isResumeReady(parseStatus: ParseStatus): boolean {
  return parseStatus === "ok" || parseStatus === "manual";
}

export function getAnalyzeActionLabel({
  analyzeBusy,
  resumeReady,
  hasAnalysis,
}: {
  analyzeBusy: boolean;
  resumeReady: boolean;
  hasAnalysis: boolean;
}): string {
  if (analyzeBusy) return "Analyzing...";
  if (!resumeReady) return "Needs text";
  if (hasAnalysis) return "Re-run analysis";
  return "Run analysis";
}

export function getPipelineActions(status: CandidateStatus): DecisionAction[] {
  return pipelineActionsByStatus[status];
}

export function getNextPipelineLabel(status: CandidateStatus): string {
  return pipelineActionsByStatus[status][0]?.label ?? "Decision complete";
}
