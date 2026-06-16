import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";

type TicketPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const { organization } = await requireOrgMembershipOrRedirect();

  const [ticket, members] = await Promise.all([
    db.ticket.findFirst({
      where: { id, organizationId: organization.id },
      include: {
        assignee: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: true },
        },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    }),
    db.organizationMember.findMany({
      where: { organizationId: organization.id },
      include: { user: true },
    }),
  ]);

  if (!ticket) {
    notFound();
  }

  const teamMembers = members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
  }));

  return (
    <>
      <Header title="Ticket detail" description="Review and resolve this request." />
      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        <TicketDetail
          teamMembers={teamMembers}
          ticket={{
            ...ticket,
            createdAt: ticket.createdAt.toISOString(),
            conversationId: ticket.conversationId,
            assigneeId: ticket.assigneeId,
            assignee: ticket.assignee
              ? { id: ticket.assignee.id, name: ticket.assignee.name }
              : null,
            comments: ticket.comments.map((comment) => ({
              ...comment,
              createdAt: comment.createdAt.toISOString(),
            })),
            conversation: ticket.conversation
              ? {
                  ...ticket.conversation,
                  messages: ticket.conversation.messages.map((message) => ({
                    ...message,
                    createdAt: message.createdAt.toISOString(),
                  })),
                }
              : null,
          }}
        />
      </main>
    </>
  );
}
