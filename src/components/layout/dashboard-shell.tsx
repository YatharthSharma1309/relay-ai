"use client";

import { useRef, useState } from "react";
import { DashboardTopBar } from "@/components/layout/dashboard-top-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavDrawer } from "@/components/layout/mobile-nav";
import type { MemberRole } from "@/generated/prisma/client";

type DashboardShellProps = {
  children: React.ReactNode;
  organizationSlug?: string;
  role?: MemberRole;
};

export function DashboardShell({
  children,
  organizationSlug,
  role = "AGENT",
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar organizationSlug={organizationSlug} role={role} />
      <MobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        returnFocusRef={menuButtonRef}
        organizationSlug={organizationSlug}
        role={role}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <DashboardTopBar
          mobileNavOpen={mobileNavOpen}
          onMobileNavToggle={() => setMobileNavOpen((value) => !value)}
          menuButtonRef={menuButtonRef}
        />
        {children}
      </div>
    </div>
  );
}
