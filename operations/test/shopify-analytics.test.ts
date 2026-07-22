import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { normalizeShopifyResponse, syncShopifyAnalytics } from "../src/shopify-analytics";

describe("Shopify aggregate sales analytics", () => {
  it("normalizes ShopifyQL rows into exact USD minor units", () => {
    const fixture = {
      data: {
        shopifyqlQuery: {
          parseErrors: [],
          tableData: {
            columns: [
              { name: "day" },
              { name: "orders" },
              { name: "units_sold" },
              { name: "gross_sales" },
              { name: "discounts" },
              { name: "sales_reversals" },
              { name: "net_sales" },
            ],
            rows: [{
              cost_of_goods_sold: "45.10",
              day: "2026-07-14",
              discounts: "-10.05",
              gross_margin: "62.4167",
              gross_profit: "74.90",
              gross_sales: "150.10",
              net_sales: "120.00",
              net_sales_with_cost_recorded: "120.00",
              net_sales_without_cost_recorded: "0.00",
              orders: "3",
              sales_reversals: "-20.05",
              net_items_sold: "5",
            }],
          },
        },
      },
    };

    expect(normalizeShopifyResponse(fixture, "USD", "America/New_York")).toEqual([{
      cogsMinor: 4510,
      costCoverageComplete: true,
      currency: "USD",
      date: "2026-07-14",
      discountsMinor: -1005,
      grossProfitMinor: 7490,
      grossSalesMinor: 15010,
      netSalesMinor: 12000,
      netSalesWithCostRecordedMinor: 12000,
      netSalesWithoutCostRecordedMinor: 0,
      orders: 3,
      salesReversalsMinor: -2005,
      timezone: "America/New_York",
      unitsSold: 5,
    }]);
  });

  it("reports a bounded ShopifyQL parse error", () => {
    expect(() => normalizeShopifyResponse({
      data: {
        shopifyqlQuery: {
          parseErrors: ["Line 2: metric is unavailable"],
          tableData: null,
        },
      },
    }, "USD", "America/New_York")).toThrow(
      "Shopify Analytics returned ShopifyQL parse errors: Line 2: metric is unavailable",
    );
  });

  it("fails closed when product-cost coverage is incomplete", () => {
    const rows = normalizeShopifyResponse({ data: { shopifyqlQuery: { parseErrors: [], tableData: { columns: [], rows: [{
      cost_of_goods_sold: "20.00",
      day: "2026-07-14",
      discounts: "0.00",
      gross_margin: "80.00",
      gross_profit: "80.00",
      gross_sales: "100.00",
      net_items_sold: "1",
      net_sales: "100.00",
      net_sales_with_cost_recorded: "50.00",
      net_sales_without_cost_recorded: "50.00",
      orders: "1",
      sales_reversals: "0.00",
    }] } } } }, "USD", "America/New_York");

    expect(rows[0]).toMatchObject({
      cogsMinor: null,
      costCoverageComplete: false,
      grossProfitMinor: null,
      netSalesMinor: 10_000,
    });
  });

  it("rejects inconsistent Shopify gross profit", () => {
    expect(() => normalizeShopifyResponse({ data: { shopifyqlQuery: { parseErrors: [], tableData: { columns: [], rows: [{
      cost_of_goods_sold: "20.00",
      day: "2026-07-14",
      discounts: "0.00",
      gross_margin: "75.00",
      gross_profit: "75.00",
      gross_sales: "100.00",
      net_items_sold: "1",
      net_sales: "100.00",
      net_sales_with_cost_recorded: "100.00",
      net_sales_without_cost_recorded: "0.00",
      orders: "1",
      sales_reversals: "0.00",
    }] } } } }, "USD", "America/New_York")).toThrow("inconsistent gross profit");
  });

  it("upserts aggregate-only daily sales and freshness", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({
        access_token: "short-lived-test-token",
        expires_in: 86_399,
        scope: "read_reports",
      }))
      .mockResolvedValueOnce(Response.json({
      data: {
        shopifyqlQuery: {
          parseErrors: [],
          tableData: {
            columns: [],
            rows: [{
              cost_of_goods_sold: "20.00",
              day: "2026-07-15",
              discounts: "-5.00",
              gross_margin: "71.4286",
              gross_profit: "50.00",
              gross_sales: "75.00",
              net_sales: "70.00",
              net_sales_with_cost_recorded: "70.00",
              net_sales_without_cost_recorded: "0.00",
              orders: "2",
              sales_reversals: "0.00",
              net_items_sold: "3",
            }],
          },
        },
      },
    }));

    await syncShopifyAnalytics(env.DB, {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      currency: "USD",
      end: "2026-07-15",
      fetcher,
      now: () => new Date("2026-07-16T00:10:00.000Z"),
      shopDomain: "test-shop.myshopify.com",
      start: "2026-07-15",
      timezone: "America/New_York",
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    const [tokenUrl, tokenInit] = fetcher.mock.calls[0]!;
    expect(tokenUrl).toBe("https://test-shop.myshopify.com/admin/oauth/access_token");
    expect(tokenInit).toMatchObject({
      body: new URLSearchParams({
        client_id: "test-client-id",
        client_secret: "test-client-secret",
        grant_type: "client_credentials",
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });
    const [queryUrl, queryInit] = fetcher.mock.calls[1]!;
    expect(queryUrl).toBe("https://test-shop.myshopify.com/admin/api/2026-07/graphql.json");
    expect(queryInit).toMatchObject({
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": "short-lived-test-token",
      },
      method: "POST",
    });
    const request = JSON.parse(String(queryInit?.body)) as { variables: { query: string } };
    expect(request.variables.query).toContain("orders, net_items_sold, gross_sales");
    expect(request.variables.query).toContain("cost_of_goods_sold, gross_profit");
    expect(request.variables.query).toContain("gross_margin");
    expect(request.variables.query).toContain("net_sales_with_cost_recorded, net_sales_without_cost_recorded");
    expect(request.variables.query).toContain("WHERE sales_channel = 'Online Store'");
    expect(request.variables.query).toContain("WITH CURRENCY 'USD', TIMEZONE 'America/New_York'");
    const metric = await env.DB.prepare(`
      SELECT date, orders, net_sales_minor,
             cogs_minor, gross_profit_minor, cost_coverage_complete
      FROM daily_online_shopify_metrics WHERE date = '2026-07-15'
    `).first();
    expect(metric).toEqual({
      cogs_minor: 2000,
      cost_coverage_complete: 1,
      date: "2026-07-15",
      gross_profit_minor: 5000,
      net_sales_minor: 7000,
      orders: 2,
    });
  });

  it("rejects a short-lived token without read_reports before querying analytics", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      access_token: "wrong-scope-token",
      expires_in: 86_399,
      scope: "read_products",
    }));

    await expect(syncShopifyAnalytics(env.DB, {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      currency: "USD",
      end: "2026-07-15",
      fetcher,
      now: () => new Date("2026-07-16T00:10:00.000Z"),
      shopDomain: "test-shop.myshopify.com",
      start: "2026-07-15",
      timezone: "America/New_York",
    })).rejects.toThrow("Shopify token lacks read_reports scope");

    expect(fetcher).toHaveBeenCalledOnce();
    const state = await env.DB.prepare(`
      SELECT last_error FROM integration_state WHERE integration = 'shopify_online_analytics'
    `).first();
    expect(state).toEqual({ last_error: "Shopify token lacks read_reports scope" });
  });

  it("records invalid shop-domain configuration as integration state", async () => {
    await expect(syncShopifyAnalytics(env.DB, {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      currency: "USD",
      end: "2026-07-15",
      now: () => new Date("2026-07-16T00:10:00.000Z"),
      shopDomain: "https://test-shop.myshopify.com",
      start: "2026-07-15",
      timezone: "America/New_York",
    })).rejects.toThrow("Invalid Shopify shop domain");

    const state = await env.DB.prepare(`
      SELECT last_error FROM integration_state WHERE integration = 'shopify_online_analytics'
    `).first();
    expect(state).toEqual({ last_error: "Invalid Shopify shop domain" });
  });
});
