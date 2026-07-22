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
              day: "2026-07-14",
              discounts: "-10.05",
              gross_sales: "150.10",
              net_sales: "120.00",
              orders: "3",
              sales_reversals: "-20.05",
              net_items_sold: "5",
            }],
          },
        },
      },
    };

    expect(normalizeShopifyResponse(fixture, "USD", "America/New_York")).toEqual([{
      currency: "USD",
      date: "2026-07-14",
      discountsMinor: -1005,
      grossSalesMinor: 15010,
      netSalesMinor: 12000,
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
              day: "2026-07-15",
              discounts: "-5.00",
              gross_sales: "75.00",
              net_sales: "70.00",
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
    expect(request.variables.query).toContain("WITH CURRENCY 'USD', TIMEZONE 'America/New_York'");
    const metric = await env.DB.prepare(`
      SELECT date, orders, units_sold, gross_sales_minor, net_sales_minor
      FROM daily_shopify_metrics WHERE date = '2026-07-15'
    `).first();
    expect(metric).toEqual({
      date: "2026-07-15",
      gross_sales_minor: 7500,
      net_sales_minor: 7000,
      orders: 2,
      units_sold: 3,
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
      SELECT last_error FROM integration_state WHERE integration = 'shopify_analytics'
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
      SELECT last_error FROM integration_state WHERE integration = 'shopify_analytics'
    `).first();
    expect(state).toEqual({ last_error: "Invalid Shopify shop domain" });
  });
});
