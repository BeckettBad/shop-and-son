export interface PendingNotification {
  createdAt: string;
  id: number;
  kind: "opened" | "reminder" | "recovered";
  message: string;
  target: string;
}

interface NotificationRow {
  created_at: string;
  id: number;
  kind: PendingNotification["kind"];
  latest_detail: string;
  target: string;
}

function formatMessage(row: NotificationRow): string {
  if (row.kind === "recovered") {
    return `RECOVERED &son: ${row.target} is healthy again`;
  }
  if (row.kind === "reminder") {
    return `STILL BROKEN &son: ${row.target} — ${row.latest_detail}`;
  }
  return `ALERT &son: ${row.target} — ${row.latest_detail}`;
}

export async function listPendingNotifications(
  db: D1Database,
  requestedLimit: number,
): Promise<PendingNotification[]> {
  const limit = Math.max(1, Math.min(25, Math.trunc(requestedLimit)));
  const result = await db.prepare(`
    SELECT n.id, n.kind, n.created_at, i.target, i.latest_detail
    FROM notifications n
    JOIN incidents i ON i.id = n.incident_id
    WHERE n.delivered_at IS NULL
    ORDER BY n.id
    LIMIT ?
  `).bind(limit).all<NotificationRow>();

  return result.results.map((row) => ({
    createdAt: row.created_at,
    id: row.id,
    kind: row.kind,
    message: formatMessage(row),
    target: row.target,
  }));
}

export async function acknowledgeNotification(
  db: D1Database,
  notificationId: number,
  deliveredAt: string,
): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE notifications
    SET delivered_at = ?
    WHERE id = ? AND delivered_at IS NULL
  `).bind(deliveredAt, notificationId).run();

  return result.meta.changes === 1;
}
