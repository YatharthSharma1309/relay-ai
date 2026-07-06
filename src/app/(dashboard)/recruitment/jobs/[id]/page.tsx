import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Header } from "@/components/layout/header";
import { CandidateStatusBadge } from "@/components/recruitment/candidate-status-badge";
import { ManualCandidateForm } from "@/components/recruitment/manual-candidate-form";
import { PendingHireBanner } from "@/components/recruitment/pending-hire-banner";
import { ResumeUploader } from "@/components/recruitment/resume-uploader";
import { ScoreBadge } from "@/components/recruitment/score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RelativeTime } from "@/components/ui/relative-time";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { getJobDetail } from "@/lib/recruitment/services/jobs";
import { Users } from "lucide-react";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const { organization } = await requireOrgMembershipOrRedirect();
  const job = await getJobDetail(organization.id, id);

  if (!job) {
    notFound();
  }

  const activeCandidates = job.candidates.filter(
    (candidate) => candidate.status !== "archived",
  );

  return (
    <>
      <Header
        title={job.title}
        description="Manage candidates and review AI match scores."
        action={
          <Link href={`/recruitment/jobs/${job.id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" />
              Edit job
            </Button>
          </Link>
        }
      />

      <main id="main-content" className="flex-1 space-y-6 px-4 py-6 sm:p-6 lg:p-8">
        {job.pendingHire ? (
          <PendingHireBanner jobId={job.id} pendingHire={job.pendingHire} />
        ) : null}

        <Card>
          <CardTitle>Job criteria</CardTitle>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium text-slate-700">Required skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill) => (
                  <Badge key={skill} tone="info">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            {job.preferredSkills.length > 0 ? (
              <div>
                <p className="font-medium text-slate-700">Preferred skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.preferredSkills.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {job.experienceLevel ? (
              <p className="text-slate-600">
                <span className="font-medium text-slate-700">Level:</span>{" "}
                {job.experienceLevel}
                {job.minYearsExperience !== null
                  ? ` (${job.minYearsExperience}+ years)`
                  : ""}
              </p>
            ) : null}
            {job.roleType ? (
              <p className="text-slate-600">
                <span className="font-medium text-slate-700">Type:</span> {job.roleType}
              </p>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{job.description}</p>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Add candidates</CardTitle>
            <div className="mt-4 space-y-4">
              <ResumeUploader jobId={job.id} />
              <ManualCandidateForm jobId={job.id} />
            </div>
          </Card>

          <Card>
            <CardTitle>Pipeline summary</CardTitle>
            {job.candidateStats ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Active</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {job.candidateStats.activeTotal}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Analyzed</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {job.candidateStats.analyzed}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Pending analysis</dt>
                  <dd className="text-lg font-semibold text-amber-600">
                    {job.candidateStats.pendingAnalysis}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Parse failed</dt>
                  <dd className="text-lg font-semibold text-rose-600">
                    {job.candidateStats.parseFailed}
                  </dd>
                </div>
              </dl>
            ) : null}
          </Card>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Candidates</h2>

          {activeCandidates.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No candidates yet"
              description="Upload a resume or add candidate text to start building your pipeline."
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Match</th>
                      <th className="px-4 py-3">Parse</th>
                      <th className="px-4 py-3">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <Link
                            href={`/recruitment/jobs/${job.id}/candidates/${candidate.id}`}
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            {candidate.displayName}
                          </Link>
                          {candidate.fileName ? (
                            <p className="text-xs text-slate-400">{candidate.fileName}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <CandidateStatusBadge status={candidate.status} />
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBadge score={candidate.matchScore} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              candidate.parseStatus === "ok" || candidate.parseStatus === "manual"
                                ? "success"
                                : candidate.parseStatus === "failed"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {candidate.parseStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <RelativeTime date={candidate.createdAt} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}
