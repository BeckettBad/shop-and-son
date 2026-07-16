import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { normalizeCloudflareResponse, syncCloudflareAnalytics } from "../src/cloudflare-analytics";

describe("Cloudflare daily analytics", () => {
  it("normalizes daily traffic and groups edge status codes", () => {
    const fixture = {
      data: {
        viewer: {
          zones: [{
            httpRequests1dGroups: [{
              dimensions: { date: "2026-07-14" },
              sum: {
                bytes: 4096,
                pageViews: 40,
                requests: 100,
                responseStatusMap: [
                  { edgeResponseStatus: 200, requests: 80 },
                  { edgeResponseStatus: 304, requests: 5 },
                  { edgeResponseStatus: 404, requests: 10 },
                  { edgeResponseStatus: 522, requests: 4 },
                  { edgeResponseStatus: 0, requests: 1 },
                ],
                threats: 2,
              },
              uniq: { uniques: 30 },
            }],
          }],
        },
      },
      errors: null,
    };

    expect(normalizeCloudflareResponse(fixture)).toEqual([{
      bytes: 4096,
      date: "2026-07-14",
      pageViews: 40,
      requests: 100,
      status1xx: 0,
      status2xx: 80,
      status3xx: 5,
      status4xx: 10,
      status5xx: 4,
      statusOther: 1,
      threats: 2,
      uniqueIps: 30,
    }]);
  });

  it("upserts normalized daily metrics and freshness", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      data: { viewer: { zones: [{ httpRequests1dGroups: [{
        dimensions: { date: "2026-07-15" },
        sum: {
          bytes: 2048,
          pageViews: 12,
          requests: 50,
          responseStatusMap: [{ edgeResponseStatus: 200, requests: 50 }],
          threats: 0,
        },
        uniq: { uniques: 10 },
      }] }] } },
      errors: null,
    }));

    await syncCloudflareAnalytics(env.DB, {
      end: "2026-07-15",
      fetcher,
      now: () => new Date("2026-07-16T00:05:00.000Z"),
      start: "2026-07-15",
      token: "test-token",
      zoneId: "test-zone",
    });

    const metric = await env.DB.prepare(`
      SELECT date, requests, page_views, unique_ips, bytes, status_2xx
      FROM daily_cloudflare_metrics WHERE date = '2026-07-15'
    `).first();
    expect(metric).toEqual({
      bytes: 2048,
      date: "2026-07-15",
      page_views: 12,
      requests: 50,
      status_2xx: 50,
      unique_ips: 10,
    });
    const state = await env.DB.prepare(`
      SELECT last_success_at, last_error FROM integration_state
      WHERE integration = 'cloudflare_analytics'
    `).first();
    expect(state).toEqual({ last_error: null, last_success_at: "2026-07-16T00:05:00.000Z" });
  });

  it("records a bounded Cloudflare API error message", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      errors: [{ message: "cannot query this dataset" }],
    }, { status: 400 }));

    await expect(syncCloudflareAnalytics(env.DB, {
      end: "2026-07-15",
      fetcher,
      now: () => new Date("2026-07-16T00:05:00.000Z"),
      start: "2026-07-15",
      token: "test-token",
      zoneId: "test-zone",
    })).rejects.toThrow("Cloudflare Analytics HTTP 400: cannot query this dataset");

    const state = await env.DB.prepare(`
      SELECT last_error FROM integration_state WHERE integration = 'cloudflare_analytics'
    `).first();
    expect(state).toEqual({ last_error: "Cloudflare Analytics HTTP 400: cannot query this dataset" });
  });
});
