# Shop & Sons Operations State

Last updated: 2026-07-16

## Control

- Owner: Beckett Badertscher
- Status: active production integration
- Type: durable operational system inside the existing `Shop & Sons` repository
- Repository: `/Users/robo/Desktop/BaderBureau/Shop & Sons`
- Branch: `dev` tracking `origin/dev`
- Worktree: primary checkout
- Current session owner: this Hermes session; no other session may edit this checkout concurrently

## Current state

Operations source is committed locally at `3829ceb` plus diagnostic fix `f8d5cb1`; `dev` is five commits ahead of `origin/dev`. Worker version `5b415f2a-5f4b-4603-a7fa-fb8a490c4304` is deployed at 100%. Its immutable script ETag matches the prior version mapped to `f8d5cb1`; it retains all eight secret bindings, `EVENT_COLLECTION_ENABLED=false`, `workers_dev=false`, preview URLs disabled, the intended D1 binding, the sole `operations.shopandson.com` custom domain, and the sole five-minute Cron. Remote migrations `0001`–`0003` are current. `/health` returns 200, Access redirects `/dashboard`, `POST /v1/events` returns `503 collection_disabled`, and unauthenticated notifications return 401. All four health targets are healthy with zero consecutive failures and no open incidents. Shopify has 90 aggregate rows covering 2026-04-17 through 2026-07-15. The corrected `Zone → Analytics → Read` token succeeded at 22:00 UTC: `last_error` is null, `last_success_at` is `2026-07-16T22:00:54.000Z`, and six Cloudflare rows cover 2026-07-10 through 2026-07-15. Collection has written zero funnel events. Notification IDs 1–6 were acknowledged without invoking the Shortcut; all six records and incident history remain. The LaunchAgent is installed and loaded from a mode-700 relay copy under `~/Library/Application Support/ShopAndSonOperations/`; 15 observed runs end with exit 0 and clean logs. The approved delivery drill created retained incident 4 and notifications 7–8; Beckett confirmed exactly one opening and one recovery iMessage, both rows are acknowledged, synthetic probe/state rows were removed, the pending queue is empty, and no incident is open. Storefront telemetry changes remain dirty and unpublished.

## Completed work

- Implemented off-device storefront, now-playing `/now`, Spotify authorization, and feature-toggle probes.
- Implemented atomic incident state transitions, retained probe/incident history, deduplicated notifications, and recovery/reminder handling.
- Implemented lease-based daily scheduler claims with stale-claim recovery and isolated aggregate integrations.
- Implemented a private hardened dashboard with session-based funnel conversions and complete aggregate sales/traffic fields.
- Implemented exact-schema, privacy-minimized storefront events with atomic per-session/global limits, disabled-by-default collection, 90-day raw retention, and daily rollups.
- Implemented no-throw storefront analytics and success-only commerce/newsletter instrumentation.
- Implemented a Keychain/Shortcut relay with a local pending-ack journal and a secret-free LaunchAgent template.
- Added deployment, credential, backup/recovery, rollback, and production-readiness documentation.
- Added the required workstream `README.md`, `AGENTS.md`, and `STATE.md` contract.

## Active work

- Beckett authorized this session to complete routine, reversible production setup end to end, including Worker versions, D1, the documented custom hostname, Cron, Access, rate limits, integration verification, collection enablement, documentation, and a local commit on `dev`.
- This session owns `operations/`, the related homepage telemetry paths, `.github/workflows/deploy.yml`, `.gitignore`, and `homepage/.env.example` until handoff. No other session may edit this checkout concurrently.
- Remaining manual gates are collection enablement, live storefront publication, push/merge, and unexpected destructive or materially permission-expanding work.

## Blockers and decisions needed

- Notification delivery is production-verified through one approved synthetic opening/recovery drill. Incident 4 and notifications 7–8 are retained as audit evidence; generated synthetic probe/state rows were removed after recovery.
- Storefront publication, push/merge, and any unexpected destructive, irreversible, materially permission-expanding, or live-storefront-interrupting action remain separate Beckett gates. A local scoped commit on `dev` is authorized after verification.
- Shopify and Cloudflare production aggregation, repeated LaunchAgent polling, and real opening/recovery iMessage delivery are verified. Collector enablement and storefront publication are not.
- The storefront source now pins `https://operations.shopandson.com/v1/events` at runtime, CSP generation, CI, and example configuration. Denied/unavailable session storage uses only a page-lifetime anonymous in-memory UUID; no fingerprint or alternate persistence is added, and reloads may count separately.
- Collector enablement remains blocked on a green live-data production build and complete artifact inspection. The final independent frozen-source review found no privacy, security, or production-correctness blocker. Five production attempts—including three against the final source—each exhausted the unchanged three-attempt Shopify retry policy with `429` during sitemap generation. Access, integrations, notification protection, and the plan-available collector edge rule are verified.
- Storefront dependencies retain two linked low-severity transitive esbuild findings; remediation requires a separately tested breaking Astro 7 migration.

## Next steps

1. Rerun the unchanged production build after Shopify's current `429` window clears; require a complete artifact and exact pinned-endpoint assertion.
2. Inspect the complete artifact against the independently approved frozen source. Only then enable and verify edge-protected collection; live storefront publication remains a separate approval.
3. Commit documentation/storefront work locally, update the root coordination summary, and stop before push/merge or publication.

## Immediate post-rollout follow-up — do not start during this rollout

Finish the current Operations production setup, stability verification, documentation, local commit, and root handoff before changing the existing shared newsletter/now-playing Worker. Once Operations is live and stable, stop and present this as the next focused workstream:

1. Fix the rare `/subscribe` branch that can return success after a create conflict when the follow-up customer lookup never confirms the customer.
2. Add a non-mutating newsletter/Shopify-auth health signal to the shared Worker.
3. Add a separate `newsletter_api` target to Operations.
4. Keep newsletter signup events labeled as directional funnel telemetry, not authoritative subscriber totals.
5. Keep campaign delivery, open, and click analytics outside the current rollout.

The shared newsletter/now-playing Worker’s code, bindings, routes, secrets, and deployment configuration are explicitly out of scope for the current Operations rollout.

## Dependencies and coordination

- Upstream systems: `shopandson.com`, the existing now-playing Worker, Cloudflare Analytics, and Shopify Admin ShopifyQL.
- Downstream consumers: Beckett’s private dashboard, macOS notification relay, and the homepage analytics adapter.
- Parallel session ownership: none.
- Files reserved by another session: none.
- Primary deeper files: `PRODUCTION-READINESS.md`, `src/worker.ts`, `src/events.ts`, `src/health-repository.ts`, `src/scheduler.ts`, `scripts/notification_relay.py`, and `../.github/workflows/deploy.yml` (repository-relative path is `.github/workflows/deploy.yml`).

## Verification record

Executed locally on 2026-07-16 without production credentials or network-side changes:

- `npm test` in `operations`: 56/56 tests passed across 15 files.
- `npm run typecheck` in `operations`: production and test TypeScript passed.
- `npm run cf-typegen -- --check`: generated runtime declarations are current; handwritten `Env` owns dynamic bindings.
- `npm run deploy:dry`: passed; 55.64 KiB upload, 13.96 KiB gzip, DB binding present, collector binding `false`.
- Clean temporary local D1: migrations `0001`, `0002`, and `0003` applied successfully.
- Python relay: 4/4 tests passed; `compileall` passed.
- LaunchAgent template: `plutil -lint` passed.
- Operations `npm audit --audit-level=low`: 0 vulnerabilities.
- Storefront analytics and emitted-artifact verification: 8/8 tests passed.
- Astro check: 0 errors, 0 warnings, 1 existing inline external-script hint.
- Current static storefront build: blocked across five production attempts, including three against the final source, by Shopify `429` responses for collection `clothing-1`; each attempt exhausted the existing three bounded retries while rendering the sitemap, and no source/build error preceded the upstream rejection.
- Pinned collector tests: exact production endpoint accepted; arbitrary HTTPS host and malformed alternatives are no-ops. Denied storage reuses one in-memory UUID within a page instance and creates a distinct UUID after reload/new instance without extra identifiers. Requests explicitly omit credentials and suppress referrers; malformed stored session identifiers are replaced with anonymous UUIDs.
- Storefront dependency audit: 0 critical/high/moderate; 2 linked low transitive esbuild findings with no non-breaking fix in the current Astro line.
- `git diff --check`: passed.
- Independent production/security review identified duplicate-Cron health accounting and reproducibility blockers; both are resolved in committed/deployed Operations source. The final frozen storefront source review found no privacy, security, or production-correctness blocker; artifact approval remains blocked on the red Shopify-backed build.
- Current 15-file candidate scan found no credential-pattern files; the temporary-index path gate found no secret/local-database paths.

## Handoff

- Start by reading: `../../README.md`, `../../BUSINESS-STATE.md`, `../../WORKSTREAM-STANDARD.md`, `../AGENTS.md`, this workstream’s `README.md`, `AGENTS.md`, `STATE.md`, and `PRODUCTION-READINESS.md`.
- Repository state: `dev` is five local commits ahead of `origin/dev`; Operations production-state documentation and storefront telemetry/workflow paths are dirty. Do not push, merge, publish, or let another session edit this checkout without Beckett's approval and ownership transfer.
- Last handoff summary: Worker `5b415f2a-5f4b-4603-a7fa-fb8a490c4304` is live with collection disabled; health, integrations, notifications, pinned storefront destination, and the accepted page-lifetime privacy fallback are green. The full storefront build is red only because Shopify returned `429` through five bounded production attempts; collection and publication remain gated.
- Resume point: perform only step 1 above after the upstream throttle window clears. Do not weaken retries, enable collection, or publish the storefront without the remaining evidence and approvals.
