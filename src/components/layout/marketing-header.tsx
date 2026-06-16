import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MarketingAuthLinks, MarketingNav } from "@/components/layout/marketing-nav";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarketingHeaderProps = {
  variant?: "marketing" | "help" | "app";
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  className?: string;
};

export function MarketingHeader({
  variant = "marketing",
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  action,
  className,
}: MarketingHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 glass-panel border-b border-slate-200/80",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6",
          variant === "marketing" ? "max-w-6xl" : "max-w-5xl",
        )}
      >
        {variant === "marketing" ? (
          <>
            <BrandLogo showTagline />
            <MarketingNav />
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              {backHref ? (
                <Link
                  href={backHref}
                  aria-label={backLabel}
                  className={buttonClassName({ variant: "ghost", size: "sm" })}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </Link>
              ) : null}
              <BrandLogo href="/" size="sm" className="hidden sm:flex" />
              {title ? (
                <div className="min-w-0 border-l border-slate-200 pl-3 sm:pl-4">
                  <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="truncate text-xs text-slate-500 sm:text-sm">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {variant === "help" ? (
              <MarketingAuthLinks className="shrink-0" />
            ) : action ? (
              <div className="flex shrink-0 items-center gap-2">{action}</div>
            ) : null}
          </>
        )}
      </div>
    </header>
  );
}
