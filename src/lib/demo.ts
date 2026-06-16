import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getDemoOrganizationContext } from "@/lib/auth/demo";
import { ingestUploadedFile } from "@/lib/documents/process";

export async function seedDemoKnowledgeBase() {
  const { organization } = await getDemoOrganizationContext();
  const demoFilePath = path.join(process.cwd(), "demo", "support-faq.txt");
  const content = await readFile(demoFilePath, "utf-8");

  const existing = await db.document.findFirst({
    where: {
      organizationId: organization.id,
      title: "Support FAQ",
    },
  });

  if (existing) {
    return { document: existing, created: false };
  }

  const file = new File([content], "support-faq.txt", { type: "text/plain" });
  const document = await ingestUploadedFile(organization.id, file);

  return { document, created: true };
}

async function seedDemoConversationsAndTickets(organizationId: string) {
  const marker = await db.conversation.findFirst({
    where: {
      organizationId,
      title: "Demo: Refund question",
    },
  });

  if (marker) {
    return { created: false };
  }

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const refundConversation = await db.conversation.create({
    data: {
      organizationId,
      title: "Demo: Refund question",
      channel: "ADMIN",
      createdAt: twoDaysAgo,
      updatedAt: oneDayAgo,
    },
  });

  await db.message.createMany({
    data: [
      {
        conversationId: refundConversation.id,
        role: "USER",
        content: "What is your refund policy for annual plans?",
        createdAt: twoDaysAgo,
      },
      {
        conversationId: refundConversation.id,
        role: "ASSISTANT",
        content:
          "Annual plans can be refunded within 14 days of purchase if usage stays under the demo limits. After 14 days, refunds are prorated.",
        helpful: true,
        createdAt: oneDayAgo,
      },
    ],
  });

  const escalationConversation = await db.conversation.create({
    data: {
      organizationId,
      title: "Demo: API rate limits",
      channel: "WIDGET",
      visitorId: "demo-widget-visitor",
      createdAt: oneDayAgo,
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  await db.message.createMany({
    data: [
      {
        conversationId: escalationConversation.id,
        role: "USER",
        content: "We keep hitting API rate limits during batch imports.",
        createdAt: oneDayAgo,
      },
      {
        conversationId: escalationConversation.id,
        role: "ASSISTANT",
        content:
          "I found general API limit info, but batch import throttling may need an engineer to review your workspace settings.",
        helpful: false,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
    ],
  });

  await db.ticket.create({
    data: {
      organizationId,
      conversationId: escalationConversation.id,
      title: "Escalation: API rate limits during batch imports",
      description:
        "user: We keep hitting API rate limits during batch imports.\n\nassistant: I found general API limit info, but batch import throttling may need an engineer to review your workspace settings.",
      status: "OPEN",
      priority: "HIGH",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  await db.ticket.createMany({
    data: [
      {
        organizationId,
        title: "Billing sync issue",
        description:
          "Customer reports Stripe charges not syncing to the admin dashboard.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId,
        title: "Password reset emails delayed",
        description: "Multiple users report reset emails arriving after 30 minutes.",
        status: "RESOLVED",
        priority: "LOW",
        resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  await db.conversation.create({
    data: {
      organizationId,
      title: "Demo: Help center billing question",
      channel: "HELP_CENTER",
      visitorId: "demo-help-visitor",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
      messages: {
        create: [
          {
            role: "USER",
            content: "Where can I find my invoice in the help center?",
          },
          {
            role: "ASSISTANT",
            content:
              "Invoices are available under Billing in your account settings. I can walk you through the steps.",
            helpful: true,
          },
        ],
      },
    },
  });

  return { created: true };
}

export async function seedDemoWorkspace() {
  const knowledge = await seedDemoKnowledgeBase();
  const { organization } = await getDemoOrganizationContext();
  const workspace = await seedDemoConversationsAndTickets(organization.id);

  return {
    document: knowledge.document,
    knowledgeCreated: knowledge.created,
    workspaceCreated: workspace.created,
  };
}

export async function getWorkspaceHealth(organizationId: string) {
  const [readyDocuments, conversations, openTickets] = await Promise.all([
    db.document.count({
      where: { organizationId, status: "READY" },
    }),
    db.conversation.count({ where: { organizationId } }),
    db.ticket.count({
      where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  return { readyDocuments, conversations, openTickets };
}
