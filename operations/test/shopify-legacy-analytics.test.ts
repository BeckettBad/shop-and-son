import { env } from "cloudflare:workers";
import { expect, it, vi } from "vitest";
import { syncAllChannelShopifyAnalytics } from "../src/shopify-legacy-analytics";

it("continues refreshing the preserved all-channel Shopify series", async () => {
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ access_token: "temporary-test-token", scope: "read_reports" }))
    .mockResolvedValueOnce(Response.json({
      data: {
        shopifyqlQuery: {
          parseErrors: [],
          tableData: {
            columns: [],
            rows: [{
              day: "2026-07-15",
              discounts: "-5.00",
              gross_sales: "115.00",
              net_items_sold: "2",
              net_sales: "100.00",
              orders: "1",
              sales_reversals: "-10.00",
            }],
          },
        },
      },
    }));

  await syncAllChannelShopifyAnalytics(env.DB, {
    clientId: "client-id",
    clientSecret: "client-secret",
    currency: "USD",
    end: "2026-07-15",
    fetcher,
    now: () => new Date("2026-07-16T05:00:00.000Z"),
    shopDomain: "shop-and-son.myshopify.com",
    start: "2026-07-15",
    timezone: "America/New_York",
  });

  const request = JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body));
  expect(request.variables.query).not.toContain("sales_channel");
  const row = await env.DB.prepare(`
    SELECT orders, units_sold, gross_sales_minor, discounts_minor,
           sales_reversals_minor, net_sales_minor
    FROM daily_shopify_metrics WHERE date = '2026-07-15'
  `).first();
  expect(row).toEqual({
    discounts_minor: -500,
    gross_sales_minor: 11_500,
    net_sales_minor: 10_000,
    orders: 1,
    sales_reversals_minor: -1_000,
    units_sold: 2,
  });
  const state = await env.DB.prepare(`
    SELECT last_success_at, last_error
    FROM integration_state WHERE integration = 'shopify_analytics'
  `).first();
  expect(state).toEqual({ last_error: null, last_success_at: "2026-07-16T05:00:00.000Z" });
});
