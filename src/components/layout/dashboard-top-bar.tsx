"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileMenuButton } from "@/components/layout/mobile-nav";
import { clerkAppearance } from "@/lib/clerk-appearance";
import type { MemberRole } from "@/generated/prisma/client";

function isDemoToolsEnabled() {
  return (
    process.env.NEXT_PUBLIC_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

type DashboardTopBarProps = {
  mobileNavOpen: boolean;
  onMobileNavToggle: () => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export function DashboardTopBar({
  mobileNavOpen,
  onMobileNavToggle,
  menuButtonRef,
}: DashboardTopBarProps) {
  const demoMode = isDemoToolsEnabled();

  return (
    <>
      {demoMode ? (
        <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-center text-xs font-medium text-indigo-800 lg:pl-64">
          Demo mode — authentication bypassed for local development
        </div>
      ) : null}

      <div className="sticky top-0 z-30 glass-panel border-b border-slate-200 px-4 py-2.5 sm:px-6 lg:pl-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 lg:hidden">
            <MobileMenuButton
              ref={menuButtonRef}
              open={mobileNavOpen}
              onClick={onMobileNavToggle}
            />
            <BrandLogo href="/dashboard" size="sm" />
          </div>

          <div className="hidden flex-1 lg:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            {demoMode ? null : (
              <>
                <OrganizationSwitcher
                  hidePersonal
                  appearance={{
                    ...clerkAppearance,
                    elements: {
                      ...clerkAppearance.elements,
                      organizationSwitcherTrigger:
                        "rounded-xl border border-slate-200 px-3 py-1.5 text-sm",
                    },
                  }}
                />
                <UserButton appearance={clerkAppearance} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export type { MemberRole };
