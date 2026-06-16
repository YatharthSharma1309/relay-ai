import { Header } from "@/components/layout/header";
import { ChatPanelLoader } from "@/components/chat/chat-panel-loader";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAgentSettings } from "@/lib/settings";

export default async function ChatPage() {
  const { organization } = await requireOrgMembershipOrRedirect();
  const [readyDocuments, settings] = await Promise.all([
    db.document.count({
      where: { organizationId: organization.id, status: "READY" },
    }),
    getAgentSettings(organization.id),
  ]);

  return (
    <>
      <Header
        title="AI Chatbot"
        description="RAG-powered answers with live retrieval visualization and source citations."
      />
      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        <ChatPanelLoader
          hasDocuments={readyDocuments > 0}
          welcomeMessage={settings.greeting}
        />
      </main>
    </>
  );
}
