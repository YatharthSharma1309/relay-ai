import { describe, expect, it } from "vitest";
import { parseJsonBody } from "./json";

describe("parseJsonBody", () => {
  it("returns parsed JSON on valid body", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ message: "hello" }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseJsonBody<{ message: string }>(request);

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.message).toBe("hello");
    }
  });

  it("returns 400 error on invalid JSON", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: "{not-json",
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseJsonBody(request);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(400);
      const body = await result.error.json();
      expect(body.error).toBe("Invalid JSON body");
    }
  });
});
