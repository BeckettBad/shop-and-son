# Shop & Sons Operations — Production Readiness Report

**Assessment date:** 2026-07-16
**Branch:** `dev`
**Disposition:** Contained production integration is active but is not approved for collection or storefront publication. Worker version `5b415f2a-5f4b-4603-a7fa-fb8a490c4304` runs at 100%; its immutable script ETag matches the prior version mapped to `f8d5cb1`, and D1, Access, the Free-plan collector rate limit, five-minute Cron, and collection-disabled boundary remain intact. Health, Shopify, Cloudflare aggregation, stale-notification handling, LaunchAgent polling, and confirmed opening/recovery iMessage delivery are verified. The collector and storefront remain gated.

## 1. Completed functionality

### Health and incidents

- Five-minute Cloudflare Cron contract
- Off-device probes for:
  - `https://shopandson.com/`
  - Existing now-playing Worker
  - Spotify authorization
  - Now-playing feature toggle as its own `feature_toggle` target
- Ten-second probe timeouts
- Network, HTTP, malformed JSON, schema, and timeout failures normalized into unhealthy measurements
- D1 probe history and current target state
- Atomic target-state transitions under overlapping probe writes
- First failure recorded as pending
- Incident opened on the second consecutive failure
- Continued failures update one open incident without duplicate opening alerts
- Recovery closes the incident and creates one recovery alert
- Daily, deduplicated reminders for unresolved incidents
- Probe/incident detail bounded to 500 characters

### Notifications

- D1 opening, reminder, and recovery queue
- Constant-time bearer-token authentication
- Protected, uncached pending-notification endpoint
- Retry-safe acknowledgement endpoint with exactly-once delivery timestamp mutation
- Bounded queue reads and operator-safe messages
- Tested macOS relay that:
  - Reads its token from Keychain
  - Invokes a named Shortcut using stdin
  - Acknowledges only after Shortcut success
  - Rejects malformed or oversized API responses
  - Persists successful delivery IDs locally before remote acknowledgement so ack retries do not resend
- Secret-free LaunchAgent template

### Privacy-minimized storefront funnel

- Public `POST /v1/events` collector with exact production-origin allowlist
- Strict event and field allowlists
- Unknown fields—including PII-like additions—rejected
- 8 KiB body limit
- UUID and public product-handle validation
- Bounded integer values
- Event timestamps limited to 24 hours old and five minutes in the future
- Atomic per-session and global application rate limits
- Event-ID idempotency
- 90-day raw-event retention and daily rollups
- Storefront adapter accepts only `https://operations.shopandson.com/v1/events` and otherwise remains a no-op
- When session storage is unavailable or denied, the adapter uses one anonymous in-memory UUID for the current page instance only. It does not fingerprint or persist elsewhere; a reload creates a new page instance and may be counted as a separate session
- Analytics requests explicitly omit credentials and suppress the referrer
- Anonymous session/event UUIDs only
- Successful-action instrumentation for:
  - Logical page views
  - Product renders
  - Cart additions
  - Cart quantity changes
  - Cart removals
  - Checkout initiation
  - Newsletter subscription success
- UI stage `fam` normalized to canonical `family`

The collector does not persist raw URLs, query strings, search text, referrers, email addresses, IP addresses, user agents, fingerprints, customer/order payloads, cart IDs, checkout URLs, line IDs, variant IDs/GIDs, or free-form customer content.

### Aggregate integrations

- Cloudflare GraphQL `httpRequests1dGroups` integration
- Daily requests, HTML page views, bytes, threats, status families, and unique-IP estimates
- Shopify Admin GraphQL `shopifyqlQuery` integration pinned to API `2026-07`
- Daily aggregate orders, net items sold (stored in the compatibility `units_sold` field), gross sales, discounts, sales reversals, and net sales
- Money persisted as exact integer minor units
- No raw Cloudflare responses, Shopify orders, or customer records persisted
- Integration success/error freshness records
- Lease-based daily job ledger with failure retry and stale-claim recovery
- One failed integration does not prevent unrelated scheduled work from starting

### Private dashboard

- Server-rendered `/dashboard` with no client JavaScript
- Constant-time HTTP Basic authentication
- 7-, 30-, and 90-day views
- Current health state
- Recent bounded probe latency/history
- Open and recovered incident history
- Funnel counts and conversion rates
- Cloudflare traffic/status/threat trends
- Clearly labeled daily unique-IP total
- Orders, units, gross sales, discounts, sales reversals, net sales, and AOV
- Integration freshness/error warnings
- Escaped database content
- `no-store`, restrictive CSP, frame denial, MIME-sniffing prevention, and no-referrer policy
- Runbook requires Cloudflare Access in front of application auth for production defense in depth

## 2. Local verification evidence

All checks below were executed without production credentials or resources.

| Check | Result |
|---|---|
| Operations Vitest suite | 56/56 passed across 15 files |
| Operations production TypeScript | Passed |
| Operations test TypeScript | Passed |
| Wrangler generated-type consistency | Passed with `--include-env false --check`; handwritten `Env` owns dynamic bindings |
| Wrangler deployment dry run | Passed; 55.64 KiB upload, 13.96 KiB gzip; collector binding defaults to `false` |
| D1 migrations against local database | `0001`, `0002`, and `0003` applied successfully |
| Storefront analytics and emitted-artifact verification tests | 8/8 passed |
| Astro check | 0 errors, 0 warnings, 1 existing inline external-script hint |
| Astro static production build | Blocked across five production attempts, including three against the final source, by upstream Shopify `429` for `clothing-1`; each build exhausted the existing three bounded fetch attempts during sitemap generation after source compilation passed |
| Configured collector source/runtime/CI gate | Passed focused tests and source review; only `https://operations.shopandson.com/v1/events` is accepted. Final artifact assertion remains blocked on the red production build |
| Notification relay tests | 4/4 passed |
| Python bytecode compilation | Passed |
| LaunchAgent plist validation | Passed |
| `git diff --check` | Passed |
| Independent production/security review | Final frozen storefront source review found no privacy, security, or production-correctness blocker; artifact/build approval remains blocked on Shopify `429` |
| Secret-pattern scan | No credential-like values found in new source/configuration |
| Dynamic SQL/eval/unsafe-HTML scan | No findings in Operations source |
| Operations `npm audit` | 0 advisories |
| Storefront `npm audit` | 0 critical, 0 high, 0 moderate; 2 linked low entries |

The complete Operations verification was rerun after resolving the collector accounting/body-limit, probe-contract, relay-journal, ordered-cohort, analytics-query, and duplicate-Cron findings. The storefront privacy contract and production-host pinning findings are resolved in source, tests, and independent review; final candidate approval remains blocked on a green live-data build and complete artifact inspection.

## 3. Security assessment

### Passed controls

- No real token, password, account credential, or private key is committed
- The production D1 UUID is committed as a non-secret resource identifier; possession of it alone grants no access
- Constant-time bearer and Basic credential comparisons
- Parameterized D1 statements
- Exact collector origins and narrow CORS response; collection is disabled by default until edge protection is verified
- Exact event-field allowlist
- PII-like unknown fields rejected
- Bounded bodies, fields, timestamps, details, queue reads, dashboard history, and relay responses
- Strict dashboard cache/security headers
- Database-originated dashboard content escaped
- External fetches use timeouts and bounded persisted errors
- Cloudflare/Shopify errors do not log tokens or persist raw responses
- Notification ack retry cannot duplicate delivery timestamp mutation
- `.dev.vars`, local Wrangler state, D1 exports, and Python bytecode ignored
- Production dashboard is protected by verified Cloudflare Access plus application Basic auth. The Free plan provides only one WAF rate-limit rule, assigned to the public collector; a dashboard WAF rule would require a paid-plan change.
- Public collector requires a separate edge rate limit because browser Origin/CORS is not authentication

### Dependency assessment

A safe Astro 6 lockfile update removed all four moderate YAML/language-server advisories. The two remaining low entries represent one transitive esbuild advisory affecting a local Windows development server. Production is a static build, local development here is macOS, and npm requires a breaking Astro 7 upgrade for remediation. Do not run `npm audit fix --force`; handle Astro 7 as a separate migration.

## 4. Not yet verified

These require a corrected external value, explicit production changes, or a successful upstream build window. The collector edge rate limit is verified; the unavailable second dashboard rule remains a documented Free-plan limitation.

- Controlled duplicate-delivery exercise of the active Cron; code-level same-timestamp idempotency is covered and deployed
- Authenticated dashboard use after the verified Access redirect
- Live storefront event receipt
- Production storefront publish and regression check
- Continued production Cloudflare freshness
- A green storefront static build after Shopify's current catalog `429` window clears

## 5. One minimum credential and permission checklist

Do **not** paste credential values into chat, documentation, commits, screenshots, or command arguments. Configure secrets only through Wrangler's interactive secret prompt or macOS Keychain. Report completion/status, never the value.

### A. Required for the first real integration test

| Item | Minimum access | Where to obtain it | Read-only or production-modifying | Why required |
|---|---|---|---|---|
| Cloudflare deployment authentication | Custom token scoped to the intended account with **Workers Scripts: Edit** and **D1: Edit**, or an explicitly approved Wrangler OAuth session with equivalent access | Cloudflare Dashboard → My Profile → API Tokens → Create Custom Token; authenticate Wrangler with the chosen method | **Can modify production.** Can create/update Worker versions, Cron configuration, and D1 resources | Required to create D1, apply remote migrations, upload undeployed versions, configure version secrets, and activate a deployment |
| Cloudflare Analytics runtime token | **Zone → Analytics → Read** only, scoped to `shopandson.com`; do not substitute **Account → Account Analytics → Read** | Cloudflare Dashboard → My Profile → API Tokens → Create Custom Token | **Read-only** zone analytics access | Grants the exact `com.cloudflare.api.account.zone.analytics.read` permission required by the daily zone GraphQL query without configuration/write authority |
| Cloudflare zone ID | No permission; identifier only | Cloudflare Dashboard → `shopandson.com` zone → Overview → Zone ID | **Not a credential; cannot modify anything by itself** | Selects the exact zone in the GraphQL query |
| Shopify client ID and client secret | Dev Dashboard API-only app with **`read_reports` only** and Shopify's required Level 2 protected-customer-data approval. Do not add `read_orders`, customer-write, product-write, or browser scopes | Shopify Dev Dashboard → Apps → Create app → Start from Dev Dashboard → release a version with `read_reports` → install it on the Shop & Sons store → Settings | **Read-only** reporting access when limited to `read_reports`; the Worker exchanges these credentials for a 24-hour token and does not persist it | Supplies authoritative aggregate sales/orders/discounts/reversals/units through ShopifyQL using Shopify's current client-credentials flow |
| Shopify permanent shop domain | No permission; `*.myshopify.com` identifier only | Shopify Admin → Settings → Domains | **Not a credential** | Builds the versioned Admin GraphQL endpoint safely |
| Dashboard username and generated password | One unique operator username and at least 32 random bytes/characters of generated password material | Generate locally with a password manager; do not reuse an account password | Dashboard credential is **read-only in application behavior**, but grants access to private operational/sales data | Protects server-rendered dashboard behind Cloudflare Access |
| Notification API token | At least 32 random bytes generated locally | Generate locally with a password manager; store the Worker copy through interactive `wrangler versions secret put` and the Mac copy in Keychain | **Can modify limited production state:** reads pending messages and marks notifications delivered; cannot change incidents, storefront, Shopify, or Cloudflare configuration | Authenticates the local polling/acknowledgement relay |

### B. Required configuration permissions and identifiers

| Item | Minimum access or value | Where to obtain/configure it | Read-only or production-modifying |
|---|---|---|---|
| D1 database ID | Identifier returned by `wrangler d1 create`; no independent permission | Wrangler output after approved creation | **Identifier only**; creation and migration modify production |
| Deployed Worker HTTPS origin | Identifier returned after activation | Wrangler/Cloudflare Workers deployment output | **Identifier only** |
| Cloudflare Access application/policy authority | Account role or narrowly scoped token allowed to edit Access applications and policies; restrict `/dashboard*` to Beckett's approved identity | Cloudflare Zero Trust Dashboard → Access → Applications, or My Profile → API Tokens when token management is used | **Production-modifying** access policy |
| Edge rate-limit authority | Zone-scoped WAF/ruleset edit permission sufficient to create measured rules for dashboard auth attempts and `POST /v1/events` | Cloudflare Dashboard → `shopandson.com` → Security/WAF → Rate limiting rules, or a narrowly scoped API token | **Production-modifying** traffic/security policy |
| Optional custom-hostname/route authority | Workers Routes edit and DNS edit only if the generated `workers.dev` hostname cannot be protected by the approved edge rule | Cloudflare zone/Workers route settings or a zone-scoped API token | **Production-modifying**; not required when `workers.dev` can be protected directly |
| GitHub Actions repository-variable authority | Repository permission sufficient to set `PUBLIC_OPERATIONS_EVENTS_URL` | GitHub repository → Settings → Secrets and variables → Actions → Variables | **Production build configuration**; publishing the resulting storefront is separately gated |
| macOS Keychain and Shortcuts access | Beckett's local macOS user plus a visually selected recipient | Password manager/Keychain Access and the Shortcuts app | **Local production integration**; Shortcut testing can send a real iMessage and acknowledgement changes limited notification state |

### C. Explicitly not required

- Shopify customer-write or order-write scopes
- Shopify `read_orders` when `read_reports`/ShopifyQL is available
- Browser-side Shopify Admin credentials
- Cloudflare DNS edit permission
- Workers route or DNS edit permission only when the approved edge rule requires a custom hostname/zone route; otherwise it is not required
- Modification of the existing now-playing/newsletter Worker
- Webhooks for daily aggregate sales
- Customer Events/Web Pixels for the currently implemented pre-checkout funnel

## 6. Approved-order deployment procedure

Routine reversible production work was authorized on 2026-07-16. The remaining manual gates are collection enablement, storefront publication, push/merge, and unexpected destructive or materially permission-expanding changes.

1. **Completed:** keep collection disabled; confirm D1, custom domain, migrations, eight secret bindings, disabled developer URLs, and committed version provenance.
2. **Completed:** configure Access for `/dashboard*` and apply the Free plan's one available rule to `POST /v1/events`; retain application Basic auth because a second dashboard WAF rule is unavailable.
3. **Completed:** verify the public boundary, five-minute Cron, four healthy targets, Shopify authentication/aggregation, Shortcut recipient test, Keychain item, and authenticated notification polling.
4. **Completed:** activate the inspected `Zone → Analytics → Read` version and verify the 22:00 UTC scheduled aggregate write clears `last_error`, populates `last_success_at`, and writes six Cloudflare rows.
5. **Completed:** acknowledge six stale rollout notifications without delivering false alarms, preserve all rows, install the LaunchAgent from an Application Support relay copy, and verify two clean empty-queue runs.
6. **Completed:** run the approved synthetic delivery drill without taking a real service offline. Beckett confirmed exactly one opening and one recovery iMessage; retain incident 4 and notifications 7–8, remove only generated synthetic probe/state rows, and verify zero pending notifications/open incidents.
7. **Source complete:** pin the storefront collector to `operations.shopandson.com` and use a page-lifetime anonymous in-memory UUID when session storage is denied, documenting reload overcounting. A green static build and final review remain required.
8. Enable collection in a new version only after all protections pass; verify preflight and edge limiting.
9. Set the storefront collector variable, rebuild, preview, and inspect the exact artifact.
10. Publish storefront instrumentation only under separate explicit approval, then verify safe event receipt, aggregate freshness, dashboard values, logs, and no duplicate alerts.

Exact commands and stop/report-back points are in `operations/README.md`.

## 7. Rollback

- **Worker:** before any next version activation, retain current contained version `5b415f2a-5f4b-4603-a7fa-fb8a490c4304` as the immediate rollback. Prior contained versions `42828ca3-64f8-4363-b9bc-dbe948e25403` and `3b2f9e22-3037-40b6-907f-a2573bd7087a`, plus secret-free bootstrap `95f0abfe-37a3-48ec-b60c-64dcee166b67`, remain deeper collection-disabled fallbacks. Preserve D1 unless schema caused the incident.
- **Cron:** disable the Operations Worker's Cron trigger if scheduled execution is harmful.
- **Storefront:** unset `PUBLIC_OPERATIONS_EVENTS_URL` and rebuild; the analytics adapter becomes a no-op without changing commerce.
- **Notifications:** unload the LaunchAgent; queued alerts remain in D1.
- **Schema:** prefer reviewed forward fixes. Before remote migrations, export D1. Restore a verified full export only into a separate empty recovery database; validate it before reviewing a Worker binding switch. Never import a full export over the populated source database.

## 8. Known limitations

- Shopify and Cloudflare production integrations are authenticated and writing aggregates. Cloudflare currently has six rows covering 2026-07-10 through 2026-07-15. The Worker remains collection-disabled and fail-closed for private routes.
- Cloudflare analytics fields remain plan/schema dependent; the currently requested `httpRequests1dGroups` fields succeeded with the zone-scoped read token.
- Cloudflare unique values are unique IP estimates, not people. The dashboard labels the sum as a daily unique-IP total; it is not a distinct-period visitor count.
- Funnel dates use UTC event dates; Shopify reporting is explicitly `America/New_York`. Cross-source daily boundaries are therefore not identical.
- Browser Origin/CORS does not stop non-browser abuse; the edge collector rate limit is a production prerequisite.
- The Mac relay is not the monitor or source of truth. If the Mac is offline, D1 retains pending alerts, but delivery waits for the relay to resume.
- Basic auth sits behind verified Cloudflare Access. A dashboard WAF rate limit is unavailable on the current Free plan; the public collector receives the plan's single rule because it accepts unauthenticated browser telemetry.
- Astro cannot observe Shopify-hosted checkout progression or payment completion. `checkout_begin` records departure intent; Shopify Admin aggregates remain purchase truth.
- Customer Events/Web Pixels would be required for hosted-checkout step telemetry and are not part of this implementation.
- Raw probes and funnel events retain 90 days; daily aggregates remain until a later reviewed aggregate-retention policy is introduced.
- A breaking Astro 7 migration remains the only available fix for the low Windows development-server advisory.
- Storefront catalog/sitemap builds depend on Shopify availability. Five production attempts—including three against the final source—each exhausted the unchanged three-attempt Shopify retry policy with `429` while generating the sitemap; the build remains red.

## 9. Final gate

The frozen-source independent review is complete with no blocker. The next necessary gate is a green production build after Shopify's `429` window clears, followed by complete artifact inspection. Only then may the separately inspected collection-enabled Worker version be considered. Push/merge and storefront publication remain separate gates.
