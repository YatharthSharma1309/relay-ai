import { getAiClient, getChatModel } from "@/lib/ai";
import { RecruitmentError } from "@/lib/recruitment/errors";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionOptions = {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
};

export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const client = getAiClient();
  if (!client) {
    throw new RecruitmentError(
      "AI API key is missing. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
      500,
      "MISSING_API_KEY"
    );
  }

  const model = options.model ?? getChatModel();

  const response = await client.chat.completions.create({
    model,
    temperature: options.temperature ?? 0.3,
    messages: options.messages,
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new RecruitmentError("Model returned an empty response.", 502, "EMPTY_MODEL");
  }

  return content.trim();
}
