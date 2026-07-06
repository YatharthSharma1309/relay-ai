import { Badge } from "@/components/ui/badge";
import type { CandidateStatus } from "@/lib/recruitment/types";

const statusConfig: Record<
  CandidateStatus,
  { label: string; tone: "default" | "success" | "warning" | "danger" | "info" }
> = {
  new: { label: "New", tone: "info" },
  shortlisted: { label: "Shortlisted", tone: "default" },
  interviewing: { label: "Interviewing", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
  hired: { label: "Hired", tone: "success" },
  archived: { label: "Archived", tone: "default" },
};

type CandidateStatusBadgeProps = {
  status: CandidateStatus;
  className?: string;
};

export function CandidateStatusBadge({ status, className }: CandidateStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge tone={config.tone} className={className}>
      {config.label}
    </Badge>
  );
}
