import { Badge } from "@/components/ui/badge";

export type WorkspaceStatus = "ready" | "setup" | "keyword";

type WorkspaceStatusBadgeProps = {
  readyDocuments: number;
  aiConfigured: boolean;
};

export function WorkspaceStatusBadge({
  readyDocuments,
  aiConfigured,
}: WorkspaceStatusBadgeProps) {
  let tone: "success" | "warning" | "info" = "success";
  let label = "Workspace ready";
  let dotClass = "bg-emerald-500";

  if (readyDocuments === 0) {
    tone = "warning";
    label = "Add knowledge docs";
    dotClass = "bg-amber-500";
  } else if (!aiConfigured) {
    tone = "info";
    label = "Keyword search mode";
    dotClass = "bg-indigo-500";
  }

  return (
    <Badge tone={tone} className="hidden gap-2 md:inline-flex">
      <span className={cnDot(dotClass)} aria-hidden />
      {label}
    </Badge>
  );
}

function cnDot(color: string) {
  return `h-1.5 w-1.5 rounded-full ${color}`;
}
