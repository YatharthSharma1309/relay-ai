import { getChatModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { RecruitmentError } from "@/lib/recruitment/errors";
import { parseStringArray, stringifyJson, stringifyStringArray } from "@/lib/recruitment/json";
import { calculateMatchScore } from "@/lib/recruitment/match-score";
import { createChatCompletion } from "@/lib/recruitment/openrouter";
import { buildAnalyzePrompt, parseAnalyzeResult } from "@/lib/recruitment/prompts";
import { toAnalysisDTO } from "@/lib/recruitment/serializers";
import type { AnalysisDTO, JobCriteria } from "@/lib/recruitment/types";

export async function analyzeCandidate(
  organizationId: string,
  candidateId: string
): Promise<AnalysisDTO> {
  const candidate = await db.candidate.findFirst({
    where: { id: candidateId, job: { organizationId } },
    include: { job: true, analysis: true },
  });

  if (!candidate) {
    throw new RecruitmentError("Candidate not found.", 404, "CANDIDATE_NOT_FOUND");
  }

  if (candidate.parseStatus === "failed" || candidate.rawText.length < 50) {
    throw new RecruitmentError(
      "Resume text is missing or failed to parse. Re-upload or add text before analysis.",
      400,
      "RESUME_NOT_READY"
    );
  }

  const criteria: JobCriteria = {
    requiredSkills: parseStringArray(candidate.job.requiredSkills),
    preferredSkills: parseStringArray(candidate.job.preferredSkills),
    experienceLevel: candidate.job.experienceLevel || null,
    minYearsExperience: candidate.job.minYearsExperience,
    educationRequirements: parseStringArray(candidate.job.educationRequirements),
    certifications: parseStringArray(candidate.job.certifications),
    roleType: candidate.job.roleType || null,
  };

  const { system, user } = buildAnalyzePrompt({
    jobTitle: candidate.job.title,
    jobDescription: candidate.job.description,
    criteria,
    resumeText: candidate.rawText,
  });

  const raw = await createChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  });

  let result;
  try {
    result = parseAnalyzeResult(raw);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid model output.";
    throw new RecruitmentError(message, 502, "INVALID_MODEL_JSON");
  }

  const scoreResult = calculateMatchScore({
    criteria,
    resumeText: candidate.rawText,
    evidence: result.evidence,
  });
  const missingSkills = [
    ...scoreResult.breakdown.missingRequiredSkills,
    ...scoreResult.breakdown.missingPreferredSkills,
  ];

  const analysis = await db.candidateAnalysis.upsert({
    where: { candidateId },
    create: {
      candidateId,
      summary: result.summary,
      extractedSkills: stringifyStringArray(result.extractedSkills),
      matchScore: scoreResult.score,
      scoreBreakdown: stringifyJson(scoreResult.breakdown),
      matchRationale: result.matchRationale,
      missingSkills: stringifyStringArray(
        missingSkills.length > 0 ? missingSkills : result.missingSkills
      ),
      interviewQuestions: stringifyStringArray(result.interviewQuestions),
      modelId: getChatModel(),
    },
    update: {
      summary: result.summary,
      extractedSkills: stringifyStringArray(result.extractedSkills),
      matchScore: scoreResult.score,
      scoreBreakdown: stringifyJson(scoreResult.breakdown),
      matchRationale: result.matchRationale,
      missingSkills: stringifyStringArray(
        missingSkills.length > 0 ? missingSkills : result.missingSkills
      ),
      interviewQuestions: stringifyStringArray(result.interviewQuestions),
      modelId: getChatModel(),
      analyzedAt: new Date(),
    },
  });

  return toAnalysisDTO(analysis);
}
