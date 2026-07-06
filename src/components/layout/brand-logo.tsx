import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  showTagline?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function BrandLogo({
  href = "/",
  showTagline = false,
  size = "md",
  className,
}: BrandLogoProps) {
  const iconSize = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const iconInner = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-sm shadow-indigo-200",
          iconSize,
        )}
      >
        <Sparkles className={iconInner} />
      </div>
      <div>
        <p
          className={cn(
            "font-semibold text-slate-900",
            size === "sm" ? "text-sm" : "text-lg",
          )}
        >
          OpsAI
        </p>
        {showTagline ? (
          <p className="text-xs text-slate-500">AI operations platform</p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
