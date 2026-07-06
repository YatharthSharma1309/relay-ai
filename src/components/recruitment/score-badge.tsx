import { cn } from "@/lib/utils";

type ScoreBadgeProps = {
  score: number | null;
  className?: string;
};

function scoreTone(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (score >= 60) return "bg-indigo-100 text-indigo-700 ring-indigo-200";
  if (score >= 40) return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-slate-50 text-slate-400 ring-slate-200",
          className,
        )}
      >
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        scoreTone(score),
        className,
      )}
    >
      {score}%
    </span>
  );
}
