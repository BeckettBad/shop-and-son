export interface ProbeMeasurement {
  detail: string;
  healthy: boolean;
  latencyMs: number;
  statusCode: number | null;
}

const SITE_URL = "https://shopandson.com/";
const NOW_PLAYING_WORKER_URL = "https://shop-and-son-now-playing.shop-and-son.workers.dev";

export interface NowPlayingProbeMeasurements {
  featureToggle: ProbeMeasurement;
  spotifyAuth: ProbeMeasurement;
  worker: ProbeMeasurement;
}

const HIDDEN_NOW_REASONS = new Set([
  "auth_error", "device_gated", "idle", "local_file", "missing_item",
  "missing_track_data", "not_track", "paused", "spotify_error", "toggle_off",
]);

function validNowPayload(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  if (payload.show === false) {
    return typeof payload.reason === "string" && HIDDEN_NOW_REASONS.has(payload.reason);
  }
  if (payload.show !== true || !payload.track || typeof payload.track !== "object" || Array.isArray(payload.track)) {
    return false;
  }
  const track = payload.track as Record<string, unknown>;
  return typeof track.name === "string" && track.name.length > 0
    && Array.isArray(track.artists) && track.artists.length > 0
    && track.artists.every((artist) => typeof artist === "string" && artist.length > 0)
    && typeof track.album === "string"
    && (track.art === null || typeof track.art === "string")
    && typeof track.url === "string" && track.url.length > 0
    && Number.isFinite(payload.progressMs) && Number(payload.progressMs) >= 0
    && Number.isFinite(payload.durationMs) && Number(payload.durationMs) > 0
    && typeof payload.fetchedAt === "string" && Number.isFinite(Date.parse(payload.fetchedAt));
}

interface StatusPayload {
  allowedDevices: string[];
  auth: "error" | "ok";
  lastShowAt: string | null;
  lastSpotifyOkAt: string | null;
  toggle: "off" | "on";
}

function validTimestamp(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function validStatusPayload(value: unknown): value is StatusPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const status = value as Record<string, unknown>;
  return (status.auth === "ok" || status.auth === "error")
    && (status.toggle === "on" || status.toggle === "off")
    && Array.isArray(status.allowedDevices)
    && status.allowedDevices.every((device) => typeof device === "string" && device.length > 0)
    && validTimestamp(status.lastSpotifyOkAt)
    && validTimestamp(status.lastShowAt);
}

export async function probeSite(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<ProbeMeasurement> {
  const startedAt = now();
  let response: Response;
  try {
    response = await fetcher(SITE_URL, {
      headers: { Accept: "text/html" },
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const latencyMs = Math.max(0, now() - startedAt);
    const message = error instanceof Error ? error.message : "unknown error";
    return {
      detail: `site request failed: ${message}`,
      healthy: false,
      latencyMs,
      statusCode: null,
    };
  }
  const latencyMs = Math.max(0, now() - startedAt);
  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  const healthy = response.ok && contentType.includes("text/html");

  return {
    detail: healthy
      ? `site returned HTML ${response.status}`
      : `site returned ${response.status}${contentType ? ` (${contentType})` : ""}`,
    healthy,
    latencyMs,
    statusCode: response.status,
  };
}

export async function probeNowPlayingWorker(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<NowPlayingProbeMeasurements> {
  const startedAt = now();
  let nowResponse: Response;
  let response: Response;
  try {
    nowResponse = await fetcher(`${NOW_PLAYING_WORKER_URL}/now`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    response = await fetcher(`${NOW_PLAYING_WORKER_URL}/status`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const latencyMs = Math.max(0, now() - startedAt);
    const message = error instanceof Error ? error.message : "unknown error";
    return {
      featureToggle: {
        detail: "Feature toggle unavailable because Worker request failed",
        healthy: false,
        latencyMs,
        statusCode: null,
      },
      spotifyAuth: {
        detail: "Spotify authorization unavailable because Worker request failed",
        healthy: false,
        latencyMs,
        statusCode: null,
      },
      worker: {
        detail: `now-playing Worker request failed: ${message}`,
        healthy: false,
        latencyMs,
        statusCode: null,
      },
    };
  }
  const latencyMs = Math.max(0, now() - startedAt);
  const statusContentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  let status: StatusPayload;
  try {
    if (!statusContentType.includes("application/json")) throw new Error("invalid content type");
    const payload: unknown = await response.json();
    if (!validStatusPayload(payload)) throw new Error("invalid status payload");
    status = payload;
  } catch {
    return {
      featureToggle: {
        detail: "Feature toggle unavailable because Worker status was invalid",
        healthy: false,
        latencyMs,
        statusCode: response.status,
      },
      spotifyAuth: {
        detail: "Spotify authorization unavailable because Worker status was invalid",
        healthy: false,
        latencyMs,
        statusCode: response.status,
      },
      worker: {
        detail: "now-playing Worker returned invalid /status JSON",
        healthy: false,
        latencyMs,
        statusCode: response.status,
      },
    };
  }
  const authHealthy = response.ok && status.auth === "ok";
  const toggle = status.toggle;
  const toggleHealthy = response.ok && toggle === "on";
  const nowContentType = nowResponse.headers.get("Content-Type")?.toLowerCase() ?? "";
  let nowPayload: unknown;
  try {
    if (!nowContentType.includes("application/json")) throw new Error("invalid content type");
    nowPayload = await nowResponse.json();
  } catch {
    nowPayload = null;
  }
  const nowHealthy = nowResponse.ok && validNowPayload(nowPayload);

  return {
    featureToggle: {
      detail: `now-playing feature toggle is ${toggle}`,
      healthy: toggleHealthy,
      latencyMs,
      statusCode: response.status,
    },
    spotifyAuth: {
      detail: authHealthy
        ? `Spotify authorization healthy (toggle=${toggle})`
        : `Spotify authorization unhealthy (toggle=${toggle})`,
      healthy: authHealthy,
      latencyMs,
      statusCode: response.status,
    },
    worker: {
      detail: nowHealthy && response.ok
        ? "now-playing Worker returned valid /now and /status responses"
        : !nowHealthy
          ? `now-playing Worker /now response was invalid (${nowResponse.status})`
          : `now-playing Worker /status response was unhealthy (${response.status})`,
      healthy: nowHealthy && response.ok,
      latencyMs,
      statusCode: nowHealthy ? response.status : nowResponse.status,
    },
  };
}
