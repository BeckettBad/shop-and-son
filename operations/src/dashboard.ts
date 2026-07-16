import { hasValidBasicCredentials } from "./auth";

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

interface FunnelRow {
  date: string;
  page_views: number;
  product_views: number;
  cart_adds: number;
  checkout_begins: number;
  newsletter_signups: number;
  distinct_sessions: number;
}

interface FunnelSessions {
  cart_sessions: number;
  checkout_sessions: number;
  product_sessions: number;
}

interface CloudflareRow {
  date: string;
  requests: number;
  page_views: number;
  unique_ips: number;
  threats: number;
  status_4xx: number;
  status_5xx: number;
}

interface ShopifyRow {
  date: string;
  currency: string;
  orders: number;
  units_sold: number;
  gross_sales_minor: number;
  discounts_minor: number;
  net_sales_minor: number;
  sales_reversals_minor: number;
}

interface StateRow {
  target: string;
  status: string;
  consecutive_failures: number;
  latest_detail: string;
  updated_at: string;
}

interface IncidentRow {
  target: string;
  opened_at: string;
  recovered_at: string | null;
  latest_detail: string;
}

interface ProbeRow {
  checked_at: string;
  detail: string;
  healthy: number;
  latency_ms: number;
  status_code: number | null;
  target: string;
}

interface IntegrationRow {
  integration: string;
  last_success_at: string | null;
  last_error: string | null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sum<T>(rows: T[], field: keyof T): number {
  return rows.reduce((total, row) => total + Number(row[field] ?? 0), 0);
}

function money(minor: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(minor / 100);
}

function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function table(headers: string[], rows: unknown[][]): string {
  const head = headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("");
  const body = rows.length > 0
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}">No data yet</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

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

  const requestedDays = Number(new URL(request.url).searchParams.get("days"));
  const days = requestedDays === 7 || requestedDays === 90 ? requestedDays : 30;
  const cutoff = new Date(now().getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const [states, incidents, probes, funnel, funnelSessions, cloudflare, shopify, integrations] = await Promise.all([
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
      FROM health_probes WHERE checked_at >= ?
      ORDER BY checked_at DESC LIMIT 200
    `).bind(`${cutoff}T00:00:00.000Z`).all<ProbeRow>(),
    db.prepare(`
      SELECT date, page_views, product_views, cart_adds, checkout_begins,
             newsletter_signups, distinct_sessions
      FROM daily_funnel_metrics WHERE date >= ? ORDER BY date DESC
    `).bind(cutoff).all<FunnelRow>(),
    db.prepare(`
      WITH product_sessions AS (
        SELECT session_id, MIN(occurred_at) AS first_product_at
        FROM funnel_events WHERE occurred_at >= ? AND event_type = 'product_view'
        GROUP BY session_id
      ), cart_sessions AS (
        SELECT events.session_id, MIN(events.occurred_at) AS first_cart_at
        FROM funnel_events AS events
        JOIN product_sessions AS products ON products.session_id = events.session_id
        WHERE events.occurred_at >= products.first_product_at
          AND events.event_type IN ('cart_add', 'cart_update', 'cart_remove')
        GROUP BY events.session_id
      ), checkout_sessions AS (
        SELECT DISTINCT events.session_id
        FROM funnel_events AS events
        JOIN cart_sessions AS carts ON carts.session_id = events.session_id
        WHERE events.occurred_at >= carts.first_cart_at AND events.event_type = 'checkout_begin'
      )
      SELECT
        (SELECT COUNT(*) FROM product_sessions) AS product_sessions,
        (SELECT COUNT(*) FROM cart_sessions) AS cart_sessions,
        (SELECT COUNT(*) FROM checkout_sessions) AS checkout_sessions
    `).bind(`${cutoff}T00:00:00.000Z`).first<FunnelSessions>(),
    db.prepare(`
      SELECT date, requests, page_views, unique_ips, threats, status_4xx, status_5xx
      FROM daily_cloudflare_metrics WHERE date >= ? ORDER BY date DESC
    `).bind(cutoff).all<CloudflareRow>(),
    db.prepare(`
      SELECT date, currency, orders, units_sold, gross_sales_minor,
             discounts_minor, sales_reversals_minor, net_sales_minor
      FROM daily_shopify_metrics WHERE date >= ? ORDER BY date DESC
    `).bind(cutoff).all<ShopifyRow>(),
    db.prepare(`
      SELECT integration, last_success_at, last_error
      FROM integration_state ORDER BY integration
    `).all<IntegrationRow>(),
  ]);

  const funnelRows = funnel.results;
  const cloudflareRows = cloudflare.results;
  const shopifyRows = shopify.results;
  const productViews = sum(funnelRows, "product_views");
  const productSessions = funnelSessions?.product_sessions ?? 0;
  const cartSessions = funnelSessions?.cart_sessions ?? 0;
  const checkoutSessions = funnelSessions?.checkout_sessions ?? 0;
  const orders = sum(shopifyRows, "orders");
  const netSales = sum(shopifyRows, "net_sales_minor");
  const averageOrderValue = orders > 0 ? Math.round(netSales / orders) : null;
  const currency = shopifyRows[0]?.currency ?? "USD";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shop &amp; Sons Operations</title><style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#15191f;--line:#2b323c;--text:#eef2f6;--muted:#9ca8b5;--good:#71d99e;--warn:#ffd166;--bad:#ff7272}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}main{max-width:1280px;margin:auto;padding:24px}h1,h2{margin:0 0 12px}h1{font-size:24px}h2{font-size:16px;margin-top:28px}.muted{color:var(--muted)}nav{display:flex;gap:8px;margin:16px 0 24px}nav a{color:var(--text);border:1px solid var(--line);padding:6px 10px;text-decoration:none}nav a.active{background:var(--text);color:var(--bg)}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.card{background:var(--panel);border:1px solid var(--line);padding:14px}.value{font-size:22px;font-weight:700}.table-wrap{overflow:auto;border:1px solid var(--line)}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-weight:500}tr:last-child td{border-bottom:0}.healthy{color:var(--good)}.open{color:var(--bad)}footer{margin-top:32px;color:var(--muted)}
</style></head><body><main>
<h1>Shop &amp; Sons Operations</h1><p class="muted">Private operational view · last ${days} days · generated ${escapeHtml(now().toISOString())}</p>
<nav>${[7, 30, 90].map((period) => `<a class="${period === days ? "active" : ""}" href="/dashboard?days=${period}">${period} days</a>`).join("")}</nav>
<section class="cards">
<div class="card"><div class="muted">Requests</div><div class="value">${sum(cloudflareRows, "requests").toLocaleString()}</div></div>
<div class="card"><div class="muted">Daily unique-IP total*</div><div class="value">${sum(cloudflareRows, "unique_ips").toLocaleString()}</div></div>
<div class="card"><div class="muted">Product views</div><div class="value">${productViews.toLocaleString()}</div></div>
<div class="card"><div class="muted">Cart session conversion</div><div class="value">${percent(cartSessions, productSessions)}</div></div>
<div class="card"><div class="muted">Checkout session conversion</div><div class="value">${percent(checkoutSessions, cartSessions)}</div></div>
<div class="card"><div class="muted">Orders</div><div class="value">${orders.toLocaleString()}</div></div>
<div class="card"><div class="muted">Net sales</div><div class="value">${money(netSales, currency)}</div></div>
<div class="card"><div class="muted">AOV</div><div class="value">${averageOrderValue === null ? "—" : money(averageOrderValue, currency)}</div></div>
</section>
<h2>Health</h2>${table(["Target","State","Failures","Latest detail","Updated"], states.results.map((row) => [row.target,row.status,row.consecutive_failures,row.latest_detail,row.updated_at]))}
<h2>Recent incidents</h2>${table(["Target","State","Opened","Recovered","Latest detail"], incidents.results.map((row) => [row.target,row.recovered_at ? "recovered" : "open",row.opened_at,row.recovered_at ?? "—",row.latest_detail]))}
<h2>Recent probes</h2>${table(["Target","Checked","Healthy","HTTP","Latency ms","Detail"], probes.results.map((row) => [row.target,row.checked_at,row.healthy === 1 ? "yes" : "no",row.status_code ?? "—",row.latency_ms,row.detail]))}
<h2>Funnel</h2>${table(["Date","Sessions","Page views","Product views","Cart adds","Checkouts","Newsletter"], funnelRows.map((row) => [row.date,row.distinct_sessions,row.page_views,row.product_views,row.cart_adds,row.checkout_begins,row.newsletter_signups]))}
<h2>Cloudflare traffic</h2>${table(["Date","Requests","HTML page views","Unique IPs*","4xx","5xx","Threats"], cloudflareRows.map((row) => [row.date,row.requests,row.page_views,row.unique_ips,row.status_4xx,row.status_5xx,row.threats]))}
<h2>Shopify sales</h2>${table(["Date","Orders","Units","Gross sales","Discounts","Sales reversals","Net sales","AOV"], shopifyRows.map((row) => [row.date,row.orders,row.units_sold,money(row.gross_sales_minor,row.currency),money(row.discounts_minor,row.currency),money(row.sales_reversals_minor,row.currency),money(row.net_sales_minor,row.currency),row.orders > 0 ? money(Math.round(row.net_sales_minor / row.orders),row.currency) : "—"]))}
<h2>Integration freshness</h2>${table(["Integration","Last success","Last error"], integrations.results.map((row) => [row.integration,row.last_success_at ?? "Never",row.last_error ?? "—"]))}
<footer>* Unique IP values are daily Cloudflare estimates and are not people. Daily values are not additive into a distinct-period visitor count.</footer>
</main></body></html>`;

  return new Response(html, {
    headers: { ...SECURITY_HEADERS, "Content-Type": "text/html; charset=utf-8" },
  });
}
