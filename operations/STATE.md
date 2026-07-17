# Shop & Sons Operations State

Last updated: 2026-07-16

## Control

- Owner: Beckett Badertscher
- Status: active production integration
- Type: durable operational system inside the existing `Shop & Sons` repository
- Repository: `/Users/robo/Desktop/BaderBureau/Shop & Sons`
- Branch: `dev` tracking `origin/dev`
- Worktree: primary checkout
- Current session owner: none after this handoff; the primary checkout contains the reviewed local dashboard wording changes

## Current state

`dev` matches `origin/dev` at `c676486`; the reviewed storefront telemetry and dashboard integration were pushed, and an external Cloudflare Pages GitHub App created a non-production `dev` branch preview. The plain-language dashboard rewrite is verified locally and remains uncommitted. No merge, Worker deployment, remote migration, collection enablement, secret change, or production storefront publication occurred in this session. Worker version `5b415f2a-5f4b-4603-a7fa-fb8a490c4304` remains deployed at 100% with all eight secret bindings, `EVENT_COLLECTION_ENABLED=false`, `workers_dev=false`, preview URLs disabled, the intended D1 binding, the sole `operations.shopandson.com` custom domain, and the sole five-minute Cron. Remote migrations `0001`–`0003` are current. `/health` returns 200, Access redirects `/dashboard`, `POST /v1/events` returns `503 collection_disabled`, and unauthenticated notifications return 401. All four health targets are healthy with zero consecutive failures and no open incidents. Shopify has 90 aggregate rows covering 2026-04-17 through 2026-07-15. The corrected `Zone → Analytics → Read` token last verified six Cloudflare rows covering 2026-07-10 through 2026-07-15. Collection has written zero funnel events. Notification IDs 1–8 and incident history remain as audit evidence; Beckett confirmed exactly one opening and one recovery iMessage during the approved drill, the pending queue is empty, and no incident is open. The LaunchAgent remains installed from a mode-700 relay copy under `~/Library/Application Support/ShopAndSonOperations/`.

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
- Rewrote dashboard headings, labels, descriptions, warnings, metric explanations, comparison states, and empty states in plain store-owner language while retaining estimate, date-boundary, and sales-source caveats.

## Active work

- No active file owner after this handoff. Local changes are limited to the plain-language dashboard renderer, its tests, and this state record.
- Remaining manual gates are collection enablement, live storefront publication, push/merge, and unexpected destructive or materially permission-expanding work.

## Blockers and decisions needed

- Notification delivery is production-verified through one approved synthetic opening/recovery drill. Incident 4 and notifications 7–8 are retained as audit evidence; generated synthetic probe/state rows were removed after recovery.
- Storefront publication, push/merge, and any unexpected destructive, irreversible, materially permission-expanding, or live-storefront-interrupting action remain separate Beckett gates. A local scoped commit on `dev` is authorized after verification.
- Shopify and Cloudflare production aggregation, repeated LaunchAgent polling, and real opening/recovery iMessage delivery are verified. Collector enablement and storefront publication are not.
- The storefront source now pins `https://operations.shopandson.com/v1/events` at runtime, CSP generation, CI, and example configuration. Denied/unavailable session storage uses only a page-lifetime anonymous in-memory UUID; no fingerprint or alternate persistence is added, and reloads may count separately.
- The storefront build and artifact gate is green. After five bounded Shopify-throttled failures, the next unchanged build completed all routes and 467 sitemap URLs. The 41-file artifact passed collector, CSP, privacy-transport, and 17/17 public-file parity checks with SHA-256 `0845980d02996a583589873167ae65a71135fa2f63f7c5a8f8eb10f7d8996673`. Collection remains disabled pending its separate inspected-version approval; publication remains a distinct push/merge approval.
- The redesigned private dashboard is integrated locally. Its Cloudflare and Shopify 7/30/90-day windows end on the latest complete reporting date and retain exactly the requested number of days; probe history preserves its existing start-of-cutoff-UTC-day boundary.
- Storefront dependencies retain two linked low-severity transitive esbuild findings; remediation requires a separately tested breaking Astro 7 migration.

## Next steps

1. Inspect any proposed collection-enabled Worker version without activating it, then obtain separate explicit approval before changing live traffic.
2. Obtain separate immutable storefront artifact/source approval before any push, merge, or publication.
3. Keep collection disabled and stop before every production, push, merge, or publication boundary until those approvals are explicit.

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

- `npm test` in `operations`: 83/83 tests passed across 15 files, including the new plain-language and source-specific unavailable-state assertions.
- `npm run typecheck` in `operations`: production and test TypeScript passed.
- `npm run cf-typegen -- --check`: generated runtime declarations are current; handwritten `Env` owns dynamic bindings.
- `npm run deploy:dry`: passed after the wording rewrite and independent review corrections; 104.94 KiB upload, 25.81 KiB gzip, DB binding present, collector binding `false`.
- Independent read-only review found no accessibility or security regression. Its four dashboard accuracy findings were corrected: estimated/derived chart values are no longer called exact, comparison copy describes matched available dates, Shopify units are labeled net items sold, and Cloudflare 4xx/5xx/threat labels no longer overinterpret source fields.
- Live loopback runtime: authenticated dashboard returned 200 with `Cache-Control: no-store`, the plain-language and source-specific unavailable states rendered, no external scripts were present, and `POST /v1/events` remained `503 collection_disabled`.
- Browser review: no visible clipping or overflow at desktop width, no console errors, one H1, no duplicate IDs, all figures named, and all eight scrollable table regions retained captions, labels, and keyboard focus.
- Clean temporary local D1: migrations `0001`, `0002`, and `0003` applied successfully.
- Python relay: 4/4 tests passed; `compileall` passed.
- LaunchAgent template: `plutil -lint` passed.
- Operations `npm audit --audit-level=low`: 0 vulnerabilities.
- Storefront analytics and emitted-artifact verification: 8/8 tests passed.
- Astro check: 0 errors, 0 warnings, 1 existing inline external-script hint.
- Static storefront production build: passed after five earlier bounded Shopify-throttled failures; 3 pages, `/sitemap.xml`, and 467 sitemap URLs completed.
- Complete artifact inspection: 4/4 required outputs, 17/17 public files, 41 total files, exact collector/CSP/privacy controls, no forbidden analytics identifiers, SHA-256 `0845980d02996a583589873167ae65a71135fa2f63f7c5a8f8eb10f7d8996673`.
- Pinned collector tests: exact production endpoint accepted; arbitrary HTTPS host and malformed alternatives are no-ops. Denied storage reuses one in-memory UUID within a page instance and creates a distinct UUID after reload/new instance without extra identifiers. Requests explicitly omit credentials and suppress referrers; malformed stored session identifiers are replaced with anonymous UUIDs.
- Storefront dependency audit: 0 critical/high/moderate; 2 linked low transitive esbuild findings with no non-breaking fix in the current Astro line.
- `git diff --check`: passed.
- Independent production/security review identified duplicate-Cron health accounting and reproducibility blockers; both are resolved in committed/deployed Operations source. The final frozen storefront source review found no privacy, security, or production-correctness blocker; artifact approval remains blocked on the red Shopify-backed build.
- Current 15-file candidate scan found no credential-pattern files; the temporary-index path gate found no secret/local-database paths.

## Handoff

- Start by reading: `../../README.md`, `../../BUSINESS-STATE.md`, `../../WORKSTREAM-STANDARD.md`, `../AGENTS.md`, this workstream’s `README.md`, `AGENTS.md`, `STATE.md`, and `PRODUCTION-READINESS.md`.
- Repository state: `dev` matches `origin/dev` with uncommitted changes in `operations/src/dashboard-render.ts`, `operations/test/dashboard.test.ts`, and `operations/STATE.md`. Do not push, merge, publish, deploy, or edit this checkout without Beckett's approval and a fresh ownership claim.
- Last handoff summary: Worker `5b415f2a-5f4b-4603-a7fa-fb8a490c4304` is unchanged and live with collection disabled; the plain-language dashboard is verified only on the local loopback runtime. Health, integrations, notifications, pinned storefront destination, accepted page-lifetime privacy fallback, complete storefront build, and artifact inspection remain green. Collection and publication remain separately gated.
- Resume point: only prepare the next separately reviewed version/approval evidence. Do not enable collection or publish the storefront without the remaining explicit approvals.
