# Shop & Sons Operations

Local-first Cloudflare Worker for Shop & Sons uptime, privacy-minimized storefront funnel analytics, daily Cloudflare traffic, aggregate Shopify sales, incident notifications, and a private dashboard.

| Field | Value |
|---|---|
| Type | Durable operational system inside the existing repository |
| Status | Contained production integration; custom domain, eight secret bindings, and five-minute Cron live with collection disabled |
| Owner | Beckett Badertscher |
| Repository | Containing `Shop & Sons` repository; active branch `dev` |

## Scope and sources of truth

- **In scope:** the separate Operations Worker/D1, health and incidents, aggregate integrations, private dashboard, notification relay, and the privacy-minimized storefront telemetry contract.
- **Out of scope:** redesigning the storefront, modifying the existing now-playing Worker, raw customer/order analytics, and storefront publication without final approval.
- **Durable direction and runbook:** this `README.md`.
- **Agent execution rules:** `AGENTS.md`.
- **Current status, blockers, verification, and handoff:** `STATE.md`.
- **Readiness evidence and minimum permissions:** `PRODUCTION-READINESS.md`.
- **Executable behavior:** source, migrations, configuration, and tests in this directory plus the explicitly documented homepage integration files.

Completion of the local phase requires all documented local checks to pass, independent review to have no blocking security or logic finding, and `STATE.md` to record the result. Production completion additionally requires Beckett-approved deployment, authenticated integration checks, alert drill, rollback verification, and storefront publication validation.

> **Production safety:** D1, the committed secret-bearing Worker, `operations.shopandson.com`, dashboard Access policy, collector edge rate limit, five-minute Cron, and notification LaunchAgent are live. Collection and storefront telemetry remain disabled until the ordered gates below pass. `wrangler deploy --dry-run` is safe and does not deploy.

## Architecture

- `src/probes.ts` checks `https://shopandson.com/`, the existing now-playing Worker's `/now`, and `/status`.
- `src/incidents.ts` opens an incident after two consecutive failures and recovers it after one success.
- `src/events.ts` accepts allowlisted, anonymous storefront events from the two Shop & Sons origins.
- `src/cloudflare-analytics.ts` reads daily `httpRequests1dGroups` aggregates.
- `src/shopify-analytics.ts` reads aggregate ShopifyQL `sales` rows; it never requests raw orders or customers.
- `src/dashboard.ts` renders a private, no-client-JavaScript dashboard at `/dashboard`. Funnel conversion uses ordered session cohorts: product view, then cart, then checkout, with every counted stage inside the selected reporting window.
- `scripts/notification_relay.py` polls pending alerts on a Mac and invokes a Shortcut; it acknowledges only successful deliveries.
- `AGENTS.md` and `STATE.md` define local operating rules and the durable handoff.
- D1 migrations live in `migrations/`. Raw funnel events, health probes, and delivered notifications have 90-day retention; daily aggregates remain.

The Worker runs every five minutes. Health checks run every tick. Cloudflare sync, Shopify sync, funnel rollup, reminders, and retention run once per UTC date using leased D1 job claims. Failed jobs remove their claim, and abandoned incomplete claims become retryable after the lease expires.

## Privacy boundary

The event collector stores only:

- Random per-tab/session UUID
- Random event UUID
- Event timestamp and allowlisted event name
- Fixed logical page kind
- Public product handle when applicable
- Bounded quantities/counts
- Optional fixed campaign identifier

It rejects unknown fields. It does **not** store IP addresses, user agents, fingerprints, email addresses/domains, search text, referrers, query strings, full URLs, Shopify cart IDs, checkout URLs, line IDs, variant IDs/GIDs, customer/order payloads, or raw upstream API responses.

Cloudflare `unique_ips` means daily unique IPs, not people. Daily unique-IP values are not additive into a monthly distinct visitor count.

## Local verification

Requires Node 22 and Python 3. Run from this directory:

```sh
npm ci
npm test
npm run typecheck
npm run cf-typegen -- --check
npm run deploy:dry
python3 -m unittest discover -s scripts/tests -v
```

Apply migrations to a local D1 database through Wrangler when doing manual local testing:

```sh
npx wrangler d1 migrations apply shop-and-son-operations --local
```

Storefront verification from `../homepage`:

```sh
npm ci
npm test
npm run astro check
npm run build
```

The storefront analytics adapter is a no-op unless `PUBLIC_OPERATIONS_EVENTS_URL` equals `https://operations.shopandson.com/v1/events` exactly.

## Runtime bindings

D1 binding:

- `DB`

Plain-text runtime configuration:

- `EVENT_COLLECTION_ENABLED` — committed as `false`; set to `true` only in a deployment made after edge protection is active

Worker secrets or secret-valued bindings:

- `CLOUDFLARE_ANALYTICS_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `DASHBOARD_USERNAME`
- `DASHBOARD_PASSWORD`
- `NOTIFICATION_API_TOKEN`
- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_SHOP_DOMAIN`

`CLOUDFLARE_ZONE_ID`, `SHOPIFY_CLIENT_ID`, and `SHOPIFY_SHOP_DOMAIN` are identifiers rather than passwords, but they are kept out of the repository so the deployment has one explicit configuration path. The Worker exchanges Shopify client credentials for a short-lived access token on each daily sync; it does not persist that token. Never put real values in `wrangler.jsonc`, `.dev.vars`, shell history, logs, screenshots, or commits.

## Production rollout

Beckett authorized routine, reversible production completion on 2026-07-16. The remaining manual gates are collection enablement, storefront publication, push/merge, and unexpected destructive or permission-expanding changes.

### Current production baseline

- D1 `shop-and-son-operations` exists under binding `DB`; migrations `0001`–`0003` are applied.
- Version `5b415f2a-5f4b-4603-a7fa-fb8a490c4304` is deployed at 100% with all eight secret bindings and collection disabled. Its immutable script ETag matches the prior version mapped to local commit `f8d5cb1`.
- `operations.shopandson.com` is the only Worker target. Standard and preview `workers.dev` URLs are disabled.
- `/health` returns the versioned service contract; Access redirects `/dashboard` to the approved identity login; `/v1/events` returns `503 collection_disabled`; notification APIs return 401.
- The collector edge rule allows 20 `POST /v1/events` requests per 10 seconds per IP and blocks for 10 seconds. It was verified with 429 responses and post-block recovery. The Free plan supplies one rule, so the dashboard relies on Access plus application Basic auth rather than a second WAF rule.
- The five-minute Cron is active and all four health targets are healthy. Shopify production aggregation has 90 daily rows. The corrected `Zone → Analytics → Read` token succeeded at 22:00 UTC: `last_error` is clear, `last_success_at` is populated, and Cloudflare has six rows covering 2026-07-10 through 2026-07-15.
- The six recovered rollout notifications were acknowledged without sending and all rows were preserved. The approved Shortcut and Keychain token are configured. The LaunchAgent uses an installed mode-700 relay copy under `~/Library/Application Support/ShopAndSonOperations/`; repeated runs exit 0 with clean logs. The approved delivery drill produced exactly one confirmed opening and one confirmed recovery iMessage; incident 4 and notifications 7–8 are retained, synthetic probe/state rows were removed, and the queue is empty.
- The frozen storefront source accepts only `https://operations.shopandson.com/v1/events`. If session storage is unavailable or denied, it uses one anonymous in-memory UUID for the current page instance only, with no fingerprint or alternate persistence; reloads can therefore be counted as separate sessions. Tests and Astro check pass, but the final production build remains blocked after five bounded attempts—including three against the final source—exhausted Shopify `429` responses during sitemap generation.

### Remaining ordered rollout

1. Verify Wrangler is still authenticated to the intended Cloudflare account:

   ```sh
   npx wrangler whoami
   ```

2. Confirm the remote schema remains current before any deployment. Create an encrypted export before every future migration after production data exists:

   ```sh
   npx wrangler d1 migrations list shop-and-son-operations --remote
   npx wrangler d1 migrations apply shop-and-son-operations --remote
   ```

3. Re-run the dry run and review bindings, routes, and bundle size:

   ```sh
   npm run deploy:dry
   ```

4. **Completed:** Access protects `operations.shopandson.com/dashboard*` for Beckett's confirmed identity. The Free plan's single available WAF rule protects `POST /v1/events` at 20 requests per 10 seconds per IP with a 10-second block. Access plus Basic auth protect the dashboard; enabling a second WAF rule would require a separately approved paid-plan change.

5. **Completed:** create a token with only `Zone → Analytics → Read`, restricted to `shopandson.com`, then replace only the Cloudflare Analytics runtime token interactively in an undeployed version. Do not use `Account → Account Analytics → Read`; it does not grant the zone GraphQL permission `com.cloudflare.api.account.zone.analytics.read`. Use `versions secret put`, not `secret put`: plain `wrangler secret put` deploys immediately. Wrangler reads the value from its hidden prompt; do not append it to the command:

   ```sh
   npx wrangler versions secret put CLOUDFLARE_ANALYTICS_TOKEN
   ```

6. **Completed:** list versions, record the newly produced version ID, and inspect it. Before activation, stop unless inspection proves its immutable script ETag matches the current version mapped to source revision `f8d5cb1`, and it retains all eight secret binding names, D1 binding `DB`, the sole `operations.shopandson.com` custom domain, the sole `*/5 * * * *` Cron, and `EVENT_COLLECTION_ENABLED="false"`. Record names and identifiers, never secret values:

   ```sh
   npx wrangler versions list
   npx wrangler versions view <FINAL_VERSION_ID>
   ```

7. **Completed:** activate that exact secret-bearing version at 100%. This does not create Cron; current Wrangler applies routes/domains and Cron separately:

   ```sh
   npx wrangler versions deploy <FINAL_VERSION_ID>@100%
   ```

8. **Completed:** verify `/health`; verify `/dashboard` is intercepted by Access before application Basic auth; verify `/v1/events` returns `503 collection_disabled`; verify the notification API rejects missing/wrong tokens. Do not enter credentials on any non-HTTPS origin.

9. **Completed:** after activating the inspected token version, stop unless the next Cron clears `cloudflare_analytics.last_error` and writes `daily_cloudflare_metrics`. The 22:00 UTC run succeeded and wrote six rows. The Cron is already active; do not recreate it.

10. Enable collection only after Access, the collector edge rule, integrations, Cron, and notification protection succeed. This creates a new Worker version and deployment:

    ```sh
    npm run deploy:dry
    npx wrangler versions upload --var EVENT_COLLECTION_ENABLED:true --message "enable edge-protected event collection"
    npx wrangler versions deploy <COLLECTION_VERSION_ID>@100%
    ```

    Verify an approved storefront-origin preflight reaches the collector and an edge-rate-limit test is enforced. If either check fails, redeploy the committed configuration (`EVENT_COLLECTION_ENABLED=false`) immediately.

11. Configure the storefront build variable:

    ```text
    PUBLIC_OPERATIONS_EVENTS_URL=https://operations.shopandson.com/v1/events
    ```

    Rebuild and preview the storefront before any production publish. Publishing the storefront remains a separate explicit approval.

## Dashboard

- URL: `https://<operations-worker-host>/dashboard`
- Windows: 7, 30, or 90 days
- Authentication: HTTPS Basic auth using `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`
- Defense in depth: Cloudflare Access should be required in production
- Responses use `no-store`, deny framing, disable MIME sniffing, suppress referrers, and use a restrictive CSP
- Database-originated text is HTML-escaped

Use a generated high-entropy dashboard password, not a reused personal password.

## macOS Shortcut alert delivery

Do this only after the Worker exists and the alert API has been verified.

1. Open **Shortcuts** on the always-on Mac.
2. Create a Shortcut named exactly **Shop and Sons Operations Alert**.
3. Configure it to accept **Text** input from anywhere.
4. Add **Send Message**.
5. Set the message body to **Shortcut Input**.
6. Select only Beckett's intended iMessage recipient. This step can send real messages, so stop and visually verify the recipient before testing.
7. Disable **Show When Run** if the Mac should deliver unattended.
8. Run this harmless local test and confirm the correct recipient receives it:

   ```sh
   printf 'Shop & Sons operations relay test' | shortcuts run 'Shop and Sons Operations Alert' -i -
   ```

9. Save the notification API token in Keychain without placing it in shell history. The command prompts securely:

   ```sh
   security add-generic-password \
     -s shop-and-son-operations \
     -a notification-api-token \
     -w
   ```

10. Install a private executable copy outside `~/Desktop`; macOS TCC can deny LaunchAgents access to Desktop-hosted scripts even when manual execution succeeds:

    ```sh
    install -d -m 700 "$HOME/Library/Application Support/ShopAndSonOperations"
    install -m 700 scripts/notification_relay.py \
      "$HOME/Library/Application Support/ShopAndSonOperations/notification_relay.py"
    ```

11. Copy `templates/com.shopandson.operations-notifications.plist` to a temporary path. Replace `REPLACE_WITH_INSTALLED_RELAY_PATH` with the absolute Application Support path above and replace only the Worker host placeholder.
12. Validate it:

    ```sh
    plutil -lint /path/to/com.shopandson.operations-notifications.plist
    ```

13. Test the relay once manually:

    ```sh
    /usr/bin/python3 \
      "$HOME/Library/Application Support/ShopAndSonOperations/notification_relay.py" \
      --base-url https://<operations-worker-host>
    ```

14. Only after that succeeds, install and start the LaunchAgent:

    ```sh
    cp /path/to/com.shopandson.operations-notifications.plist \
      ~/Library/LaunchAgents/com.shopandson.operations-notifications.plist
    launchctl bootstrap gui/$(id -u) \
      ~/Library/LaunchAgents/com.shopandson.operations-notifications.plist
    ```

15. Report back the manual relay exit status and whether exactly one message arrived. Do not proceed to a real failure drill if either differs.

To stop it:

```sh
launchctl bootout gui/$(id -u) \
  ~/Library/LaunchAgents/com.shopandson.operations-notifications.plist
```

## Alert drill

A real drill can send iMessages and write production D1 records. Run it only after explicit approval.

1. Verify the recipient and LaunchAgent.
2. Use a dedicated, documented test path or a temporary injected failing probe; do not take the storefront or now-playing Worker offline.
3. Produce two consecutive failed checks to open one incident.
4. Confirm exactly one opening message.
5. Restore the test probe and run one successful check.
6. Confirm exactly one recovery message.
7. Confirm `/dashboard` shows no open test incident.
8. Remove all temporary test configuration. Do not delete retained audit rows manually.

Production drill completed 2026-07-16: approved synthetic incident 4 produced opening notification 7 and recovery notification 8. Beckett confirmed exactly one correct iMessage for each transition. Both notifications are acknowledged; the incident and notification rows remain as audit evidence; only generated synthetic probe/state rows were removed. Final state: zero pending notifications and zero open incidents.

## Backups and restore

D1 exports contain anonymous session/event IDs and operational history. Store them encrypted with restricted access.

Create a timestamped backup before migrations or risky changes:

```sh
mkdir -p backups
npx wrangler d1 export shop-and-son-operations --remote \
  --output "backups/operations-$(date -u +%Y%m%dT%H%M%SZ).sql"
```

`backups/` must remain untracked and must never be committed. Verify the file exists and is non-empty, then move it to approved encrypted storage.

Restore is production-modifying and potentially destructive. Never execute a full export against the populated source database: schema and row conflicts can leave a partial restore. Stop the Worker/Cron, obtain explicit approval, create a separate empty recovery D1 database, import the verified export there, validate schema and representative counts, and only then review a binding switch. Preserve the original database until recovery verification is complete.

Prefer forward-fix migrations. SQLite/D1 migrations are not automatically reversible.

## Rollback

### Worker code

1. Do not alter D1 first.
2. Identify the last known-good Worker version in Cloudflare deployment history.
3. Roll back through Cloudflare's version/deployment controls or redeploy the last known-good commit.
4. Verify `/health`, dashboard authentication, Cron status, and notification polling.
5. Preserve D1 unless the schema itself caused the incident.

### Storefront telemetry

1. Remove or unset `PUBLIC_OPERATIONS_EVENTS_URL` and rebuild. The adapter becomes a no-op without changing commerce behavior.
2. Preview the build.
3. Publish only with explicit approval.

### Schema

Do not hand-edit production tables. Restore from a verified pre-migration export only with explicit approval, or ship a reviewed forward migration.

## Troubleshooting

- **No events:** confirm the full HTTPS `/v1/events` build variable and that CSP `connect-src` contains its origin.
- **Collector 403:** only `https://shopandson.com` and `https://www.shopandson.com` are accepted.
- **Collector 400 for delayed events:** event timestamps must be no more than 24 hours old and no more than five minutes in the future.
- **Analytics stale:** inspect Integration freshness in the dashboard; upstream errors are truncated and do not include tokens or raw responses.
- **No alert:** run the relay manually, check the Keychain item, then inspect `/tmp/shopandson-operations-notifications.err`.
- **Repeated alert:** acknowledgement occurs only after Shortcut success. Verify the Shortcut exits zero and the ack endpoint is reachable.
- **Shopify empty:** verify `read_reports`, protected-customer-data approval, reporting timezone/currency, and ShopifyQL parse errors.
- **Cloudflare query error:** use the zone's GraphQL `settings.httpRequests1dGroups` to confirm field availability for the current plan.

## Known local dependency limitation

`npm audit` for the storefront reports one transitive low-severity advisory as two affected packages: Astro 6 depends on esbuild 0.27, whose development server can permit a local arbitrary-file read on Windows under specific conditions. Production is a static build hosted on GitHub Pages/Cloudflare, development here is on macOS, and there are no high, critical, or moderate advisories after the safe Astro 6 lockfile update. npm requires a breaking Astro 7 upgrade to remove the remaining low advisory; do that as a separate tested migration rather than using `npm audit fix --force` in this release.
