import { describe, expect, it } from "vitest";
import { hasValidBearerToken } from "../src/auth";

describe("notification API authentication", () => {
  it("accepts only the exact bearer secret", async () => {
    const secret = "local-test-secret";

    await expect(hasValidBearerToken(new Request("https://ops.test/api", {
      headers: { Authorization: `Bearer ${secret}` },
    }), secret)).resolves.toBe(true);
    await expect(hasValidBearerToken(new Request("https://ops.test/api", {
      headers: { Authorization: "Bearer wrong-secret" },
    }), secret)).resolves.toBe(false);
    await expect(hasValidBearerToken(new Request("https://ops.test/api"), secret)).resolves.toBe(false);
  });
});
