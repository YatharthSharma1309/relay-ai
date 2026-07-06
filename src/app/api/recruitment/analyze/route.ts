export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { withRecruitmentOrg } from "@/lib/recruitment/api-handler";
import { recordRecruitmentAuditEvent } from "@/lib/recruitment/services/audit";
import { analyzeCandidate } from "@/lib/recruitment/services/analyze";
import { getCandidateDetail } from "@/lib/recruitment/services/candidates";
import { analyzeCandidateSchema } from "@/lib/recruitment/validators";

export async function POST(request: Request) {
  return withRecruitmentOrg(async ({ organization, user }) => {
    if (
      await checkRateLimit(`recruitment-analyze:${organization.id}`, 10, 60 * 1000)
    ) {
      return NextResponse.json(
        { error: "Analysis rate limit exceeded. Try again shortly." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = analyzeCandidateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid analyze payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const candidateId = parsed.data.candidateId;
    const candidate = await getCandidateDetail(organization.id, candidateId);
    const analysis = await analyzeCandidate(organization.id, candidateId);

    await recordRecruitmentAuditEvent({
      organizationId: organization.id,
      action: "candidate.analyze",
      entityType: "candidate",
      entityId: candidateId,
      actorId: user.id,
      metadata: {
        jobId: candidate?.jobId ?? null,
        analysisId: analysis.id,
        matchScore: analysis.matchScore,
      },
    });

    return NextResponse.json({ analysis });
  });
}
