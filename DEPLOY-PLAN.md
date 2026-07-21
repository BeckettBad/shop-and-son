# DEPLOY-PLAN.md — taking the custom front-end live as headless shopandson.com

Status: AUDITED 2026-07-10 (three-agent sweep: domain coupling, operator maintainability,
security/robustness). Goal: publish this custom Astro front-end (currently at
`beckettbad.github.io/shop-and-son`) as the LIVE headless Shopify storefront at
**shopandson.com**, replacing the old templated Online Store theme. Style: no em dashes.

## The one rule that shapes everything
**Checkout is always Shopify. Everything else should be first-party (on our site).**
You cannot self-host Shopify checkout. "Self-contained" means: all browsing, product,
designer, collection, policy, and content views live on our site; the ONLY handoff a user
sees is the checkout page (via the Storefront cart's `checkoutUrl`), plus the Storefront
API for data behind the scenes.

## The core hazard, in one sentence
Today shopandson.com IS Shopify, so every request to it works; the moment DNS points
shopandson.com at our static site, anything that expects Shopify to answer on that domain
(API calls, products.json, checkoutUrl) hits our own HTML and dies. Everything below flows
from that.

---

## AUDIT FINDINGS (2026-07-10)

### A. BREAKS AT GO-LIVE, code changes required in this repo
1. `homepage/astro.config.mjs:10-11`: `site: 'https://beckettbad.github.io'`,
   `base: '/shop-and-son'`. At the domain root every asset/link 404s. Must become
   `site: 'https://shopandson.com'`, `base: '/'`. Good news: `withBase()`
   (`src/lib/url.ts`) derives from BASE_URL, so the config change auto-corrects all
   base-path usage.
2. `homepage/src/lib/catalog.ts:36-37`: `PRODUCT_FEED_BASE_URL` and
   `PRODUCT_PAGE_BASE_URL` hardcode `https://shopandson.com`. This is the BUILD-TIME
   snapshot fetch (`/collections/<c>/products.json`) that the nightly cron depends on.
   After cutover it would silently snapshot our own HTML. Must point at the Shopify-owned
   domain (same env var as the Storefront client, see B1).
3. `homepage/src/layouts/Base.astro:26`: CSP `connect-src` hardcodes
   `https://shopandson.com`. Must list the real Storefront API origin or every GraphQL
   fetch and the newsletter POST is CSP-blocked. Also `:38` `form-action` and `:63`
   preconnect track the same origin.

### B. MUST RECONFIGURE, env / Shopify / infra
1. `PUBLIC_SHOPIFY_STORE_DOMAIN` (GitHub Actions Variable + `homepage/.env`) currently
   `shopandson.com`. Flip to the store's `*.myshopify.com` domain. This one variable
   gates ALL live reads: cart, product view, search, live menu, policies, newsletter.
2. **Checkout domain (highest severity, Shopify-side, nothing in the repo can fix it).**
   `cart.checkoutUrl` comes straight from Shopify and uses the store's primary domain.
   If Shopify's primary domain is still shopandson.com after DNS flips to us, Shopify
   returns `https://shopandson.com/checkout/...` which now resolves to the static site:
   checkout dead. At cutover, Shopify's primary domain must move to the myshopify.com
   domain (or a Shopify-retained subdomain such as checkout/shop.shopandson.com), so
   `checkoutUrl` lands on a Shopify-owned host.
3. User-facing links that point at the OLD theme and become 404s on our own domain:
   `src/data/content.ts:40-89` (shop() helper, wear/house collection links, account,
   cart), `src/lib/product-view.ts:17-18,90-99` (buy-fallback), `src/pages/policies.astro:37-50`
   (policy fallbacks). Convert to in-app views or the Shopify-owned domain.
4. `src/components/blocks/Preorders.astro:5-6,22,36,49`: hardcoded
   `beckettbad.github.io/shop-and-son/...` URLs; switch to `withBase()`.
5. Hosting: GitHub Pages needs a CNAME/custom-domain setup (no CNAME file exists), or
   move to Cloudflare Pages (recommended: we already run a CF worker, and only a real
   header-setting host can close the clickjacking gap in C4).
6. Cosmetic, no runtime effect: `storefront-client.ts:187` URL parse base,
   `global.css` comments, `.env.example`.

### C. SECURITY / ROBUSTNESS, fix before launch (from the code review)
1. **Cart wipe on transient failure (should-fix).** `storefrontFetch` returns null on
   any 429/timeout/network error; `cart.ts` treats null as "cart gone" and resets
   localStorage, silently deleting a real cart on one flaky request. Fix: distinguish
   "request failed, keep cart + show message" from "API definitively said cart null".
2. **Empty snapshot ships silently (should-fix).** `catalog.ts` returns `[]` after 3
   failed attempts (429s already observed in builds) and even discards pages already
   fetched; build stays green; the 4am cron would deploy blank collections. Fix: fail
   the build (or skip deploy) if any hero-menu collection resolves to 0 products.
3. **Newsletter: single opt-in is the OPERATOR'S DECISION (2026-07-10), double opt-in
   REFUSED.** Desired flow (verified live 2026-07-10 with a real test signup): email in,
   submit, immediately subscribed with marketing consent, trackable in Shopify admin
   Customers, stays on page, no login, no account step, no confirmation email, no
   redirect. Current customerCreate flow DELIVERS this for NEW emails.
   KNOWN GAP (verified): an EXISTING customer resubscribing gets TAKEN from Shopify;
   our UI shows success but consent is NOT updated. Matters for old-site customers.
   FIX (Phase AM, worker-backed subscribe, same UX): POST email to our Cloudflare
   worker; worker uses an ADMIN API token (never shipped to browsers) to upsert:
   customer exists -> customerEmailMarketingConsentUpdate(SUBSCRIBED), else create
   with consent. Bonuses: fixes TAKEN, adds rate-limit/Turnstile option, lets us drop
   unauthenticated_write_customers from the public token (abuse surface closed without
   double opt-in). Operator prerequisite: create a Develop app with read_customers +
   write_customers ADMIN scopes and put its token in the worker's secrets.
   Interim risk accepted: forged single-opt-in signups possible until AM lands;
   Shopify per-IP rate limits are the backstop.
4. **Headers only a real host can set.** `frame-ancestors` cannot ship via meta and
   GitHub Pages sets no headers, so the site is frameable (clickjacking). On
   Cloudflare, add `frame-ancestors 'none'`/`X-Frame-Options`. Also add
   `upgrade-insecure-requests` to the meta CSP (works in meta today).
5. Verified clean, no action: no XSS path (all Shopify strings rendered via
   textContent; `descriptionHtml`/policies go through `sanitizeShopifyHtml` and
   `script-src 'self'` backstops), no leaked secrets anywhere in src/public/dist/git
   history, deps clean (single dep, 2 low dev-only advisories).
6. Nice-to-haves: cart stepper race (fast +/- double-applies, checkout re-validates so
   low stakes), bfcache stale drawer after checkout (re-hydrate on `pageshow`),
   subscribe failure is a shake with no text.

### D. BEN'S UPKEEP MAP, what his normal admin work does (verified in code)
Auto-live, NO rebuild, NO code edit, keeps working after cutover once B1 is done:
- Add/remove/draft products in existing collections (grid live-reconciles; drafted
  products drop off; product page shows "no longer listed").
- Prices, sold-out states, variant availability (grid + product detail read live).
- Product images (imageless products are hidden by AI1 until photos are uploaded,
  then appear automatically).
- Refund/privacy/terms policy edits (fetched live).
- **New designer: add the designer to Shopify admin -> Online Store -> Navigation ->
  `main-menu` under the `designers` item.** The site hydrates this menu at runtime.
  A Collection-linked designer is clickable and opens its catalogue. A designer
  without a Collection remains visible as unclickable text at the bottom of the
  list; when Ben later changes its link to the real Collection, it automatically
  becomes clickable. A collection not added to `main-menu` gets no button.
Refreshes within 24h via the nightly 4am ET rebuild (cron in deploy.yml):
- Baked first-paint snapshot, scoped (within-collection) search handle set.
Needs a code edit (us):
- Store hours (`content.ts:46`), contact/about copy, section labels
  (CLOTHES/OBJECTS/MUSIC/& FAM), & FAM panel text, preorder iframe, MUSIC playlist.
Trap for future editors: `content.ts` contains large DEAD sections (`site.nav`,
`clothing.designers` 28-name roster, `about`, `objects`, `music.tracks`, `vault`,
`catalog` index) used only by unrendered components. The LIVE menu seed is `heroMenu`
(`content.ts:129-183`). Consider deleting the dead code before handoff.

---

## THE PLAN (phased, in order)

1. **Pre-cutover code phase (pipeline, works fine on GitHub Pages today):**
   AJ: env-driven domain unification (catalog.ts feed base + CSP/preconnect/form-action
   from `PUBLIC_SHOPIFY_STORE_DOMAIN`), in-app/Shopify-owned link conversion
   (content.ts nav, product-view fallback, policies fallback), Preorders withBase fix.
   AK: robustness (cart null-vs-fail fix, empty-snapshot build guard, pageshow cart
   re-hydrate, upgrade-insecure-requests).
   Cleanup: delete dead content.ts sections.
2. **Staging rehearsal:** repoint `PUBLIC_SHOPIFY_STORE_DOMAIN` to the myshopify domain
   in a test build BEFORE cutover; verify catalog, search, menu, policies, subscribe,
   and a real end-to-end test order. Nothing about this needs the DNS switch.
3. **Admin config:** double opt-in ON; confirm which surface issued the 470c token
   (parked follow-up) and plan the catalog-read/newsletter-write token split.
4. **SEO/redirects:** decide URL scheme (real routes vs in-app state), build the 301
   map from old theme URLs (`/collections/*`, `/products/*`, `/policies/*`, `/pages/*`),
   add robots/sitemap. Critical for replacing a live indexed site.
   DAY-ONE MINIMUM (if host is Cloudflare Pages): ship a `_redirects` file at cutover:
   `/products/:handle -> /product/?handle=:handle 301`, `/collections/* -> / 302`,
   `/policies/* -> /policies/ 302`, `/pages/* -> / 302`. Old indexed links keep working
   from hour one; the full SEO map refines later.
5. **Checkout domain architecture (operator decision 2026-07-10): branded subdomain.**
   Target: shopandson.com -> our front-end; **checkout.shopandson.com -> Shopify** and
   set as the store's PRIMARY domain at cutover, so `checkoutUrl` lands there.
   PROVEN FACTS (tested 2026-07-10 with real carts): checkoutUrl ALWAYS uses the
   store's primary domain regardless of which API host created the cart; non-primary
   Shopify hosts 301 to the primary; checkout.shopandson.com has no DNS record yet;
   apex currently points at Shopify (23.227.38.32).
   CONSEQUENCE: full end-to-end checkout proof on the subdomain is only possible in
   the cutover window itself (when it becomes primary), so the sequence below is
   staged with a rollback at every step. NO primary-domain or DNS change happens
   until the staged proof passes.
   Pre-cutover (zero customer impact):
   a. DNS: add CNAME checkout.shopandson.com -> shops.myshopify.com.
   b. Shopify admin: Settings -> Domains -> Connect existing domain ->
      checkout.shopandson.com; wait for SSL "Connected". (Non-primary = visitors
      simply redirect to shopandson.com; old theme unaffected.)
   c. Stage our site on the new host's temp URL (e.g. *.pages.dev) with cutover env;
      full Playwright sweep + REAL cart; checkoutUrl still points at the old theme
      (still primary), so checkout keeps working during all staging.
   Cutover window (minutes, each step reversible):
   d. Shopify: set primary = checkout.shopandson.com. Old-theme URLs now redirect
      there (theme still fully functional on the subdomain). VERIFY a real checkout
      end to end on checkout.shopandson.com NOW. Rollback = set primary back.
   e. DNS: point apex/www at the new host. shopandson.com becomes our site.
   f. Full verification from the live site: browse -> cart -> checkout on
      checkout.shopandson.com -> test order -> order confirmation.
6. **Post-cutover verification:** full Playwright sweep against shopandson.com, test
   order, checkout return path, newsletter signup, now-playing worker origin in CSP,
   old-theme URL redirects.

## CHECKLIST, OPERATOR (Beckett/Ben)
- [ ] Merge PR #32 (AI1) and confirm live site has no blank tiles.
- [ ] Confirm the two newsletter test signups in admin (Customers ->
      beckettnotbadertscher+newslettertest1@gmail.com shows Subscribed; delete after).
      Double opt-in stays OFF per operator decision.
- [ ] For Phase AM (newsletter upsert worker): Shopify admin -> Settings -> Apps and
      sales channels -> Develop apps -> Create app ("son-ops") -> Configuration ->
      Admin API scopes: read_customers, write_customers -> Install -> copy the Admin
      API access token ONCE and paste it ONLY into the worker secret (never the repo).
- [ ] Teach Ben the ONE nav rule: add every designer to Navigation `main-menu`
      (designers submenu). Collection links are clickable; entries without a
      Collection display as inert bottom-of-list names until linked later.
- [x] Product hygiene RESOLVED (Ben, 2026-07-10): the headless-only list is POS-only
      inventory. Never draft/delete (breaks POS). Phase AN filters the site to
      Online-Store-published products, so the list is excluded automatically.
      WARNING for later admin work: do not uninstall the Online Store channel or
      password-protect the old storefront without checking the AN gate first, the
      site keys visibility off onlineStoreUrl.
- [ ] Locate the surface that issued token ...470c (parked; needed before the token
      split in plan step 3).
- [ ] Decide: hosting (Cloudflare Pages recommended) and URL scheme (step 4/5).
- [ ] At cutover: Shopify primary domain -> myshopify.com, DNS -> new host.
- [ ] After cutover: place a real test order end to end.

## CHECKLIST, CLAUDE (all via Codex pipeline)
- [ ] Phase AJ: domain unification + link conversion + Preorders withBase (step 1).
- [ ] Phase AK: cart-fail fix, snapshot build guard, pageshow re-hydrate, CSP additions.
- [ ] content.ts dead-code cleanup.
- [ ] Staging rehearsal build against myshopify domain + Playwright verification.
- [ ] Redirect map + robots/sitemap once URL scheme is decided.
- [ ] Post-cutover Playwright sweep + report.

## Open decisions for the operator
- Hosting: Cloudflare Pages (recommended) vs GitHub Pages + CNAME vs Hydrogen/Oxygen.
- URL scheme: real routes for collections/products (SEO) vs current in-app state views.
- Checkout domain shape: bare myshopify.com vs a branded Shopify-retained subdomain.
- Timeline for the token split (catalog-read vs newsletter-write credentials).

## Progress log
- 2026-07-10: three-agent audit complete (domain coupling, Ben maintainability,
  security/robustness); findings folded in above. AI1 (imageless-product filter) built,
  verified, PR #32 open awaiting operator verify/merge. Blank-tile root cause: the
  2026-07-09 token swap moved the site onto a publication that includes all Active
  products; ~130 Active-but-not-on-Online-Store products surfaced, 97 imageless
  (list: HEADLESS-ONLY-PRODUCTS-2026-07-10.md).
- 2026-07-09: initial audit (cart/checkout already in-app; gap is browse links + domain
  hardcoding + routing/SEO). Designer link fix shipped (Phase AD). Plan drafted.
