import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { handleDashboardRequest } from "../src/dashboard";

const NOW = new Date("2026-07-16T12:00:00.000Z");

function authorization(username = "operator", password = "strong-password"): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

async function render(days = 30): Promise<{ html: string; response: Response }> {
  const response = await handleDashboardRequest(
    new Request(`https://operations.test/dashboard?days=${days}`, {
      headers: { Authorization: authorization() },
    }),
    env.DB,
    "operator",
    "strong-password",
    () => NOW,
  );
  return { html: await response.text(), response };
}

async function insertDailyMetrics(
  date: string,
  requests: number,
  orders: number,
  netSalesMinor: number,
): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO daily_cloudflare_metrics (
        date, requests, page_views, unique_ips, bytes, threats,
        status_1xx, status_2xx, status_3xx, status_4xx, status_5xx, status_other, updated_at
      ) VALUES (?, ?, ?, ?, 0, 0, 0, ?, 0, 0, 0, 0, ?)
    `).bind(date, requests, Math.floor(requests / 2), Math.floor(requests / 4), requests, `${date}T23:00:00.000Z`),
    env.DB.prepare(`
      INSERT INTO daily_shopify_metrics (
        date, currency, timezone, orders, units_sold, gross_sales_minor,
        discounts_minor, sales_reversals_minor, net_sales_minor, updated_at
      ) VALUES (?, 'USD', 'America/New_York', ?, ?, ?, -500, -1000, ?, ?)
    `).bind(date, orders, orders + 1, netSalesMinor + 1500, netSalesMinor, `${date}T23:00:00.000Z`),
  ]);
}

describe("private dashboard", () => {
  beforeEach(async () => {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM funnel_events"),
      env.DB.prepare("DELETE FROM daily_funnel_metrics"),
      env.DB.prepare("DELETE FROM daily_cloudflare_metrics"),
      env.DB.prepare("DELETE FROM daily_shopify_metrics"),
      env.DB.prepare("DELETE FROM integration_state"),
      env.DB.prepare("DELETE FROM notifications"),
      env.DB.prepare("DELETE FROM incidents"),
      env.DB.prepare("DELETE FROM health_probes"),
      env.DB.prepare("DELETE FROM target_states"),
    ]);
  });

  it("rejects unauthenticated requests with hardened headers", async () => {
    const response = await handleDashboardRequest(
      new Request("https://operations.test/dashboard"),
      env.DB,
      "operator",
      "strong-password",
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain("Basic");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
  });

  it("rejects malformed, incorrect, and unconfigured Basic credentials", async () => {
    const attempts = [
      { authorization: "Basic !!!", username: "operator", password: "secret" },
      { authorization: authorization("operator", "wrong"), username: "operator", password: "secret" },
      { authorization: authorization("", ""), username: "", password: "" },
    ];

    for (const attempt of attempts) {
      const response = await handleDashboardRequest(
        new Request("https://operations.test/dashboard", { headers: { Authorization: attempt.authorization } }),
        env.DB,
        attempt.username,
        attempt.password,
        () => NOW,
      );
      expect(response.status).toBe(401);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("WWW-Authenticate")).toContain("Basic");
    }
  });

  it("renders the executive summary and honest matched prior-period comparisons", async () => {
    for (let day = 3; day <= 16; day += 1) {
      const date = `2026-07-${String(day).padStart(2, "0")}`;
      const current = day >= 10;
      await insertDailyMetrics(date, current ? 100 : 50, current ? 2 : 1, current ? 10_000 : 5_000);
    }

    const { html, response } = await render(7);

    expect(response.status).toBe(200);
    expect(html).toContain("Executive summary");
    expect(html).toContain("Requests");
    expect(html).toContain("Estimated unique IPs");
    expect(html).toContain("Orders");
    expect(html).toContain("Net sales");
    expect(html).toContain("Average order value");
    expect(html).toContain('data-metric="requests" data-current="700" data-previous="350"');
    expect(html).toContain("+100.0%");
    expect(html).toContain("Matched 7-day comparison");
    expect(html).toContain("$700.00");
    expect(html).toContain("$50.00");
  });

  it("does not compare mismatched calendar coverage", async () => {
    await insertDailyMetrics("2026-07-16", 100, 2, 10_000);
    await insertDailyMetrics("2026-07-08", 50, 1, 5_000);

    const { html } = await render(7);

    expect(html).toContain('data-metric="requests" data-current="100"');
    expect(html).not.toContain('data-metric="requests" data-current="100" data-previous=');
    expect(html).toContain("No matched prior-period data");
  });

  it("does not compare AOV when either matched period has no orders", async () => {
    for (let day = 3; day <= 16; day += 1) {
      const date = `2026-07-${String(day).padStart(2, "0")}`;
      await insertDailyMetrics(date, 100, day >= 10 ? 0 : 1, day >= 10 ? 0 : 5_000);
    }

    const { html } = await render(7);
    const aovCard = html.match(/<article class="metric-card" data-metric="aov"[\s\S]*?<\/article>/)?.[0];

    expect(aovCard).toBeDefined();
    expect(aovCard).toContain('<div class="metric-value">—</div>');
    expect(aovCard).not.toContain("data-previous");
    expect(aovCard).toContain("AOV comparison unavailable without orders");
  });

  it("renders healthy, degraded, unhealthy, stale, and overall health states", async () => {
    await env.DB.prepare(`
      INSERT INTO target_states (
        target, status, consecutive_failures, latest_detail, updated_at
      ) VALUES
        ('site', 'healthy', 0, 'Storefront responded', '2026-07-16T11:55:00.000Z'),
        ('worker', 'pending', 1, 'First failed check', '2026-07-16T11:58:00.000Z'),
        ('spotify_auth', 'open', 2, 'Authorization failed', '2026-07-16T11:59:00.000Z'),
        ('feature_toggle', 'healthy', 0, 'Toggle is on', '2026-07-16T11:30:00.000Z')
    `).run();

    const { html } = await render();

    expect(html).toContain("System attention required");
    expect(html).toContain("Storefront");
    expect(html).toContain("Shared Worker");
    expect(html).toContain("Spotify authorization");
    expect(html).toContain("Now-playing feature");
    expect(html).toContain('data-state="healthy"');
    expect(html).toContain('data-state="degraded"');
    expect(html).toContain('data-state="unhealthy"');
    expect(html).toContain('data-state="stale"');
    expect(html).toContain("First failed check");
    expect(html).toContain("Authorization failed");
  });

  it("renders active and recovered incidents with durations and escaped details", async () => {
    await env.DB.prepare(`
      INSERT INTO incidents (target, opened_at, recovered_at, first_detail, latest_detail)
      VALUES
        ('site', '2026-07-16T10:00:00.000Z', NULL, 'failed', '<script>alert(1)</script>'),
        ('worker', '2026-07-16T09:00:00.000Z', '2026-07-16T10:30:00.000Z', 'failed', 'Recovered cleanly')
    `).run();

    const { html } = await render();

    expect(html).toContain("Incident timeline");
    expect(html).toContain("Active incident");
    expect(html).toContain("Recovered");
    expect(html).toContain("2h 0m active");
    expect(html).toContain("1h 30m");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("renders unavailable business metrics when no aggregate records exist", async () => {
    const { html } = await render();

    expect(html).toContain('data-metric="requests" data-availability="unavailable"');
    expect(html).toContain('data-metric="orders" data-availability="unavailable"');
    expect(html).toContain('data-metric="net-sales" data-availability="unavailable"');
    expect(html).toContain('data-metric="aov" data-availability="unavailable"');
    expect(html).toContain("No stored aggregate data for this period");
    expect(html).not.toContain('data-metric="requests" data-current="0"');
    expect(html).not.toContain('data-metric="net-sales" data-current="0"');
    expect(html).toContain("No stored data for this view");
    expect(html).toContain("Storefront funnel");
    expect(html).toContain("Storefront telemetry is unavailable");
    expect(html).toContain("No storefront events have been recorded");
    expect(html).toContain("Product views, cart additions, checkout starts, newsletter responses, and conversion trends will appear here");
    expect(html).toContain('class="empty-state"');
  });

  it("renders ordered funnel conversions and never counts out-of-order sessions", async () => {
    await env.DB.prepare(`
      INSERT INTO daily_funnel_metrics (
        date, page_views, product_views, cart_adds, checkout_begins,
        newsletter_signups, distinct_sessions, updated_at
      ) VALUES ('2026-07-15', 8, 4, 3, 2, 1, 4, '2026-07-16T01:00:00.000Z')
    `).run();
    await env.DB.prepare(`
      INSERT INTO funnel_events (event_id, session_id, occurred_at, received_at, event_type, product_handle)
      VALUES
        ('0194f1e5-7f4a-7000-8000-000000000101', '0194f1e5-7f4a-7000-8000-000000000201', '2026-07-15T10:00:00.000Z', '2026-07-15T10:00:00.000Z', 'product_view', 'one'),
        ('0194f1e5-7f4a-7000-8000-000000000102', '0194f1e5-7f4a-7000-8000-000000000202', '2026-07-15T10:01:00.000Z', '2026-07-15T10:01:00.000Z', 'product_view', 'two'),
        ('0194f1e5-7f4a-7000-8000-000000000103', '0194f1e5-7f4a-7000-8000-000000000201', '2026-07-15T10:02:00.000Z', '2026-07-15T10:02:00.000Z', 'cart_add', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000104', '0194f1e5-7f4a-7000-8000-000000000201', '2026-07-15T10:03:00.000Z', '2026-07-15T10:03:00.000Z', 'checkout_begin', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000105', '0194f1e5-7f4a-7000-8000-000000000203', '2026-07-15T10:04:00.000Z', '2026-07-15T10:04:00.000Z', 'cart_add', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000106', '0194f1e5-7f4a-7000-8000-000000000203', '2026-07-15T10:05:00.000Z', '2026-07-15T10:05:00.000Z', 'checkout_begin', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000107', '0194f1e5-7f4a-7000-8000-000000000202', '2026-07-15T09:59:00.000Z', '2026-07-15T10:06:00.000Z', 'cart_add', NULL)
    `).run();

    const { html } = await render();

    expect(html).toContain("Product views");
    expect(html).toContain("Cart additions");
    expect(html).toContain("Checkout starts");
    expect(html).toContain("Newsletter responses");
    expect(html).toContain("Cart session conversion");
    expect(html).toContain("Checkout session conversion");
    expect(html).toContain("50.0%");
    expect(html).toContain("100.0%");
    expect(html).not.toContain("150.0%");
    expect(html).toContain("ordered anonymous session cohorts");
  });

  it("aligns funnel counts and cohorts to the latest complete UTC day", async () => {
    await env.DB.prepare(`
      INSERT INTO daily_funnel_metrics (
        date, page_views, product_views, cart_adds, checkout_begins,
        newsletter_signups, distinct_sessions, updated_at
      ) VALUES ('2026-07-15', 4, 2, 1, 0, 0, 2, '2026-07-16T01:00:00.000Z')
    `).run();
    await env.DB.prepare(`
      INSERT INTO funnel_events (event_id, session_id, occurred_at, received_at, event_type, product_handle)
      VALUES
        ('0194f1e5-7f4a-7000-8000-000000000301', 'private-session-complete-day', '2026-07-15T10:00:00.000Z', '2026-07-15T10:00:00.000Z', 'product_view', 'private-product-handle'),
        ('0194f1e5-7f4a-7000-8000-000000000302', 'private-session-complete-day', '2026-07-15T10:01:00.000Z', '2026-07-15T10:01:00.000Z', 'cart_add', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000303', 'private-session-current-day', '2026-07-16T10:00:00.000Z', '2026-07-16T10:00:00.000Z', 'product_view', 'today-product-handle'),
        ('0194f1e5-7f4a-7000-8000-000000000304', 'private-session-current-day', '2026-07-16T10:01:00.000Z', '2026-07-16T10:01:00.000Z', 'cart_add', NULL)
    `).run();

    const { html } = await render(7);

    expect(html).toContain("1 of 1 product-view sessions");
    expect(html).toContain("Funnel data through Jul 15, 2026");
    expect(html).toContain("Ordered cart and checkout session conversion percentages by product-view cohort day: exact stored values");
    expect(html).toContain("<td>2026-07-15</td><td>100</td><td>0</td>");
    expect(html).not.toContain("private-session-complete-day");
    expect(html).not.toContain("private-session-current-day");
    expect(html).not.toContain("private-product-handle");
    expect(html).not.toContain("today-product-handle");
  });

  it("renders integration freshness and safely escapes upstream errors", async () => {
    await env.DB.prepare(`
      INSERT INTO integration_state (integration, last_success_at, last_error, updated_at)
      VALUES
        ('cloudflare_analytics', NULL, 'permission <denied>', '2026-07-16T11:00:00.000Z'),
        ('shopify_analytics', '2026-07-16T10:00:00.000Z', NULL, '2026-07-16T10:00:00.000Z')
    `).run();

    const { html } = await render();

    expect(html).toContain("Integration freshness");
    expect(html).toContain("Cloudflare Analytics");
    expect(html).toContain("Shopify Analytics");
    expect(html).toContain("Latest error");
    expect(html).toContain("permission &lt;denied&gt;");
    expect(html).not.toContain("permission <denied>");
  });

  it.each([7, 30, 90])("renders an accessible %i-day view", async (days) => {
    const { html } = await render(days);

    expect(html).toContain(`Last ${days} days`);
    expect(html).toContain(`href="/dashboard?days=${days}" aria-current="page"`);
    expect(html).toContain('<meta name="viewport" content="width=device-width,initial-scale=1">');
    expect(html).toContain("@media (max-width:760px)");
  });

  it.each([7, 30, 90])("uses exact inclusive boundaries and excludes outside and future rows for %i days", async (days) => {
    const start = new Date(NOW.getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const before = new Date(NOW.getTime() - days * 86_400_000).toISOString().slice(0, 10);
    const future = new Date(NOW.getTime() + 86_400_000).toISOString().slice(0, 10);
    await insertDailyMetrics(before, 900, 9, 90_000);
    await insertDailyMetrics(start, 10, 1, 1_000);
    await insertDailyMetrics("2026-07-16", 20, 2, 2_000);
    await insertDailyMetrics(future, 800, 8, 80_000);

    const { html } = await render(days);

    expect(html).toContain('data-metric="requests" data-current="30"');
    expect(html).toContain('data-metric="orders" data-current="3"');
    expect(html).not.toContain(">900<");
    expect(html).not.toContain(">800<");
  });

  it.each([7, 30, 90])("uses exactly %i complete UTC days for funnel counts and cohorts", async (days) => {
    const end = new Date(NOW.getTime() - 86_400_000);
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    const before = new Date(start.getTime() - 86_400_000);
    const dates = {
      before: before.toISOString().slice(0, 10),
      current: NOW.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      start: start.toISOString().slice(0, 10),
    };
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO daily_funnel_metrics (date, product_views, updated_at) VALUES (?, 900, ?), (?, 10, ?), (?, 20, ?), (?, 800, ?)`).bind(
        dates.before, `${dates.before}T23:00:00.000Z`,
        dates.start, `${dates.start}T23:00:00.000Z`,
        dates.end, `${dates.end}T23:00:00.000Z`,
        dates.current, `${dates.current}T12:00:00.000Z`,
      ),
      env.DB.prepare(`
        INSERT INTO funnel_events (event_id, session_id, occurred_at, received_at, event_type)
        VALUES
          ('boundary-before-product', 'boundary-before', ?, ?, 'product_view'),
          ('boundary-before-cart', 'boundary-before', ?, ?, 'cart_add'),
          ('boundary-start-product', 'boundary-start', ?, ?, 'product_view'),
          ('boundary-start-cart', 'boundary-start', ?, ?, 'cart_add'),
          ('boundary-end-product', 'boundary-end', ?, ?, 'product_view'),
          ('boundary-end-cart', 'boundary-end', ?, ?, 'cart_add'),
          ('boundary-current-product', 'boundary-current', ?, ?, 'product_view'),
          ('boundary-current-cart', 'boundary-current', ?, ?, 'cart_add')
      `).bind(
        `${dates.before}T10:00:00.000Z`, `${dates.before}T10:00:00.000Z`, `${dates.before}T10:01:00.000Z`, `${dates.before}T10:01:00.000Z`,
        `${dates.start}T10:00:00.000Z`, `${dates.start}T10:00:00.000Z`, `${dates.start}T10:01:00.000Z`, `${dates.start}T10:01:00.000Z`,
        `${dates.end}T10:00:00.000Z`, `${dates.end}T10:00:00.000Z`, `${dates.end}T10:01:00.000Z`, `${dates.end}T10:01:00.000Z`,
        `${dates.current}T10:00:00.000Z`, `${dates.current}T10:00:00.000Z`, `${dates.current}T10:01:00.000Z`, `${dates.current}T10:01:00.000Z`,
      ),
    ]);

    const { html } = await render(days);
    const funnel = html.match(/<section class="section" aria-labelledby="funnel-title"[\s\S]*?<\/section>/)?.[0];

    expect(funnel).toContain("<strong>30</strong>");
    expect(funnel).toContain("2 of 2 product-view sessions");
    expect(funnel).not.toContain("900");
    expect(funnel).not.toContain("800");
  });

  it("falls back to the 30-day period for unsupported day counts", async () => {
    const { html } = await render(14);
    expect(html).toContain("Last 30 days");
    expect(html).toContain('href="/dashboard?days=30" aria-current="page"');
  });

  it("renders accessible real-data charts without external assets or scripts", async () => {
    await insertDailyMetrics("2026-07-16", 100, 2, 10_000);
    const { html, response } = await render();

    expect(html).toContain("Growth and trends");
    expect(html).toContain('aria-labelledby="traffic-chart-title traffic-chart-caption"');
    expect(html).toContain('role="img" aria-label="Requests, HTML page views, and estimated unique IPs by stored day"');
    expect(html).toContain('aria-labelledby="sales-chart-title sales-chart-caption"');
    expect(html).toContain("Charts use stored daily aggregates only");
    expect(html).toContain("Cloudflare traffic details");
    expect(html).toContain("Shopify sales details");
    expect(html).toContain("Health details");
    expect(html).toContain("Probe history");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<link");
    expect(html).not.toMatch(/src=["']https?:/);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    expect(response.headers.get("Content-Security-Policy")).not.toContain("script-src");
  });

  it("keeps charts and wide data tables readable and keyboard accessible", async () => {
    await insertDailyMetrics("2026-07-14", 80, 1, 7_500);
    await insertDailyMetrics("2026-07-15", 100, 2, 10_000);
    const { html } = await render(7);

    expect(html).toContain('class="sparkline" viewBox="0 0 160 42" aria-hidden="true"');
    expect(html).toContain('class="chart-scroll" tabindex="0" role="region" aria-label="Scrollable chart: Requests, HTML page views, and estimated unique IPs by stored day"');
    expect(html).toContain('<table class="chart-data"><caption>Requests, HTML page views, and estimated unique IPs by stored day: exact stored values</caption>');
    expect(html).toContain('stroke-dasharray="8 5"');
    expect(html).toContain('class="table-wrap" tabindex="0" role="region" aria-label="Daily Cloudflare aggregate traffic; scroll horizontally when needed"');
    expect(html).toContain("--muted:#56615b");
    expect(html).toContain("--gold:#765817");
    expect(html).toContain(".period-nav a:focus-visible{outline:3px solid #1f5a43");
    expect(html).toContain(".chart-scroll .chart{min-width:600px}");
    expect(html).toContain(".chart-grid{display:grid;grid-template-columns:1fr");
  });

  it("renders missing chart dates as separate, shape-distinguished points", async () => {
    await insertDailyMetrics("2026-07-13", 80, 1, 7_500);
    await insertDailyMetrics("2026-07-15", 100, 2, 10_000);

    const { html } = await render(7);
    const trafficFigure = html.match(/<figure class="chart-card" aria-labelledby="traffic-chart-title[\s\S]*?<\/figure>/)?.[0];

    expect(trafficFigure).toBeDefined();
    expect(trafficFigure).not.toContain("<polyline");
    expect(trafficFigure).toContain('class="point-series-0"');
    expect(trafficFigure).toContain('class="point-series-1"');
    expect(trafficFigure).toContain('class="point-series-2"');
    expect(trafficFigure).toContain("2026-07-13");
    expect(trafficFigure).toContain("2026-07-15");
  });

  it("keeps a visible zero baseline when a stored sales value is negative", async () => {
    await insertDailyMetrics("2026-07-15", 100, 1, -5_000);
    await insertDailyMetrics("2026-07-16", 100, 2, 10_000);

    const { html } = await render();

    expect(html).toContain('data-scale-min="-50" data-scale-max="115"');
    expect(html).toContain("-$50.00");
    expect(html).toContain("zero baseline");
  });
});