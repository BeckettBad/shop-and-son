import { calendarDateInTimeZone, shiftCalendarDate, zonedMidnightUtc } from "./reporting-time";

const DAY_MS = 86_400_000;
const REPORTING_TIMEZONE = "America/New_York";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function runDailyMaintenance(db: D1Database, now: Date): Promise<void> {
  const latestCompleteDate = shiftCalendarDate(calendarDateInTimeZone(now, REPORTING_TIMEZONE), -1);
  const oldestDate = shiftCalendarDate(latestCompleteDate, -89);
  const cutoff = new Date(now.getTime() - 90 * DAY_MS).toISOString();
  const rateLimitCutoff = new Date(now.getTime() - 2 * DAY_MS).toISOString();
  const funnelCutoff = zonedMidnightUtc(oldestDate, REPORTING_TIMEZONE).toISOString();
  const runDate = isoDate(now);
  const updatedAt = now.toISOString();
  const aggregateStatements = Array.from({ length: 90 }, (_, offset) => {
    const date = shiftCalendarDate(oldestDate, offset);
    const start = zonedMidnightUtc(date, REPORTING_TIMEZONE).toISOString();
    const end = zonedMidnightUtc(shiftCalendarDate(date, 1), REPORTING_TIMEZONE).toISOString();
    return db.prepare(`
      INSERT INTO daily_funnel_metrics (
        date, page_views, product_views, cart_adds, cart_updates, cart_removes,
        checkout_begins, newsletter_signups, distinct_sessions, updated_at
      )
      SELECT
        ?,
        SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'product_view' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'cart_add' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'cart_update' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'cart_remove' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'checkout_begin' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'newsletter_signup' THEN 1 ELSE 0 END),
        COUNT(DISTINCT session_id),
        ?
      FROM funnel_events
      WHERE occurred_at >= ? AND occurred_at < ?
      HAVING COUNT(*) > 0
      ON CONFLICT(date) DO UPDATE SET
        page_views = excluded.page_views,
        product_views = excluded.product_views,
        cart_adds = excluded.cart_adds,
        cart_updates = excluded.cart_updates,
        cart_removes = excluded.cart_removes,
        checkout_begins = excluded.checkout_begins,
        newsletter_signups = excluded.newsletter_signups,
        distinct_sessions = excluded.distinct_sessions,
        updated_at = excluded.updated_at
    `).bind(date, updatedAt, start, end);
  });

  await db.batch([
    ...aggregateStatements,
    db.prepare(`
      INSERT OR IGNORE INTO notifications (incident_id, kind, created_at, dedupe_key)
      SELECT id, 'reminder', ?, 'reminder:' || id || ':' || ?
      FROM incidents
      WHERE recovered_at IS NULL
    `).bind(updatedAt, runDate),
    db.prepare("DELETE FROM funnel_events WHERE occurred_at < ?").bind(funnelCutoff),
    db.prepare("DELETE FROM event_rate_limits WHERE window_start < ?").bind(rateLimitCutoff),
    db.prepare("DELETE FROM scheduled_job_runs WHERE job_name = 'health' AND run_date < ?").bind(rateLimitCutoff),
    db.prepare("DELETE FROM health_probes WHERE checked_at < ?").bind(cutoff),
    db.prepare("DELETE FROM notifications WHERE delivered_at IS NOT NULL AND delivered_at < ?").bind(cutoff),
  ]);
}
