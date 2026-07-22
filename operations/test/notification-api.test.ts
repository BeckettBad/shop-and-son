import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { handleNotificationApi } from "../src/notification-api";
import { recordProbe } from "../src/health-repository";

async function seedNotification(): Promise<void> {
  const base = {
    detail: "site unavailable",
    healthy: false,
    latencyMs: 100,
    statusCode: 503,
  };
  await recordProbe(env.DB, "api_site", { ...base, checkedAt: "2026-07-16T09:00:00.000Z" });
  await recordProbe(env.DB, "api_site", { ...base, checkedAt: "2026-07-16T09:05:00.000Z" });
}

describe("notification API", () => {
  it("rejects requests without the bearer secret", async () => {
    const response = await handleNotificationApi(
      new Request("https://ops.test/api/notifications"),
      env.DB,
      "test-secret",
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("lists and acknowledges a pending notification", async () => {
    await seedNotification();
    const headers = { Authorization: "Bearer test-secret" };
    const listResponse = await handleNotificationApi(
      new Request("https://ops.test/api/notifications", { headers }),
      env.DB,
      "test-secret",
    );
    const body = await listResponse.json<{ notifications: Array<{ id: number }> }>();

    expect(listResponse.status).toBe(200);
    expect(body.notifications).toHaveLength(1);
    const id = body.notifications[0]!.id;

    const ackResponse = await handleNotificationApi(
      new Request(`https://ops.test/api/notifications/${id}/ack`, {
        headers,
        method: "POST",
      }),
      env.DB,
      "test-secret",
      () => new Date("2026-07-16T09:06:00.000Z"),
    );
    expect(ackResponse.status).toBe(204);

    const retryResponse = await handleNotificationApi(
      new Request(`https://ops.test/api/notifications/${id}/ack`, {
        headers,
        method: "POST",
      }),
      env.DB,
      "test-secret",
    );
    expect(retryResponse.status).toBe(204);

    const secondList = await handleNotificationApi(
      new Request("https://ops.test/api/notifications", { headers }),
      env.DB,
      "test-secret",
    );
    await expect(secondList.json()).resolves.toEqual({ notifications: [] });
  });
});
