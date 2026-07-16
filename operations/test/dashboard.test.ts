import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { handleDashboardRequest } from "../src/dashboard";

function authorization(username = "operator", password = "strong-password"): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

describe("private dashboard", () => {
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
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
  });

  it("renders authenticated operational history and sales with escaped incident details", async () => {
    await env.DB.prepare(`
      INSERT INTO incidents (target, opened_at, first_detail, latest_detail)
      VALUES ('dashboard_site', '2026-07-16T10:00:00.000Z', 'failed', '<script>alert(1)</script>')
    `).run();
    await env.DB.prepare(`
      INSERT INTO health_probes (
        target, checked_at, healthy, status_code, latency_ms, detail
      ) VALUES ('dashboard_site', '2026-07-16T10:05:00.000Z', 0, 503, 275, 'still failed')
    `).run();
    await env.DB.prepare(`
      INSERT INTO daily_shopify_metrics (
        date, currency, timezone, orders, units_sold, gross_sales_minor,
        discounts_minor, sales_reversals_minor, net_sales_minor, updated_at
      ) VALUES ('2026-07-16', 'USD', 'America/New_York', 2, 3, 12000, -500, -1500, 10000,
        '2026-07-16T12:00:00.000Z')
    `).run();
    await env.DB.prepare(`
      INSERT INTO funnel_events (
        event_id, session_id, occurred_at, received_at, event_type, product_handle
      ) VALUES
        ('0194f1e5-7f4a-7000-8000-000000000101', '0194f1e5-7f4a-7000-8000-000000000201', '2026-07-16T10:00:00.000Z', '2026-07-16T10:00:00.000Z', 'product_view', 'one'),
        ('0194f1e5-7f4a-7000-8000-000000000102', '0194f1e5-7f4a-7000-8000-000000000202', '2026-07-16T10:01:00.000Z', '2026-07-16T10:01:00.000Z', 'product_view', 'two'),
        ('0194f1e5-7f4a-7000-8000-000000000103', '0194f1e5-7f4a-7000-8000-000000000201', '2026-07-16T10:02:00.000Z', '2026-07-16T10:02:00.000Z', 'cart_add', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000104', '0194f1e5-7f4a-7000-8000-000000000201', '2026-07-16T10:03:00.000Z', '2026-07-16T10:03:00.000Z', 'checkout_begin', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000105', '0194f1e5-7f4a-7000-8000-000000000203', '2026-07-16T10:04:00.000Z', '2026-07-16T10:04:00.000Z', 'cart_add', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000106', '0194f1e5-7f4a-7000-8000-000000000203', '2026-07-16T10:05:00.000Z', '2026-07-16T10:05:00.000Z', 'checkout_begin', NULL),
        ('0194f1e5-7f4a-7000-8000-000000000107', '0194f1e5-7f4a-7000-8000-000000000202', '2026-07-16T09:59:00.000Z', '2026-07-16T10:06:00.000Z', 'cart_add', NULL)
    `).run();
    const response = await handleDashboardRequest(
      new Request("https://operations.test/dashboard?days=30", {
        headers: { Authorization: authorization() },
      }),
      env.DB,
      "operator",
      "strong-password",
      () => new Date("2026-07-16T12:00:00.000Z"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Shop &amp; Sons Operations");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Recent incidents");
    expect(html).toContain("Recent probes");
    expect(html).toContain("275");
    expect(html).toContain("Discounts");
    expect(html).toContain("Sales reversals");
    expect(html).toContain("AOV");
    expect(html).toContain("$50.00");
    expect(html).toContain("Daily unique-IP total*");
    expect(html).toContain("Cart session conversion");
    expect(html).toContain("Checkout session conversion");
    expect(html).toContain("50.0%");
    expect(html).toContain("100.0%");
  });
});
