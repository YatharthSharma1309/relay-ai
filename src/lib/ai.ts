import OpenAI from "openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_CHAT_MODEL = "openrouter/free";

const PLACEHOLDER_KEYS = new Set([
  "",
  "sk-your-openai-key",
  "your-openai-api-key",
  "sk-or-v1-your-openrouter-key",
  "changeme",
]);

let aiClient: OpenAI | null = null;

function getApiKey() {
  for (const value of [process.env.OPENROUTER_API_KEY, process.env.OPENAI_API_KEY]) {
    const key = value?.trim();
    if (key && !PLACEHOLDER_KEYS.has(key)) {
      return key;
    }
  }
  return null;
}

export function getChatModel() {
  return (
    process.env.OPENROUTER_CHAT_MODEL?.trim() ||
    process.env.AI_CHAT_MODEL?.trim() ||
    DEFAULT_CHAT_MODEL
  );
}

export function getEmbeddingModel() {
  return process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "";
}

export function isEmbeddingEnabled() {
  return Boolean(getEmbeddingModel());
}

export function getAiClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  if (!aiClient) {
    aiClient = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer":
          process.env.APP_URL?.trim() || "http://localhost:3000",
        "X-Title": "OpsAI Platform",
      },
    });
  }

  return aiClient;
}

export function isAiConfigured() {
  return Boolean(getApiKey());
}
