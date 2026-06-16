import { Header } from "@/components/layout/header";
import { DocumentList } from "@/components/knowledge/document-list";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";

export default async function KnowledgePage() {
  const { role } = await requireOrgMembershipOrRedirect();
  const canManage = role === "ADMIN";

  return (
    <>
      <Header
        title="Knowledge Base"
        description="Upload and manage documents that power your AI chatbot."
      />
      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        <DocumentList canManage={canManage} />
      </main>
    </>
  );
}

