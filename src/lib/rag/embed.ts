import {
  getAiClient,
  getEmbeddingModel,
  isEmbeddingEnabled,
} from "@/lib/ai";

export async function createEmbedding(text: string): Promise<number[] | null> {
  if (!isEmbeddingEnabled()) return null;

  const client = getAiClient();
  if (!client) return null;

  const response = await client.embeddings.create({
    model: getEmbeddingModel(),
    input: text,
  });

  return response.data[0]?.embedding ?? null;
}

export async function createEmbeddings(
  texts: string[],
): Promise<(number[] | null)[]> {
  if (!isEmbeddingEnabled() || texts.length === 0) {
    return texts.map(() => null);
  }

  const client = getAiClient();
  if (!client) {
    return texts.map(() => null);
  }

  const batchSize = 50;
  const results: (number[] | null)[] = [];

  for (let index = 0; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize);
    const response = await client.embeddings.create({
      model: getEmbeddingModel(),
      input: batch,
    });

    const batchEmbeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    results.push(...batchEmbeddings);
  }

  return results;
}
