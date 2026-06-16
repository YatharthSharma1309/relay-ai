import { expect, test } from "@playwright/test";

test.describe("admin API with AUTH_BYPASS", () => {
  test.skip(
    () => process.env.PLAYWRIGHT_DASHBOARD !== "1",
    "Set PLAYWRIGHT_DASHBOARD=1 with AUTH_BYPASS dev server",
  );

  test("rejects invalid JSON on ticket create", async ({ request }) => {
    const response = await request.post("/api/tickets", {
      headers: { "Content-Type": "application/json" },
      data: "not-json",
    });

    expect(response.status()).toBe(400);
  });

  test("rejects ticket create without required fields", async ({ request }) => {
    const response = await request.post("/api/tickets", {
      data: { title: "", description: "" },
    });

    expect(response.status()).toBe(400);
  });

  test("lists documents for demo org", async ({ request }) => {
    const response = await request.get("/api/documents");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.documents)).toBe(true);
  });

  test("rejects unauthenticated widget session without origin", async ({
    request,
  }) => {
    test.skip(!process.env.DEMO_WIDGET_KEY, "Requires DEMO_WIDGET_KEY");

    const response = await request.post("/api/widget/session", {
      headers: { "x-widget-key": process.env.DEMO_WIDGET_KEY! },
      data: {},
    });

    expect(response.status()).toBe(401);
  });
});
