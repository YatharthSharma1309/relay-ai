import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { CandidateDetailPanel } from "@/components/recruitment/candidate-detail-panel";
import { ScoreBadge } from "@/components/recruitment/score-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { getCandidateDetail } from "@/lib/recruitment/services/candidates";
import { getJobDetail } from "@/lib/recruitment/services/jobs";

type CandidateDetailPageProps = {
  params: Promise<{ id: string; candidateId: string }>;
};

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id: jobId, candidateId } = await params;
  const { organization } = await requireOrgMembershipOrRedirect();

  const [job, candidate] = await Promise.all([
    getJobDetail(organization.id, jobId),
    getCandidateDetail(organization.id, candidateId),
  ]);

  if (!job || !candidate || candidate.jobId !== jobId) {
    notFound();
  }

  const otherCandidateCount = job.candidates.filter(
    (item) => item.id !== candidate.id && item.status !== "archived" && item.status !== "hired",
  ).length;

  const analysis = candidate.analysis;

  return (
    <>
      <Header
        title={candidate.displayName}
        description={`Candidate for ${job.title}`}
        action={
          <Link
            href={`/recruitment/jobs/${jobId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to job
          </Link>
        }
      />

      <main id="main-content" className="flex-1 space-y-6 px-4 py-6 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>AI analysis</CardTitle>
                  <CardDescription>
                    {analysis
                      ? `Analyzed ${new Date(analysis.analyzedAt).toLocaleString()}`
                      : "Run analysis to score this candidate against job criteria."}
                  </CardDescription>
                </div>
                <ScoreBadge score={analysis?.matchScore ?? candidate.matchScore} />
              </div>

              {analysis ? (
                <div className="mt-6 space-y-5 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">Summary</p>
                    <p className="mt-1 leading-6 text-slate-600">{analysis.summary}</p>
                  </div>

                  <div>
                    <p className="font-medium text-slate-700">Match rationale</p>
                    <p className="mt-1 leading-6 text-slate-600">{analysis.matchRationale}</p>
                  </div>

                  {analysis.extractedSkills.length > 0 ? (
                    <div>
                      <p className="font-medium text-slate-700">Extracted skills</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {analysis.extractedSkills.map((skill) => (
                          <Badge key={skill} tone="info">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {analysis.missingSkills.length > 0 ? (
                    <div>
                      <p className="font-medium text-slate-700">Missing skills</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {analysis.missingSkills.map((skill) => (
                          <Badge key={skill} tone="warning">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {analysis.interviewQuestions.length > 0 ? (
                    <div>
                      <p className="font-medium text-slate-700">Suggested interview questions</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                        {analysis.interviewQuestions.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {analysis.scoreBreakdown ? (
                    <div>
                      <p className="font-medium text-slate-700">Score breakdown</p>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-slate-600 sm:grid-cols-3">
                        <div>
                          <dt>Required skills</dt>
                          <dd className="font-semibold text-slate-900">
                            {analysis.scoreBreakdown.requiredSkills}/50
                          </dd>
                        </div>
                        <div>
                          <dt>Preferred skills</dt>
                          <dd className="font-semibold text-slate-900">
                            {analysis.scoreBreakdown.preferredSkills}/15
                          </dd>
                        </div>
                        <div>
                          <dt>Role alignment</dt>
                          <dd className="font-semibold text-slate-900">
                            {analysis.scoreBreakdown.roleAlignment}/10
                          </dd>
                        </div>
                        <div>
                          <dt>Experience</dt>
                          <dd className="font-semibold text-slate-900">
                            {analysis.scoreBreakdown.experience}/10
                          </dd>
                        </div>
                        <div>
                          <dt>Education & certs</dt>
                          <dd className="font-semibold text-slate-900">
                            {analysis.scoreBreakdown.educationCertifications}/10
                          </dd>
                        </div>
                        <div>
                          <dt>Penalties</dt>
                          <dd className="font-semibold text-rose-600">
                            -{analysis.scoreBreakdown.penalties}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No analysis yet. Use the actions panel to run AI scoring.
                </p>
              )}
            </Card>

            <Card>
              <CardTitle>Resume text</CardTitle>
              <CardDescription>
                {candidate.fileName
                  ? `Source: ${candidate.fileName} (${candidate.parseStatus})`
                  : `Manually entered (${candidate.parseStatus})`}
              </CardDescription>
              <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs leading-6 text-slate-700">
                {candidate.rawText}
              </pre>
            </Card>
          </div>

          <Card>
            <CardTitle>Actions</CardTitle>
            <div className="mt-4">
              <CandidateDetailPanel
                candidate={candidate}
                otherCandidateCount={otherCandidateCount}
              />
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
