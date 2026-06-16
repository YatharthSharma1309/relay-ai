"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { MobileMenuButton } from "@/components/layout/mobile-nav";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarketingNavLinksProps = {
  onNavigate?: () => void;
  className?: string;
  layout?: "row" | "column";
};

function MarketingNavLinksBypass({
  onNavigate,
  className,
  layout = "row",
}: MarketingNavLinksProps) {
  const isColumn = layout === "column";

  return (
    <div
      className={cn(
        isColumn ? "flex flex-col gap-1" : "flex flex-wrap items-center gap-2 sm:gap-3",
        className,
      )}
    >
      <Link
        href="/help"
        onClick={onNavigate}
        className={buttonClassName({
          variant: "ghost",
          size: "sm",
          className: isColumn ? "justify-start" : undefined,
        })}
      >
        Help Center
      </Link>
      <Link
        href="/#features"
        onClick={onNavigate}
        className={buttonClassName({
          variant: "ghost",
          size: "sm",
          className: isColumn ? "justify-start" : undefined,
        })}
      >
        Features
      </Link>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={buttonClassName({
          size: "sm",
          className: isColumn ? "justify-start" : undefined,
        })}
      >
        Dashboard
      </Link>
    </div>
  );
}

function MarketingNavLinksWithClerk({
  onNavigate,
  className,
  layout = "row",
}: MarketingNavLinksProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const isColumn = layout === "column";

  return (
    <div
      className={cn(
        isColumn ? "flex flex-col gap-1" : "flex flex-wrap items-center gap-2 sm:gap-3",
        className,
      )}
    >
      <Link
        href="/help"
        onClick={onNavigate}
        className={buttonClassName({
          variant: "ghost",
          size: "sm",
          className: isColumn ? "justify-start" : undefined,
        })}
      >
        Help Center
      </Link>
      <Link
        href="/#features"
        onClick={onNavigate}
        className={buttonClassName({
          variant: "ghost",
          size: "sm",
          className: isColumn ? "justify-start" : undefined,
        })}
      >
        Features
      </Link>
      {isLoaded && isSignedIn ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={buttonClassName({
            size: "sm",
            className: isColumn ? "justify-start" : undefined,
          })}
        >
          Dashboard
        </Link>
      ) : (
        <>
          <Link
            href="/sign-in"
            onClick={onNavigate}
            className={buttonClassName({
              variant: "ghost",
              size: "sm",
              className: isColumn ? "justify-start" : undefined,
            })}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            onClick={onNavigate}
            className={buttonClassName({
              size: "sm",
              className: isColumn ? "justify-start" : undefined,
            })}
          >
            Get started
          </Link>
        </>
      )}
    </div>
  );
}

function MarketingNavLinks(props: MarketingNavLinksProps) {
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS === "true") {
    return <MarketingNavLinksBypass {...props} />;
  }

  return <MarketingNavLinksWithClerk {...props} />;
}

export function MarketingAuthLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS === "true") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={buttonClassName({ size: "sm" })}
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return <MarketingAuthLinksWithClerk onNavigate={onNavigate} className={className} />;
}

function MarketingAuthLinksWithClerk({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {isLoaded && isSignedIn ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={buttonClassName({ size: "sm" })}
        >
          Dashboard
        </Link>
      ) : (
        <>
          <Link
            href="/sign-in"
            onClick={onNavigate}
            className={buttonClassName({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            onClick={onNavigate}
            className={buttonClassName({ size: "sm" })}
          >
            Get started
          </Link>
        </>
      )}
    </div>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      menuButtonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    first?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <nav className="hidden items-center md:flex">
        <MarketingNavLinks />
      </nav>

      <div className="md:hidden">
        <MobileMenuButton
          ref={menuButtonRef}
          open={open}
          onClick={() => setOpen((value) => !value)}
        />
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
            aria-label="Close navigation overlay"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawerRef}
            className="fixed inset-y-0 right-0 z-50 w-72 border-l border-slate-200 bg-white p-4 shadow-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketing-nav-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <p id="marketing-nav-title" className="text-sm font-semibold text-slate-900">
                Menu
              </p>
              <MobileMenuButton open={open} onClick={() => setOpen(false)} />
            </div>
            <MarketingNavLinks
              layout="column"
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </>
      ) : null}
    </>
  );
}
