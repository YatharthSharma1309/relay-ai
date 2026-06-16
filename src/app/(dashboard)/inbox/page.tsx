import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { customerConversationWhere } from "@/lib/conversations/filters";
import { db } from "@/lib/db";
import { RelativeTime } from "@/components/ui/relative-time";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox } from "lucide-react";

export default async function InboxPage() {
  const { organization } = await requireOrgMembershipOrRedirect();

  const conversations = await db.conversation.findMany({
    where: customerConversationWhere(organization.id),
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      tickets: {
        select: { id: true, status: true },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <Header
        title="Agent Inbox"
        description="Monitor customer conversations, escalations, and linked tickets."
      />

      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        {conversations.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No conversations yet"
            description="Customer chats appear here once someone uses the chatbot or widget."
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {conversations.map((conversation) => {
                const lastMessage = conversation.messages[0];
                const linkedTicket = conversation.tickets[0];
                const escalated = Boolean(linkedTicket);

                return (
                  <Card key={conversation.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {conversation.title ?? "Support chat"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {conversation._count.messages} messages ·{" "}
                          <RelativeTime date={conversation.updatedAt} />
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1">
                        {escalated ? (
                          <Badge tone="warning">Escalated</Badge>
                        ) : (
                          <Badge tone="success">AI</Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                      {lastMessage
                        ? `${lastMessage.role === "USER" ? "Customer" : "AI"}: ${lastMessage.content}`
                        : "No messages"}
                    </p>
                    <div className="mt-4 flex gap-3">
                            <Link
                              href={`/inbox/${conversation.id}`}
                              className="text-sm font-medium text-indigo-600"
                            >
                              View transcript
                            </Link>
                      {linkedTicket ? (
                        <Link
                          href={`/tickets/${linkedTicket.id}`}
                          className="text-sm font-medium text-slate-600"
                        >
                          Ticket
                        </Link>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="hidden overflow-hidden p-0 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Conversation</th>
                      <th className="px-4 py-3 font-medium">Last message</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map((conversation) => {
                      const lastMessage = conversation.messages[0];
                      const linkedTicket = conversation.tickets[0];
                      const escalated = Boolean(linkedTicket);

                      return (
                        <tr
                          key={conversation.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-900">
                              {conversation.title ?? "Support chat"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {conversation._count.messages} messages
                            </p>
                          </td>
                          <td className="max-w-xs px-4 py-4">
                            <p className="line-clamp-2 text-slate-600">
                              {lastMessage
                                ? `${lastMessage.role === "USER" ? "Customer" : "AI"}: ${lastMessage.content}`
                                : "No messages"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {escalated ? (
                                <Badge tone="warning">Escalated</Badge>
                              ) : (
                                <Badge tone="success">AI handling</Badge>
                              )}
                              {linkedTicket ? (
                                <Badge tone="info">
                                  {linkedTicket.status.replace("_", " ").toLowerCase()}
                                </Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            <RelativeTime date={conversation.updatedAt} />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/inbox/${conversation.id}`}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                View transcript
                              </Link>
                              {linkedTicket ? (
                                <Link
                                  href={`/tickets/${linkedTicket.id}`}
                                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                >
                                  Ticket
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
