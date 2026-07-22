import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { recordProbe } from "../src/health-repository";
import { runDailyMaintenance } from "../src/maintenance";

describe("daily maintenance", () => {
  it("rolls up funnel metrics, deduplicates reminders, and enforces retention", async () => {
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO funnel_events (
          event_id, session_id, occurred_at, received_at, event_type, page_kind
        ) VALUES (?, ?, ?, ?, 'page_view', 'landing')
      `).bind("event-recent", "session-recent", "2026-07-15T12:00:00.000Z", "2026-07-15T12:00:01.000Z"),
      env.DB.prepare(`
        INSERT INTO funnel_events (
          event_id, session_id, occurred_at, received_at, event_type, page_kind
        ) VALUES (?, ?, ?, ?, 'page_view', 'landing')
      `).bind("event-old", "session-old", "2026-03-01T12:00:00.000Z", "2026-03-01T12:00:01.000Z"),
      env.DB.prepare(`
        INSERT INTO funnel_events (
          event_id, session_id, occurred_at, received_at, event_type, page_kind
        ) VALUES (?, ?, ?, ?, 'page_view', 'landing')
      `).bind("event-oldest-complete-day", "session-boundary", "2026-04-17T04:30:00.000Z", "2026-04-17T04:30:01.000Z"),
      env.DB.prepare(`
        INSERT INTO funnel_events (
          event_id, session_id, occurred_at, received_at, event_type, page_kind
        ) VALUES (?, ?, ?, ?, 'page_view', 'landing')
      `).bind("event-before-complete-window", "session-before", "2026-04-17T03:59:59.999Z", "2026-04-17T04:00:00.000Z"),
      env.DB.prepare(`
        INSERT INTO funnel_events (
          event_id, session_id, occurred_at, received_at, event_type, page_kind
        ) VALUES
          ('event-before-ny-midnight', 'session-before-ny-midnight', '2026-07-15T03:30:00.000Z', '2026-07-15T03:30:01.000Z', 'page_view', 'landing'),
          ('event-after-ny-midnight', 'session-after-ny-midnight', '2026-07-15T04:30:00.000Z', '2026-07-15T04:30:01.000Z', 'page_view', 'landing')
      `),
      env.DB.prepare(`
        INSERT INTO event_rate_limits (rate_key, window_start, event_count)
        VALUES ('global', '2026-07-01T00:00:00.000Z', 1)
      `),
      env.DB.prepare(`
        INSERT INTO scheduled_job_runs (job_name, run_date, claim_id, claimed_at, completed_at)
        VALUES ('health', '2026-07-01T00:00:00.000Z', 'old-health', '2026-07-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z')
      `),
      env.DB.prepare(`
        INSERT INTO scheduled_job_runs (job_name, run_date, claim_id, claimed_at, completed_at)
        VALUES ('health', '2026-07-15T00:00:00.000Z', 'recent-health', '2026-07-15T00:00:00.000Z', '2026-07-15T00:00:00.000Z')
      `),
    ]);
    const failure = { detail: "worker unavailable", healthy: false, latencyMs: 50, statusCode: 503 };
    await recordProbe(env.DB, "maintenance_worker", { ...failure, checkedAt: "2026-07-15T12:00:00.000Z" });
    await recordProbe(env.DB, "maintenance_worker", { ...failure, checkedAt: "2026-07-15T12:05:00.000Z" });

    const now = new Date("2026-07-16T05:00:00.000Z");
    await runDailyMaintenance(env.DB, now);
    await runDailyMaintenance(env.DB, now);

    const rollup = await env.DB.prepare(`
      SELECT page_views, distinct_sessions FROM daily_funnel_metrics
      WHERE date = '2026-07-15'
    `).first();
    expect(rollup).toEqual({ distinct_sessions: 2, page_views: 2 });
    const priorRollup = await env.DB.prepare(`
      SELECT page_views, distinct_sessions FROM daily_funnel_metrics
      WHERE date = '2026-07-14'
    `).first();
    expect(priorRollup).toEqual({ distinct_sessions: 1, page_views: 1 });
    const reminders = await env.DB.prepare(`
      SELECT COUNT(*) AS count FROM notifications WHERE kind = 'reminder'
    `).first<{ count: number }>();
    expect(reminders?.count).toBe(1);
    expect(await env.DB.prepare("SELECT 1 FROM funnel_events WHERE event_id = 'event-old'").first()).toBeNull();
    expect(await env.DB.prepare("SELECT 1 FROM funnel_events WHERE event_id = 'event-oldest-complete-day'").first()).not.toBeNull();
    expect(await env.DB.prepare("SELECT 1 FROM funnel_events WHERE event_id = 'event-before-complete-window'").first()).toBeNull();
    expect(await env.DB.prepare("SELECT 1 FROM event_rate_limits WHERE rate_key = 'global'").first()).toBeNull();
    expect(await env.DB.prepare("SELECT 1 FROM scheduled_job_runs WHERE claim_id = 'old-health'").first()).toBeNull();
    expect(await env.DB.prepare("SELECT 1 FROM scheduled_job_runs WHERE claim_id = 'recent-health'").first()).not.toBeNull();
  });
});
