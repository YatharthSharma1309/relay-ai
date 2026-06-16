import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {},
}));

import {
  WidgetAuthError,
  getWidgetKeyFromRequest,
  isOriginPermitted,
  widgetAuthErrorResponse,
} from "./widget";

describe("getWidgetKeyFromRequest", () => {
  it("reads the x-widget-key header first", () => {
    const request = new Request(
      "http://localhost/api/widget/chat/stream?key=query-key",
      {
        headers: { "x-widget-key": "header-key" },
      },
    );

    expect(getWidgetKeyFromRequest(request)).toBe("header-key");
  });

  it("falls back to the key query parameter", () => {
    const request = new Request(
      "http://localhost/api/widget/chat/stream?key=query-key",
    );

    expect(getWidgetKeyFromRequest(request)).toBe("query-key");
  });

  it("returns null when no key is present", () => {
    const request = new Request("http://localhost/api/widget/chat/stream");

    expect(getWidgetKeyFromRequest(request)).toBeNull();
  });
});

describe("isOriginPermitted", () => {
  const appOrigin = "http://localhost:3000";

  it("allows the app origin", () => {
    expect(isOriginPermitted(appOrigin, [], appOrigin)).toBe(true);
  });

  it("allows wildcard subdomain matches", () => {
    expect(
      isOriginPermitted(
        "https://app.example.com",
        ["*.example.com"],
        appOrigin,
      ),
    ).toBe(true);
  });

  it("rejects origins outside the allow list", () => {
    expect(
      isOriginPermitted("https://evil.example.net", ["*.example.com"], appOrigin),
    ).toBe(false);
  });

  it("does not treat evil-example.com as example.com", () => {
    expect(
      isOriginPermitted("https://evil-example.com", ["example.com"], appOrigin),
    ).toBe(false);
  });

  it("allows exact hostname entries", () => {
    expect(
      isOriginPermitted("https://app.example.com", ["app.example.com"], appOrigin),
    ).toBe(true);
  });
});

describe("widgetAuthErrorResponse", () => {
  it("maps WidgetAuthError to a 401 JSON response", async () => {
    const response = widgetAuthErrorResponse(
      new WidgetAuthError("Widget key is required."),
    );

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({
      error: "Widget key is required.",
    });
  });

  it("returns null for non-widget errors", () => {
    expect(widgetAuthErrorResponse(new Error("other"))).toBeNull();
  });
});
