import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { runScheduledChecks } from "../src/health";

const healthy = (detail: string) => ({
  detail,
  healthy: true,
  latencyMs: 25,
  statusCode: 200,
});

describe("scheduled health checks", () => {
  it("persists site, Worker, Spotify authorization, and feature toggle probes", async () => {
    const siteProbe = vi.fn().mockResolvedValue(healthy("site ok"));
    const workerProbe = vi.fn().mockResolvedValue({
      featureToggle: healthy("toggle on"),
      spotifyAuth: healthy("auth ok"),
      worker: healthy("worker ok"),
    });

    await runScheduledChecks(env.DB, {
      checkedAt: "2026-07-16T05:00:00.000Z",
      probeNowPlayingWorker: workerProbe,
      probeSite: siteProbe,
    });

    expect(siteProbe).toHaveBeenCalledOnce();
    expect(workerProbe).toHaveBeenCalledOnce();
    const rows = await env.DB.prepare(`
      SELECT target, checked_at, healthy, detail
      FROM health_probes
      ORDER BY target
    `).all();
    expect(rows.results).toEqual([
      {
        checked_at: "2026-07-16T05:00:00.000Z",
        detail: "toggle on",
        healthy: 1,
        target: "feature_toggle",
      },
      {
        checked_at: "2026-07-16T05:00:00.000Z",
        detail: "site ok",
        healthy: 1,
        target: "site",
      },
      {
        checked_at: "2026-07-16T05:00:00.000Z",
        detail: "auth ok",
        healthy: 1,
        target: "spotify_auth",
      },
      {
        checked_at: "2026-07-16T05:00:00.000Z",
        detail: "worker ok",
        healthy: 1,
        target: "worker",
      },
    ]);
  });
});
