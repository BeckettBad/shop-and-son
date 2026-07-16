# Shop & Sons Operations — Production Readiness Report

**Assessment date:** 2026-07-16
**Branch:** `dev`
**Disposition:** Contained production integration is active. D1, the secret-bearing Worker, `operations.shopandson.com`, dashboard Access, the Free-plan collector rate limit, and the five-minute Cron exist with collection disabled. Health is healthy; Shopify authentication is valid but awaits deployment of the current metric correction, and Cloudflare Analytics is blocked by an invalid runtime token. LaunchAgent delivery, collection enablement, and storefront publication remain gated.

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
- Storefront adapter is production-configured only and otherwise a no-op
- Storefront adapter currently falls back to an in-memory session UUID when browser session storage is unavailable; this contract must be explicitly accepted or changed to fail closed before publication
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
| Operations Vitest suite | 55/55 passed across 15 files |
| Operations production TypeScript | Passed |
| Operations test TypeScript | Passed |
| Wrangler generated-type consistency | Passed with `--include-env false --check`; handwritten `Env` owns dynamic bindings |
| Wrangler deployment dry run | Passed; 55.38 KiB upload, 13.94 KiB gzip; collector binding defaults to `false` |
| D1 migrations against local database | `0001`, `0002`, and `0003` applied successfully |
| Storefront analytics tests | 4/4 passed |
| Astro check | 0 errors, 0 warnings, 1 existing inline external-script hint |
| Astro static production build | Passed; 3 pages including sitemap |
| Configured collector build assertion | Passed; exact HTTPS `/v1/events` URL embedded in generated analytics bundle |
| Notification relay tests | 4/4 passed |
| Python bytecode compilation | Passed |
| LaunchAgent plist validation | Passed |
| `git diff --check` | Passed |
| Independent production/security review | Duplicate-Cron health accounting and reproducibility blockers found; duplicate-tick execution is fixed with lease idempotency and bounded retention, while this scoped commit resolves source reproducibility |
| Secret-pattern scan | No credential-like values found in new source/configuration |
| Dynamic SQL/eval/unsafe-HTML scan | No findings in Operations source |
| Operations `npm audit` | 0 advisories |
| Storefront `npm audit` | 0 critical, 0 high, 0 moderate; 2 linked low entries |

The complete Operations verification was rerun after resolving the collector accounting/body-limit, probe-contract, relay-journal, ordered-cohort, analytics-query, and duplicate-Cron findings. Storefront publication remains blocked on the separately documented privacy-contract and production-host pinning findings.

## 3. Security assessment

### Passed controls

- No real token, password, database ID, account ID, or private key is committed
- Placeholder D1 ID only
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

These require real external values or explicit production changes:

- Authenticated Cloudflare Analytics query after private replacement of the rejected runtime token
- Production zone availability of every requested `httpRequests1dGroups` field
- Successful ShopifyQL scheduled run using current `net_items_sold`; client-credentials exchange and `read_reports` are verified
- Deployment of the exact reviewed/committed corrective Worker candidate
- Duplicate-delivery behavior of the active Cron after deployment of tick idempotency
- Authenticated dashboard use after the verified Access redirect
- Collector edge rate limit is verified; the unavailable second dashboard rule is a documented Free-plan limitation
- LaunchAgent polling and real incident/recovery delivery; authenticated polling and one harmless iMessage test are verified
- Live storefront event receipt
- Production storefront publish and regression check
- Production logs, freshness, and alert drill

## 5. One minimum credential and permission checklist

Do **not** paste credential values into chat, documentation, commits, screenshots, or command arguments. Configure secrets only through Wrangler's interactive secret prompt or macOS Keychain. Report completion/status, never the value.

### A. Required for the first real integration test

| Item | Minimum access | Where to obtain it | Read-only or production-modifying | Why required |
|---|---|---|---|---|
| Cloudflare deployment authentication | Custom token scoped to the intended account with **Workers Scripts: Edit** and **D1: Edit**, or an explicitly approved Wrangler OAuth session with equivalent access | Cloudflare Dashboard → My Profile → API Tokens → Create Custom Token; authenticate Wrangler with the chosen method | **Can modify production.** Can create/update Worker versions, Cron configuration, and D1 resources | Required to create D1, apply remote migrations, upload undeployed versions, configure version secrets, and activate a deployment |
| Cloudflare Analytics runtime token | **Account Analytics: Read** only, scoped to the intended account and the Shop & Sons zone/resource where Cloudflare permits resource scoping | Cloudflare Dashboard → My Profile → API Tokens → Create Custom Token | **Read-only** analytics access | Allows the deployed Worker to query daily zone traffic without configuration/write authority |
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

Routine reversible production work was authorized on 2026-07-16. The remaining manual gates are secret entry, Shopify permission, Access identity, iMessage recipient/testing, storefront publication, push/merge, and unexpected destructive or materially permission-expanding changes.

1. Keep collection disabled and confirm the existing D1/bootstrap/custom-domain baseline.
2. **Completed:** configure Access for `/dashboard*` and apply the Free plan's one available rule to `POST /v1/events`; retain application Basic auth because a second dashboard WAF rule is unavailable.
3. Configure all eight values interactively with `wrangler versions secret put`; never use plain `wrangler secret put`, which deploys immediately.
4. Inspect and activate the exact final secret-bearing version at 100%.
5. Verify public health, Access interception before Basic auth, collector `503 collection_disabled`, and notification API denial.
6. Run authenticated Cloudflare and Shopify integration checks.
7. Add and apply the five-minute Cron separately through `wrangler triggers deploy`; verify scheduled D1 state.
8. Configure and manually test the Shortcut relay with a harmless approved recipient/message.
9. Run a controlled incident opening/recovery drill without taking a real service offline.
10. Enable collection in a new version only after all protections pass; verify preflight and edge limiting.
11. Set the storefront collector URL, rebuild, preview, and inspect the diff.
12. Publish storefront instrumentation only under separate explicit approval.
13. Verify safe event receipt, aggregate freshness, dashboard values, logs, and no duplicate alerts.

Exact commands and stop/report-back points are in `operations/README.md`.

## 7. Rollback

- **Worker:** roll back to the last known-good Cloudflare deployment/version; preserve D1 unless schema caused the incident.
- **Cron:** disable the Operations Worker's Cron trigger if scheduled execution is harmful.
- **Storefront:** unset `PUBLIC_OPERATIONS_EVENTS_URL` and rebuild; the analytics adapter becomes a no-op without changing commerce.
- **Notifications:** unload the LaunchAgent; queued alerts remain in D1.
- **Schema:** prefer reviewed forward fixes. Before remote migrations, export D1. Restore a verified full export only into a separate empty recovery database; validate it before reviewing a Worker binding switch. Never import a full export over the populated source database.

## 8. Known limitations

- No production integration has been authenticated yet; the reachable Worker remains collection-disabled and fail-closed for private routes.
- Cloudflare analytics fields are plan/schema dependent; production settings must be checked.
- Cloudflare unique values are unique IP estimates, not people. The dashboard labels the sum as a daily unique-IP total; it is not a distinct-period visitor count.
- Funnel dates use UTC event dates; Shopify reporting is explicitly `America/New_York`. Cross-source daily boundaries are therefore not identical.
- Browser Origin/CORS does not stop non-browser abuse; the edge collector rate limit is a production prerequisite.
- The Mac relay is not the monitor or source of truth. If the Mac is offline, D1 retains pending alerts, but delivery waits for the relay to resume.
- Basic auth sits behind verified Cloudflare Access. A dashboard WAF rate limit is unavailable on the current Free plan; the public collector receives the plan's single rule because it accepts unauthenticated browser telemetry.
- Astro cannot observe Shopify-hosted checkout progression or payment completion. `checkout_begin` records departure intent; Shopify Admin aggregates remain purchase truth.
- Customer Events/Web Pixels would be required for hosted-checkout step telemetry and are not part of this implementation.
- Raw probes and funnel events retain 90 days; daily aggregates remain until a later reviewed aggregate-retention policy is introduced.
- A breaking Astro 7 migration remains the only available fix for the low Windows development-server advisory.
- Storefront catalog/sitemap builds depend on Shopify availability and can still encounter upstream `429` responses, although the latest verified builds succeeded.

## 9. Final gate

The next necessary phase is the remaining manual gate: create the read-only Cloudflare Analytics token and least-privilege Shopify reporting app, enter all eight Worker values privately, and confirm the intended iMessage recipient. Access and the plan-available collector rule are verified. Collection, Cron, notification delivery, and storefront publication stay disabled until their remaining prerequisites are verified.
