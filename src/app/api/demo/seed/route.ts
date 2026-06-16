import { NextResponse } from "next/server";
import { isDemoSeedAllowed } from "@/lib/demo-guard";
import { seedDemoWorkspace } from "@/lib/demo";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (await checkRateLimit(`demo-seed:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isDemoSeedAllowed(request)) {
    return NextResponse.json(
      { error: "Demo seed is disabled in production without DEMO_SEED_SECRET." },
      { status: 403 },
    );
  }

  try {
    const result = await seedDemoWorkspace();
    return NextResponse.json({
      success: true,
      knowledgeCreated: result.knowledgeCreated,
      workspaceCreated: result.workspaceCreated,
      document: result.document,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load demo data",
      },
      { status: 500 },
    );
  }
}
