import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { acknowledgeNotification, listPendingNotifications } from "../src/notifications";
import { recordProbe } from "../src/health-repository";

async function openSiteIncident(target: string): Promise<void> {
  const base = {
    detail: "site returned 503",
    healthy: false,
    latencyMs: 100,
    statusCode: 503,
  };
  await recordProbe(env.DB, target, {
    ...base,
    checkedAt: "2026-07-16T08:00:00.000Z",
  });
  await recordProbe(env.DB, target, {
    ...base,
    checkedAt: "2026-07-16T08:05:00.000Z",
  });
}

describe("notification queue", () => {
  it("lists a bounded operator-safe pending message", async () => {
    await openSiteIncident("notification_site");

    const pending = await listPendingNotifications(env.DB, 10);

    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      createdAt: "2026-07-16T08:05:00.000Z",
      kind: "opened",
      message: "ALERT &son: notification_site — site returned 503",
      target: "notification_site",
    });
    expect(typeof pending[0]?.id).toBe("number");
    await acknowledgeNotification(env.DB, pending[0]!.id, "2026-07-16T08:05:30.000Z");
  });

  it("acknowledges a notification exactly once", async () => {
    await openSiteIncident("ack_site");
    const [notification] = await listPendingNotifications(env.DB, 10);
    expect(notification).toBeDefined();

    await expect(acknowledgeNotification(
      env.DB,
      notification!.id,
      "2026-07-16T08:06:00.000Z",
    )).resolves.toBe(true);
    await expect(acknowledgeNotification(
      env.DB,
      notification!.id,
      "2026-07-16T08:07:00.000Z",
    )).resolves.toBe(false);
    await expect(listPendingNotifications(env.DB, 10)).resolves.toEqual([]);
  });
});
