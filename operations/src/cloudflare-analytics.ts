export interface DailyCloudflareMetric {
  bytes: number;
  date: string;
  pageViews: number;
  requests: number;
  status1xx: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  statusOther: number;
  threats: number;
  uniqueIps: number;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Cloudflare Analytics returned a malformed response");
  }
  return value as Record<string, unknown>;
}

function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("Cloudflare Analytics returned an invalid count");
  }
  return value;
}

export function normalizeCloudflareResponse(value: unknown): DailyCloudflareMetric[] {
  const root = record(value);
  if (Array.isArray(root.errors) && root.errors.length > 0) {
    const first = root.errors[0];
    const message = first && typeof first === "object" && !Array.isArray(first)
      ? (first as Record<string, unknown>).message
      : "";
    const detail = typeof message === "string" ? message.replace(/\s+/g, " ").trim().slice(0, 300) : "";
    throw new Error(`Cloudflare Analytics returned GraphQL errors${detail ? `: ${detail}` : ""}`);
  }
  const data = record(root.data);
  const viewer = record(data.viewer);
  if (!Array.isArray(viewer.zones) || viewer.zones.length !== 1) {
    throw new Error("Cloudflare Analytics did not return exactly one zone");
  }
  const zone = record(viewer.zones[0]);
  if (!Array.isArray(zone.httpRequests1dGroups)) {
    throw new Error("Cloudflare Analytics daily dataset is unavailable");
  }

  return zone.httpRequests1dGroups.map((rawGroup) => {
    const group = record(rawGroup);
    const dimensions = record(group.dimensions);
    const sum = record(group.sum);
    const uniq = record(group.uniq);
    if (typeof dimensions.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dimensions.date)) {
      throw new Error("Cloudflare Analytics returned an invalid date");
    }
    if (!Array.isArray(sum.responseStatusMap)) {
      throw new Error("Cloudflare Analytics returned an invalid status map");
    }

    const statuses = { status1xx: 0, status2xx: 0, status3xx: 0, status4xx: 0, status5xx: 0, statusOther: 0 };
    for (const rawStatus of sum.responseStatusMap) {
      const status = record(rawStatus);
      const code = count(status.edgeResponseStatus);
      const requests = count(status.requests);
      if (code >= 100 && code <= 199) statuses.status1xx += requests;
      else if (code >= 200 && code <= 299) statuses.status2xx += requests;
      else if (code >= 300 && code <= 399) statuses.status3xx += requests;
      else if (code >= 400 && code <= 499) statuses.status4xx += requests;
      else if (code >= 500 && code <= 599) statuses.status5xx += requests;
      else statuses.statusOther += requests;
    }

    return {
      bytes: count(sum.bytes),
      date: dimensions.date,
      pageViews: count(sum.pageViews),
      requests: count(sum.requests),
      ...statuses,
      threats: count(sum.threats),
      uniqueIps: count(uniq.uniques),
    };
  });
}

const DAILY_QUERY = `query DailyZoneTraffic($zoneTag: string, $start: Date, $end: Date) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(
        limit: 1000
        orderBy: [date_ASC]
        filter: { date_geq: $start, date_leq: $end }
      ) {
        dimensions { date }
        sum {
          requests
          pageViews
          bytes
          threats
          responseStatusMap { edgeResponseStatus requests }
        }
        uniq { uniques }
      }
    }
  }
}`;

interface CloudflareSyncOptions {
  end: string;
  fetcher?: typeof fetch;
  now?: () => Date;
  start: string;
  token: string;
  zoneId: string;
}

async function cloudflareHttpError(response: Response): Promise<Error> {
  let detail = "";
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const errors = (payload as Record<string, unknown>).errors;
      const first = Array.isArray(errors) ? errors[0] : null;
      if (first && typeof first === "object" && !Array.isArray(first)) {
        const message = (first as Record<string, unknown>).message;
        if (typeof message === "string") detail = message.replace(/\s+/g, " ").trim().slice(0, 300);
      }
    }
  } catch {
    // Preserve the HTTP status when Cloudflare does not return JSON.
  }
  return new Error(`Cloudflare Analytics HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
}

export async function syncCloudflareAnalytics(
  db: D1Database,
  options: CloudflareSyncOptions,
): Promise<void> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => new Date());
  const updatedAt = now().toISOString();

  try {
    const response = await fetcher("https://api.cloudflare.com/client/v4/graphql", {
      body: JSON.stringify({
        query: DAILY_QUERY,
        variables: { end: options.end, start: options.start, zoneTag: options.zoneId },
      }),
      headers: {
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw await cloudflareHttpError(response);

    const metrics = normalizeCloudflareResponse(await response.json());
    const statements = metrics.map((metric) => db.prepare(`
      INSERT INTO daily_cloudflare_metrics (
        date, requests, page_views, unique_ips, bytes, threats,
        status_1xx, status_2xx, status_3xx, status_4xx, status_5xx, status_other, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        requests = excluded.requests,
        page_views = excluded.page_views,
        unique_ips = excluded.unique_ips,
        bytes = excluded.bytes,
        threats = excluded.threats,
        status_1xx = excluded.status_1xx,
        status_2xx = excluded.status_2xx,
        status_3xx = excluded.status_3xx,
        status_4xx = excluded.status_4xx,
        status_5xx = excluded.status_5xx,
        status_other = excluded.status_other,
        updated_at = excluded.updated_at
    `).bind(
      metric.date,
      metric.requests,
      metric.pageViews,
      metric.uniqueIps,
      metric.bytes,
      metric.threats,
      metric.status1xx,
      metric.status2xx,
      metric.status3xx,
      metric.status4xx,
      metric.status5xx,
      metric.statusOther,
      updatedAt,
    ));
    statements.push(db.prepare(`
      INSERT INTO integration_state (integration, last_success_at, last_error, updated_at)
      VALUES ('cloudflare_analytics', ?, NULL, ?)
      ON CONFLICT(integration) DO UPDATE SET
        last_success_at = excluded.last_success_at,
        last_error = NULL,
        updated_at = excluded.updated_at
    `).bind(updatedAt, updatedAt));
    await db.batch(statements);
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 500) : "Unknown Cloudflare Analytics error";
    await db.prepare(`
      INSERT INTO integration_state (integration, last_error, updated_at)
      VALUES ('cloudflare_analytics', ?, ?)
      ON CONFLICT(integration) DO UPDATE SET
        last_error = excluded.last_error,
        updated_at = excluded.updated_at
    `).bind(detail, updatedAt).run();
    throw error;
  }
}
