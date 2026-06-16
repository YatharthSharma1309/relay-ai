import { NextResponse } from "next/server";
import { withAdminMembership } from "@/lib/auth/api";
import { parseJsonBody } from "@/lib/api/json";
import {
  getAgentSettings,
  parseAgentSettings,
  updateAgentSettings,
  type AgentTone,
} from "@/lib/settings";
export async function GET() {
  return withAdminMembership(async ({ organization }) => {
    const settings = await getAgentSettings(organization.id);
    return NextResponse.json({ settings });
  });
}

export async function PATCH(request: Request) {
  return withAdminMembership(async ({ organization }) => {
    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;    const current = await getAgentSettings(organization.id);
    const tone = body.tone as AgentTone | undefined;

    const next = parseAgentSettings({
      greeting:
        typeof body.greeting === "string" ? body.greeting : current.greeting,
      tone:
        tone === "professional" || tone === "friendly" || tone === "concise"
          ? tone
          : current.tone,
      instructions:
        typeof body.instructions === "string"
          ? body.instructions
          : current.instructions,
      widget: {
        ...(typeof current.widget === "object" && current.widget
          ? current.widget
          : {}),
        ...(typeof body.widget === "object" && body.widget ? body.widget : {}),
      },
    });

    await updateAgentSettings(organization.id, next);
    return NextResponse.json({ settings: next });
  });
}
