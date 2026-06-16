import { OrganizationList } from "@clerk/nextjs";
import { getOrgMembershipContext, isAuthBypassEnabled } from "@/lib/auth";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (isAuthBypassEnabled()) {
    redirect("/dashboard");
  }

  const context = await getOrgMembershipContext();
  if (context) {
    redirect("/dashboard");
  }

  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center px-4 py-12"
    >
      <OrganizationList
        hidePersonal
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </main>
  );
}
