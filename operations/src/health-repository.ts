import type { IncidentOutcome, IncidentState } from "./incidents";

export interface StoredProbe {
  checkedAt: string;
  detail: string;
  healthy: boolean;
  latencyMs: number;
  statusCode: number | null;
}

interface TargetStateRow {
  consecutive_failures: number;
  latest_detail: string;
  opened_at: string | null;
  status: IncidentState["status"];
}

function mapState(row: TargetStateRow): IncidentState {
  return {
    consecutiveFailures: row.consecutive_failures,
    latestDetail: row.latest_detail,
    openedAt: row.opened_at,
    status: row.status,
  };
}

export async function recordProbe(db: D1Database, target: string, probe: StoredProbe): Promise<IncidentOutcome> {
  const storedProbe = { ...probe, detail: probe.detail.slice(0, 500) };
  const isHealthy = storedProbe.healthy ? 1 : 0;

  await db.batch([
    db.prepare(`
      INSERT INTO health_probes (target, checked_at, healthy, status_code, latency_ms, detail)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      target,
      storedProbe.checkedAt,
      isHealthy,
      storedProbe.statusCode,
      storedProbe.latencyMs,
      storedProbe.detail,
    ),
    db.prepare(`
      INSERT INTO target_states (
        target, status, consecutive_failures, opened_at,
        first_failure_detail, latest_detail, updated_at
      ) VALUES (?, CASE WHEN ? = 1 THEN 'healthy' ELSE 'pending' END,
        CASE WHEN ? = 1 THEN 0 ELSE 1 END, NULL,
        CASE WHEN ? = 1 THEN '' ELSE ? END, ?, ?)
      ON CONFLICT(target) DO UPDATE SET
        status = CASE
          WHEN ? = 1 THEN 'healthy'
          WHEN target_states.status = 'open' THEN 'open'
          WHEN target_states.consecutive_failures + 1 >= 2 THEN 'open'
          ELSE 'pending'
        END,
        consecutive_failures = CASE
          WHEN ? = 1 THEN 0
          ELSE target_states.consecutive_failures + 1
        END,
        opened_at = CASE
          WHEN ? = 1 THEN NULL
          WHEN target_states.status = 'open' THEN target_states.opened_at
          WHEN target_states.consecutive_failures + 1 >= 2 THEN excluded.updated_at
          ELSE NULL
        END,
        first_failure_detail = CASE
          WHEN ? = 1 THEN ''
          WHEN target_states.status = 'healthy' OR target_states.consecutive_failures = 0
            THEN excluded.latest_detail
          ELSE target_states.first_failure_detail
        END,
        latest_detail = excluded.latest_detail,
        updated_at = excluded.updated_at
    `).bind(
      target,
      isHealthy,
      isHealthy,
      isHealthy,
      storedProbe.detail,
      storedProbe.detail,
      storedProbe.checkedAt,
      isHealthy,
      isHealthy,
      isHealthy,
      isHealthy,
    ),
    db.prepare(`
      INSERT OR IGNORE INTO incidents (target, opened_at, first_detail, latest_detail)
      SELECT target, opened_at, first_failure_detail, latest_detail
      FROM target_states
      WHERE target = ? AND status = 'open' AND opened_at = ?
    `).bind(target, storedProbe.checkedAt),
    db.prepare(`
      UPDATE incidents
      SET latest_detail = (SELECT latest_detail FROM target_states WHERE target = ?)
      WHERE target = ? AND recovered_at IS NULL
        AND EXISTS (SELECT 1 FROM target_states WHERE target = ? AND status = 'open')
    `).bind(target, target, target),
    db.prepare(`
      UPDATE incidents SET recovered_at = ?
      WHERE target = ? AND recovered_at IS NULL
        AND EXISTS (
          SELECT 1 FROM target_states
          WHERE target = ? AND status = 'healthy' AND updated_at = ?
        )
    `).bind(storedProbe.checkedAt, target, target, storedProbe.checkedAt),
    db.prepare(`
      INSERT OR IGNORE INTO notifications (incident_id, kind, created_at, dedupe_key)
      SELECT id, 'opened', opened_at, target || ':' || opened_at || ':opened'
      FROM incidents WHERE target = ? AND opened_at = ?
    `).bind(target, storedProbe.checkedAt),
    db.prepare(`
      INSERT OR IGNORE INTO notifications (incident_id, kind, created_at, dedupe_key)
      SELECT id, 'recovered', recovered_at, target || ':' || opened_at || ':recovered'
      FROM incidents WHERE target = ? AND recovered_at = ?
    `).bind(target, storedProbe.checkedAt),
  ]);

  const row = await db.prepare(`
    SELECT status, consecutive_failures, opened_at, latest_detail
    FROM target_states WHERE target = ?
  `).bind(target).first<TargetStateRow>();
  if (!row) throw new Error(`Target state was not persisted for ${target}`);

  const transition = row.status === "open" && row.opened_at === storedProbe.checkedAt
    ? { at: storedProbe.checkedAt, kind: "opened" as const }
    : row.status === "healthy"
      && await db.prepare(`
        SELECT 1 FROM incidents WHERE target = ? AND recovered_at = ?
      `).bind(target, storedProbe.checkedAt).first()
      ? { at: storedProbe.checkedAt, kind: "recovered" as const }
      : null;

  return { state: mapState(row), transition };
}
