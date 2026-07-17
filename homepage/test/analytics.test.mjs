import assert from "node:assert/strict";
import test from "node:test";
import { createAnalytics } from "../src/lib/analytics.ts";

function runtime() {
  const calls = [];
  const values = new Map();
  let sequence = 0;
  return {
    calls,
    value: {
      fetcher: async (input, init) => {
        calls.push({ input, init });
      },
      now: () => new Date("2026-07-16T12:00:00.000Z"),
      randomUUID: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
      sessionStorage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
          values.set(key, value);
        },
      },
    },
  };
}

test("deduplicates logical page views and reuses an anonymous session", async () => {
  const mock = runtime();
  const analytics = createAnalytics("https://operations.shopandson.com/v1/events", mock.value);

  analytics.trackPageView("landing");
  analytics.trackPageView("landing");
  analytics.trackEvent({ eventType: "product_view", productHandle: "safe-public-handle" });
  await Promise.resolve();

  assert.equal(mock.calls.length, 2);
  const first = JSON.parse(String(mock.calls[0]?.init.body));
  const second = JSON.parse(String(mock.calls[1]?.init.body));
  assert.equal(first.eventType, "page_view");
  assert.equal(first.pageKind, "landing");
  assert.equal(first.sessionId, second.sessionId);
  assert.equal(mock.calls[0]?.init.keepalive, true);
  assert.equal(mock.calls[0]?.init.credentials, "omit");
  assert.equal(mock.calls[0]?.init.referrerPolicy, "no-referrer");
});

test("is a no-op without a valid HTTPS collector", async () => {
  const mock = runtime();
  createAnalytics("https://attacker.example/v1/events", mock.value).trackPageView("landing");
  createAnalytics("http://operations.example/v1/events", mock.value).trackPageView("landing");
  createAnalytics("https://operations.example/wrong", mock.value).trackPageView("landing");
  createAnalytics("https://user:pass@operations.example/v1/events", mock.value).trackPageView("landing");
  createAnalytics("https://operations.example/v1/events?leak=true", mock.value).trackPageView("landing");
  createAnalytics(undefined, mock.value).trackPageView("landing");
  await Promise.resolve();
  assert.equal(mock.calls.length, 0);
});

test("never throws when anonymous session storage is unavailable", async () => {
  const mock = runtime();
  mock.value.sessionStorage = {
    getItem: () => {
      throw new DOMException("denied", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("denied", "SecurityError");
    },
  };
  const analytics = createAnalytics("https://operations.shopandson.com/v1/events", mock.value);

  assert.doesNotThrow(() => analytics.trackPageView("landing"));
  assert.doesNotThrow(() => analytics.trackEvent({
    eventType: "cart_add",
    quantity: 1,
    totalQuantity: 1,
  }));
  await Promise.resolve();
  assert.equal(mock.calls.length, 2);
  const first = JSON.parse(String(mock.calls[0]?.init.body));
  const second = JSON.parse(String(mock.calls[1]?.init.body));
  assert.equal(first.sessionId, second.sessionId);
  assert.deepEqual(Object.keys(first).sort(), ["eventId", "eventType", "occurredAt", "pageKind", "sessionId"]);

  const nextPage = createAnalytics("https://operations.shopandson.com/v1/events", mock.value);
  nextPage.trackPageView("landing");
  await Promise.resolve();
  const reloaded = JSON.parse(String(mock.calls[2]?.init.body));
  assert.notEqual(first.sessionId, reloaded.sessionId);
});

test("replaces a malformed stored session identifier with an anonymous UUID", async () => {
  const mock = runtime();
  let stored = "customer@example.com";
  mock.value.sessionStorage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value;
    },
  };

  createAnalytics("https://operations.shopandson.com/v1/events", mock.value).trackPageView("landing");
  await Promise.resolve();

  const payload = JSON.parse(String(mock.calls[0]?.init.body));
  assert.equal(payload.sessionId, "00000000-0000-4000-8000-000000000002");
  assert.equal(stored, payload.sessionId);
});

test("normalizes the fam stage to the collector's canonical family page kind", async () => {
  const mock = runtime();
  createAnalytics("https://operations.shopandson.com/v1/events", mock.value).trackPageView("fam");
  await Promise.resolve();

  const payload = JSON.parse(String(mock.calls[0]?.init.body));
  assert.equal(payload.pageKind, "family");
});
