import { env } from "cloudflare:workers";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "../src/index";

describe("operations worker", () => {
  it("returns the versioned service health contract", async () => {
    const request = new Request("https://operations.example.test/health");
    const context = createExecutionContext();

    const response = await worker.fetch(request, env, context);
    await waitOnExecutionContext(context);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "shop-and-son-operations",
      version: 1,
    });
  });

  it("protects notification routes", async () => {
    const request = new Request("https://operations.test/api/notifications");
    const context = createExecutionContext();

    const response = await worker.fetch(request, env, context);
    await waitOnExecutionContext(context);

    expect(response.status).toBe(401);
  });

  it("protects the private dashboard", async () => {
    const request = new Request("https://operations.test/dashboard");
    const context = createExecutionContext();

    const response = await worker.fetch(request, env, context);
    await waitOnExecutionContext(context);

    expect(response.status).toBe(401);
  });

  it("keeps storefront collection disabled unless explicitly enabled", async () => {
    const request = new Request("https://operations.test/v1/events", {
      headers: { Origin: "https://shopandson.com" },
      method: "OPTIONS",
    });
    const context = createExecutionContext();

    const response = await worker.fetch(request, env, context);
    await waitOnExecutionContext(context);

    expect(response.status).toBe(503);
  });

  it("accepts storefront events only when collection is explicitly enabled", async () => {
    const request = new Request("https://operations.test/v1/events", {
      body: JSON.stringify({
        eventId: "0194f1e5-7f4a-7000-8000-000000000010",
        eventType: "page_view",
        occurredAt: "2026-07-16T10:30:00.000Z",
        pageKind: "landing",
        sessionId: "0194f1e5-7f4a-7000-8000-000000000011",
      }),
      headers: {
        "Content-Type": "application/json",
        Origin: "https://shopandson.com",
      },
      method: "POST",
    });
    const context = createExecutionContext();

    const response = await worker.fetch(request, { ...env, EVENT_COLLECTION_ENABLED: "true" }, context);
    await waitOnExecutionContext(context);

    expect(response.status).toBe(202);
  });
});
