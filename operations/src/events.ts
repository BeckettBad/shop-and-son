const ALLOWED_ORIGINS = new Set([
  "https://shopandson.com",
  "https://www.shopandson.com",
]);
const EVENT_TYPES = new Set([
  "page_view",
  "product_view",
  "cart_add",
  "cart_update",
  "cart_remove",
  "checkout_begin",
  "newsletter_signup",
]);
const PAGE_KINDS = new Set([
  "landing",
  "catalog",
  "search",
  "product",
  "preorder",
  "music",
  "film",
  "family",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HANDLE = /^[a-z0-9][a-z0-9-]{0,127}$/;

const MAX_BODY_BYTES = 8_192;
const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1_000;
const MAX_EVENT_FUTURE_MS = 5 * 60 * 1_000;
const SESSION_EVENTS_PER_MINUTE = 60;
const GLOBAL_EVENTS_PER_MINUTE = 5_000;
const EVENT_FIELDS = new Set([
  "campaign",
  "cartValueCents",
  "currency",
  "distinctLineCount",
  "eventId",
  "eventType",
  "occurredAt",
  "pageKind",
  "productHandle",
  "quantity",
  "sessionId",
  "totalQuantity",
]);
const COMMON_EVENT_FIELDS = ["eventId", "eventType", "occurredAt", "sessionId"];
const EVENT_SCHEMAS = new Map<string, Set<string>>([
  ["page_view", new Set([...COMMON_EVENT_FIELDS, "pageKind"])],
  ["product_view", new Set([...COMMON_EVENT_FIELDS, "productHandle"])],
  ["cart_add", new Set([...COMMON_EVENT_FIELDS, "quantity", "totalQuantity"])],
  ["cart_update", new Set([...COMMON_EVENT_FIELDS, "quantity", "totalQuantity"])],
  ["cart_remove", new Set([...COMMON_EVENT_FIELDS, "quantity", "totalQuantity"])],
  ["checkout_begin", new Set([...COMMON_EVENT_FIELDS, "distinctLineCount", "totalQuantity"])],
  ["newsletter_signup", new Set([...COMMON_EVENT_FIELDS, "campaign"])],
]);

interface EventPayload {
  eventId: string;
  eventType: string;
  occurredAt: string;
  sessionId: string;
  pageKind?: string;
  productHandle?: string;
  quantity?: number;
  totalQuantity?: number;
  distinctLineCount?: number;
  cartValueCents?: number;
  currency?: string;
  campaign?: string;
}

function response(origin: string | null, body: unknown, status: number): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return Response.json(body, { headers, status });
}

function boundedInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 10_000_000;
}

function validPayload(value: unknown, receivedAt: Date): value is EventPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  if (Object.keys(event).some((key) => !EVENT_FIELDS.has(key))) return false;
  if (!UUID.test(String(event.eventId)) || !UUID.test(String(event.sessionId))) return false;
  if (typeof event.eventType !== "string" || !EVENT_TYPES.has(event.eventType)) return false;
  const schema = EVENT_SCHEMAS.get(event.eventType);
  if (!schema || Object.keys(event).length !== schema.size || Object.keys(event).some((key) => !schema.has(key))) {
    return false;
  }
  if (typeof event.occurredAt !== "string") return false;
  const occurredAt = Date.parse(event.occurredAt);
  if (
    !Number.isFinite(occurredAt)
    || occurredAt < receivedAt.getTime() - MAX_EVENT_AGE_MS
    || occurredAt > receivedAt.getTime() + MAX_EVENT_FUTURE_MS
  ) return false;
  if (event.pageKind !== undefined && (typeof event.pageKind !== "string" || !PAGE_KINDS.has(event.pageKind))) return false;
  if (event.productHandle !== undefined && (typeof event.productHandle !== "string" || !HANDLE.test(event.productHandle))) return false;
  for (const key of ["quantity", "totalQuantity", "distinctLineCount", "cartValueCents"] as const) {
    if (event[key] !== undefined && !boundedInteger(event[key])) return false;
  }
  if (event.currency !== undefined && (typeof event.currency !== "string" || !/^[A-Z]{3}$/.test(event.currency))) return false;
  if (event.campaign !== undefined && event.campaign !== "hero") return false;
  return true;
}

async function consumeRateLimits(db: D1Database, sessionId: string, receivedAt: Date): Promise<boolean> {
  const windowStart = new Date(Math.floor(receivedAt.getTime() / 60_000) * 60_000).toISOString();
  const statement = `
    INSERT INTO event_rate_limits (rate_key, window_start, event_count)
    VALUES (?, ?, 1)
    ON CONFLICT(rate_key, window_start) DO UPDATE SET
      event_count = event_rate_limits.event_count + 1
    WHERE event_rate_limits.event_count < ?
  `;
  const session = await db.prepare(statement)
    .bind(`session:${sessionId}`, windowStart, SESSION_EVENTS_PER_MINUTE).run();
  if (session.meta.changes !== 1) return false;
  const global = await db.prepare(statement)
    .bind("global", windowStart, GLOBAL_EVENTS_PER_MINUTE).run();
  return global.meta.changes === 1;
}

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function handleEventRequest(
  request: Request,
  db: D1Database,
  now: () => Date = () => new Date(),
): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return response(origin, { error: "origin_not_allowed" }, 403);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Origin": origin,
        "Cache-Control": "no-store",
        "Vary": "Origin",
      },
      status: 204,
    });
  }
  if (request.method !== "POST") return response(origin, { error: "method_not_allowed" }, 405);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return response(origin, { error: "unsupported_media_type" }, 415);
  }
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return response(origin, { error: "payload_too_large" }, 413);

  const text = await readBoundedBody(request);
  if (text === null) return response(origin, { error: "payload_too_large" }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return response(origin, { error: "invalid_json" }, 400);
  }
  const receivedAt = now();
  if (!validPayload(payload, receivedAt)) return response(origin, { error: "invalid_event" }, 400);

  if (!await consumeRateLimits(db, payload.sessionId, receivedAt)) {
    return response(origin, { error: "rate_limited" }, 429);
  }

  const existing = await db.prepare("SELECT 1 FROM funnel_events WHERE event_id = ?")
    .bind(payload.eventId).first();
  if (existing) return response(origin, { accepted: true, duplicate: true }, 202);


  const result = await db.prepare(`
    INSERT OR IGNORE INTO funnel_events (
      event_id, session_id, occurred_at, received_at, event_type, page_kind,
      product_handle, quantity, total_quantity, distinct_line_count,
      cart_value_cents, currency, campaign
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    payload.eventId,
    payload.sessionId,
    new Date(payload.occurredAt).toISOString(),
    receivedAt.toISOString(),
    payload.eventType,
    payload.pageKind ?? null,
    payload.productHandle ?? null,
    payload.quantity ?? null,
    payload.totalQuantity ?? null,
    payload.distinctLineCount ?? null,
    payload.cartValueCents ?? null,
    payload.currency ?? null,
    payload.campaign ?? null,
  ).run();

  return response(origin, { accepted: true, duplicate: result.meta.changes === 0 }, 202);
}
