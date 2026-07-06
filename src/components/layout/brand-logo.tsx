import Link from "next/link";
import { RelayLogoMark } from "@/components/layout/relay-logo-mark";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  showTagline?: boolean;
  size?: "sm" | "md";
  className?: string;
  onNavigate?: () => void;
};

export function BrandLogo({
  href = "/",
  showTagline = false,
  size = "md",
  className,
  onNavigate,
}: BrandLogoProps) {
  const markSize = size === "sm" ? 36 : 40;

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <RelayLogoMark
        size={markSize}
        className="shadow-sm shadow-indigo-200/80"
      />
      <div>
        <p
          className={cn(
            "font-semibold text-slate-900",
            size === "sm" ? "text-sm" : "text-lg",
          )}
        >
          Relay AI
        </p>
        {showTagline ? (
          <p className="text-xs text-slate-500">Support & Recruitment Platform</p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className="transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}
