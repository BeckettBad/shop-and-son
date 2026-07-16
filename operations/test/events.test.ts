import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { handleEventRequest } from "../src/events";

const event = {
  eventId: "0194f1e5-7f4a-7000-8000-000000000001",
  eventType: "page_view",
  occurredAt: "2026-07-16T10:00:00.000Z",
  pageKind: "catalog",
  sessionId: "0194f1e5-7f4a-7000-8000-000000000002",
};

function request(body: unknown, origin = "https://shopandson.com"): Request {
  return new Request("https://ops.test/v1/events", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    method: "POST",
  });
}

describe("funnel event ingestion", () => {
  it("stores an allowed event idempotently", async () => {
    const first = await handleEventRequest(request(event), env.DB, () => new Date("2026-07-16T10:00:01.000Z"));
    const duplicate = await handleEventRequest(request(event), env.DB, () => new Date("2026-07-16T10:00:02.000Z"));

    expect(first.status).toBe(202);
    await expect(first.json()).resolves.toEqual({ accepted: true, duplicate: false });
    expect(duplicate.status).toBe(202);
    await expect(duplicate.json()).resolves.toEqual({ accepted: true, duplicate: true });

    const rows = await env.DB.prepare(`
      SELECT event_id, session_id, occurred_at, received_at, event_type, page_kind
      FROM funnel_events
      WHERE event_id = ?
    `).bind(event.eventId).all();
    expect(rows.results).toEqual([{
      event_id: event.eventId,
      event_type: "page_view",
      occurred_at: event.occurredAt,
      page_kind: "catalog",
      received_at: "2026-07-16T10:00:01.000Z",
      session_id: event.sessionId,
    }]);
  });

  it("rejects unknown fields that could contain personal data", async () => {
    const response = await handleEventRequest(
      request({ ...event, email: "customer@example.com" }),
      env.DB,
    );

    expect(response.status).toBe(400);
  });

  it("requires the exact schema for each event type", async () => {
    const invalidEvents = [
      { ...event, pageKind: undefined },
      { ...event, eventType: "product_view", pageKind: undefined },
      { ...event, eventType: "cart_add", pageKind: undefined, quantity: 1 },
      {
        ...event,
        distinctLineCount: 1,
        eventType: "checkout_begin",
        pageKind: undefined,
        productHandle: "contradiction",
        totalQuantity: 1,
      },
      { ...event, campaign: "other", eventType: "newsletter_signup", pageKind: undefined },
    ];

    for (const [index, invalidEvent] of invalidEvents.entries()) {
      const response = await handleEventRequest(
        request({
          ...invalidEvent,
          eventId: `0194f1e5-7f4a-7000-8000-${String(index + 10).padStart(12, "0")}`,
        }),
        env.DB,
      );
      expect(response.status).toBe(400);
    }
  });

  it("rejects timestamps outside the accepted ingestion window", async () => {
    const response = await handleEventRequest(
      request({ ...event, occurredAt: "2030-01-01T00:00:00.000Z" }),
      env.DB,
      () => new Date("2026-07-16T12:00:00.000Z"),
    );

    expect(response.status).toBe(400);
  });

  it("rejects unapproved origins without CORS access", async () => {
    const response = await handleEventRequest(request(event, "https://attacker.example"), env.DB);

    expect(response.status).toBe(403);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("rate-limits duplicate requests before idempotency lookup", async () => {
    for (let index = 0; index < 60; index += 1) {
      const response = await handleEventRequest(
        request({ ...event, occurredAt: "2026-07-19T10:00:00.000Z" }),
        env.DB,
        () => new Date(`2026-07-19T10:00:${String(index).padStart(2, "0")}.000Z`),
      );
      expect(response.status).toBe(202);
    }

    const limited = await handleEventRequest(
      request({ ...event, occurredAt: "2026-07-19T10:00:00.000Z" }),
      env.DB,
      () => new Date("2026-07-19T10:00:59.500Z"),
    );
    expect(limited.status).toBe(429);
    const counters = await env.DB.prepare(`
      SELECT rate_key, event_count FROM event_rate_limits
      WHERE window_start = '2026-07-19T10:00:00.000Z'
      ORDER BY rate_key
    `).all();
    expect(counters.results).toEqual([
      { event_count: 60, rate_key: "global" },
      { event_count: 60, rate_key: `session:${event.sessionId}` },
    ]);
  });

  it("cancels a streaming body as soon as it exceeds the byte limit", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
      start(controller) {
        controller.enqueue(new Uint8Array(8_192));
        controller.enqueue(new Uint8Array([1]));
        controller.enqueue(new Uint8Array(1_000_000));
      },
    });
    const response = await handleEventRequest(new Request("https://operations.test/v1/events", {
      body,
      headers: { "Content-Type": "application/json", Origin: "https://shopandson.com" },
      method: "POST",
    }), env.DB);

    expect(response.status).toBe(413);
    expect(cancelled).toBe(true);
  });
});
