import { Header } from "@/components/layout/header";
import { AgentSettingsForm } from "@/components/settings/agent-settings-form";
import { WidgetSettingsCard } from "@/components/settings/widget-settings-card";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { getAgentSettings } from "@/lib/settings";

const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
const hasAppUrl = Boolean(process.env.APP_URL?.trim());

export default async function SettingsPage() {
  const { organization } = await requireOrgMembershipOrRedirect("ADMIN");
  const settings = await getAgentSettings(organization.id);

  return (
    <>
      <Header
        title="AI Agent Settings"
        description="Configure greeting, tone, instructions, and your customer-facing widget."
      />
      <main id="main-content" className="flex-1 px-4 py-6 sm:p-6 lg:p-8">
        <AgentSettingsForm initialSettings={settings} />
        <WidgetSettingsCard
          widgetPublicKey={organization.widgetPublicKey}
          widgetEnabled={organization.widgetEnabled}
          allowedOrigins={(settings.widget?.allowedOrigins ?? []).join("\n")}
          appUrl={appUrl}
          hasAppUrl={hasAppUrl}
        />
      </main>
    </>
  );
}
