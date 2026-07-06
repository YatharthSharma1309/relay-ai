import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const defaultWidgetKey = "wk_test_e2e_demo_widget_key";

function getWidgetKey() {
  return process.env.DEMO_WIDGET_KEY ?? defaultWidgetKey;
}

const appOrigin = process.env.APP_URL ?? "http://localhost:3000";
const hasOpenRouterKey = Boolean(
  process.env.OPENROUTER_API_KEY?.trim() &&
    process.env.OPENROUTER_API_KEY !== "sk-or-v1-your-openrouter-key",
);

async function createVisitorSession(request: import("@playwright/test").APIRequestContext) {
  const widgetKey = getWidgetKey();
  const response = await request.post("/api/widget/session", {
    headers: {
      Origin: appOrigin,
      "x-widget-key": widgetKey,
    },
    data: { visitorId: randomUUID() },
  });

  expect(response.status()).toBe(200);
  return (await response.json()) as { visitorId: string; visitorToken: string };
}

async function readSsePrefix(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }

  const decoder = new TextDecoder();
  let prefix = "";

  const deadline = Date.now() + 15_000;
  while (prefix.length < 256 && Date.now() < deadline) {
    const { done, value } = await reader.read();
    if (done) break;
    prefix += decoder.decode(value, { stream: true });
    if (prefix.includes("event: meta")) break;
  }

  await reader.cancel().catch(() => undefined);
  return prefix;
}

test.describe("widget stream API", () => {
  test("rejects requests without a widget key", async ({ request }) => {
    const response = await request.post("/api/widget/chat/stream", {
      headers: { Origin: appOrigin },
      data: { message: "hello", visitorId: "e2e-visitor" },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/widget key/i),
    });
  });

  test("rejects invalid widget keys", async ({ request }) => {
    const response = await request.post("/api/widget/chat/stream", {
      headers: { "x-widget-key": "wk_live_invalid", Origin: appOrigin },
      data: { message: "hello", visitorId: "e2e-visitor" },
    });

    expect(response.status()).toBe(401);
  });

  test("issues a visitor session for valid widget keys", async ({ request }) => {
    const session = await createVisitorSession(request);
    expect(session.visitorId).toBeTruthy();
    expect(session.visitorToken).toMatch(/^[a-f0-9]{64}$/);
  });

  test("requires visitor session for chat stream", async ({ request }) => {
    const widgetKey = getWidgetKey();
    const response = await request.post("/api/widget/chat/stream", {
      headers: { "x-widget-key": widgetKey, Origin: appOrigin },
      data: { message: "hello", visitorId: "550e8400-e29b-41d4-a716-446655440000" },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/visitor session/i),
    });
  });

  test("starts SSE for a seeded widget key", async ({ request, baseURL }) => {
    test.skip(
      !hasOpenRouterKey,
      "Set OPENROUTER_API_KEY to run widget stream start test",
    );

    const widgetKey = getWidgetKey();
    const session = await createVisitorSession(request);

    const response = await fetch(`${baseURL}/api/widget/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-widget-key": widgetKey,
        Origin: appOrigin,
      },
      body: JSON.stringify({
        message: "What is your refund policy?",
        visitorId: session.visitorId,
        visitorToken: session.visitorToken,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const prefix = await readSsePrefix(response);
    expect(prefix).toContain("event: meta");
  });
});
