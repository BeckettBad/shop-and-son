import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { runScheduledOperations } from "../src/scheduler";

describe("scheduled operations", () => {
  it("runs health once per scheduled tick and daily work once per date", async () => {
    const dependencies = {
      cloudflare: vi.fn(async () => undefined),
      health: vi.fn(async () => undefined),
      maintenance: vi.fn(async () => undefined),
      shopifyAll: vi.fn(async () => undefined),
      shopifyOnline: vi.fn(async () => undefined),
    };
    const now = new Date("2026-07-16T00:15:00.000Z");

    await runScheduledOperations(env, now, dependencies);
    await runScheduledOperations(env, now, dependencies);
    await runScheduledOperations(env, new Date("2026-07-16T00:20:00.000Z"), dependencies);
    const afterNewYorkMidnight = new Date("2026-07-16T04:15:00.000Z");
    await runScheduledOperations(env, afterNewYorkMidnight, dependencies);

    expect(dependencies.health).toHaveBeenCalledTimes(3);
    expect(dependencies.cloudflare).toHaveBeenCalledOnce();
    expect(dependencies.shopifyAll).toHaveBeenCalledTimes(2);
    expect(dependencies.shopifyOnline).toHaveBeenCalledTimes(2);
    expect(dependencies.shopifyOnline).toHaveBeenNthCalledWith(1, env, "2026-04-16", "2026-07-14", now);
    expect(dependencies.shopifyOnline).toHaveBeenNthCalledWith(2, env, "2026-04-17", "2026-07-15", afterNewYorkMidnight);
    expect(dependencies.maintenance).toHaveBeenCalledTimes(2);
  });

  it("marks daily work complete only after the task succeeds", async () => {
    let completedDuringTask: string | null | undefined;
    const dependencies = {
      cloudflare: vi.fn(async () => {
        const row = await env.DB.prepare(`
          SELECT completed_at FROM scheduled_job_runs
          WHERE job_name = 'cloudflare_analytics' AND run_date = '2026-07-17'
        `).first<{ completed_at: string | null }>();
        completedDuringTask = row?.completed_at;
      }),
      health: vi.fn(async () => undefined),
      maintenance: vi.fn(async () => undefined),
      shopifyAll: vi.fn(async () => undefined),
      shopifyOnline: vi.fn(async () => undefined),
    };

    await runScheduledOperations(env, new Date("2026-07-17T00:15:00.000Z"), dependencies);

    expect(completedDuringTask).toBeNull();
    const completed = await env.DB.prepare(`
      SELECT completed_at FROM scheduled_job_runs
      WHERE job_name = 'cloudflare_analytics' AND run_date = '2026-07-17'
    `).first<{ completed_at: string | null }>();
    expect(completed?.completed_at).toBe("2026-07-17T00:15:00.000Z");
  });

  it("recovers an abandoned claim after its lease expires", async () => {
    await env.DB.prepare(`
      INSERT INTO scheduled_job_runs (job_name, run_date, claim_id, claimed_at, completed_at)
      VALUES ('cloudflare_analytics', '2026-07-18', 'abandoned', '2026-07-18T00:00:00.000Z', NULL)
    `).run();
    const dependencies = {
      cloudflare: vi.fn(async () => undefined),
      health: vi.fn(async () => undefined),
      maintenance: vi.fn(async () => undefined),
      shopifyAll: vi.fn(async () => undefined),
      shopifyOnline: vi.fn(async () => undefined),
    };

    await runScheduledOperations(env, new Date("2026-07-18T00:20:00.000Z"), dependencies);

    expect(dependencies.cloudflare).toHaveBeenCalledOnce();
  });

  it("waits for every daily task to clean up when another task fails", async () => {
    const dependencies = {
      cloudflare: vi.fn(async () => {
        throw new Error("cloudflare failed");
      }),
      health: vi.fn(async () => undefined),
      maintenance: vi.fn(async () => undefined),
      shopifyAll: vi.fn(async () => undefined),
      shopifyOnline: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }),
    };

    await expect(runScheduledOperations(
      env,
      new Date("2026-07-19T00:15:00.000Z"),
      dependencies,
    )).rejects.toThrow("cloudflare failed");

    const shopifyClaim = await env.DB.prepare(`
      SELECT completed_at FROM scheduled_job_runs
      WHERE job_name = 'shopify_online_analytics' AND run_date = '2026-07-17'
    `).first<{ completed_at: string | null }>();
    expect(shopifyClaim?.completed_at).toBe("2026-07-19T00:15:00.000Z");
    const allChannelClaim = await env.DB.prepare(`
      SELECT completed_at FROM scheduled_job_runs
      WHERE job_name = 'shopify_all_channel_analytics' AND run_date = '2026-07-17'
    `).first<{ completed_at: string | null }>();
    expect(allChannelClaim?.completed_at).toBe("2026-07-19T00:15:00.000Z");
  });
});
