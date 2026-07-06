import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { JobForm } from "@/components/recruitment/job-form";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { getJobDetail } from "@/lib/recruitment/services/jobs";

type EditJobPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { id } = await params;
  const { organization } = await requireOrgMembershipOrRedirect();
  const job = await getJobDetail(organization.id, id);

  if (!job) {
    notFound();
  }

  return (
    <>
      <Header
        title="Edit job"
        description={`Update requirements for ${job.title}.`}
      />
      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        <JobForm job={job} />
      </main>
    </>
  );
}
