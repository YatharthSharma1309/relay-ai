import { Header } from "@/components/layout/header";
import { JobForm } from "@/components/recruitment/job-form";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";

export default async function NewJobPage() {
  await requireOrgMembershipOrRedirect();

  return (
    <>
      <Header
        title="Create job"
        description="Define role requirements. Use AI assist to generate criteria from a title."
      />
      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        <JobForm />
      </main>
    </>
  );
}
