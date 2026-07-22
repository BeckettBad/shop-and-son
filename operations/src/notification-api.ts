import { hasValidBearerToken } from "./auth";
import { acknowledgeNotification, listPendingNotifications } from "./notifications";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { headers: JSON_HEADERS, status });
}

export async function handleNotificationApi(
  request: Request,
  db: D1Database,
  secret: string,
  now: () => Date = () => new Date(),
): Promise<Response> {
  if (!await hasValidBearerToken(request, secret)) {
    return json({ error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/notifications") {
    return json({ notifications: await listPendingNotifications(db, 10) });
  }

  const ack = url.pathname.match(/^\/api\/notifications\/(\d+)\/ack$/);
  if (request.method === "POST" && ack) {
    const id = Number(ack[1]);
    if (!Number.isSafeInteger(id) || id < 1) return json({ error: "invalid_id" }, 400);

    const acknowledged = await acknowledgeNotification(db, id, now().toISOString());
    const exists = acknowledged || await db.prepare("SELECT 1 FROM notifications WHERE id = ?")
      .bind(id).first() !== null;
    return exists
      ? new Response(null, { headers: { "Cache-Control": "no-store" }, status: 204 })
      : json({ error: "not_found" }, 404);
  }

  return json({ error: "not_found" }, 404);
}
