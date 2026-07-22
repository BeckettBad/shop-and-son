import { syncCloudflareAnalytics } from "./cloudflare-analytics";
import { runScheduledChecks } from "./health";
import { runDailyMaintenance } from "./maintenance";
import { calendarDateInTimeZone, shiftCalendarDate } from "./reporting-time";
import { syncAllChannelShopifyAnalytics } from "./shopify-legacy-analytics";
import { syncShopifyAnalytics } from "./shopify-analytics";

interface SchedulerDependencies {
  cloudflare: (env: Env, start: string, end: string, now: Date) => Promise<void>;
  health: (env: Env) => Promise<void>;
  maintenance: (env: Env, now: Date) => Promise<void>;
  shopifyAll: (env: Env, start: string, end: string, now: Date) => Promise<void>;
  shopifyOnline: (env: Env, start: string, end: string, now: Date) => Promise<void>;
}

const JOB_LEASE_MS = 15 * 60_000;

function dateOffset(date: Date, days: number): string {
  return new Date(date.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

const defaults: SchedulerDependencies = {
  cloudflare: (env, start, end, now) => syncCloudflareAnalytics(env.DB, {
    end,
    now: () => now,
    start,
    token: env.CLOUDFLARE_ANALYTICS_TOKEN,
    zoneId: env.CLOUDFLARE_ZONE_ID,
  }),
  health: (env) => runScheduledChecks(env.DB),
  maintenance: (env, now) => runDailyMaintenance(env.DB, now),
  shopifyAll: (env, start, end, now) => syncAllChannelShopifyAnalytics(env.DB, {
    clientId: env.SHOPIFY_CLIENT_ID,
    clientSecret: env.SHOPIFY_CLIENT_SECRET,
    currency: "USD",
    end,
    now: () => now,
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    start,
    timezone: "America/New_York",
  }),
  shopifyOnline: (env, start, end, now) => syncShopifyAnalytics(env.DB, {
    clientId: env.SHOPIFY_CLIENT_ID,
    clientSecret: env.SHOPIFY_CLIENT_SECRET,
    currency: "USD",
    end,
    now: () => now,
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    start,
    timezone: "America/New_York",
  }),
};

async function runOncePerDate(
  db: D1Database,
  jobName: string,
  runDate: string,
  now: Date,
  task: () => Promise<void>,
): Promise<void> {
  const claimId = crypto.randomUUID();
  const claimedAt = now.toISOString();
  const staleBefore = new Date(now.getTime() - JOB_LEASE_MS).toISOString();
  const claim = await db.prepare(`
    INSERT INTO scheduled_job_runs (job_name, run_date, claim_id, claimed_at, completed_at)
    VALUES (?, ?, ?, ?, NULL)
    ON CONFLICT(job_name, run_date) DO UPDATE SET
      claim_id = excluded.claim_id,
      claimed_at = excluded.claimed_at,
      completed_at = NULL
    WHERE scheduled_job_runs.completed_at IS NULL
      AND scheduled_job_runs.claimed_at <= ?
  `).bind(jobName, runDate, claimId, claimedAt, staleBefore).run();
  if (claim.meta.changes === 0) return;

  try {
    await task();
    await db.prepare(`
      UPDATE scheduled_job_runs SET completed_at = ?
      WHERE job_name = ? AND run_date = ? AND claim_id = ? AND completed_at IS NULL
    `).bind(now.toISOString(), jobName, runDate, claimId).run();
  } catch (error) {
    await db.prepare(`
      DELETE FROM scheduled_job_runs
      WHERE job_name = ? AND run_date = ? AND claim_id = ? AND completed_at IS NULL
    `).bind(jobName, runDate, claimId).run();
    throw error;
  }
}

export async function runScheduledOperations(
  env: Env,
  now: Date = new Date(),
  dependencies: SchedulerDependencies = defaults,
): Promise<void> {
  const utcRunDate = dateOffset(now, 0);
  const cloudflareEnd = dateOffset(now, -1);
  const cloudflareStart = dateOffset(now, -90);
  const shopifyEnd = shiftCalendarDate(calendarDateInTimeZone(now, "America/New_York"), -1);
  const shopifyStart = shiftCalendarDate(shopifyEnd, -89);

  const results = await Promise.allSettled([
    runOncePerDate(env.DB, "health", now.toISOString(), now, () =>
      dependencies.health(env)),
    runOncePerDate(env.DB, "cloudflare_analytics", utcRunDate, now, () =>
      dependencies.cloudflare(env, cloudflareStart, cloudflareEnd, now)),
    runOncePerDate(env.DB, "shopify_all_channel_analytics", shopifyEnd, now, () =>
      dependencies.shopifyAll(env, shopifyStart, shopifyEnd, now)),
    runOncePerDate(env.DB, "shopify_online_analytics", shopifyEnd, now, () =>
      dependencies.shopifyOnline(env, shopifyStart, shopifyEnd, now)),
    runOncePerDate(env.DB, "maintenance", shopifyEnd, now, () =>
      dependencies.maintenance(env, now)),
  ]);
  const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failure) throw failure.reason;
}
