export type ChunkWithScore = {
  id: string;
  documentId: string;
  content: string;
  score: number;
  documentTitle?: string;
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function rankChunksBySimilarity(
  queryEmbedding: number[],
  chunks: Array<{
    id: string;
    documentId: string;
    content: string;
    embedding: unknown;
    documentTitle?: string;
  }>,
  topK = 5,
): ChunkWithScore[] {
  const scored = chunks
    .map((chunk) => {
      const embedding = chunk.embedding as number[] | null;
      if (!embedding || !Array.isArray(embedding)) {
        return null;
      }

      return {
        id: chunk.id,
        documentId: chunk.documentId,
        content: chunk.content,
        documentTitle: chunk.documentTitle,
        score: cosineSimilarity(queryEmbedding, embedding),
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

export function rankChunksByKeywords(
  query: string,
  chunks: Array<{
    id: string;
    documentId: string;
    content: string;
    documentTitle?: string;
  }>,
  topK = 5,
): ChunkWithScore[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const scored = chunks
    .map((chunk) => {
      const contentTokens = tokenize(chunk.content);
      let score = 0;

      for (const token of contentTokens) {
        if (queryTokens.has(token)) {
          score += 1;
        }
      }

      const titleTokens = chunk.documentTitle ? tokenize(chunk.documentTitle) : [];
      for (const token of titleTokens) {
        if (queryTokens.has(token)) {
          score += 0.5;
        }
      }

      return score > 0
        ? {
            id: chunk.id,
            documentId: chunk.documentId,
            content: chunk.content,
            documentTitle: chunk.documentTitle,
            score,
          }
        : null;
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

export function retrieveRelevantChunksWithMode(
  query: string,
  chunks: Array<{
    id: string;
    documentId: string;
    content: string;
    embedding: unknown;
    documentTitle?: string;
  }>,
  queryEmbedding: number[] | null,
  topK = 5,
): { chunks: ChunkWithScore[]; mode: "vector" | "keyword" } {
  if (queryEmbedding) {
    const vectorResults = rankChunksBySimilarity(queryEmbedding, chunks, topK);
    if (vectorResults.length > 0) {
      return { chunks: vectorResults, mode: "vector" };
    }
  }

  return {
    chunks: rankChunksByKeywords(query, chunks, topK),
    mode: "keyword",
  };
}

export function buildRagPrompt(
  question: string,
  chunks: ChunkWithScore[],
): string {
  const context =
    chunks.length > 0
      ? chunks
          .map(
            (chunk, index) =>
              `[Source ${index + 1}${chunk.documentTitle ? ` - ${chunk.documentTitle}` : ""}]\n${chunk.content}`,
          )
          .join("\n\n")
      : "No relevant documentation was found.";

  return `You are a helpful customer support assistant. Answer using only the provided context. If the answer is not in the context, say you do not have enough information and suggest creating a support ticket.

Context:
${context}

Question:
${question}`;
}
