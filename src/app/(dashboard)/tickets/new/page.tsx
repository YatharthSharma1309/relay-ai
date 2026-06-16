import { Header } from "@/components/layout/header";
import { CreateTicketForm } from "@/components/tickets/create-ticket-form";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";

export default async function NewTicketPage() {
  await requireOrgMembershipOrRedirect();

  return (
    <>
      <Header
        title="Create ticket"
        description="Log a new customer support request manually."
      />
      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        <CreateTicketForm />
      </main>
    </>
  );
}
