import type { AnalyzeEvidence, EvidenceMatch, JobCriteria, ScoreBreakdown } from "@/lib/recruitment/types";

type MatchScoreInput = {
  criteria: JobCriteria;
  resumeText: string;
  evidence: AnalyzeEvidence;
};

type SkillRequirement = {
  label: string;
  normalized: string;
};

export type MatchScoreResult = {
  score: number;
  breakdown: ScoreBreakdown;
};

const WORDISH = /[a-z0-9+#.]+/gi;

function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/\bjavascript\b/g, "js")
    .replace(/\btypescript\b/g, "ts")
    .replace(/\bnode\.?js\b/g, "node")
    .replace(/\bnext\.?js\b/g, "next")
    .replace(/\breact\.?js\b/g, "react")
    .replace(/\bpostgresql\b/g, "postgres")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

function uniqueSkills(skills: string[]): SkillRequirement[] {
  const seen = new Set<string>();
  const result: SkillRequirement[] = [];

  for (const skill of skills) {
    const trimmed = skill.trim();
    const normalized = normalizeSkill(trimmed);

    if (!trimmed || !normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push({ label: trimmed, normalized });
  }

  return result;
}

function tokenize(value: string): Set<string> {
  return new Set(
    Array.from(value.matchAll(WORDISH), ([token]) => normalizeSkill(token)).filter(Boolean)
  );
}

function hasSkillEvidence(
  normalizedSkill: string,
  evidenceText: string,
  evidenceTokens: Set<string>
): boolean {
  if (normalizedSkill.length <= 3) {
    return evidenceTokens.has(normalizedSkill);
  }

  const escapedSkill = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escapedSkill}(\\s|$)`, "i").test(evidenceText);
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function evidenceConfidence(match: EvidenceMatch): number {
  const base = clamp(match.confidence);
  if (match.matchType === "exact") return base;
  if (match.matchType === "semantic") return base * 0.9;
  return base * 0.75;
}

function scoreSkills(input: {
  requirements: SkillRequirement[];
  aiMatches: EvidenceMatch[];
  evidenceText: string;
  evidenceTokens: Set<string>;
  maxPoints: number;
}): {
  points: number;
  matched: string[];
  missing: string[];
  coverage: number;
} {
  if (input.requirements.length === 0) {
    return { points: input.maxPoints, matched: [], missing: [], coverage: 1 };
  }

  const aiMatchBySkill = new Map<string, EvidenceMatch>();
  for (const match of input.aiMatches) {
    const normalized = normalizeSkill(match.skill);
    if (!normalized) continue;
    const existing = aiMatchBySkill.get(normalized);
    if (!existing || evidenceConfidence(match) > evidenceConfidence(existing)) {
      aiMatchBySkill.set(normalized, match);
    }
  }

  let weightedCoverage = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  for (const requirement of input.requirements) {
    const localMatch = hasSkillEvidence(
      requirement.normalized,
      input.evidenceText,
      input.evidenceTokens
    );
    const aiMatch = aiMatchBySkill.get(requirement.normalized);
    const confidence = Math.max(
      localMatch ? 1 : 0,
      aiMatch ? evidenceConfidence(aiMatch) : 0
    );

    if (confidence >= 0.55) {
      matched.push(requirement.label);
      weightedCoverage += confidence;
    } else {
      missing.push(requirement.label);
    }
  }

  const coverage = weightedCoverage / input.requirements.length;
  return {
    points: Math.round(coverage * input.maxPoints),
    matched,
    missing,
    coverage,
  };
}

function scoreExperience(criteria: JobCriteria, evidence: AnalyzeEvidence): number {
  const aiScore = clamp(evidence.experience.score);
  if (criteria.minYearsExperience === null || criteria.minYearsExperience === 0) {
    return Math.round(aiScore * 10);
  }

  const years = evidence.experience.years;
  if (years === null) {
    return Math.round(aiScore * 10);
  }

  const yearsScore = clamp(years / criteria.minYearsExperience);
  return Math.round(((yearsScore * 0.65) + (aiScore * 0.35)) * 10);
}

function scoreEducationAndCertifications(
  criteria: JobCriteria,
  evidence: AnalyzeEvidence
): number {
  const totalRequirements =
    criteria.educationRequirements.length + criteria.certifications.length;
  if (totalRequirements === 0) {
    return 10;
  }

  const matched =
    evidence.educationMatches.length + evidence.certificationMatches.length;
  return Math.round(clamp(matched / totalRequirements) * 10);
}

export function calculateMatchScore(input: MatchScoreInput): MatchScoreResult {
  const requiredSkills = uniqueSkills(input.criteria.requiredSkills);
  const preferredSkills = uniqueSkills(input.criteria.preferredSkills);
  const evidenceText = normalizeSkill(input.resumeText);
  const evidenceTokens = tokenize(evidenceText);
  const required = scoreSkills({
    requirements: requiredSkills,
    aiMatches: input.evidence.matchedRequiredSkills,
    evidenceText,
    evidenceTokens,
    maxPoints: 50,
  });
  const preferred = scoreSkills({
    requirements: preferredSkills,
    aiMatches: input.evidence.matchedPreferredSkills,
    evidenceText,
    evidenceTokens,
    maxPoints: 15,
  });
  const roleAlignment = Math.round(clamp(input.evidence.roleAlignment.score) * 10);
  const experience = scoreExperience(input.criteria, input.evidence);
  const educationCertifications = scoreEducationAndCertifications(
    input.criteria,
    input.evidence
  );
  const parseQuality = Math.round(clamp(input.evidence.parseQuality.score) * 5);

  const missingRequiredPenalty = Math.min(15, required.missing.length * 4);
  const keywordStuffingPenalty =
    evidenceTokens.size < 45 && required.matched.length >= 4 ? 8 : 0;
  const penalties = missingRequiredPenalty + keywordStuffingPenalty;
  const rawScore =
    required.points +
    preferred.points +
    roleAlignment +
    experience +
    educationCertifications +
    parseQuality -
    penalties;
  const cappedScore =
    required.coverage === 0
      ? Math.min(rawScore, 45)
      : required.coverage < 0.5
        ? Math.min(rawScore, 65)
        : rawScore;
  const score = Math.max(0, Math.min(100, Math.round(cappedScore)));
  const notes = [
    input.evidence.roleAlignment.evidence,
    input.evidence.experience.evidence,
    ...input.evidence.parseQuality.concerns,
  ].filter(Boolean);

  return {
    score,
    breakdown: {
      requiredSkills: required.points,
      preferredSkills: preferred.points,
      roleAlignment,
      experience,
      educationCertifications,
      parseQuality,
      penalties,
      matchedRequiredSkills: required.matched,
      matchedPreferredSkills: preferred.matched,
      missingRequiredSkills: required.missing,
      missingPreferredSkills: preferred.missing,
      notes,
    },
  };
}
