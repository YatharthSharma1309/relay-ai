import type { CandidateStatus } from "@/lib/recruitment/types";

export function getStatusChangeConfirmation({
  nextStatus,
  displayName,
  otherCandidateCount,
}: {
  nextStatus: CandidateStatus;
  displayName: string;
  otherCandidateCount: number;
}): string | null {
  if (nextStatus === "rejected") {
    return `Reject ${displayName} from consideration for this role?`;
  }

  if (nextStatus === "hired") {
    if (otherCandidateCount > 0) {
      return `Mark ${displayName} as hired? ${otherCandidateCount} other candidate(s) will be archived immediately. You can undo this hire during the grace window; after that their records are permanently removed.`;
    }
    return `Mark ${displayName} as the hired candidate for this role?`;
  }

  return null;
}

export function getPruneCandidateIds(
  candidateIds: string[],
  hiredCandidateId: string
): string[] {
  return candidateIds.filter((id) => id !== hiredCandidateId);
}
