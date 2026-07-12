# Phase AM handoff — worker-backed newsletter (2026-07-12)

Verified against the repo and the deployed worker. Style: no em dashes.

## Status in one line
The Cloudflare Worker `/subscribe` endpoint is BUILT, DEPLOYED, and VERIFIED. Remaining: AM2 (point
the live site's subscribe box at it) and AM3 (drop the write scope off the public Storefront token).
The worker is NOT wired to the site yet, so no real customer signup path has changed.

## What AM1b / AM1c / AM1d changed (all in `worker/src/index.js`, on `dev`)
- AM1 `b2d6f3e`: added the initial `POST /subscribe` endpoint (upsert customer marketing consent),
  originally written for a permanent `SHOPIFY_ADMIN_TOKEN`.
- AM1b `8085016`: migrated Shopify auth to the CLIENT-CREDENTIALS grant (the permanent-token model
  is deprecated; new admin custom apps cannot be created). Removed all `SHOPIFY_ADMIN_TOKEN` use.
- AM1c `049cdfb`: handled the create-then-resubmit race. Shopify's customer SEARCH is eventually
  consistent, so a lookup right after a create can miss the record; the worker then re-creates and
  Shopify returns "taken". Fix: on a taken response, retry the lookup (findCustomerIdWithRetry,
  4 attempts x 800ms) and update consent.
- AM1d `08e5d90`: fixed an AM1c regression. AM1c had added `code` to the customerCreate
  `userErrors` selection, but `code` is ONLY on the Storefront API error type, not the ADMIN API
  (Admin customerCreate userErrors = field + message only). That invalid field made every create
  fail. AM1d removed `code`, detects "taken" by message (/taken/i), and logs the real Shopify
  GraphQL errors before throwing (so failures are diagnosable).

## Final Shopify authentication architecture
- App: a Dev Dashboard app ("Shop & Son Newsletter Worker") owned by the same org as the store,
  INSTALLED on the shop-and-son production store. Scope: `write_customers` (which IMPLIES
  `read_customers`; Shopify lists only the write scope, read access confirmed by a live query).
- Grant: client credentials. Worker POSTs `https://shop-and-son.myshopify.com/admin/oauth/access_token`
  with `grant_type=client_credentials`, `client_id`, `client_secret` -> returns a token valid 24h
  (`expires_in` 86399). Token is cached in-memory (`getShopifyAdminToken` / `shopifyTokenCache`,
  mirroring the Spotify `getAccessToken` pattern), used as the `X-Shopify-Access-Token` header for
  Admin GraphQL (`/admin/api/2025-01/graphql.json`). On a 401 the worker force-refreshes once and
  retries.
- Upsert logic: findCustomerId (search) -> if found, `customerEmailMarketingConsentUpdate`
  (SUBSCRIBED, SINGLE_OPT_IN); else `customerCreate` (SUBSCRIBED, SINGLE_OPT_IN); on create-taken,
  retry-lookup then update. Generic `{ok:true}` on success (no enumeration). Rate limit 5/hour per
  IP via `NOW_PLAYING_KV`. CORS for `https://shopandson.com` and `https://www.shopandson.com`,
  OPTIONS preflight -> 204.

## Worker + paths
- Worker name: `shop-and-son-now-playing` (the newsletter endpoint shares the existing worker).
- Endpoint: `POST https://shop-and-son-now-playing.shop-and-son.workers.dev/subscribe`.
- Source: `worker/src/index.js`. Config: `worker/wrangler.toml`. KV binding: `NOW_PLAYING_KV`
  (id 64e0dc44b8f1433aa3748a8385e207a1).
- Deploy: `cd worker && npx wrangler deploy`. This worker deploys via wrangler, NOT the GitHub
  Pages pipeline. Current deployed version at handoff: `8debc6f5-3f68-4068-8d72-6750fdd54263`.

## Secrets already configured (Cloudflare, values NOT here)
`wrangler secret list` on the worker shows: `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` (the AM
newsletter creds), plus the pre-existing now-playing secrets `SPOTIFY_CLIENT_SECRET`,
`SPOTIFY_REFRESH_TOKEN`, `TOGGLE_SECRET`. No further secret input is needed for AM2. To reset a
secret, the operator runs `wrangler secret put <NAME>` (interactive prompt).

## Tests that passed (live, against the deployed worker)
- New customer signup: 3 sequential distinct new emails -> all `{ok:true}` 200.
- Rapid double-submit of one new email -> both 200 (create-then-resubmit race retry works).
- Existing-customer update -> 200 (consent update path).
- CORS: allowed-origin OPTIONS -> 204 with `Access-Control-Allow-Origin: https://shopandson.com`;
  disallowed origin -> no allow-origin header.
- Wrong method GET -> 405. Invalid email -> 400 (and does NOT consume rate limit).
- Rate limit -> 429 at the 6th valid POST from one IP (5/hour).
- now-playing `/now` -> 200 (no regression). No token/secret in any response body; secrets absent
  from the deploy bindings list.

## Shopify throttling finding (not a bug)
Under CONCURRENT bursts (several truly-simultaneous POSTs, from testing), Shopify's Admin GraphQL
API throttles and the worker returns a transient 502. Real signups arrive sequentially and all
succeed. Optional future hardening: retry on a THROTTLED GraphQL error using the response's
throttle/cost extensions. Not required for launch.

## Test customers to DELETE in Shopify admin (Customers -> search `beckettnotbadertscher+`)
`+amtest`, `+amrace`, `+amdiag2`, `+seqa`, `+seqb`, `+seqc`, `+seqrace` @gmail.com, plus any
`+amfinal1` / `+amfinal2` / `+amdiag` that were created. (Some `+amfinal*` calls were throttled and
may not exist.)

## Remaining work
### AM2 (site repoint) — through the pipeline (dev -> main), operator merges
Point the subscribe box at the worker instead of calling Shopify directly.
- File: `homepage/public/scripts/base.js`. Today it POSTs a Storefront `customerCreate` mutation
  (grep finds 3 refs to `customerCreate` / `X-Shopify-Storefront-Access-Token`). Replace that call
  with a POST to the worker `/subscribe` sending `{ "email": "<email>" }`, expecting `{ok:true}`.
  Keep the exact same on-page UX (idle -> typing -> valid arrow -> neon check; failure = shake).
  Remove the throwaway-password / customerCreate logic.
- CSP: `homepage/src/layouts/Base.astro` `connect-src` already includes the worker origin (it is
  derived from `PUBLIC_NOW_PLAYING_URL`, same worker host). Confirm the subscribe fetch URL uses
  that same origin; likely NO CSP change needed. Verify in the built `dist/index.html`.
- Consider a small env var (e.g. `PUBLIC_SUBSCRIBE_URL`) or derive the endpoint from the existing
  now-playing URL. Do NOT hardcode if it can be env-driven.
- Verify on the live site after merge: real signup shows the success state and lands the email as
  Subscribed in admin.

### AM3 (operator admin action, AFTER AM2 is live)
Remove the `unauthenticated_write_customers` scope from the PUBLIC Storefront token (the token
ending `...470c`, used by the site). Once the site no longer calls customerCreate directly, that
write scope is unused and its removal closes the forged-signup abuse surface.

## Branch / commits / workflow
- Branch: `dev`. AM commits (dev, NOT merged to main): `b2d6f3e` AM1, `8085016` AM1b, `049cdfb`
  AM1c, `08e5d90` AM1d. The worker changes are already LIVE via `wrangler deploy` (they do not need
  a main merge). AM2's site change DOES go dev -> main (GitHub Pages -> Cloudflare Pages deploy).
- Pipeline: Claude writes a brief in `homepage/CODEX-BRIEF.md`, dispatches Codex via
  `./dispatch-codex.sh` (background), reviews the diff, verifies behaviorally, then the operator
  merges dev -> main. Only the operator merges the deploy PR.

## Files the next session MUST inspect
- `worker/src/index.js` (the /subscribe handler, getShopifyAdminToken, findCustomerIdWithRetry,
  createSubscribedCustomer, subscribeExistingCustomer, shopifyAdminGraphql).
- `worker/wrangler.toml` (bindings, worker name).
- `homepage/public/scripts/base.js` (AM2 target: the current Storefront subscribe call).
- `homepage/src/layouts/Base.astro` (CSP connect-src).
- `homepage/CODEX-BRIEF.md` (the AM1/AM1b/AM1c/AM1d logs, newest-at-top).

## DO NOT REVERT (paid-for lessons)
1. Do NOT re-add `code` to the ADMIN customerCreate `userErrors` selection. It is invalid on the
   Admin API and breaks every create. Detect "taken" by message.
2. Do NOT remove the create-then-resubmit retry (findCustomerIdWithRetry). Shopify's customer
   search is eventually consistent; without it, rapid resubmits 502.
3. Do NOT revert the auth to a permanent `SHOPIFY_ADMIN_TOKEN`. That model is deprecated and no
   permanent token exists for this app; auth MUST be the client-credentials grant.
4. Do NOT hardcode credentials or log the token/secret/email. Secrets stay as wrangler secrets.
5. Do NOT touch the now-playing endpoints (/now, /toggle, /status) in this worker.
6. wrangler KV commands must use `--remote` to hit the production namespace (local KV silently
   differs).
