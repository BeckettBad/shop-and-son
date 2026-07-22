import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { recordProbe } from "../src/health-repository";

describe("health repository", () => {
  it("persists the first failed probe without opening an incident", async () => {
    const outcome = await recordProbe(env.DB, "site", {
      checkedAt: "2026-07-16T03:00:00.000Z",
      detail: "site returned 503",
      healthy: false,
      latencyMs: 246,
      statusCode: 503,
    });

    expect(outcome.state).toMatchObject({
      consecutiveFailures: 1,
      status: "pending",
    });
    expect(outcome.transition).toBeNull();

    const probe = await env.DB.prepare(
      "SELECT target, checked_at, healthy, status_code, latency_ms, detail FROM health_probes",
    ).first();
    expect(probe).toEqual({
      checked_at: "2026-07-16T03:00:00.000Z",
      detail: "site returned 503",
      healthy: 0,
      latency_ms: 246,
      status_code: 503,
      target: "site",
    });

    const targetState = await env.DB.prepare(
      "SELECT target, status, consecutive_failures, opened_at, latest_detail FROM target_states",
    ).first();
    expect(targetState).toEqual({
      consecutive_failures: 1,
      latest_detail: "site returned 503",
      opened_at: null,
      status: "pending",
      target: "site",
    });

    const incidentCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM incidents").first<{ count: number }>();
    expect(incidentCount?.count).toBe(0);
  });

  it("bounds probe details before persistence and incident processing", async () => {
    await recordProbe(env.DB, "bounded_target", {
      checkedAt: "2026-07-16T03:00:00.000Z",
      detail: "x".repeat(2_500),
      healthy: false,
      latencyMs: 10,
      statusCode: null,
    });

    const row = await env.DB.prepare(`
      SELECT p.detail, s.latest_detail
      FROM health_probes p
      JOIN target_states s ON s.target = p.target
      WHERE p.target = 'bounded_target'
    `).first<{ detail: string; latest_detail: string }>();
    expect(row?.detail).toHaveLength(500);
    expect(row?.latest_detail).toHaveLength(500);
  });

  it("opens one incident and queues one notification on the second failure", async () => {
    await recordProbe(env.DB, "worker", {
      checkedAt: "2026-07-16T03:00:00.000Z",
      detail: "worker returned 503",
      healthy: false,
      latencyMs: 246,
      statusCode: 503,
    });
    await recordProbe(env.DB, "worker", {
      checkedAt: "2026-07-16T03:05:00.000Z",
      detail: "worker timed out",
      healthy: false,
      latencyMs: 12000,
      statusCode: null,
    });

    const incident = await env.DB.prepare(
      "SELECT target, opened_at, recovered_at, first_detail, latest_detail FROM incidents WHERE target = 'worker'",
    ).first();
    expect(incident).toEqual({
      first_detail: "worker returned 503",
      latest_detail: "worker timed out",
      opened_at: "2026-07-16T03:05:00.000Z",
      recovered_at: null,
      target: "worker",
    });

    const notification = await env.DB.prepare(`
      SELECT n.kind, n.created_at, n.delivered_at, n.dedupe_key
      FROM notifications n
      JOIN incidents i ON i.id = n.incident_id
      WHERE i.target = 'worker'
    `).first();
    expect(notification).toEqual({
      created_at: "2026-07-16T03:05:00.000Z",
      dedupe_key: "worker:2026-07-16T03:05:00.000Z:opened",
      delivered_at: null,
      kind: "opened",
    });
  });

  it("closes the open incident and queues one recovery notification", async () => {
    const failure = {
      detail: "Spotify authorization failed",
      healthy: false,
      latencyMs: 180,
      statusCode: 200,
    };
    await recordProbe(env.DB, "spotify_auth", {
      ...failure,
      checkedAt: "2026-07-16T04:00:00.000Z",
    });
    await recordProbe(env.DB, "spotify_auth", {
      ...failure,
      checkedAt: "2026-07-16T04:05:00.000Z",
    });
    const recovery = await recordProbe(env.DB, "spotify_auth", {
      checkedAt: "2026-07-16T04:10:00.000Z",
      detail: "Spotify authorization healthy",
      healthy: true,
      latencyMs: 142,
      statusCode: 200,
    });

    expect(recovery.transition).toEqual({
      at: "2026-07-16T04:10:00.000Z",
      kind: "recovered",
    });

    const incident = await env.DB.prepare(
      "SELECT recovered_at, latest_detail FROM incidents WHERE target = 'spotify_auth'",
    ).first();
    expect(incident).toEqual({
      latest_detail: "Spotify authorization failed",
      recovered_at: "2026-07-16T04:10:00.000Z",
    });

    const notifications = await env.DB.prepare(`
      SELECT n.kind, n.created_at, n.dedupe_key
      FROM notifications n
      JOIN incidents i ON i.id = n.incident_id
      WHERE i.target = 'spotify_auth'
      ORDER BY n.id
    `).all();
    expect(notifications.results).toEqual([
      {
        created_at: "2026-07-16T04:05:00.000Z",
        dedupe_key: "spotify_auth:2026-07-16T04:05:00.000Z:opened",
        kind: "opened",
      },
      {
        created_at: "2026-07-16T04:10:00.000Z",
        dedupe_key: "spotify_auth:2026-07-16T04:05:00.000Z:recovered",
        kind: "recovered",
      },
    ]);
  });

  it("updates the existing incident on repeated failures without duplicate alerts", async () => {
    const base = {
      healthy: false,
      latencyMs: 100,
      statusCode: 503,
    };
    await recordProbe(env.DB, "repeat_target", {
      ...base,
      checkedAt: "2026-07-16T07:00:00.000Z",
      detail: "first failure",
    });
    await recordProbe(env.DB, "repeat_target", {
      ...base,
      checkedAt: "2026-07-16T07:05:00.000Z",
      detail: "second failure",
    });
    await recordProbe(env.DB, "repeat_target", {
      ...base,
      checkedAt: "2026-07-16T07:10:00.000Z",
      detail: "latest failure",
    });

    const incident = await env.DB.prepare(`
      SELECT COUNT(*) AS count, latest_detail
      FROM incidents
      WHERE target = 'repeat_target'
    `).first();
    expect(incident).toEqual({ count: 1, latest_detail: "latest failure" });

    const notificationCount = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM notifications n
      JOIN incidents i ON i.id = n.incident_id
      WHERE i.target = 'repeat_target'
    `).first<{ count: number }>();
    expect(notificationCount?.count).toBe(1);
  });

  it("atomically counts overlapping failures and opens one incident", async () => {
    const failure = {
      detail: "concurrent failure",
      healthy: false,
      latencyMs: 100,
      statusCode: 503,
    };

    await Promise.all([
      recordProbe(env.DB, "concurrent_target", {
        ...failure,
        checkedAt: "2026-07-16T08:00:00.000Z",
      }),
      recordProbe(env.DB, "concurrent_target", {
        ...failure,
        checkedAt: "2026-07-16T08:00:01.000Z",
      }),
    ]);

    const state = await env.DB.prepare(`
      SELECT status, consecutive_failures FROM target_states
      WHERE target = 'concurrent_target'
    `).first();
    expect(state).toEqual({ consecutive_failures: 2, status: "open" });
    const counts = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM incidents WHERE target = 'concurrent_target') AS incidents,
        (SELECT COUNT(*) FROM notifications n JOIN incidents i ON i.id = n.incident_id
          WHERE i.target = 'concurrent_target') AS notifications
    `).first();
    expect(counts).toEqual({ incidents: 1, notifications: 1 });
  });
});
