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

Operations source is committed locally at `3829ceb` plus diagnostic fix `f8d5cb1`; `dev` is two commits ahead of `origin/dev`. Worker version `3b2f9e22-3037-40b6-907f-a2573bd7087a`, mapped to `f8d5cb1`, is deployed at 100% with all eight secret bindings, `EVENT_COLLECTION_ENABLED=false`, `workers_dev=false`, preview URLs disabled, and the five-minute Cron active. Remote migrations `0001`–`0003` are current. `operations.shopandson.com` returns 200 for `/health`, Access redirects `/dashboard`, `POST /v1/events` returns `503 collection_disabled`, and unauthenticated notifications return 401. All four health targets are healthy with zero consecutive failures and no open incidents. Shopify authentication and `read_reports` succeed; 90 aggregate rows cover 2026-04-17 through 2026-07-15. Cloudflare Analytics has zero rows because the deployed token still lacks `Account Analytics: Read` for the zone. Collection has written zero funnel events. Six rollout-generated notifications remain undelivered; do not start the relay until they are explicitly suppressed or otherwise dispositioned. The approved Shortcut and Keychain item exist, the harmless iMessage test arrived, and the relay's exact HTTP identity receives 200, but no LaunchAgent is installed and no real incident drill has run. Storefront telemetry changes remain dirty and unpublished.

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
- Remaining manual gates are private entry of the new Cloudflare Analytics token, disposition of stale notifications, LaunchAgent installation, the real incident/recovery drill, the storefront privacy decision, collection enablement, live storefront publication, push/merge, and unexpected destructive or materially permission-expanding work.

## Blockers and decisions needed

- Cloudflare Analytics remains blocked on a genuinely new token with `Account → Account Analytics → Read`, restricted to the intended account and `shopandson.com` zone. The current deployed actor still lacks that permission. Enter the replacement only through Wrangler's hidden version-secret prompt.
- Storefront publication, push/merge, and any unexpected destructive, irreversible, materially permission-expanding, or live-storefront-interrupting action remain separate Beckett gates. A local scoped commit on `dev` is authorized after verification.
- Shopify production aggregation is verified. Cloudflare aggregation, LaunchAgent delivery, the incident drill, collector enablement, and storefront publication are not.
- Collector enablement remains blocked until Cloudflare integration and notification protection are verified. Access and the plan-available collector edge rule are active and verified; a second dashboard rule would require a paid-plan change and is not assumed.
- Storefront dependencies retain two linked low-severity transitive esbuild findings; remediation requires a separately tested breaking Astro 7 migration.

## Next steps

1. Create a genuinely new least-privilege Cloudflare Analytics token and apply it with `wrangler versions secret put`. Stop unless the newer version retains source `f8d5cb1`, all eight binding names, D1 binding `DB`, the intended custom route, and `EVENT_COLLECTION_ENABLED="false"`; deploy only that inspected version and require a successful Cron row write.
2. Explicitly disposition the six rollout-generated pending notifications without sending stale false alarms; preserve incident history. Then install the LaunchAgent, verify empty polling/ack behavior, and obtain explicit approval before a controlled incident/recovery drill.
3. Resolve the storefront host-pinning finding and decide whether storage-denied browsers should fail closed or use the current in-memory UUID. Rerun the static build after Shopify's current `429` window clears.
4. Re-review the frozen storefront candidate. Only then enable and verify edge-protected collection; live storefront publication remains a separate approval.
5. Commit documentation/storefront work locally, update the root coordination summary, and stop before push/merge or publication.

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
- Storefront analytics: 4/4 tests passed.
- Astro check: 0 errors, 0 warnings, 1 existing inline external-script hint.
- Current static storefront build: blocked twice by Shopify `429` responses for collection `clothing-1` after all built-in retries while rendering the sitemap; no source/build error preceded the upstream rejection.
- Configured collector build: exact dummy HTTPS `/v1/events` value found in generated analytics bundle.
- Storefront dependency audit: 0 critical/high/moderate; 2 linked low transitive esbuild findings with no non-breaking fix in the current Astro line.
- `git diff --check`: passed.
- Independent production/security review identified duplicate-Cron health accounting and reproducibility blockers; both are resolved in committed/deployed Operations source. Storefront host pinning and the storage-denied privacy contract remain pre-publication findings.
- Current 15-file candidate scan found no credential-pattern files; the temporary-index path gate found no secret/local-database paths.

## Handoff

- Start by reading: `../../README.md`, `../../BUSINESS-STATE.md`, `../../WORKSTREAM-STANDARD.md`, `../AGENTS.md`, this workstream’s `README.md`, `AGENTS.md`, `STATE.md`, and `PRODUCTION-READINESS.md`.
- Repository state: `dev` is two local commits ahead of `origin/dev`; only storefront telemetry/workflow paths remain dirty. Do not push, merge, publish, or let another session edit this checkout without Beckett's approval and ownership transfer.
- Last handoff summary: committed Operations code and Cron are live with collection disabled; health and Shopify are green. Cloudflare Analytics permission, six stale pending notifications, LaunchAgent/drill verification, and storefront gates remain.
- Resume point: perform only step 1 above. Stop if the new Cloudflare version does not have a creation time after the current active version or if its first scheduled attempt does not clear `last_error` and populate `daily_cloudflare_metrics`.
