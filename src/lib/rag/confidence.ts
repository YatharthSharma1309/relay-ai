import type { ChunkWithScore } from "@/lib/rag/retrieve";

export type GroundingConfidence = "high" | "medium" | "low";

export function computeGroundingConfidence(
  chunks: ChunkWithScore[],
  mode: "vector" | "keyword",
): GroundingConfidence {
  if (chunks.length === 0) return "low";

  const topScore = chunks[0].score;

  if (mode === "vector") {
    if (topScore >= 0.75 && chunks.length >= 2) return "high";
    if (topScore >= 0.45) return "medium";
    return "low";
  }

  if (topScore >= 3 && chunks.length >= 2) return "high";
  if (topScore >= 1) return "medium";
  return "low";
}
