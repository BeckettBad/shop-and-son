import { recordProbe } from "./health-repository";
import {
  probeNowPlayingWorker,
  probeSite,
  type NowPlayingProbeMeasurements,
  type ProbeMeasurement,
} from "./probes";

export interface ScheduledCheckOptions {
  checkedAt?: string;
  probeNowPlayingWorker?: () => Promise<NowPlayingProbeMeasurements>;
  probeSite?: () => Promise<ProbeMeasurement>;
}

export async function runScheduledChecks(
  db: D1Database,
  options: ScheduledCheckOptions = {},
): Promise<void> {
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  const siteProbe = options.probeSite ?? probeSite;
  const workerProbe = options.probeNowPlayingWorker ?? probeNowPlayingWorker;
  const [site, nowPlaying] = await Promise.all([siteProbe(), workerProbe()]);

  await Promise.all([
    recordProbe(db, "feature_toggle", { ...nowPlaying.featureToggle, checkedAt }),
    recordProbe(db, "site", { ...site, checkedAt }),
    recordProbe(db, "worker", { ...nowPlaying.worker, checkedAt }),
    recordProbe(db, "spotify_auth", { ...nowPlaying.spotifyAuth, checkedAt }),
  ]);
}
