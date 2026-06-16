import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, role } = await requireOrgMembershipOrRedirect();

  return (
    <DashboardShell organizationSlug={organization.slug} role={role}>
      {children}
    </DashboardShell>
  );
}
