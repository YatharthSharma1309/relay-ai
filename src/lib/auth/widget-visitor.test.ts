import { describe, expect, it } from "vitest";
import {
  assertWidgetVisitor,
  createVisitorToken,
  isValidVisitorId,
  verifyVisitorToken,
} from "./widget-visitor";
import { WidgetAuthError } from "./widget-errors";

const orgId = "org_test_123";
const visitorId = "550e8400-e29b-41d4-a716-446655440000";

describe("widget visitor tokens", () => {
  it("validates visitor id format", () => {
    expect(isValidVisitorId(visitorId)).toBe(true);
    expect(isValidVisitorId("not-a-uuid")).toBe(false);
  });

  it("creates and verifies visitor tokens", () => {
    const token = createVisitorToken(orgId, visitorId);
    expect(verifyVisitorToken(orgId, visitorId, token)).toBe(true);
    expect(verifyVisitorToken(orgId, visitorId, "bad-token")).toBe(false);
    expect(verifyVisitorToken("other-org", visitorId, token)).toBe(false);
  });

  it("assertWidgetVisitor returns the visitor id when valid", () => {
    const token = createVisitorToken(orgId, visitorId);
    expect(assertWidgetVisitor(orgId, visitorId, token)).toBe(visitorId);
  });

  it("throws WidgetAuthError for invalid sessions", () => {
    expect(() => assertWidgetVisitor(orgId, visitorId, "bad")).toThrow(
      WidgetAuthError,
    );
  });
});
