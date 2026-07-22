import { describe, expect, it, vi } from "vitest";
import { probeNowPlayingWorker, probeSite } from "../src/probes";

function statusPayload(toggle: "off" | "on" = "on") {
  return {
    allowedDevices: ["studio"],
    auth: "ok",
    lastShowAt: null,
    lastSpotifyOkAt: "2026-07-16T08:00:00.000Z",
    toggle,
  };
}

describe("site probe", () => {
  it("reports a successful HTML response with measured latency", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("<!doctype html><title>&son</title>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 200,
    }));
    const timestamps = [1000, 1246];

    const result = await probeSite(fetcher, () => timestamps.shift() ?? 1246);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(result).toEqual({
      detail: "site returned HTML 200",
      healthy: true,
      latencyMs: 246,
      statusCode: 200,
    });
  });

  it("normalizes a network failure into an unhealthy probe", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("connection reset"));
    const timestamps = [2000, 2310];

    const result = await probeSite(fetcher, () => timestamps.shift() ?? 2310);

    expect(result).toEqual({
      detail: "site request failed: connection reset",
      healthy: false,
      latencyMs: 310,
      statusCode: null,
    });
  });
});

describe("now-playing Worker probe", () => {
  it("reports valid Worker status and Spotify authorization separately", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ show: false, reason: "idle" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(statusPayload()), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));
    const timestamps = [3000, 3125];

    const result = await probeNowPlayingWorker(fetcher, () => timestamps.shift() ?? 3125);

    expect(result).toEqual({
      featureToggle: {
        detail: "now-playing feature toggle is on",
        healthy: true,
        latencyMs: 125,
        statusCode: 200,
      },
      spotifyAuth: {
        detail: "Spotify authorization healthy (toggle=on)",
        healthy: true,
        latencyMs: 125,
        statusCode: 200,
      },
      worker: {
        detail: "now-playing Worker returned valid /now and /status responses",
        healthy: true,
        latencyMs: 125,
        statusCode: 200,
      },
    });
  });

  it("reports an intentionally disabled feature toggle as unhealthy", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ show: false, reason: "toggle_off" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(statusPayload("off")), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    const result = await probeNowPlayingWorker(fetcher, () => 6000);

    expect(result.featureToggle).toEqual({
      detail: "now-playing feature toggle is off",
      healthy: false,
      latencyMs: 0,
      statusCode: 200,
    });
  });

  it("normalizes malformed status JSON into failed Worker and auth probes", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ show: false, reason: "idle" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }))
      .mockResolvedValueOnce(new Response("not-json", {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));
    const timestamps = [4000, 4080];

    const result = await probeNowPlayingWorker(fetcher, () => timestamps.shift() ?? 4080);

    expect(result).toEqual({
      featureToggle: {
        detail: "Feature toggle unavailable because Worker status was invalid",
        healthy: false,
        latencyMs: 80,
        statusCode: 200,
      },
      spotifyAuth: {
        detail: "Spotify authorization unavailable because Worker status was invalid",
        healthy: false,
        latencyMs: 80,
        statusCode: 200,
      },
      worker: {
        detail: "now-playing Worker returned invalid /status JSON",
        healthy: false,
        latencyMs: 80,
        statusCode: 200,
      },
    });
  });

  it("marks the Worker unhealthy when the customer-facing endpoint fails", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "failed" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(statusPayload()), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    const result = await probeNowPlayingWorker(fetcher, () => 7000);

    expect(result.worker.healthy).toBe(false);
    expect(result.worker.statusCode).toBe(500);
    expect(result.spotifyAuth.healthy).toBe(true);
    expect(result.featureToggle.healthy).toBe(true);
  });

  it("marks the Worker unhealthy for a malformed customer-facing response", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ playing: false }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(statusPayload()), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    const result = await probeNowPlayingWorker(fetcher, () => 8000);

    expect(result.worker.healthy).toBe(false);
    expect(result.spotifyAuth.healthy).toBe(true);
    expect(result.featureToggle.healthy).toBe(true);
  });

  it("rejects incomplete visible and hidden customer-facing contracts", async () => {
    for (const payload of [{ show: true }, { show: false }]) {
      const fetcher = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify(payload), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(statusPayload()), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }));

      const result = await probeNowPlayingWorker(fetcher, () => 8_000);
      expect(result.worker.healthy).toBe(false);
    }
  });

  it("rejects malformed status enum values for the Worker target", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ show: false, reason: "idle" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ auth: "maybe", toggle: "sometimes" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }));

    const result = await probeNowPlayingWorker(fetcher, () => 8_000);
    expect(result.worker.healthy).toBe(false);
    expect(result.spotifyAuth.healthy).toBe(false);
    expect(result.featureToggle.healthy).toBe(false);
  });

  it("returns unhealthy measurements for incomplete or mistyped status contracts", async () => {
    const invalidStatuses = [
      null,
      [],
      "invalid",
      { auth: "ok", toggle: "on" },
      { allowedDevices: "studio", auth: "ok", lastShowAt: null, lastSpotifyOkAt: null, toggle: "on" },
      { allowedDevices: [], auth: "ok", lastShowAt: "not-a-date", lastSpotifyOkAt: null, toggle: "on" },
      { allowedDevices: [], auth: "ok", lastShowAt: "July 16, 2026", lastSpotifyOkAt: null, toggle: "on" },
      { allowedDevices: [], auth: "ok", lastShowAt: "2026-02-30T00:00:00.000Z", lastSpotifyOkAt: null, toggle: "on" },
    ];
    for (const status of invalidStatuses) {
      const fetcher = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ show: false, reason: "idle" }), {
          headers: { "Content-Type": "application/json" }, status: 200,
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(status), {
          headers: { "Content-Type": "application/json" }, status: 200,
        }));

      const result = await probeNowPlayingWorker(fetcher, () => 8_000);
      expect(result.worker.healthy).toBe(false);
      expect(result.spotifyAuth.healthy).toBe(false);
      expect(result.featureToggle.healthy).toBe(false);
    }
  });

  it("accepts valid production status variants", async () => {
    const statuses = [
      { allowedDevices: [], auth: "error", lastShowAt: null, lastSpotifyOkAt: null, toggle: "off" },
      statusPayload(),
    ];
    for (const status of statuses) {
      const fetcher = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ show: false, reason: "idle" }), {
          headers: { "Content-Type": "application/json" }, status: 200,
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(status), {
          headers: { "Content-Type": "application/json" }, status: 200,
        }));

      const result = await probeNowPlayingWorker(fetcher, () => 8_000);
      expect(result.worker.healthy).toBe(true);
    }
  });

  it("normalizes a Worker network failure into failed Worker and auth probes", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("network unavailable"));
    const timestamps = [5000, 5200];

    const result = await probeNowPlayingWorker(fetcher, () => timestamps.shift() ?? 5200);

    expect(result).toEqual({
      featureToggle: {
        detail: "Feature toggle unavailable because Worker request failed",
        healthy: false,
        latencyMs: 200,
        statusCode: null,
      },
      spotifyAuth: {
        detail: "Spotify authorization unavailable because Worker request failed",
        healthy: false,
        latencyMs: 200,
        statusCode: null,
      },
      worker: {
        detail: "now-playing Worker request failed: network unavailable",
        healthy: false,
        latencyMs: 200,
        statusCode: null,
      },
    });
  });
});
