import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { JobCard } from "@/components/recruitment/job-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { listJobs } from "@/lib/recruitment/services/jobs";

export default async function RecruitmentPage() {
  const { organization } = await requireOrgMembershipOrRedirect();
  const jobs = await listJobs(organization.id);

  return (
    <>
      <Header
        title="Recruitment"
        description="Create job postings, upload resumes, and score candidates with AI."
        action={
          <Link href="/recruitment/jobs/new">
            <Button size="sm">New job</Button>
          </Link>
        }
      />

      <main id="main-content" className="flex-1 space-y-6 px-4 py-6 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <Link href="/recruitment/jobs/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create job
            </Button>
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Create your first job posting to start collecting and analyzing candidate resumes."
            action={
              <Link href="/recruitment/jobs/new">
                <Button>Create job</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
