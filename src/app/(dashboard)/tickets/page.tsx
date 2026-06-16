import Link from "next/link";
import { Headphones } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { priorityTone, statusTone } from "@/lib/tickets/constants";
import { RelativeTime } from "@/components/ui/relative-time";

export default async function TicketsPage() {
  const { organization } = await requireOrgMembershipOrRedirect();
  const tickets = await db.ticket.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header
        title="Tickets"
        description="Track, assign, and resolve customer support requests."
        action={
          <Link href="/tickets/new">
            <Button size="sm">New ticket</Button>
          </Link>
        }
      />

      <main id="main-content" className="flex-1 space-y-6 px-4 py-6 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <Link href="/tickets/new">
            <Button>Create ticket</Button>
          </Link>
        </div>

        {tickets.length === 0 ? (
          <EmptyState
            icon={Headphones}
            title="No tickets yet"
            description="Create one manually or escalate from the chatbot when AI cannot resolve a question."
            action={
              <Link href="/tickets/new">
                <Button>Create ticket</Button>
              </Link>
            }
          />
        ) : (
          <Card>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 px-4 py-4 hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{ticket.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge tone={priorityTone[ticket.priority]}>
                      {ticket.priority.toLowerCase()}
                    </Badge>
                    <Badge tone={statusTone[ticket.status]}>
                      {ticket.status.replace("_", " ").toLowerCase()}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      <RelativeTime date={ticket.createdAt} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
