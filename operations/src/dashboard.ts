import { hasValidBasicCredentials } from "./auth";
import { calendarDateInTimeZone, shiftCalendarDate, zonedMidnightUtc } from "./reporting-time";
import {
  renderGrowthDashboard,
  renderOperationsDashboard,
  type CloudflareRow,
  type FunnelRow,
  type FunnelSessions,
  type FunnelTrendRow,
  type IncidentRow,
  type IntegrationRow,
  type ProbeRow,
  type ShopifyRow,
  type StateRow,
} from "./dashboard-render";

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const DAY_MS = 86_400_000;
const REPORTING_TIMEZONE = "America/New_York";

export async function handleDashboardRequest(
  request: Request,
  db: D1Database,
  username: string,
  password: string,
  now: () => Date = () => new Date(),
): Promise<Response> {
  if (!await hasValidBasicCredentials(request, username, password)) {
    return new Response("Authentication required", {
      headers: {
        ...SECURITY_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
        "WWW-Authenticate": 'Basic realm="Shop & Sons Operations", charset="UTF-8"',
      },
      status: 401,
    });
  }

  const generatedAt = now();
  const requestedDays = Number(new URL(request.url).searchParams.get("days"));
  const days = requestedDays === 7 || requestedDays === 90 ? requestedDays : 30;
  const endDate = shiftCalendarDate(calendarDateInTimeZone(generatedAt, REPORTING_TIMEZONE), -1);
  const periodStart = shiftCalendarDate(endDate, -(days - 1));
  const priorStart = shiftCalendarDate(endDate, -(days * 2 - 1));
  const funnelEndDate = endDate;
  const funnelPeriodStart = periodStart;
  const funnelEndTimestamp = new Date(
    zonedMidnightUtc(shiftCalendarDate(funnelEndDate, 1), REPORTING_TIMEZONE).getTime() - 1,
  ).toISOString();
  const funnelPeriodStartTimestamp = zonedMidnightUtc(funnelPeriodStart, REPORTING_TIMEZONE).toISOString();
  const probePeriodStartTimestamp = `${new Date(generatedAt.getTime() - (days - 1) * DAY_MS).toISOString().slice(0, 10)}T00:00:00.000Z`;
  const generatedTimestamp = generatedAt.toISOString();

  const [states, incidents, probes, funnel, funnelSessions, funnelTrend, cloudflare, shopify, onlineShopify, integrations] = await Promise.all([
    db.prepare(`
      SELECT target, status, consecutive_failures, latest_detail, updated_at
      FROM target_states ORDER BY target
    `).all<StateRow>(),
    db.prepare(`
      SELECT target, opened_at, recovered_at, latest_detail FROM incidents
      ORDER BY opened_at DESC LIMIT 50
    `).all<IncidentRow>(),
    db.prepare(`
      SELECT target, checked_at, healthy, status_code, latency_ms, detail
      FROM health_probes WHERE checked_at >= ? AND checked_at <= ?
      ORDER BY checked_at DESC LIMIT 200
    `).bind(probePeriodStartTimestamp, generatedTimestamp).all<ProbeRow>(),
    db.prepare(`
      SELECT date, page_views, product_views, cart_adds, checkout_begins,
             newsletter_signups, distinct_sessions
      FROM daily_funnel_metrics WHERE date >= ? AND date <= ? ORDER BY date DESC
    `).bind(funnelPeriodStart, funnelEndDate).all<FunnelRow>(),
    db.prepare(`
      WITH product_sessions AS (
        SELECT session_id, MIN(occurred_at) AS first_product_at
        FROM funnel_events
        WHERE occurred_at >= ? AND occurred_at <= ? AND event_type = 'product_view'
        GROUP BY session_id
      ), cart_sessions AS (
        SELECT events.session_id, MIN(events.occurred_at) AS first_cart_at
        FROM funnel_events AS events
        JOIN product_sessions AS products ON products.session_id = events.session_id
        WHERE events.occurred_at >= products.first_product_at
          AND events.occurred_at <= ?
          AND events.event_type IN ('cart_add', 'cart_update', 'cart_remove')
        GROUP BY events.session_id
      ), checkout_sessions AS (
        SELECT DISTINCT events.session_id
        FROM funnel_events AS events
        JOIN cart_sessions AS carts ON carts.session_id = events.session_id
        WHERE events.occurred_at >= carts.first_cart_at
          AND events.occurred_at <= ?
          AND events.event_type = 'checkout_begin'
      )
      SELECT
        (SELECT COUNT(*) FROM product_sessions) AS product_sessions,
        (SELECT COUNT(*) FROM cart_sessions) AS cart_sessions,
        (SELECT COUNT(*) FROM checkout_sessions) AS checkout_sessions
    `).bind(funnelPeriodStartTimestamp, funnelEndTimestamp, funnelEndTimestamp, funnelEndTimestamp).first<FunnelSessions>(),
    Promise.resolve({ results: [] as FunnelTrendRow[] }),
    db.prepare(`
      SELECT date, requests, page_views, unique_ips, threats, status_4xx, status_5xx
      FROM daily_cloudflare_metrics WHERE date >= ? AND date <= ? ORDER BY date DESC
    `).bind(priorStart, endDate).all<CloudflareRow>(),
    db.prepare(`
      SELECT date, currency, orders, units_sold, gross_sales_minor,
             discounts_minor, sales_reversals_minor, net_sales_minor
      FROM daily_shopify_metrics WHERE date >= ? AND date <= ? ORDER BY date DESC
    `).bind(priorStart, endDate).all<ShopifyRow>(),
    db.prepare(`
      SELECT date, currency, orders, net_sales_minor, cogs_minor,
             gross_profit_minor, cost_coverage_complete
      FROM daily_online_shopify_metrics WHERE date >= ? AND date <= ? ORDER BY date DESC
    `).bind(priorStart, endDate).all<ShopifyRow>(),
    db.prepare(`
      SELECT integration, last_success_at, last_error
      FROM integration_state ORDER BY integration
    `).all<IntegrationRow>(),
  ]);

  const dashboardData = {
    cloudflareRows: cloudflare.results,
    days,
    funnelEndDate,
    funnelPeriodStart,
    funnelRows: funnel.results,
    funnelSessions,
    funnelTrendRows: funnelTrend.results,
    incidents: incidents.results,
    integrations: integrations.results,
    now: generatedAt,
    onlineShopifyRows: onlineShopify.results,
    periodStart,
    probes: probes.results,
    shopifyRows: shopify.results,
    states: states.results,
  };
  const html = new URL(request.url).pathname === "/dashboard/operations"
    ? renderOperationsDashboard(dashboardData)
    : renderGrowthDashboard(dashboardData);

  return new Response(html, {
    headers: { ...SECURITY_HEADERS, "Content-Type": "text/html; charset=utf-8" },
  });
}