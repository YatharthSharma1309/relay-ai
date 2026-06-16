import type { Prisma } from "@/generated/prisma/client";

/** Customer-facing channels (excludes admin dashboard test chats). */
export const customerChannelFilter = {
  channel: { not: "ADMIN" as const },
} satisfies Prisma.ConversationWhereInput;

export function customerConversationWhere(
  organizationId: string,
): Prisma.ConversationWhereInput {
  return {
    organizationId,
    ...customerChannelFilter,
  };
}
