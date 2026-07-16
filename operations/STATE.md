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

The monitoring, incident, private dashboard, aggregate reporting, notification relay, and storefront telemetry implementation exists locally as uncommitted work. Remote migrations `0001_health.sql`, `0002_analytics.sql`, and `0003_scheduled_jobs.sql` are applied. Worker version `ab382b32-e588-43d0-9d24-839a5cf380a6` is deployed at 100% with all eight runtime bindings, `EVENT_COLLECTION_ENABLED=false`, `workers_dev=false`, preview URLs disabled, and the five-minute Cron active. The only target is `operations.shopandson.com`; `/health` returns 200, Access intercepts `/dashboard`, `/v1/events` returns `503 collection_disabled`, and protected notification access rejects missing credentials. All four health targets are healthy. Production D1 contains rollout health, integration, job, incident, and notification records but no funnel events or aggregate analytics rows. Shopify client-credentials exchange and `read_reports` scope verification succeed, but the deployed query still requests obsolete `units_sold`; the local candidate uses current `net_items_sold`. Cloudflare Analytics rejects the configured runtime token with `Authentication failed`, so that token must be privately replaced. The approved Shortcut exists, its harmless iMessage test arrived, the notification token is in Keychain, and authenticated notification polling returns 200; the LaunchAgent and real incident drill are not configured. The Free-plan collector rule remains verified at 20 requests per 10 seconds per IP with a 10-second block. The storefront has not been published.

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
- Manual gates remain only for private credential entry, Shopify app permission, the Access identity, the iMessage recipient/real notification, live storefront publication, push/merge, and unexpected destructive or materially permission-expanding work.

## Blockers and decisions needed

- Manual credential correction: privately recreate or correct the rejected `CLOUDFLARE_ANALYTICS_TOKEN` with Account Analytics Read access and re-enter it through Wrangler's interactive version-secret prompt. Never paste the value into chat or a command argument.
- Storefront publication, push/merge, and any unexpected destructive, irreversible, materially permission-expanding, or live-storefront-interrupting action remain separate Beckett gates. A local scoped commit on `dev` is authorized after verification.
- Shopify authentication and `read_reports` are verified; the corrected `net_items_sold` query still needs deployment and a successful scheduled run. Cloudflare Analytics remains blocked by the invalid runtime token.
- Collector enablement remains blocked until integrations, Cron, and notification protection are verified. Access and the plan-available collector edge rule are active and verified; a second dashboard rule would require a paid-plan change and is not assumed.
- Storefront dependencies retain two linked low-severity transitive esbuild findings; remediation requires a separately tested breaking Astro 7 migration.

## Next steps

1. Freeze the reviewed Operations candidate in a local `dev` commit, deploy that exact commit with collection disabled, and verify Shopify aggregates plus duplicate-tick idempotency.
2. Have Beckett privately replace the invalid Cloudflare Analytics token; verify Cloudflare aggregates on a scheduled run.
3. Clear only generated pre-stability false-positive alert records, configure/test the approved LaunchAgent, and obtain explicit approval before a real incident/recovery drill.
4. Resolve the remaining storefront privacy/collector-host review findings, then enable edge-protected collection.
5. Update production/rollback documentation from live evidence; publish storefront telemetry only under separate final approval.

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

- `npm test` in `operations`: 55/55 tests passed across 15 files.
- `npm run typecheck` in `operations`: production and test TypeScript passed.
- `npm run cf-typegen -- --check`: generated runtime declarations are current; handwritten `Env` owns dynamic bindings.
- `npm run deploy:dry`: passed; 55.38 KiB upload, 13.94 KiB gzip, DB binding present, collector binding `false`.
- Clean temporary local D1: migrations `0001`, `0002`, and `0003` applied successfully.
- Python relay: 4/4 tests passed; `compileall` passed.
- LaunchAgent template: `plutil -lint` passed.
- Operations `npm audit --audit-level=low`: 0 vulnerabilities.
- Storefront analytics: 4/4 tests passed.
- Astro check: 0 errors, 0 warnings, 1 existing inline external-script hint.
- Static storefront build: passed, 3 pages including sitemap.
- Configured collector build: exact dummy HTTPS `/v1/events` value found in generated analytics bundle.
- Storefront dependency audit: 0 critical/high/moderate; 2 linked low transitive esbuild findings with no non-breaking fix in the current Astro line.
- `git diff --check`: passed.
- Independent production/security review identified duplicate-Cron health accounting and reproducibility blockers. Duplicate-tick health execution is now lease-idempotent with two-day claim retention and regression coverage; reproducibility is being resolved by this scoped commit.
- Credential-pattern scan found only explicit test fixtures, no credential-like production value.

## Handoff

- Start by reading: `../../README.md`, `../../BUSINESS-STATE.md`, `../../WORKSTREAM-STANDARD.md`, `../AGENTS.md`, this workstream’s `README.md`, `AGENTS.md`, `STATE.md`, and `PRODUCTION-READINESS.md`.
- Repository state before the reproducibility commit: `operations/` and its necessary `.gitignore` rules are scoped for the first commit; related storefront telemetry remains dirty and unpublished.
- Last handoff summary: the secret-bearing Worker and Cron are live with collection disabled; health is healthy, Shopify needs the locally corrected metric deployed, and Cloudflare Analytics needs a privately replaced token.
- Resume point: deploy the exact reviewed Operations commit, verify Shopify, then stop for the Cloudflare token correction if Beckett has not completed it.
