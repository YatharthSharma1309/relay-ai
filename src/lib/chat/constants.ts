/** Maximum characters accepted per chat message (admin + widget). */
export const MAX_CHAT_MESSAGE_LENGTH = 4_000;

export function validateChatMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return "Message is required";
  if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
    return `Message must be at most ${MAX_CHAT_MESSAGE_LENGTH} characters`;
  }
  return null;
}
