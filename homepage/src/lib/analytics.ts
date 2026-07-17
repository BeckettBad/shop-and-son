export type AnalyticsPageKind =
  | "landing"
  | "catalog"
  | "search"
  | "product"
  | "preorder"
  | "music"
  | "film"
  | "fam";

type CollectorPageKind = Exclude<AnalyticsPageKind, "fam"> | "family";

type AnalyticsEvent =
  | { eventType: "page_view"; pageKind: CollectorPageKind }
  | { eventType: "product_view"; productHandle: string }
  | { eventType: "cart_add"; quantity: number; totalQuantity: number }
  | { eventType: "cart_update"; quantity: number; totalQuantity: number }
  | { eventType: "cart_remove"; quantity: number; totalQuantity: number }
  | { eventType: "checkout_begin"; distinctLineCount: number; totalQuantity: number }
  | { eventType: "newsletter_signup"; campaign: "hero" };

interface AnalyticsRuntime {
  fetcher: (input: string, init: RequestInit) => Promise<unknown>;
  now: () => Date;
  randomUUID: () => string;
  sessionStorage?: Pick<Storage, "getItem" | "setItem">;
}

const SESSION_KEY = "andson:analytics-session";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HANDLE = /^[a-z0-9][a-z0-9-]{0,127}$/;
export const PRODUCTION_COLLECTOR_ENDPOINT = "https://operations.shopandson.com/v1/events";

function browserSessionStorage(): Pick<Storage, "getItem" | "setItem"> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

const browserRuntime: AnalyticsRuntime = {
  fetcher: (input, init) => fetch(input, init),
  now: () => new Date(),
  randomUUID: () => crypto.randomUUID(),
  sessionStorage: browserSessionStorage(),
};

function normalizeEndpoint(value: string | undefined): string | null {
  return value === PRODUCTION_COLLECTOR_ENDPOINT ? value : null;
}

function boundedInteger(value: number): number {
  return Math.max(0, Math.min(10_000_000, Math.floor(value)));
}

export function createAnalytics(endpointValue: string | undefined, runtime: AnalyticsRuntime) {
  const endpoint = normalizeEndpoint(endpointValue);
  let inMemorySessionId: string | undefined;
  let lastPageKind: CollectorPageKind | undefined;

  const getSessionId = () => {
    let stored: string | null | undefined;
    try {
      stored = runtime.sessionStorage?.getItem(SESSION_KEY);
    } catch {
      stored = undefined;
    }
    if (stored && UUID.test(stored)) return stored;
    inMemorySessionId ??= runtime.randomUUID();
    try {
      runtime.sessionStorage?.setItem(SESSION_KEY, inMemorySessionId);
    } catch {
      // Storage may be disabled; the in-memory ID remains privacy-safe for this page.
    }
    return inMemorySessionId;
  };

  const send = (event: AnalyticsEvent) => {
    if (!endpoint) return;
    if (event.eventType === "product_view" && !HANDLE.test(event.productHandle)) return;
    try {
      const payload = {
        ...event,
        eventId: runtime.randomUUID(),
        occurredAt: runtime.now().toISOString(),
        sessionId: getSessionId(),
      };
      void runtime.fetcher(endpoint, {
        body: JSON.stringify(payload),
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        method: "POST",
        referrerPolicy: "no-referrer",
      }).catch(() => undefined);
    } catch {
      // Analytics must never interrupt commerce or navigation.
    }
  };

  return {
    trackEvent(event: Exclude<AnalyticsEvent, { eventType: "page_view" }>) {
      const normalized = event.eventType === "cart_add" || event.eventType === "cart_update" || event.eventType === "cart_remove"
        ? { ...event, quantity: boundedInteger(event.quantity), totalQuantity: boundedInteger(event.totalQuantity) }
        : event.eventType === "checkout_begin"
          ? {
              ...event,
              distinctLineCount: boundedInteger(event.distinctLineCount),
              totalQuantity: boundedInteger(event.totalQuantity),
            }
          : event;
      send(normalized);
    },
    trackPageView(pageKind: AnalyticsPageKind) {
      const normalizedPageKind = pageKind === "fam" ? "family" : pageKind;
      if (normalizedPageKind === lastPageKind) return;
      lastPageKind = normalizedPageKind;
      send({ eventType: "page_view", pageKind: normalizedPageKind });
    },
  };
}

const environment = (import.meta as ImportMeta & {
  env?: { PUBLIC_OPERATIONS_EVENTS_URL?: string };
}).env;
const analytics = createAnalytics(environment?.PUBLIC_OPERATIONS_EVENTS_URL, browserRuntime);

export const trackEvent = analytics.trackEvent;
export const trackPageView = analytics.trackPageView;

export function initializeAnalytics(): void {
  document.addEventListener("analytics:newsletter-signup", () => {
    trackEvent({ campaign: "hero", eventType: "newsletter_signup" });
  });
}
