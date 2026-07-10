# DEPLOY-PLAN.md — taking the custom front-end live as headless shopandson.com

Status: DRAFT, 2026-07-09. The goal: publish this custom Astro front-end (currently at
`beckettbad.github.io/shop-and-son`) as the LIVE headless Shopify storefront at
**shopandson.com**, replacing the old templated Online Store theme. Style: no em dashes.

## The one rule that shapes everything
**Checkout is always Shopify. Everything else should be first-party (on our site).**
You cannot self-host Shopify checkout. So "self-contained" means: all browsing, product,
designer, collection, policy, and content views live on our site, and the ONLY handoff to
Shopify a user ever sees is the **checkout page** (via the Storefront cart's `checkoutUrl`),
plus the Storefront API for data behind the scenes. Any other link to shopandson.com's old
theme (collections, product pages, designers, policies) is a bug to fix.

## Current state (audited 2026-07-09) — better than expected
- **In-app cart + checkout: DONE.** `src/lib/cart.ts` runs real Storefront `cartCreate` /
  `cartLinesAdd` / `cartLinesUpdate`; `CartDrawer.astro` is a working on-site cart; checkout
  is `window.location.href = cart.checkoutUrl` (the correct Shopify-hosted handoff). This is
  the hard part and it already exists.
- **In-app browsing: EXISTS in the hero.** `openCatalog(collection, label)` renders a
  collection view in-app; product detail renders in-app via `src/lib/product-view.ts`;
  policies render in-app at `/policies`. Menu collection items use `data-collection` +
  a delegated click handler to open in-app (no external navigation).
- **The gap: hardcoded shopandson.com links + absolute-domain URLs.** Several user-facing
  links still point at the OLD theme instead of using the in-app views, and the domain is
  hardcoded, which breaks the moment this site *becomes* shopandson.com.

## Link inventory (what points at shopandson.com today)
FIX (should be in-app / first-party):
- `product-view.ts` designer/vendor link -> was `collections/vendors?q=` (Phase AD, in progress).
- `content.ts` `shop()` helper -> the left/right nav (wear, house, account, cart) as external
  `shopandson.com/...` links. Should drive in-app views (or the cart drawer) instead.
- `product-view.ts` "buy on shopandson.com" -> currently a FALLBACK when the in-app cart is
  not ready; keep as fallback but it should rarely fire once cart is confirmed live.
- `policies.astro` -> links to `shopandson.com/policies/...`; should use the in-app policies
  view as primary.

KEEP (correct, do not "fix"):
- Storefront cart `checkoutUrl` -> Shopify checkout (the payment handoff).
- Storefront API endpoint (`/api/2025-01/graphql.json`), CSP `connect-src`, preconnect -> infra.
- `mailto:info@shopandson.com` -> an email address, not a site link.
- Build-reference comments in CSS.

## The plan (phased)
1. **Convert browse links to in-app.** Designer link first (Phase AD). Then the left-nav
   collections and policies to render in-app rather than navigate to the old theme. Leave the
   cart/checkout on Shopify.
2. **Stop hardcoding the domain.** Replace absolute `https://shopandson.com/...` browse URLs
   with relative / in-app navigation so the site is domain-portable (behaves the same on the
   GitHub URL or on shopandson.com). Only `checkoutUrl` (from the API) stays absolute.
3. **Confirm cart + checkout end-to-end** on a staging domain: add to cart, cart drawer,
   checkout redirect, complete a test order.
4. **Real routes + SEO.** Decide whether collections/products get real URL paths (better for
   Google) vs. the current in-app hash/state views. Then set **301 redirects** from the old
   Shopify theme URLs (`/collections/*`, `/products/*`, `/policies/*`) to the new equivalents
   so existing rankings and inbound links survive the switch. This is critical when replacing
   a live site.
5. **Deployment model (decision needed).** Where does shopandson.com point?
   - Recommended: static Astro on **Cloudflare Pages** (you already run a Cloudflare worker),
     Storefront API for data, Shopify for checkout. Keeps the current stack.
   - Alternative: Shopify **Hydrogen/Oxygen** for Shopify-native hosting.
6. **Go-live.** Point shopandson.com at the new site (Shopify admin -> Domains, or DNS at the
   host), retire/disable the old Online Store theme, verify checkout on the live domain, ship.
   Note: there is no single "publish" button in Shopify admin for a headless front-end. Going
   live = deploy the front-end + point the domain + retire the old theme.

## Open decisions for the operator
- Deployment host: Cloudflare Pages (recommended) vs. Shopify Hydrogen/Oxygen.
- URL scheme: real routes for collections/products (SEO-friendly) vs. in-app state views.
- Redirect map from old Shopify URLs (needed to preserve SEO on the switch).
- Timeline: fix browse links now (small), or batch into a dedicated "headless go-live" sprint.

## Progress log
- 2026-07-09: audit complete (cart/checkout already in-app; gap is browse links + domain
  hardcoding + routing/SEO). Designer link fix dispatched (Phase AD). Plan drafted.
