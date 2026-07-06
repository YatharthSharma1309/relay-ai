import Link from "next/link";
import { Code2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { FloatingWidget } from "@/components/widget/floating-widget";
import { requireOrgMembershipOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAgentSettings } from "@/lib/settings";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export default async function WidgetPage() {
  const { organization, role } = await requireOrgMembershipOrRedirect();
  const isAdmin = role === "ADMIN";
  const widgetKey = organization.widgetPublicKey ?? "";
  const embedUrl = widgetKey
    ? `${appUrl}/widget/embed?key=${encodeURIComponent(widgetKey)}`
    : null;

  const [readyDocuments, settings] = await Promise.all([
    db.document.count({
      where: { organizationId: organization.id, status: "READY" },
    }),
    getAgentSettings(organization.id),
  ]);
  const hasDocuments = readyDocuments > 0;

  return (
    <>
      <Header
        title="Embeddable Widget"
        description="Preview the chat bubble and copy embed code for your site."
        action={
          embedUrl ? (
            <Link
              href="#iframe-embed"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
            >
              <Code2 className="h-4 w-4" />
              Embed code
            </Link>
          ) : null
        }
      />

      <main id="main-content" className="relative mx-auto max-w-5xl flex-1 px-4 py-6 sm:p-6 lg:p-8">
        {!widgetKey ? (
          <Card>
            <CardTitle>Widget key not configured</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Generate a widget key in Settings to enable embeds and preview."
                : "Ask an admin to configure the widget key in Settings."}
            </CardDescription>
            {isAdmin ? (
              <Link href="/settings" className={buttonClassName({ className: "mt-4" })}>
                Open settings
              </Link>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Contact your workspace admin to enable the embeddable widget.
              </p>
            )}
          </Card>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-800">
              Click the bubble in the bottom-right corner to preview the floating widget.
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="min-h-[420px]">
                <p className="text-sm font-semibold text-slate-900">Live preview area</p>
                <p className="mt-2 text-sm text-slate-500">
                  This simulates a customer site. The widget floats above your product UI.
                </p>
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                  Customer-facing content appears here
                </div>
              </Card>

              <div className="space-y-4">
                <Card id="iframe-embed">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Code2 className="h-4 w-4 text-indigo-600" />
                    Iframe embed
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Full-viewport transparent iframe for the floating bubble.
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{`<iframe
  src="${embedUrl}"
  title="Relay AI chat widget"
  style="border:0;position:fixed;inset:0;width:100%;height:100%;z-index:9999;background:transparent;pointer-events:none"
></iframe>`}
                  </pre>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-slate-900">Launcher script</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Paste before the closing body tag on your site.
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{`<script>
  (function () {
    var iframe = document.createElement("iframe");
    iframe.src = "${embedUrl}";
    iframe.style.cssText =
      "border:0;position:fixed;inset:0;width:100%;height:100%;z-index:9999;background:transparent;pointer-events:none";
    iframe.title = "Relay AI chat widget";
    document.body.appendChild(iframe);
  })();
</script>`}
                  </pre>
                </Card>
              </div>
            </div>

            <FloatingWidget
              hasDocuments={hasDocuments}
              welcomeMessage={settings.greeting}
              widgetKey={widgetKey}
            />
          </>
        )}
      </main>
    </>
  );
}
