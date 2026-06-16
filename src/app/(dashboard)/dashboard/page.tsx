import Link from "next/link";
import { BookOpen, Bot, Headphones, MessageSquare } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SetupHealthCard } from "@/components/dashboard/setup-health-card";
import { GettingStartedWorkflow } from "@/components/dashboard/getting-started-workflow";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAiConfigured, isEmbeddingEnabled } from "@/lib/ai";
import { RelativeTime } from "@/components/ui/relative-time";

async function getDashboardData(organizationId: string) {
  const [documents, readyDocuments, conversations, openTickets, recentTickets] =
    await Promise.all([
      db.document.count({ where: { organizationId } }),
      db.document.count({ where: { organizationId, status: "READY" } }),
      db.conversation.count({ where: { organizationId } }),
      db.ticket.count({
        where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      db.ticket.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return { documents, readyDocuments, conversations, openTickets, recentTickets };
}

export default async function DashboardPage() {
  const { organization } = await requireOrgMembershipOrRedirect();
  const data = await getDashboardData(organization.id);
  const aiConfigured = isAiConfigured();

  return (
    <>
      <Header
        title="Command Center"
        description={`Support health overview for ${organization.name}.`}
        readyDocuments={data.readyDocuments}
        aiConfigured={aiConfigured}
        action={
          <Link href="/inbox" className={buttonClassName({ size: "sm" })}>
            Open inbox
          </Link>
        }
      />

      <main id="main-content" className="flex-1 space-y-6 px-4 py-6 sm:p-6 lg:p-8">
        <SetupHealthCard
          readyDocuments={data.readyDocuments}
          conversations={data.conversations}
          aiConfigured={aiConfigured}
          embeddingEnabled={isEmbeddingEnabled()}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Knowledge Documents"
            value={data.documents}
            hint="Uploaded support docs"
            icon={BookOpen}
          />
          <StatCard
            label="Chat Conversations"
            value={data.conversations}
            hint="AI support sessions"
            icon={MessageSquare}
          />
          <StatCard
            label="Open Tickets"
            value={data.openTickets}
            hint="Needs agent attention"
            icon={Headphones}
          />
          <StatCard
            label="AI Engine"
            value={data.readyDocuments ? (aiConfigured ? "OpenRouter" : "Keyword") : "Setup"}
            hint={
              data.readyDocuments
                ? aiConfigured
                  ? "Free model via OpenRouter"
                  : "Works without API key"
                : "Upload knowledge docs first"
            }
            icon={Bot}
          />
        </section>

        <GettingStartedWorkflow />

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Jump into the core workflows for your support platform.
            </CardDescription>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/knowledge" className={buttonClassName()}>
                Upload documents
              </Link>
              <Link href="/chat" className={buttonClassName({ variant: "secondary" })}>
                Test chatbot
              </Link>
              <Link href="/widget" className={buttonClassName({ variant: "secondary" })}>
                Open widget
              </Link>
              <Link
                href="/analytics"
                className={buttonClassName({ variant: "secondary" })}
              >
                View analytics
              </Link>
            </div>
          </Card>

          <Card>
            <CardTitle>Recent tickets</CardTitle>
            <CardDescription>
              Latest customer issues across your workspace.
            </CardDescription>
            <div className="mt-5">
              {data.recentTickets.length === 0 ? (
                <EmptyState
                  icon={Headphones}
                  title="No tickets yet"
                  description="Escalate from the chatbot or create a ticket manually to start the support workflow."
                  action={
                    <Link href="/tickets/new" className={buttonClassName({ size: "sm" })}>
                      Create ticket
                    </Link>
                  }
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {data.recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-indigo-100 hover:bg-indigo-50/40"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ticket.status.replace("_", " ").toLowerCase()}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        <RelativeTime date={ticket.createdAt} />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
