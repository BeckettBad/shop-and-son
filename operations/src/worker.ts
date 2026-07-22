import { handleDashboardRequest } from "./dashboard";
import { handleEventRequest } from "./events";
import { handleNotificationApi } from "./notification-api";
import { runScheduledOperations } from "./scheduler";

const SERVICE = "shop-and-son-operations";
const CONTRACT_VERSION = 1;

type ScheduledOperationsRunner = (env: Env, now: Date) => Promise<void>;

export function createWorker(runOperations: ScheduledOperationsRunner = runScheduledOperations) {
  return {
    async fetch(request: Request, env: Env, _context: ExecutionContext): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/notifications")) {
        return handleNotificationApi(request, env.DB, env.NOTIFICATION_API_TOKEN);
      }

      if (url.pathname === "/dashboard" || url.pathname === "/dashboard/operations") {
        return handleDashboardRequest(
          request,
          env.DB,
          env.DASHBOARD_USERNAME,
          env.DASHBOARD_PASSWORD,
        );
      }

      if (url.pathname === "/v1/events") {
        if (env.EVENT_COLLECTION_ENABLED !== "true") {
          return Response.json(
            { error: "collection_disabled" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
        return handleEventRequest(request, env.DB);
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return Response.json(
          { ok: true, service: SERVICE, version: CONTRACT_VERSION },
          { headers: { "Cache-Control": "no-store" } },
        );
      }

      return Response.json(
        { error: "not_found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    },

    scheduled(controller: ScheduledController, env: Env, context: ExecutionContext): void {
      context.waitUntil(runOperations(env, new Date(controller.scheduledTime)));
    },
  } satisfies ExportedHandler<Env>;
}
