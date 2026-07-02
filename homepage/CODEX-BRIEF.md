# CODEX-BRIEF — &son homepage

Shared hand-off file between **Claude (orchestrator)** and **Codex (coder)**.
Claude writes the **active brief** below from the operator's instruction and
dispatches it to Codex headless (`./dispatch-codex.sh`); Codex implements +
verifies inside `homepage/`; Claude reviews the diff, commits, and logs.

How to read this file:
- **ACTIVE BRIEF** = the one task to do right now. If it says "(none)", wait.
- Scope is always **`homepage/` only**. Don't touch `archive/`, and don't
  casually change root `public/preorders/` (it ships as-is).
- **Edits go LIVE on merge to `main`.** Build on `dev`; the operator verifies and
  approves the merge. Never merge `dev` → `main` yourself.
- Verify with `npm run build` **and** `npx astro check` (both green) before
  declaring done. No mockup comparison — the brief is the spec.
- One focused commit per change.

## Handshake — the automated build loop

Claude drives Codex directly via **headless dispatch** — the operator is NOT a
courier between panes. `./dispatch-codex.sh` runs Codex non-interactively in
`homepage/`, **unsandboxed** (`--dangerously-bypass-approvals-and-sandbox`, the
only way Codex can write `.git`); Codex's stdout returns to Claude. Codex makes
its own focused commit on `dev`; it does **not** push or merge. Pushing `dev` and
opening the `dev → main` deploy PR stay with Claude/operator. The sandbox fence is
off, so the dispatch's scope rules + Claude's review are the only guardrails.

1. **Operator** gives Claude the edit instruction.
2. **Claude** confirms intent + style, writes the ACTIVE BRIEF here
   (`Status: ready for Codex`), then dispatches:
   `./dispatch-codex.sh` (implements the active brief) — or
   `./dispatch-codex.sh "free-form instruction"`.
3. **Codex** (headless) implements in `homepage/` only, runs `npm run build`
   **and** `npx astro check` until both green, makes **one focused commit on
   `dev`** (no push, no merge), and prints the files changed + verify results +
   commit hash to stdout.
4. **Claude** reviews the real commit (`git show <hash>`). If clean → appends a
   **Log** entry (newest at top), sets
   `Status: committed @ <hash> — ready for operator verify`. If Codex was blocked,
   the diff is wrong, or it touched out-of-scope files → Claude amends/reverts and
   fixes the brief, then re-dispatches. Never guess.
   Log shape: `YYYY-MM-DD — <task> — <hash> — build:green check:green — <notes>`
5. **Operator** verifies on `dev` (`npm run dev`).
6. **Ship (PR gate):** when the operator says ship, Claude pushes `dev` and opens
   a PR **`dev → main`** (`gh pr create`) with the diff summary + verify results.
   The operator reviews on GitHub and **merges = deploy** (push to `main` triggers
   the Pages build). Only the operator merges the deploy PR.
   > **PROTOCOL (2026-07-02, after the Wave-3 parked-vs-shipped mixup):** NOTHING
   > goes to `main` without an explicit **"ship &lt;wave&gt;"** from the operator that
   > NAMES the wave. "ship X" authorizes ONLY wave X; a PR must never quietly carry
   > other in-flight work. (Wave 3 was verified-after-the-fact and left live —
   > operator's call — but the default is: name it or it doesn't ship.)

---

## ACTIVE BRIEF

> **Phases G–J are SHIPPED** (merged `dev → main` @ `012f918`, live). Do not re-do
> any of them; their brief text lives in this file's git history + the sections below.

**Status:** ready for Codex — **K0 is an operator prerequisite** (Storefront token).
K1 and the snapshot half of K2 can start without it; K2's live-refresh, K3's live
fetch, K4, and K6 need the token in `homepage/.env` to be testable. L1 and L2 need
nothing; **L3 needs the operator to save the fam photo** to
`homepage/public/images/fam-tattoo.jpg` first. M3's video asset is likely already
in the repo (see M3's asset note) — operator confirms it before M3 is dispatched.
**Operator priority within Phase M: M3 (the film stage) first**; M2's green
stencil is best-effort — if the recolor fights back, ship it white and flag.

**DISPATCH PROTOCOL — this brief is 12 sub-tasks, NOT one dispatch.** One
sub-task per `./dispatch-codex.sh` run, one commit each, Claude reviews the real
diff against that sub-task's **Done when** + the risks list before the next
dispatch. Before each dispatch, Claude updates the line below so Codex has ONE
target; everything else in this file is context, not instruction.

> **ACTIVE SUB-TASK: K4 — Cart: Storefront Cart API + on-site drawer, checkout hands off to Shopify** (see the K4 section below). THE verify-gate (operator hand-checks add-to-cart → Shopify checkout). Wires K3's cart:add + window.__cartReady. cartCreate proven live. Order: K4 (gate) → K6 → K5.

Recommended order (three waves, operator verifies on `dev` after each wave and
ships dev → main per wave, not one giant merge):
1. **Wave 1 — no prerequisites, quick wins:** L2 → M1 → L1. (L1 is the invasive
   one: after it, click through every stage + confirm the page can't scroll.)
2. **Wave 2 — after K0 (token live in `homepage/.env`):** K1 → K2 → K3 → L4 →
   K4 → K6 → K5. Browser-verify K2's pager and K4's cart flow by hand, not just
   build+check.
3. **Wave 3 — assets confirmed first:** M2 → M3 → L3 (M3 and L3 both extend the
   stage machinery — keep them adjacent so the second copies the first's
   pattern).

If a diff misses the brief: revert and re-dispatch with the brief amended —
never patch-on-patch, never let Codex "fix forward" a wrong commit.
**Task:** Phase K — commerce core (K1–K6), Phase L — chrome/editorial edits
(L1–L4), **and** Phase M — neon interaction language + the house film stage
(M1–M3). The homepage becomes a proper selling site: in-site product pages,
on-site cart, checkout handed to Shopify, menus + listings that mirror Shopify
admin automatically. **One focused commit each**, `npm run build` **and**
`npx astro check` green after every one. K runs in order (K6 depends only on K1);
L1–L3 are independent of K and of each other; L4 depends on K1+K3; M1–M2 are
independent, M3 needs M2 (the stencil must be clickable) — all of M is
independent of K and L. Scope:
`homepage/` only — EXCEPT K5, which (with operator awareness) touches
`.github/workflows/deploy.yml`.

**The model (decided with the operator 2026-07-01):**
- **Cart = on-site drawer** via the Shopify **Storefront Cart API**; only the final
  CHECKOUT click leaves for Shopify's hosted checkout (`cart.checkoutUrl`). The cart
  icon stops linking out to `shopandson.com/cart`.
- **Product pages = ONE live client-driven page** at `/product/?handle=<handle>`
  (query param, NOT a static route per product) that fetches full product data from
  the Storefront API at view time. A listing the owner adds in Shopify admin works
  on our site immediately — no redeploy. Catalogue cards navigate there in-site
  instead of out to `shopandson.com/products/<handle>`.
- **Sold-out items stay visible**, marked `sold out`, with add-to-cart disabled.
- **Data freshness = layered:** build-time snapshot (existing `products.json` fetch)
  paints instantly → client-side Storefront re-fetch revalidates on open → a daily
  scheduled rebuild keeps the snapshot itself from going stale.
- **⚠️ STANDING DATA RULE (2026-07-02):** the **Headless channel's publication set
  MUST mirror the Online Store's.** The snapshot comes from the Online Store
  (`products.json`); the live layer comes from the Headless channel (Storefront
  API). They must contain the same products. If **imageless or unknown products
  ever appear** in the live catalogue, **check channel publication FIRST — it's a
  data/admin problem, not code.** (2026-07-02: the Headless channel had 40+
  phantom products — imported but never published to Online Store, 404 on the live
  site, no images; Ben removed them in admin and the two sets now match at 342 =
  342, 0 imageless. The paper-box resilience in `createProductCard` stays as
  correct defensive behavior if the sets ever drift again.)
- **Menus mirror Shopify admin (K6):** the CLOTHES + OBJECTS subcategories are
  driven by the store's live navigation menus via the Storefront `menu` query —
  when Ben adds/renames/removes a collection or menu entry in admin, the homepage
  follows without a redeploy. `content.ts` stays as the no-token fallback snapshot.
- **Collection descriptions (K2):** opening any designer/category catalogue shows
  that collection's Shopify description NEXT TO its name at the top of the panel.
- **No footer (L1):** the H5/J1 footer is removed entirely; the three required
  legal links live subtly in the bottom-left about block instead.

---

### K0 — OPERATOR prerequisite: Storefront API token with cart scopes

Not a Codex task — Beckett does this once; Codex consumes the values.

- Shopify admin → Settings → Apps and sales channels → Develop apps → (the app) →
  **Storefront API** → enable scopes: `unauthenticated_read_product_listings`,
  `unauthenticated_read_checkouts`, `unauthenticated_write_checkouts` (the Cart API
  mutations ride the checkout scopes), and `unauthenticated_read_content` (needed
  for the K6 `menu` query that keeps the nav categories mirroring admin). Install/reinstall the app, copy the
  **Storefront access token** (this is the PUBLIC token — safe to ship in the page;
  it is NOT the Admin key/secret).
- Add to `homepage/.env` (and Codex mirrors the names into `.env.example` in K1):
  `PUBLIC_SHOPIFY_STORE_DOMAIN=shopandson.com` and
  `PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN=<token>`. The `PUBLIC_` prefix is what lets
  Astro inline them into client code — deliberate, the token is public-by-design.
  The private `SHOPIFY_API_KEY`/`SHOPIFY_API_SECRET` are NOT used anywhere in Phase K.
- For deploys: add the same two values in GitHub → repo Settings → Secrets and
  variables → Actions → **Variables** (they're public; variables, not secrets, is
  fine). K5 wires them into the Pages build.
- Sanity check the endpoint `https://shopandson.com/api/2025-01/graphql.json` accepts
  the token; if the custom domain ever doesn't serve the API, use the store's
  `*.myshopify.com` domain in `PUBLIC_SHOPIFY_STORE_DOMAIN` instead.

---

### K1 — Client-side Storefront data layer

**Why:** everything live (fresh listings, full product detail, cart) needs a
browser-side Shopify client. The existing `src/lib/shopify.ts` is build-time-shaped
(non-PUBLIC env, `console` fallbacks) — leave it alone; make a clean client module.

**Files:** new `src/lib/storefront-client.ts`; update `.env.example` with the two
`PUBLIC_` vars (commented, no values).

- Browser-safe TS module (no Node APIs). Reads
  `import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN` / `PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN`;
  export `isStorefrontConfigured`. Every function returns `null`/`[]` quietly when
  unconfigured or on error — the site must keep working from the snapshot.
- `storefrontFetch<T>(query, variables)` → POST
  `https://${domain}/api/2025-01/graphql.json` with
  `X-Shopify-Storefront-Access-Token`; handle non-OK + GraphQL `errors[]`; ~10s
  timeout via AbortController.
- `getCollection(handle, first = 250)` →
  `collection(handle:){ title description products(first:){ nodes{ handle title
  vendor availableForSale featuredImage{ url altText width height }
  priceRange{ minVariantPrice{ amount currencyCode } } } } }`, paginating with
  `pageInfo`/cursor past 250 if needed. Returns `{ title, description, products }`;
  products map to the SAME `CatalogProduct` shape K2 extends in `catalog.ts`
  (import the type) so the catalogue can swap data sources transparently.
  `description` is the plain-text collection description Ben writes in admin
  (e.g. Hender Scheme's tannery note) — K2 renders it in the catalogue head.
- `getMenu(handle)` → `menu(handle:){ items{ title url items{ title url } } }`
  (requires `unauthenticated_read_content`). Map each item to
  `{ label, collectionHandle?, href? }` — collection handles parsed from
  `/collections/<handle>` URLs; anything else kept as a plain href. K6 consumes
  this; the live menu HANDLES (the store's nav menus behind its `wear` /
  `designers` / `objects` dropdowns — likely under `main-menu`) must be discovered
  at implementation time by querying and inspecting, not guessed.
- `getProduct(handle)` → `product(handle:){ id handle title vendor descriptionHtml
  availableForSale images(first:24){ nodes{ url altText width height } }
  options{ name values } variants(first:100){ nodes{ id title availableForSale
  price{ amount currencyCode } selectedOptions{ name value } } } }`. Export the
  mapped `ProductDetail` type for K3/K4.
- Reuse the width-resize + srcset convention from `catalog.ts`
  (`?width=` on `cdn.shopify.com` URLs, 700/1100/1600) — export those two helpers
  from `catalog.ts` and import them; don't fork the logic.
- Price formatting matches the cards: `$495` (strip `.00`), non-USD shows code.
- `sanitizeShopifyHtml(html)` — the ONE gate for any admin-authored HTML the site
  injects (K3 `descriptionHtml`, L4 policy bodies): parse via
  `DOMParser`, strip `<script>/<iframe>/<object>/<embed>/<form>`, every `on*`
  attribute, and `javascript:` URLs, return the cleaned fragment. Shopify admin
  content is trusted-ish (it's Ben's), but a compromised admin must not become a
  compromised storefront. Plain-text fields (titles, vendors, prices) keep using
  `textContent` — never `innerHTML` — as the card factory already does.

**Done when:** build+check green; module typechecks and is importable from client
scripts; with the token in `.env`, a quick manual `getProduct("<any live handle>")`
from the browser console (or a temporary test snippet, removed before commit)
returns full data; without the token everything degrades quietly.

---

### K2 — Catalogue: whitespace-free cards, sold-out tags, in-site links, live refresh

**Why:** cards currently letterbox the image inside a bordered gray box and link OUT
to `shopandson.com/products/<handle>`. Beckett wants: **no whitespace margin — just
the image, with title/vendor/price below**; sold-out marked; clicks stay on our site;
and the grid to reflect Shopify changes without waiting for a redeploy.

**Files:** `src/lib/catalog.ts`, `src/components/blocks/HeroVideo.astro`
(card factory + render + script), `src/styles/global.css`.

- **Snapshot data (`catalog.ts`):** extend `CatalogProduct` with `handle`,
  `available` (true if ANY variant `available`), and `imageAspect` (width/height from
  the feed's image dims; fallback 3/4). Raise `PRODUCT_CAP` to 250 and page
  `products.json?limit=250&page=N` until a short page, so big collections
  (e.g. `clothing-1`) are complete. Keep `url` for now (unused by cards after this).
- **Card restyle (whitespace kill):** `.product-card__media` loses the border and the
  gradient/letterbox background entirely; the media box gets
  `aspect-ratio: var(--card-aspect)` (set per-card from `imageAspect`) and the image
  fills it exactly (`object-fit:cover` is safe now — box ratio == image ratio, so
  nothing crops). Cards top-align. Rows are no longer uniform height → the row pager
  must **measure**: replace the `--catalog-row-index`-driven uniform translateY with
  cumulative real row offsets (`offsetTop` of the target row), recomputed on render
  and on resize. Wheel/touch paging behavior otherwise unchanged; mobile scroll
  fallback unchanged.
- **Sold-out tag:** when `available === false`, card gets a small uppercase
  `sold out` label (skin-consistent: mono/uppercase, black on paper or thin-bordered),
  overlaid on the image corner or first line of the body — Codex picks the cleaner,
  operator verifies. Image dims slightly (e.g. `opacity:.55`). Card stays clickable.
- **In-site links:** `createProductCard` hrefs become
  `withBase(\`/product/?handle=${handle}\`)` — same tab, no `target=_blank`. Import
  `withBase` logic into the client script the same way other base-aware URLs are
  handled (the script is bundled by Astro, so a small inlined base constant from
  `import.meta.env.BASE_URL` is fine).
- **Collection description in the head:** the catalogue head becomes
  `TITLE — description` on ONE line block: the collection title as now, and NEXT TO
  it (inline to its right, not underneath) the collection's Shopify description in
  smaller, muted, lowercase-as-authored type (e.g. `HENDER SCHEME` followed by
  "Sourcing from a local Japanese tannery, …"). Long descriptions clamp to ~2 lines
  (`-webkit-line-clamp`) so the grid never gets pushed around. Applies to EVERY
  collection — designers, clothing categories, objects. Description arrives with
  the K1 live fetch (`getCollection`); before it resolves (or with no token) the
  head shows just the title, exactly as today — no layout jump beyond the text
  appearing. Empty description → title only.
- **Live refresh (stale-while-revalidate):** `renderCatalogContent` paints the
  snapshot immediately (as now), then fires `getCollection(collection)` (K1). On
  resolve: if the panel is still showing THAT collection (race-guard via
  `hero.dataset.activeCollection`) and the data differs, re-render the rows +
  description and clamp `rowIndex` to the new `lastRowIndex`. A collection with NO
  snapshot entry (e.g. a menu entry Ben added after the last deploy, via K6) paints
  an empty grid then fills from the live fetch. Cache per-collection in a Map for
  the session (one live fetch per collection per visit). Unconfigured/failed fetch
  → snapshot stands, zero user-visible errors.

**Done when:** build+check green; cards show edge-to-edge images with info below (no
border, no gray letterbox); mixed aspect ratios page correctly by measured rows;
sold-out items are marked + dimmed; clicking any card goes to
`/shop-and-son/product/?handle=<handle>` in the same tab; opening HENDER SCHEME
shows its tannery description next to the name at the top (and every other
collection likewise shows its admin description, or nothing when unset); with the
token set, a product retitled in Shopify admin shows the new title on next
catalogue open without a rebuild.

---

### K3 — Product detail page: `/product/?handle=<handle>`

**Why:** the in-site listing view. Layout mirrors the pre-order site's split — photos
on one side, details on the other — restated in the homepage skin (paper, black,
uppercase mono/serif already in `global.css`; NO new fonts, no preorder CSS imports).

**Files:** new `src/pages/product.astro`; `src/layouts/Base.astro` (one additive
prop); `src/styles/global.css` (or a scoped style block in the page).

- **Chrome:** add a `bare` prop to `Base.astro` — renders like `landing` (no TopBar,
  no IndexOverlay) but WITHOUT the `landing` class, so the page scrolls normally.
  Purely additive: `{!landing && !bare && <TopBar />}` etc.; existing pages
  untouched. The product page uses `<Base bare title=...>`.
- **Page top:** minimal header row — left: a `← back` control (`history.length > 1 ?
  history.back() : location = withBase("/")`); right: the same cart icon/drawer
  trigger as the homepage (K4 wires it; until then render the icon linking to
  `withBase("/")`).
- **Client flow:** read `?handle=` → `getProduct(handle)` (K1). States:
  - loading: blank paper + a small mono `loading` line (no spinners);
  - not found / no handle: `this piece is no longer listed` + link back home;
  - Storefront unconfigured (deploy without token): fall back to a plain link out to
    `https://shopandson.com/products/<handle>` so the page is never a dead end.
- **Layout, desktop (≥761px):** two columns ~55/45. **Left:** ALL product images
  stacked full-column-width, natural aspect ratios, edge-to-edge, no borders
  (lazy-load below the first; width-resized srcset via the K1 helpers). **Right:**
  `position:sticky; top:0` details panel: vendor (small, muted) → title → price →
  variant selector → ADD TO CART → `descriptionHtml` (inside a
  `.product-detail__desc` wrapper with sane type styles — injected ONLY through
  the K1 `sanitizeShopifyHtml()` helper, never raw `innerHTML`). Page scrolls the image
  stack; details stay pinned — same reading as the preorder page.
- **Variant selector:** square bordered uppercase buttons per variant option value
  (visual language of the preorder `size-btn`, rebuilt in our skin — selected =
  inverted black/white; unavailable = disabled + struck). Single-variant products
  auto-select and show no selector. Multi-OPTION products (size × color) may render
  one button row per option — handle generally, not size-specific.
- **ADD TO CART:** disabled until a purchasable variant is resolved; label `add to
  cart`; whole-product `availableForSale === false` → button reads `sold out`,
  permanently disabled. In THIS commit the click handler dispatches
  `document.dispatchEvent(new CustomEvent("cart:add", { detail: { variantId,
  quantity: 1 } }))` — K4 listens.
  **Interim (until K4 is live WITH cart scopes on the token):** when no
  `cart:add` listener is active — feature-flag it simply: K4 sets
  `window.__cartReady = true` when its listener mounts, and if that's absent —
  the button instead renders as a link, same styling, labelled `buy on
  shopandson.com`, to `https://shopandson.com/products/<handle>` (new tab,
  `rel="noopener"`). No dead buttons in any shippable state; K4 removes the
  interim path.
- **Mobile:** single column — images first (swipeable horizontal strip or stacked;
  stacked is fine), details after; sticky-off.
- No instructional/internal text anywhere on the page.

**Done when:** build+check green; `/product/?handle=<live handle>` renders all images
left + sticky details right in the homepage skin; variants select; sold-out renders
disabled; unknown handle shows the not-found state; back control works; a
handle created in Shopify admin AFTER the build renders fine (that's the point).

---

### K4 — Cart: Storefront Cart API + on-site drawer, checkout hands off to Shopify

**Why:** "everything leading up to checkout" happens on our site. The cart lives
here; Shopify only takes over at the pay step.

**Files:** new `src/lib/cart.ts`, new `src/components/CartDrawer.astro`;
`src/components/blocks/HeroVideo.astro` (cart icon rewire), `src/pages/index.astro`
+ `src/pages/product.astro` (mount drawer), `src/styles/global.css`.

- **`cart.ts` (client, on top of K1's `storefrontFetch`):**
  - Mutations/queries: `cartCreate`, `cartLinesAdd`, `cartLinesUpdate`,
    `cartLinesRemove`, and a `cart(id:)` query selecting `id checkoutUrl
    totalQuantity cost{ subtotalAmount{ amount currencyCode } } lines(first:100){
    nodes{ id quantity merchandise{ ... on ProductVariant{ id title product{ title
    handle vendor } image{ url width height } price{ amount currencyCode } } }
    cost{ totalAmount{ amount currencyCode } } } }`.
  - Persist cart id in `localStorage("andson:cart-id")`. On load, hydrate; if the
    stored cart errors, is null, or is already checked out → clear the id, lazily
    recreate on next add. `userErrors` surfaced as a quiet inline message, never an
    alert.
  - API: `getCart()`, `addLine(variantId, qty=1)`, `updateLine(lineId, qty)`
    (qty 0 = remove), `removeLine(lineId)`. After EVERY mutation dispatch
    `cart:updated` (detail = mapped cart) on `document`; listen for K3's `cart:add`.
- **`CartDrawer.astro`:** right-edge slide-over (transform transition, matches the
  550ms stage timing), paper background, 1px black left rule, `z-index` above the
  hero panels. Header `cart` + `×` close. Lines: thumb (width-resized), title,
  variant title (skip `Default Title`), qty stepper (`−`/`+`), remove `×`, line
  price. Footer: `subtotal` + amount, note `shipping + tax at checkout`, full-width
  black `CHECKOUT` button → `location.href = cart.checkoutUrl` (same tab). Empty
  state: `nothing yet`. Backdrop click + Esc close. Scroll within the drawer;
  page behind doesn't scroll while open.
- **Cart icon:** `.hero__cart` becomes a `<button>` toggling the drawer (keep the
  exact bag SVG + placement). Add a count badge — small mono superscript number,
  hidden when 0 — updated from `cart:updated` + initial hydrate. Same trigger on the
  product page header. Adding to cart auto-opens the drawer. **Keep** the existing
  hide-while-catalog/preorder-open CSS for now (collision rules from I1) — flag to
  operator that adding from a catalogue view opens the drawer even while the icon is
  hidden, and whether the icon should stay visible in panels is an operator call.
- Buys are otherwise untouched: no payment UI, no customer accounts — Shopify's
  checkout owns everything after `checkoutUrl`.

**Done when:** build+check green; with the token set: add a variant from a product
page → drawer opens showing the line; qty stepper + remove work; badge count tracks;
reload keeps the cart; CHECKOUT lands on Shopify's checkout with those items; a
completed checkout results in a fresh empty cart on return; without the token the
drawer shows the empty state and add-to-cart is inert (no crashes).

---

### K5 — Freshness ops: scheduled rebuild + token into the Pages build

**Why:** the build snapshot (instant first paint + no-token fallback) shouldn't rot,
and the deployed bundle needs the `PUBLIC_` vars inlined at build time.

**File:** `.github/workflows/deploy.yml` — the one Phase K exception to
homepage-only scope; operator is aware.

- Add `schedule: - cron: "0 8 * * *"` (daily, ~4am ET) alongside the existing
  `push`/`workflow_dispatch` triggers. It redeploys `main` as-is with a fresh product
  snapshot — no code change risk.
- Pass the vars into the build step:
  `env: PUBLIC_SHOPIFY_STORE_DOMAIN: ${{ vars.PUBLIC_SHOPIFY_STORE_DOMAIN }}` and
  `PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN: ${{ vars.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN }}`
  (repo Actions **variables**, set by the operator in K0). Build must stay green when
  they're unset (fork/PR builds) — K1's quiet degradation guarantees it.

**Done when:** workflow YAML is valid (`npm run build` locally is unaffected); after
the operator sets the repo variables and this merges, the deployed site has live
Storefront features AND the nightly refresh; a build without the vars still succeeds.

---

### K6 — Live nav menus: CLOTHES + OBJECTS subcategories mirror Shopify admin

**Why:** the hero menu's subcategories (OBJECTS' LIVING/KITCHEN/LIBRARY/SEATING,
CLOTHES' CATEGORIES + DESIGNERS) are hardcoded in `content.ts` and have already
drifted twice (H1, I2). Beckett wants them **identical to the live Shopify nav, now
and in the future** — when Ben adds/renames/removes a collection or menu entry in
admin, the site follows on its own. Depends only on K1 (`getMenu`).

**Files:** `src/components/blocks/HeroVideo.astro` (client script),
`src/lib/catalog.ts` or a small new `src/lib/menu.ts` if cleaner;
`src/data/content.ts` untouched (it IS the fallback).

- **Discover first:** with the token in `.env`, query the store's menus and identify
  the handle(s) feeding the live site's `wear`/`designers`/`objects` dropdowns
  (start with `main-menu`; inspect the item tree). Record the mapping in a comment.
- **Hydrate, don't rebuild:** on page load, fetch the relevant menus once and
  reconcile the DOM the server rendered from `content.ts`:
  - OBJECTS: replace the section's leaf items (labels + collection handles) with the
    live menu's entries, uppercase labels, same markup shape (`data-shop-all`,
    `data-collection`, `data-collection-label`) so existing wiring keeps working.
  - CLOTHES: same treatment for the CATEGORIES and DESIGNERS child lists (SHOP ALL
    stays pointed at the menu's shop-all entry).
  - Rebind/delegate the click handlers for replaced nodes — cleanest is switching
    the collection-button listener to EVENT DELEGATION on `.hero__menu` (one
    listener, survives any re-render) rather than the current per-button binding.
    Subgroup toggles (H2) and section headers must be untouched by the swap.
- **Equality guard:** if the live menu matches what's already rendered (the common
  case), do nothing — zero flicker. Reconcile only on real difference; if a
  reconcile happens while that section is open, the open/closed state of the
  section + subfolders is preserved.
- **Fallback:** no token / fetch fails / menu handle missing → `content.ts` menu
  stands, exactly as today. Never render an empty menu.
- **Operator note (surface, don't act):** once this ships, `content.ts`'s menu is a
  snapshot that only matters for the pre-hydrate paint and no-token builds — worth
  refreshing it occasionally, but drift no longer breaks anything.

**Done when:** build+check green; with the token set, the OBJECTS + CLOTHES
subcategories render exactly the live store's nav (verify against
shopandson.com's dropdowns); a menu entry renamed in admin shows renamed on next
page load with no redeploy; clicking hydrated entries opens populated catalogues
(including a collection created after the last build — K2's no-snapshot path);
without the token the menu is byte-identical to today's.

---

## PHASE L — chrome & editorial edits (L1–L3 independent of Phase K, any order;
L4 depends on K1+K3)

### L1 — Remove the footer entirely; legal links move into the about block

**Why:** Beckett cut the footer from the design. The homepage goes back to a pure
locked 100vh hero; the only footer content that survives is the legally required
minimum, tucked subtly into the bottom-left about block.

**Files:** `src/pages/index.astro`, `src/layouts/Base.astro`,
`src/components/Footer.astro` (DELETE), `src/components/blocks/HeroVideo.astro`
(about block + scroll-lock helper), `src/styles/global.css`,
`homepage/public/images/footer-chronicle.png` (DELETE).

- **Tear out H5 + J1 cleanly (they shipped together; reverse both):**
  - `index.astro`: drop `<Footer />` and the `footer` prop → `<Base landing>`.
  - `Base.astro`: delete the `footer` prop + `has-footer` class plumbing.
  - Delete `Footer.astro`, the chronicle PNG, and ALL footer CSS (`.site-footer*` /
    footer clone rules from H5).
  - global.css: delete the `has-footer` scroll-unlock rules AND the
    `.is-scroll-locked` re-lock rules (J1). End state: `html.landing` is
    unconditionally `overflow:hidden` again — ONE simple lock rule, no variants.
  - `HeroVideo.astro`: remove `updatePageScrollLock()` and its call sites +
    the `scrollTo(0,0)` guard — with the page permanently locked it's dead code.
    Nothing else in the stage/pager logic changes.
- **Legal links in the about block:** in `.hero-info`, under the contact `<p>`, add
  one final block:
  `<p class="hero-info__legal"><a …>refund policy</a> · <a …>privacy policy</a> ·
  <a …>terms of service</a></p>` linking out (full https, `rel="noopener"`, no
  `withBase`) to `https://shopandson.com/policies/refund-policy`,
  `/policies/privacy-policy`, `/policies/terms-of-service`.
  **Transitional:** L4 (after K1/K3 land) repoints these three hrefs at the
  IN-SITE policy page — the external URLs are the interim + no-token fallback.
  These three are the required set for a US store (privacy is legally required;
  refund terms must be conspicuous; ToS is the contract) — contact info is already
  the line above. **Subtle is the spec:** same mono font, ~1–2px smaller than the
  address lines, muted (e.g. `rgba(0,0,0,.55)`), lowercase, hover underline. It
  must read as part of the existing block, not a new element.
- Newsletter signup dies with the footer — intentional, don't relocate it.

**Done when:** build+check green; no footer anywhere; the homepage cannot scroll
(pure locked hero, as pre-H5); about block reads address → contact → three quiet
policy links that visually blend; links open the live policy pages; no orphaned
footer CSS/assets/props; other `landing` pages unaffected.

---

### L2 — MUSIC: single playlist entry, linked to Spotify

**Why:** the MUSIC panel lists three playlists; two are gone. What remains is the
official playlist, and it should actually link out to Spotify for anyone to play.

**Files:** `src/data/content.ts` (MUSIC section), `src/components/blocks/HeroVideo.astro`
(only if the item markup needs the external-link variant).

- In `heroMenu` MUSIC section: DELETE `WILLIAM FREDERICK PLAYLIST` and
  `SMALL TALK STUDIO PLAYLIST`. Keep `& SON OFFICIAL PLAYLIST` as the only item and
  give it `href: "https://open.spotify.com/playlist/6MD3a8wIY0582I3iWIngqE"`
  (strip the tracking params; the bare playlist URL is the durable link) — plus
  `external: true` semantics: renders as an `<a target="_blank" rel="noopener">`.
  The section keeps `music: true` (header click still opens the DJ stage); the
  playlist link is the item WITHIN the opened section.
- Check the item-rendering branch in `HeroVideo.astro`: an `href` item already
  renders as `<a>` — confirm it opens in a new tab for absolute URLs (add
  `target`/`rel` handling for external hrefs if missing; internal menu links, if
  any ever exist, must not inherit it).
- Leave the separate `music` content export (radio block copy) alone — it belongs
  to a non-homepage page.

**Done when:** build+check green; opening MUSIC shows the DJ stage and exactly one
menu item, `& SON OFFICIAL PLAYLIST`; clicking it opens the Spotify playlist in a
new tab; the two removed playlists are gone.

---

### L3 — & FAM: interview-series teaser (image + coming-soon line)

**Why:** & FAM stops being a category list. Opening it shows a single editorial
teaser: the &fam photo with a short series description — the same
menu-left / stage-right pattern as MUSIC's DJ panel.

**ASSET (operator provides):** Beckett saves the photo (the back tattoo — script
"&fam" with the small tree, matching the site's ampersand mark) to
`homepage/public/images/fam-tattoo.jpg`. If it's not there when you start, STOP and
flag — don't substitute anything.

**Files:** `src/data/content.ts` (& FAM section), `src/components/blocks/HeroVideo.astro`
(new `fam` stage), `src/styles/global.css`.

- **Menu:** delete all three interview items (`SMALL TALK STUDIO INTERVIEW`,
  `WILLIAM FREDERICK INTERVIEW`, `LIV RYAN INTERVIEW`). & FAM becomes a headerless
  section like PRE-ORDER: clicking `& FAM +` opens its stage directly (add a
  `fam: true` flag on the section, mirroring how `preorder`/`music` flags work; no
  `.hero__menu-panel` rendered).
- **Stage:** add a fourth panel stage `"fam"` to the existing machinery (extend
  `PanelStage`, `getStagePanel`, `getStageClass`, an `is-fam` hero class, an
  `openFam()` mirroring `openMusic()`). Same 550ms slide/exit conventions, same
  close behavior (closing via the section header toggle, matching MUSIC — reuse
  whatever close affordance MUSIC has; if MUSIC has none beyond the header, ditto).
- **Panel content (static markup in the component, right side of the hero):**
  - the photo, large, natural aspect ratio, no border — the visual anchor;
  - under it, in the site's mono/serif skin (match `.hero-info` type, slightly
    larger), lowercase editorial voice (the site is lowercase; Beckett's words,
    exactly, recased): `an interview series that takes an in-depth look at
    designers we carry like you've never seen them before, unless you're related
    to them.` then on its own line, styled as the quiet kicker: `coming soon…`
  - no other text, no placeholder links.
- Mobile: image scales to the panel, text below, no overflow.

**Done when:** build+check green; clicking `& FAM +` slides in the teaser panel
(photo + the two lines, correctly typeset); no interview items remain anywhere;
stage opens/closes/switches cleanly against catalog/preorder/music; other stages
unaffected.

---

### L4 — In-site policy pages (kills the last old-site content links)

**Why:** the goal is a fully separate storefront — the old Shopify-rendered site
should leave no visible trace beyond checkout itself. Shopify exposes the store
policies as CONTENT via the Storefront API (`shop { refundPolicy { title body }
privacyPolicy { title body } termsOfService { title body } }` — `body` is HTML,
straight from what Ben edits in admin → auto-updating like everything else).
Host them here. **Depends on K1 (client data layer) + K3 (the `bare` Base prop);
sequence it after K3 — it is NOT part of Wave 1.**

**Files:** new `src/pages/policies.astro`; `src/lib/storefront-client.ts` (add
`getPolicies()`); `src/components/blocks/HeroVideo.astro` (the three L1 hrefs).

- **One page, query-param routed** (same pattern as K3):
  `/policies/?policy=refund-policy | privacy-policy | terms-of-service`.
  `<Base bare>`, homepage skin: small uppercase mono title (the policy title from
  Shopify), the body HTML rendered inside a contained `.policy__body` wrapper
  (sane type styles, links styled per site, Shopify markup can't restyle the
  page) — injected through the K1 `sanitizeShopifyHtml()` helper — and a `← back`
  control like K3's. Nothing else on the page.
- `getPolicies()` in the client layer fetches all three in one query, cached for
  the session. Verify at implementation whether the `shop` policy fields need any
  scope beyond what K0 grants — flag if so.
- **Repoint the L1 links:** the three about-block hrefs become
  `withBase("/policies/?policy=<handle>")` (internal, no `target=_blank`).
- **Fallback:** unknown `?policy=`, fetch failure, or no token → the page shows a
  plain link out to the same policy on `https://shopandson.com/policies/…` (never
  a dead end, mirroring K3's fallback convention).

**Done when:** build+check green; all three policy links open in-site pages
showing the exact text from Shopify admin, typeset in the site skin; editing a
policy in admin shows on next load without a redeploy; without a token the pages
degrade to an outbound link; no `shopandson.com/policies` hrefs remain in the
about block.

---

### IDEA — "now playing in store" on the MUSIC stage (NOT scheduled; do NOT
build; last-pass item, revisit after Phases K/L/M ship AND Ben approves)

Concept: the MUSIC stage (DJ + notes) gains one quiet line — pulsing neon-green
dot, `now playing in store`, then `track — artist` (+ small album art), showing
what's live on the store's Spotify. The whole line deep-links to that track on
Spotify (visitors add it to their own playlists via Spotify's native UI — no
visitor login on our site; Spotify's dev-mode caps make on-site "add to
playlist" a dead end, deep-link is the design). Sits with the existing
`& SON OFFICIAL PLAYLIST` link.

**HARD requirement — store-hours gate:** the feature renders ONLY during store
hours (site config already has `hours`, America/New_York). Outside hours it
renders NOTHING — not "last played", not a placeholder — so Ben's personal
at-home listening is never displayed. Also hide when nothing is playing.

Two candidate architectures (decide at build time):
1. **Last.fm relay, zero backend (try first):** Ben one-time connects his
   Spotify to a free Last.fm account; the site reads Last.fm's public
   now-playing API client-side. No secrets to protect, no infra.
2. **Serverless relay (upgrade path):** a Cloudflare Worker (free tier) holds
   Ben's Spotify OAuth credential privately and exposes a sanitized
   `{track, artist, art, isPlaying}` JSON. Tighter real-time; one new moving
   part. The site component is identical either way — the data source is
   swappable.

**Ben's on/off switch (part of the idea):** a Shopify SHOP METAFIELD boolean
(e.g. namespace `site`, key `now_playing_enabled`, storefront access enabled),
read via the Storefront API like everything else. Ben gets a bookmark straight
to the field in admin: flip on/off → site follows on next load, no redeploy.
Display requires ALL THREE gates: switch on AND store hours AND actively
playing — otherwise the section doesn't render at all. This `site.*` flag
namespace is the pattern for any future operator toggles (one place, Ben's
existing login, zero new accounts).

Blocked on: Ben's approval + his one-time account connection. Historical note:
the retired v1 design mocked exactly this (`content.ts` `music.nowPlaying`).

---

### FUTURE — domain cutover (NOT scheduled; operator decision, recorded so
nothing built now blocks it)

End state: `shopandson.com` points at THIS site and the old Shopify storefront
disappears from public view. When Beckett + Ben call it: (1) the Pages site gets
the custom domain (repo Settings → Pages → custom domain; base path drops from
`/shop-and-son` to `/` — `withBase` everywhere is what makes that a config-only
change, keep it disciplined); (2) `PUBLIC_SHOPIFY_STORE_DOMAIN` and the
build-time `products.json` fetches switch to the store's `*.myshopify.com`
domain (the custom domain will no longer serve Shopify); (3) checkout continues
uninterrupted on Shopify's domain. Until then the old site stays live at
shopandson.com and the fallback/external links above remain correct.

---

## PHASE M — neon interaction language + the house film stage

The site's `--neon-green` (`#1faa2e`, global.css :root) graduates from a
click/active accent into the site-wide "this is clickable" language, the house
stencil joins it, and the house becomes the door to an about film.
**Operator priority: M3 > M2 > M1** — the film stage with its animation and
layout is the must-land; the green stencil recolor is best-effort (white fallback
acceptable, we circle back); M1 is polish.

### M1 — Universal neon-green hover on clickable text

**Why:** neon green currently marks the PRESSED/open state
(`.hero__menu-section.is-open > .hero__menu-header`, `.hero__menu-link.is-active`);
hover is just an underline. Beckett wants hover to ALSO read neon green — anything
clickable highlights green while the mouse is on it, and only while it's on it.

**File:** `src/styles/global.css` only.

- Wrap the new rules in `@media (hover:hover)` so touch devices never get a stuck
  green highlight.
- Add `color:var(--neon-green)` on `:hover` (keeping each element's existing
  underline behavior) to the homepage's clickable text: `.hero__menu-header`,
  `.hero__menu-subheader`, `.hero__menu-link[data-shop-all]` and menu `<a>` links
  (NOT the inert `<span>` placeholders — they aren't clickable and must not lie),
  the catalogue/preorder `×` close buttons, and `.hero__cart` (green icon on hover
  via `color`, since the SVG uses `currentColor`).
- Product cards: on card hover the title keeps its underline AND goes
  `var(--neon-green)` — same statement, same system.
- Active/pressed states are UNCHANGED (open section headers and `.is-active` links
  stay solid green); hover simply previews the same color. Where an element is
  already green from its active state, the hover is a no-op — fine.
- Do NOT touch non-homepage components (`TopBar`, legacy blocks use `--accent`
  orange — leave that ecosystem alone; this is the hero/homepage language).
  K3/K4's new surfaces (product page controls, cart drawer buttons/links) adopt
  the same hover convention when they land — one line in their CSS, whoever lands
  second wires it.

**Done when:** build+check green; mousing over any menu folder/category/link,
close button, cart icon, or product card shows neon green only during hover;
touch devices unaffected; open/active states look exactly as before.

---

### M2 — House stencil: white → neon green, and clickable

**Why:** the white house stencil over the hero video becomes a neon-green
interactive element — same color language as the menu — because in M3 it opens
the about film.

**Files:** `src/components/blocks/HeroVideo.astro` (stencil markup),
`src/styles/global.css`.

- **Recolor via CSS mask (keeps the PNG's alpha, no asset regeneration):** replace
  `<img class="hero__stencil" src=…>` with
  `<button type="button" class="hero__stencil" data-film-open aria-label="about
  & son"></button>` styled as: `mask-image:url(<withBase stencil png>)` (+
  `-webkit-mask-image`), `mask-repeat:no-repeat; mask-position:center;
  mask-size:contain`, `background-color:var(--neon-green)`, no border/appearance.
  Keep the EXACT sizing/centering/z-index the img rules have now
  (`inset:0; height:min(82vh,76vw); max-width:84vw; margin:auto`, mobile override
  ~`min(74vh,88vw)`), and keep `transform:translateX(0)` +
  `transition:transform .55s ease-in-out` — the stage exit/return
  (`.is-catalog/.is-preorder/.is-music` translateX and
  `returnStencilFromRight()`) must keep working byte-identically on the new node.
- **It's clickable now:** `pointer-events:auto` (was `none`), `cursor:pointer`.
  Hover (under `@media(hover:hover)`): brightness lift on the same green —
  `filter:brightness(1.28)` — the M1 statement adapted for an element that's
  already green. No underline games on a shape.
- **Fallback (operator's call: don't block on this):** if mask rendering
  misbehaves in the build, fall back to the plain white `<img>` inside the button
  (clickable, hover `opacity`), commit that, and FLAG it — the green recolor gets
  circled back to (e.g. as a pre-tinted PNG asset) without holding up M3.
- Script: `stencil` is currently queried as `HTMLElement` — the selector keeps
  working on a `<button>`; verify nothing assumed `<img>`.

**Done when:** build+check green; the house reads neon green over the video,
same size/position as today; hovering brightens it (hover-capable devices only);
stage open/close still slides it out left / returns it from the right exactly as
before; clicking it does nothing yet (M3 wires it) but shows the pointer.

---

### M3 — Click the house → the about film slides in

**Why:** the house is the site's front door; clicking it plays the shop's film.
Stencil exits left (the exact animation it already performs when a listing panel
opens), and the film slides in from the right, replacing the house, properly
oriented, at full quality. The user controls playback by hand.

**ASSET (operator confirms FIRST):** the film is
`archive/assets-src/about-original.mp4` (operator's machine; `archive/` is
reference-only, gitignored). `homepage/public/videos/new-about-homepage.mp4`
(4.9MB, currently referenced by NOTHING) is almost certainly the already-prepped
web copy — operator eyeballs it against the original. If it matches: use it
as-is. If not: operator re-encodes the original — H.264 high profile,
**CRF ≤ 20, keep the native resolution and aspect ratio, NO cropping**, AAC audio
kept — to `homepage/public/videos/about-film.mp4`. Quality is the priority;
letterboxing is fine, recropping is not. If neither exists when you start, STOP
and flag.

**Files:** `src/components/blocks/HeroVideo.astro` (new panel + stage wiring),
`src/styles/global.css`.

- **Fourth stage:** extend the machinery the same way & FAM's stage (L3) does —
  `PanelStage` gains `"film"`, plus `getStagePanel`/`getStageClass`/`is-film`
  cases and an `openFilm()` mirroring `openMusic()`. The stencil's exit rule
  gains `.is-film` alongside `.is-catalog/.is-preorder/.is-music` (house slides
  out LEFT, as it already does for listings); the film panel enters from the
  right using the same 550ms slide the other panels use; `closeStage()` returns
  the house from the right via the existing `returnStencilFromRight()`.
- **Trigger:** click on `[data-film-open]` (the M2 stencil button) →
  `setMenuSectionState(null); openFilm();`. Guard: only from the landing stage
  (the stencil is off-screen during other stages anyway). If L3 lands first,
  follow its stage-extension pattern; if not, this commit establishes it and L3
  follows suit — flag whichever way it falls in the log.
- **Panel:** `<aside class="hero__film" aria-hidden="true">` containing the
  `<video>` (src via `withBase`, `preload="metadata"`, NO `autoplay`, NO `loop`,
  NOT muted — playback is user-initiated so audio is allowed) and a `×` close
  button matching the catalogue's. **Layout: the video takes the house's place** —
  centered in the same box the stencil occupied (`inset:0; margin:auto;
  height:min(82vh,76vw); max-width:84vw`, mobile `min(74vh,88vw)`), rendered at
  its NATIVE aspect ratio (`object-fit:contain`, no crop, no distortion), above
  the background video (z-index like the other panels). No chrome, no border.
- **Manual play/pause, in-skin:** hide native controls. Clicking the video
  toggles play/pause; overlay ONE minimal control — a small lowercase mono label
  (`play` when paused, `pause` while playing — or ▶/❚❚ glyphs if cleaner)
  bottom-left of the video, neon-green on hover per M1, implemented as a real
  `<button>` for keyboard/screen-reader access. No scrubber, no volume UI.
- **Lifecycle:** pause the video whenever the stage exits — in `closeStage()` and
  on any `transitionToStage` away from `"film"` (menu header clicks that open
  other stages included). Reopening resumes from the paused position (don't
  reset `currentTime`). Cart icon: add `.is-film` to the existing
  hide-while-panel-open rule (the panel has its own `×`).
- Mobile: same centered box, tap toggles playback, close button reachable.

**Done when:** build+check green; clicking the green house slides it out left and
the film in from the right, centered where the house was, native aspect, sharp;
nothing plays until the user hits play; play/pause toggles by click and by the
button; `×` (or opening any menu section/stage) pauses the film and the house
glides back in from the right; switching to catalog/preorder/music from the film
stage is flicker-free; audio plays when the user plays.

---

### M3-rev — film panel: contain the video clear of the menu + visible play control

**Operator revision (2026-07-01, screenshot-verified):** the M3 film currently
uses `inset:0; margin:auto` (centres in the FULL viewport) so it spans into the
left menu column, overlapping the menu text + about block. This is a LAYOUT fix
only. **DO NOT touch the video file — no re-encode, no crop.** The displayed box
shrinks; the asset + its quality stay exactly as they are.

**Files:** `src/styles/global.css` (primary); `src/components/blocks/HeroVideo.astro`
only if the visible control needs a wrapper.

- **Confine right of the menu:** give `.hero__film` the same panel-geometry
  discipline as `.hero__catalog` — content area starts RIGHT of the menu:
  `left:max(30vw,240px)` (match `.hero__catalog`'s override), `top:0; right:0;
  bottom:0`, ~2vw right padding, vertically centred. Replace the `inset:0;
  margin:auto; aspect-ratio:16/9; max-height:47.25vw` centred-box model. The
  video sizes WITHIN that box: `max-height:~78vh`, `object-fit:contain`, native
  aspect (no crop, no distortion). It must NEVER overlap the menu column, the
  about block/legal links, or the cart/× zone, at any viewport width.
- **Keep the animation exactly as-is:** the film stays in the shared
  slide-in-from-right / exit-left behaviour (same transforms — the off-screen
  `translateX(calc(50vw + 100%))`, active `translateX(0)` via the shared
  `.is-film` rule, exit `translateX(-110%)`). Only the box geometry changes.
- **Visible play control:** a real `<button>` overlaid on the video, BOTTOM-LEFT
  OF THE VIDEO BOX (not the letterbox margin — wrap the `<video>` in a
  shrink-to-video frame if needed so the button and × sit on the video). Site
  skin: lowercase mono label `play` ⇄ `pause`, `aria-label`, neon-green on hover
  per M1 (`@media (hover:hover)` only). Clicking the video itself still toggles
  playback. Never autoplays; audio stays.
- **Mobile:** the box sits clear of the horizontal menu tabs (top offset like
  the catalog/preorder mobile rule `top:clamp(88px,16vh,132px); left:0; right:0`),
  full available width, `contain`; × reachable.

**Done when:** build+check green; the film opens fully inside its panel area with
the menu column completely clear (native aspect, sharp); the visible button
toggles play/pause and highlights green on hover; × and every stage switch still
pause the film and glide the house back; mobile sane.

---

### M3-rev2 — film presence + classic centered play control + mute toggle

**Operator revision (2026-07-01, screenshot-verified after M3-rev):** layout is
clear of the menu, but the film reads too small (dead paper both sides) and the
controls should be a classic centered play/pause + a bottom-left mute. **Video
FILE untouched, as always.** Files: `src/styles/global.css`,
`src/components/blocks/HeroVideo.astro`.

1. **PRESENCE — the video dominates the area right of the menu.** Size it
   **width-first**: the video fills the panel's available width, up to
   `max-height:~86vh`, whichever binds first, native aspect (`contain`, no crop).
   Trim dead space — the gap between the menu column's right edge and the video's
   left edge should be a modest margin (~2–3vw), visually similar to the right
   margin; pull the panel's left edge in (e.g. `left:max(27vw,240px)`) if needed,
   **but the menu column incl. expanded CLOTHES must stay completely clear** at
   every width. Vertically centered. **Slide animations unchanged.**

2. **CENTERED CLASSIC PLAY/PAUSE** (replaces the current bottom-left text button
   as the playback control). Classic glyphs — **solid triangle ▶ play, two bars
   ⏸ pause** — flat/minimal, blends with the site (NO player chrome, NO circles;
   ink-style glyph with a subtle legibility treatment over the footage — e.g. a
   soft shadow/halo, not a background pill), ~56–64px, centered in the video
   frame. Real `<button>`, `aria-label`. **Exact state machine:**
   - **Before first play:** centered ▶ visible + persistent. **Never autoplays** —
     user must press it.
   - **Playing:** all controls vanish (like a normal player). Clicking anywhere on
     the video pauses.
   - **Paused** (user clicked the video or the glyph): centered icon reappears and
     STAYS until playback resumes. **Per operator spec the paused state shows the
     PAUSE icon (⏸)** — implement as written **and FLAG in the log** for operator
     verify (conventional players show ▶ when paused; one-glyph swap if he wants
     it flipped after seeing it).
   - **Hover** (hover-capable only): the centered glyph goes neon-green (M1).
   - Clicking the glyph toggles playback in every state.

3. **MUTE TOGGLE bottom-left** (replaces the play/pause text button that lives
   there now — SAME position + style: lowercase mono text, real `<button>`,
   neon-green on hover). Label reflects state and click toggles it: `sound on`
   (default — audio audible once playing) ⇄ `sound off` (muted), wired to
   `video.muted`. Persist the choice while the stage stays open; **reset to
   `sound on` (unmuted) when the stage fully closes** (`closeStage`).

**Done when:** build+check green; the film commands the space right of the menu
(minimal dead paper both sides, native aspect, sharp, menu untouched at every
width incl. CLOTHES fully expanded); the centered classic control follows the
state machine exactly and greens on hover; bottom-left is now `sound on`/`sound
off` in the old button's style; × and stage switches still pause the film and
glide the house back; mobile sane.

---

### M3-rev3 — film: larger still, re-centered off the right edge, bigger sound toggle

**Operator revision (2026-07-01, screenshot after rev2).** `src/styles/global.css`
ONLY (geometry + control sizing). **Video FILE and the rev2 control
behaviour/state machine stay EXACTLY as they are** (no JS, no glyph/markup
changes, no touching the play/pause state machine or the mute wiring).

1. **GEOMETRY.** Current: the video hugs the RIGHT viewport edge (right margin
   ≈0) with dead space pooled on the menu side (root cause: `.hero__film-video`
   uses `width:100%` + `max-height:86vh` + `object-fit:contain`, so when the cap
   binds the video pillarboxes instead of filling). Invert it — the video gets
   LARGER and sits balanced in the region right of the menu:
   - **LEFT:** small ~2vw gap between the menu column and the video's left edge
     (menu incl. FULLY-EXPANDED CLOTHES stays completely clear — hard constraint
     at every width; `left:max(27vw,240px)` is the starting point, nudge out only
     if CLOTHES overlaps).
   - **RIGHT:** a real ~4–5vw margin between the video's right edge and the
     viewport — it must no longer touch/crowd the right edge (add `right:4.5vw`,
     drop the old `padding:0 2vw 0 0`).
   - **SIZE / fill:** kill the pillarbox by giving `.hero__film-frame`
     `aspect-ratio:16 / 9` (the asset is exactly 16:9) with `width:100%`,
     `max-height:~88vh`, `margin:auto` — so the frame fills the box width-first,
     caps at 88vh on very wide/short viewports, and the video (`width:100%;
     height:100%; object-fit:contain`) fills the frame edge-to-edge with NO dead
     space and the ×/mute/centre buttons land on the true video corners. Net:
     bigger than rev2 in both dimensions, commanding, balanced not right-hugging.
   - **Vertical:** centered. × stays top-right ON the frame; **slide transforms
     stay byte-identical** (only left/right insets + frame sizing change).

2. **SOUND TOGGLE — a known feature, not a whisper.** Same bottom-left position
   on the video, same lowercase-mono style + `sound on`⇄`sound off` behaviour,
   but visibly LARGER: ~13–14px font with comfortable padding / larger hit area,
   **min ~44px touch target**. Keep/STRENGTHEN the subtle backing so it stays
   legible over any footage (e.g. bump the translucent bg, keep the border).
   Neon-green on hover unchanged.

**Done when:** build+check green; the film opens large and centered in the space
right of the menu — small consistent ~2vw gap to the menu, clear ~4–5vw margin to
the right edge, nothing overlapped, native aspect, sharp; the rev2 centered
play/pause state machine is UNTOUCHED and still greens on hover; the sound toggle
reads at a glance and greens on hover; × and stage switches still pause + glide
the house back; mobile unaffected or improved.

---

### Phase K + L + M risks / review focus (Claude checks these on every diff)

- **Row pager regression (K2):** measured offsets must survive resize, re-render,
  and the clamp when a live refresh shrinks a collection.
- **Race conditions (K2/K4):** stale collection fetch painting over a newer panel;
  double-click add-to-cart double-adding (disable button while a mutation is in
  flight).
- **Menu hydration (K6):** replaced DOM must keep every behavior — shop-all wiring,
  subgroup toggles, aria state; event delegation is the guard. No flicker when the
  live menu equals the snapshot.
- **Footer revert (L1):** H5+J1 touched Base, index, HeroVideo, and global.css —
  the removal must leave NO orphans (props, classes, dead helpers, unused CSS,
  the 1.1MB chronicle PNG) and must not disturb the other `landing` pages' lock.
- **Stencil node swap (M2):** the img→button swap must not break the stage
  exit/return transforms or `returnStencilFromRight()`'s inline-style dance —
  test open/close of every stage after the swap.
- **Stage proliferation (L3+M3):** two commits both extend `PanelStage` — whoever
  lands second rebases on the first's pattern; the exit/enter matrix (any stage →
  any stage) must stay flicker-free, and media (film video) must pause on every
  exit path.
- **Hover honesty (M1):** green hover ONLY on things that actually respond to a
  click — never on inert spans; and only under `@media(hover:hover)`.

### SECURITY posture (standing rules, every phase)

The architecture is the main defense: static files, no server, no database, no
customer accounts, no payment handling (PCI is Shopify's problem). Keep it that
way, plus:
- **Admin credentials never ship.** `SHOPIFY_API_KEY`/`SHOPIFY_API_SECRET` are
  used by NOTHING in these phases; they must never appear in client code, build
  output, workflow files, or the GitHub variables page. Only the two `PUBLIC_`
  Storefront values (public-by-design, minimal scopes) are ever exposed.
- **One HTML gate.** All admin-authored HTML goes through
  `sanitizeShopifyHtml()` (K1); all plain-text fields render via `textContent`.
  No other `innerHTML` of fetched data, ever.
- **No new dependencies without cause.** The client data layer, cart, and
  sanitizer are all plain fetch/DOM — do not add npm packages for them. Any new
  dependency gets flagged to the operator in the log with why.
- **Storage stays anonymous.** localStorage holds the cart ID only — never
  email, names, addresses, or anything personal.
- **Operator-side (not Codex):** 2FA on the GitHub account and Ben's Shopify
  admin; branch protection on `main` (PR-only, no force-push) so a stolen laptop
  ≠ a hijacked live site; Dependabot alerts on for the repo.
- **Base path (K2/K3):** every internal URL through `withBase`/`BASE_URL` — a bare
  `/product/` link 404s on Pages.
- **Token absence:** every live feature must no-op gracefully — the deployed site
  before K0/K5 land must look exactly like today, minus nothing.
- **Skin discipline:** no new fonts, no preorder-site CSS leakage; paper/black/
  uppercase; `descriptionHtml` styles contained so Shopify markup can't restyle the
  page.

---

## COMMITTED ON DEV — Phase I (I1–I3)

> Committed on `dev` (3a7fff1, 97c57a5, 75aa11b); awaiting operator verify. Kept below
> for reference.

**Task:** Phase I — cart icon + OBJECTS listings fix + about-block relocation.
THREE independent sub-tasks (I1–I3), one focused commit each. Scope: `homepage/` only.

Ground truth = a live scan of **shopandson.com** on 2026-07-01.

---

### I1 — Cart icon, top-right, links out to the Shopify cart

**Why:** add the store's cart to the homepage, top-right, linking to the live Shopify
checkout cart. The homepage renders in `landing` mode (no `TopBar`), so the icon must
live inside the hero itself.

**Files:** `src/components/blocks/HeroVideo.astro`, `src/styles/global.css`.

- Add a cart link inside `.hero-video`, pinned top-right, on a layer above the video and
  the menu overlay:
  `<a class="hero__cart" href="https://shopandson.com/cart" target="_blank" rel="noopener" aria-label="Cart">…icon…</a>`.
  It links **OUT** to the live store (absolute URL — do NOT use `withBase`).
- Use the **EXACT cart icon from the live shopandson.com header.** `web_fetch` strips
  inline SVG, so pull it from **view-source**: on your machine fetch the raw HTML of
  `https://shopandson.com/`, find the header `<a href="/cart">…</a>`, and copy its inline
  `<svg viewBox="…"><path d="…"/></svg>` **verbatim** into the component. (It's a
  shopping-**bag** motif — the live drawer reads "Shopping Bag".)
- Style `.hero__cart` minimal + brutalist to match the hero ink: black icon ~20–24px,
  `pointer-events:auto`, subtle hover (opacity/underline). Desktop ~`top:4vh; right:2vw`;
  pick a sane mobile spot. **Must not collide** with the catalogue/pre-order `×` close
  buttons — keep clear of them (or hide the cart while a panel with its own close is
  open, operator to verify).
- If the exact SVG can't be retrieved, drop in a clean single-path shopping-bag line icon
  as a placeholder and flag it for operator swap.

**Done when:** build+check green; a cart icon sits top-right of the homepage; clicking it
opens `https://shopandson.com/cart`; the icon matches the live header's cart; no collision
with panel close buttons.

---

### I2 — OBJECTS categories open empty — fix the build fetch

**Why:** OBJECTS → SHOP ALL / LIVING / KITCHEN / LIBRARY / SEATING open an empty
catalogue. **The handles are already correct** and every one resolves with live stock
(verified 2026-07-01):
- SHOP ALL → `house-1` (48 live) · LIVING → `house` (11) · KITCHEN → `kitchen` (5) ·
  LIBRARY → `library` (11) · SEATING → `seating` (6).

So this is **not** a handle/data problem — it's a **build-time fetch** problem. These
five collections are fetched LAST (after ~43 clothing + designer collections), and
`src/lib/catalog.ts` swallows any failed/rate-limited fetch as `[]`
(`catch → return []`), so throttled late requests silently render empty grids.

**Files:** `src/lib/catalog.ts` (primary). Confirm `content.ts` OBJECTS handles are
unchanged — they're correct.

- **Reproduce first:** run `npm run build` and read the `[catalog] Failed to fetch …`
  warnings — confirm the OBJECTS handles are the ones returning non-OK / empty.
- **Fix resilience:** in `fetchCatalogProducts`, add retry-with-backoff (2–3 attempts,
  increasing delay) on non-OK responses (esp. HTTP 429) and network errors before giving
  up; honor `Retry-After` if present; consider modestly raising `FETCH_SPACING_MS`. Keep
  the graceful final `[]` ONLY after retries are exhausted (a real outage still must not
  break the deploy).
- **Re-verify:** rebuild and confirm all five OBJECTS categories return the counts above.

**Note (surface, don't act):** the bare handles `living`, `objects`, `ceramics`,
`lighting` are EMPTY on the live store — do NOT switch to them. `house` (11) is the
correct backer for LIVING despite its confusing title.

**Done when:** build+check green; each OBJECTS category opens a populated catalogue with
the counts above; the build log shows no swallowed failures for those handles.

---

### I3 — About block: remove the animation, dock it in-flow at the bottom of the menu

**Why:** after H3 the about block is absolutely pinned and **overlays the menu text**
when CLOTHES is fully expanded (CATEGORIES + DESIGNERS open) — the "duplicate text"
overlap. Beckett wants **no animation**, and the block to sit **in-flow at the very
bottom of the menu column** (below PRE-ORDER) with the agreed margin gap, revealed by
scrolling **down** when the expanded menu is tall — never overlapping.

Target reading when CLOTHES is fully open:
`CLOTHES − (SHOP ALL / CATEGORIES− … / DESIGNERS− …) → OBJECTS + → MUSIC + → & FAM + →
PRE-ORDER + → [gap] → 138 sullivan st… / contact:…`

**Files:** `src/components/blocks/HeroVideo.astro` (move `.hero-info`),
`src/styles/global.css` (`.hero-info`, `.hero__overlay`).

- **Kill the animation:** delete the H3 downward keyframe / `transform` / `transition`
  and every `.hero-video.is-catalog/.is-preorder/.is-music/:has(.hero__menu-section.is-open)
  .hero-info` hide-or-animate rule. The block is now permanently static and always in flow.
  (Tagline already removed in H3 — keep only address + contact.)
- **Relocate:** move `.hero-info` to be the LAST child INSIDE the scrolling menu column
  (`.hero__overlay`), directly after the `</ul>` of `.hero__menu`, so it flows beneath
  PRE-ORDER. Give it a top margin = the agreed gap between the last menu section and the
  about block.
- **Layout:** make `.hero__overlay` a flex column with `overflow-y:auto`; give
  `.hero-info` `margin-top:auto` so it rests at the bottom of the column when the menu is
  short, and flows right after PRE-ORDER (scroll down to reveal) when the menu is tall.
  It must NEVER overlay menu text.
- **Scroll:** the column is top-anchored — CLOTHES stays "locked in" at the top; the
  column only scrolls DOWN far enough to reveal the about block (no over-scroll past it).
  This replaces the old scroll behavior. Ensure the previously pinned/absolute about block
  no longer exists.
- **Mobile:** keep the about block sensible on the mobile menu (at the end / not
  overlapping).

**Done when:** build+check green; with CLOTHES fully expanded the menu reads as the target
above with the address at the bottom and **no overlap**; the block has no animation;
scrolling down reveals it; CLOTHES stays anchored at the top.

---

## Log (Phase K — Codex appends newest at top)

- 2026-07-02 — Phase L4: in-site policy pages /policies/?policy= — d9ff640 — build:green check:green (Claude re-ran: 0/0/6; 4 pages now — dist/policies/index.html builds; shop-policy query proven live: refundPolicy/privacyPolicy/termsOfService all returned, no extra scope). storefront-client.ts: added getPolicies() (ONE query for all three shop policies, keyed by handle, module-level Promise memo = one fetch/session, quiet null on unconfigured/error) + exported ShopPolicy/ShopPolicyLookup types. NEW src/pages/policies.astro (<Base bare>): reads ?policy, validates against allowed set {refund-policy,privacy-policy,terms-of-service}; states loading / fallback (invalid/unconfigured/missing → outbound link to shopandson.com/policies/<handle> or /policies, target_blank noopener — never a dead end) / loaded (uppercase-mono title via textContent + body via sanitizeShopifyHtml into contained .policy__body); ← back like K3, no cart icon (minimal). HeroVideo.astro: the three L1 about-block legal links REPOINTED from external https://shopandson.com/policies/... (target_blank) → internal withBase("/policies/?policy=<handle>") same-tab; grep confirms NO shopandson.com/policies hrefs remain. global.css .policy-page*/.policy__body (paper skin, contained Shopify-HTML typography, M1 neon hover, no new fonts). Reviewed clean by Claude. committed @ d9ff640 — pushed to origin/dev. Next per order: K4 (cart — the verify-gate).
- 2026-07-02 — Phase K3: product detail page /product/?handle= — 6fa12ec — build:green check:green (Claude re-ran: 0/0/6; 3 pages now — dist/product/index.html builds with product-detail markup; getProduct query proven live in K2). Base.astro: additive `bare?` prop (TopBar+IndexOverlay gated on !landing && !bare; NO landing class → page scrolls). storefront-client.ts: added exported sanitizeShopifyHtml(html) — DOMParser, removes script/iframe/object/embed/form + all on* attrs + javascript: href/src, returns body.innerHTML, guards empty. NEW src/pages/product.astro (<Base bare>): client-driven — reads ?handle, states loading / not-found ("this piece is no longer listed"+home link) / unconfigured (fallback link to shopandson.com/products/<handle>) / loaded. Desktop grid 55/45: gallery left (all images stacked full-width edge-to-edge, first eager+fetchpriority high, rest lazy, srcset+sizes), sticky detail panel right (vendor→title→price→variants→add→desc). Variant selector general (one row per option, per-value buttons, is-selected inverted, unavailable disabled+strikethrough via candidate-variant resolution; single-variant → no selector, auto-select). Add-to-cart: sold-out→disabled "sold out"; else dispatches CustomEvent cart:add {variantId,quantity}; INTERIM when !window.__cartReady → renders as "buy on shopandson.com" link (new tab, noopener) so no dead button pre-K4. descriptionHtml via sanitizeShopifyHtml into .product-detail__desc (contained typography: img/video max-width, table borders); plain fields via textContent. Reuses the exact icon-bag cart SVG + formatMoney(already-formatted prices from getProduct). global.css .product-detail* (paper skin, no new fonts, no preorder CSS): sticky 2-col desktop, single-col mobile (sticky off), M1 neon hover on all controls. Reviewed clean by Claude (full page + Base + sanitizer read). committed @ 6fa12ec — pushed to origin/dev. K3 is NOT a gate (K4 is) — proceeding to L4.
- 2026-07-02 — K2 GATE PASSED (re-verify after admin data fix). Diagnosis had found the paper-box "in-stock imageless clothing" was NOT a code bug: the SONNY one-pocket-shirt-in-sand (and 40+ others) were Headless-only PHANTOM imports — 404 on the Online Store product page + products/<handle>.json, absent from the products.json snapshot, present on Storefront with featuredImage null. Ben removed them from the Headless channel in admin. Claude re-verified end-to-end (live API, no code change): Storefront clothing-1 now = 342 products, 0 imageless, 342 unique handles — EXACTLY matching the Online Store snapshot (342 products, 342 imaged). Prices one-decimal ("1045.0" etc.) → unified formatMoney → "$1045"; sold-out = genuine availableForSale (155); clothing-1 description empty → title-only (designer collections carry descriptions, e.g. hender-scheme tannery note). Paper-box resilience kept (correct if data drifts). Standing data rule added to "The model" section (Headless publication set must mirror Online Store; imageless/unknown products ⇒ check channel publication FIRST). K2 (c68cfc9) + K2-fix (76ebf36) now pushed to origin/dev. Proceeding to K3.
- 2026-07-02 — Phase K2-fix: align live mapper with K2 card shape + unify price + refresh resilience (operator remote-review found 2 live bugs; Claude live-API diagnosis found a 3rd) — 76ebf36 — build:green check:green (Claude re-ran: 0/0/6; formatter unit-checked: "295.0"/"295.00"→"$295", "295.5"/"295.50"→"$295.50", non-USD→"295 EUR"). ROOT CAUSES: (1) storefront-client formatMoney used `.replace(/\.00$/,"")` but Storefront returns one-decimal "295.0" → "$295.0" (snapshot showed "$295") → visible mismatch AND perpetual re-render (price always differed in the diff); (2) **Storefront API returns NO images (featuredImage null + images empty) for the main CLOTHING collections (clothing-1 verified) while designer collections (hender-scheme-1) DO** → naive live re-render blanked clothing images. FIX: catalog.ts formatPrice→exported formatMoney(amount,currencyCode) (numeric: int→"$295", else toFixed(2)); storefront-client deletes its local formatMoney, imports the shared one, uses it in mapCatalogProduct + getProduct variant prices — ONE formatter, snapshot+live can't drift. CatalogProduct handle/available/imageAspect confirmed REQUIRED. HeroVideo: getCardAspect() guards NaN/<=0→0.75; card factory paper-box (rgba(247,244,235,.72)) when image missing (holds space, no collapse); reconcileLiveProducts(live,snapshot) — per handle, if a live product has no image but the snapshot does, PRESERVE the snapshot image/srcset/aspect (live refresh never downgrades) → clothing keeps its snapshot images; diff + render use the reconciled list so an unchanged collection is a true no-op. Reviewed clean by Claude (full diff, formatter unit-checked, live API cross-checked). committed @ 76ebf36 — ready for operator verify. Not pushed. **FLAG (data, not code):** clothing/category collections have NO images on the Headless channel — until Ben publishes their product media to the Headless channel in admin, live-refresh RELIES on the snapshot image (fine for existing products; a brand-new clothing product with no snapshot would show a paper box). Designer collections are unaffected.
- 2026-07-02 — PROTOCOL NOTE — Wave 3 parked-vs-shipped mixup: operator intended Wave 3 held for visual verify, but PR #7 (which the operator merged) had already shipped it (+ dormant K1) to main. Resolution: operator chose LEAVE IT LIVE (option a). New standing rule added to the Handshake (step 6): nothing merges to main without an explicit "ship &lt;wave&gt;" naming the wave; a ship PR must not quietly carry other in-flight work.
- 2026-07-02 — K0 OPERATOR PREREQ DONE — Storefront token live in homepage/.env (Headless channel PUBLIC token; scopes read_product_listings + read/write_checkouts + read_content). Claude validated against https://shopandson.com/api/2025-01/graphql.json (token never printed): (a) products(first:2) → real products ✓; (b) cartCreate → cart id + checkoutUrl ✓; (c) menu(handle:"main-menu") → FULL live nav tree ✓ — **`main-menu` is the K6 handle** (structure: clothing→clothing-1 + 11 category children; objects→house-1 + 4 object brands [binu-binu, danny-ds-mud-shop, mark-patrick-harrington, shino-takeda]; designers→/pages/designers + 32 designer collections). Old SHOPIFY_STOREFRONT_API_TOKEN left empty (build uses public products.json). GitHub Actions Variables for deploy still pending → that's K5.
- 2026-07-02 — Phase K2: catalogue whitespace-free cards + sold-out + in-site links + collection description + live refresh — c68cfc9 — build:green check:green (Claude re-ran: 0 err/0 warn/6 hints; live collection query proven: getCollection('hender-scheme-1') returns title + tannery description + products w/ availableForSale + native dims). catalog.ts: CatalogProduct += handle/available/imageAspect; ShopifyVariant.available + ShopifyImage.width/height; PRODUCT_CAP 60→250 + paged fetch (products.json?limit=250&page=N until a short page, graceful [] on page failure); mapProduct populates the 3 new fields (available = any variant available; imageAspect = w/h or 0.75). storefront-client.ts (allowed single touch): getCollection's mapCatalogProduct now also fills handle/available/imageAspect. HeroVideo.astro: client CatalogProduct interface extended; BASE=import.meta.env.BASE_URL; getProductHref → `${base}/product/?handle=${encodeURIComponent(handle)}` same-tab (product page is K3 — link 404s until then, expected); createProductCard sets --card-aspect per card + is-sold-out class + appends 'sold out' corner label when !available; MEASURED PAGER — setRowIndex now reads target row.offsetTop → sets --catalog-row-offset px (replaces uniform --catalog-row-index * -100%), + window resize listener re-applies; renderCatalogHeader (title + '—' separator + 2-line-clamp description spans); renderCatalogRows(products, targetRowIndex) preserves rowIndex; SWR live refresh — paint snapshot → getLiveCollection (per-collection cached Promise Map) → race-guard (hero.dataset.activeCollection) + hasLiveCatalogChanged (description present OR product JSON differs, image compared by pathname) → re-render header+rows. global.css: .product-card__media loses border+gradient/letterbox, gains aspect-ratio:var(--card-aspect) + overflow:hidden; img object-fit contain→cover; is-sold-out img opacity:.55; .product-card__sold-out corner tag (mono uppercase, white bg, bordered); .hero__catalog-title flex baseline w/ muted 2-line-clamp description + separator; track transform → translateY(var(--catalog-row-offset)) flex-column w/ gap; rows/cards top-aligned natural height; mobile media aspect-ratio var too. Reviewed clean by Claude (all 4 files, full read). committed @ c68cfc9 — **ready for operator verify (K2 verify-gate: catalogue visuals + live refresh)**. Not pushed. Next per order: K3.
- 2026-07-01 — Phase K1: client-side Storefront data layer — b0b6a3c — build:green check:green — NEW src/lib/storefront-client.ts (420 lines, browser-safe: fetch/AbortController/URL/import.meta.env, no Node APIs) + catalog.ts (exported getSizedShopifyImageUrl + getShopifyImageSrcset, keyword-only) + .env.example (PUBLIC_SHOPIFY_STORE_DOMAIN / PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN, commented, no values). Exports: isStorefrontConfigured, storefrontFetch<T> (POST /api/2025-01/graphql.json, X-Shopify-Storefront-Access-Token, non-OK→null, GraphQL errors[]→null, 10s AbortController, timeout cleared in finally), getCollection (cursor pagination past 250, maps to current CatalogProduct shape via imported helpers, returns {title,description,products}), getMenu (parses /collections/<handle> abs+rel → collectionHandle else href, [] unconfigured), getProduct (full detail, exports ProductDetail + ProductImage/ProductOption/ProductVariant types for K3/K4). formatMoney strips .00, USD→$ else `amount CODE`. Every fn guards isStorefrontConfigured + try/catch → null/[] (quiet degradation). Reviewed clean by Claude (read full module). NOTE: homepage/.env has NO PUBLIC_ token yet (K0 not done) → live fetch not testable; acceptance = build-green + graceful degradation, both confirmed. mapCatalogProduct targets the CURRENT CatalogProduct shape (handle/available/imageAspect are added by K2, not K1 — correct sequencing). committed @ b0b6a3c — NOT pushed (holding so PR #6 stays Wave-1-only). Awaiting operator: (a) merge PR #6, (b) confirm PUBLIC_ token in homepage/.env before K2+.

- (empty)

## Log (Phase L — Codex appends newest at top)

- 2026-07-01 — Phase L1: footer removed entirely; legal links into about block — aedac2b — build:green check:green (Claude re-ran independently: 0 err/0 warn/6 pre-existing hints) — reverses H5+J1 cleanly. index.astro → <Base landing> (Footer import+usage dropped); Base.astro footer prop + has-footer plumbing deleted (landing/TopBar/IndexOverlay behavior intact); Footer.astro DELETED + footer-chronicle.png (1.1MB) git-rm'd; legacy.astro Footer import+usage removed too (REQUIRED — it rendered <Footer/>, deleting the component would break its build; legacy is the non-live full-scroll page). global.css: 3-variant lock (has-footer unlock + is-scroll-locked re-lock) collapsed to ONE rule `html.landing,html.landing body{overflow:hidden;height:100%}`; all 76 lines of .site-footer* clone CSS deleted. HeroVideo.astro: updatePageScrollLock() + all 4 call sites (setMenuSectionState, both transitionToStage paths, closeStage) + scrollTo(0,0) guard removed — stage/pager logic otherwise byte-identical. Added <p class="hero-info__legal"> under contact: refund/privacy/terms policy links, &middot;-separated, full https target=_blank rel=noopener (no withBase), muted rgba(0,0,0,.55) 10px (9px mobile), hover-underline. Newsletter died with footer (not relocated, intentional). Orphan grep clean (only match is an unrelated 'Footer line on the card' comment in content.ts). Reviewed clean by Claude. committed @ aedac2b — ready for operator verify. Not pushed. NOTE: page is now permanently locked (pure 100vh hero, pre-H5 state) — operator should click every stage open/close + confirm no scroll.
- 2026-07-01 — Phase L3: & FAM interview-series teaser stage (Wave 3; copies M3's stage pattern) — 5fb0f1f (code) + fam photo asset (prior commit) — build:green check:green (Claude re-ran independently: 0 err/0 warn/6 hints; confirmed dist/images/fam-tattoo.jpg + hero__fam markup in dist/index.html; grep confirms ZERO interview items remain anywhere). ASSET: fam photo found at archive/assets-src/& son homepage assets/& fam-tatoo.jpg, copied → public/images/fam-tattoo.jpg (1721×2295 portrait, committed separately). content.ts: added fam? flag to HeroMenuSection; & FAM section — 3 interview items DELETED, fam:true, items:[] (headerless like PRE-ORDER). HeroVideo.astro: data-fam attr + panel guard `!section.preorder && !section.fam` (no menu-panel); 5th stage 'fam' mirrors M3's 'film' exactly — HeroStage/PanelStage unions, getStagePanel→famPanel, getStageClass→'is-fam', is-fam in both returnStencilFromRight lists + clearStencilReturn + cart-hide + stencil exit-left, famPanel query, openFam() (mirrors openMusic), closeStage aria-hidden, section-header isFamSection branch → openFam. NO × close (closes via & FAM header re-click, matching MUSIC); no video ⇒ no pause logic. <aside class="hero__fam">: <img withBase(/images/fam-tattoo.jpg) alt="& fam" no border> + copy <p> (verbatim: 'an interview series that takes an in-depth look at designers we carry like you've never seen them before, unless you're related to them.') + kicker <p> 'coming soon…' (serif italic muted). CSS: centered portrait column (width:min(34vw,48vh)), enter-from-right 550ms, is-fam active + exit-left rules, mobile override. Codex Chrome-verified open/close/switch + stencil out-left/return. Reviewed clean by Claude (full diff). committed @ 5fb0f1f — ready for operator verify. Not pushed.
- 2026-07-01 — Phase L2: MUSIC single Spotify playlist — 21a5aeb — build:green check:green — content.ts + HeroVideo.astro; deleted WILLIAM FREDERICK PLAYLIST + SMALL TALK STUDIO PLAYLIST, kept & SON OFFICIAL PLAYLIST with bare href https://open.spotify.com/playlist/6MD3a8wIY0582I3iWIngqE; music:true preserved (header still opens DJ stage). HeroVideo: added isExternalHref=^https?:// gating target=_blank rel=noopener on BOTH the top-level item <a> and the child <a> branches — internal base-relative (/…) links correctly do NOT inherit _blank. Radio-block `music` export untouched. Reviewed clean by Claude. committed @ 21a5aeb — ready for operator verify. Not pushed.

## Log (Phase M — Codex appends newest at top)

- 2026-07-01 — Phase M3-rev4: enlarge film video, tighter left / bigger right margin (operator revision) — 951cce8 — build:green check:green (Claude re-ran: 0 err/0 warn/6 hints) — global.css .hero__film ONLY, two values: left max(27vw,240px)→max(19vw,232px) (video left edge ~5vw from the menu text which ends ~14vw — reduced dead gap), right 4.5vw→7vw (more margin to page edge). Box ~68.5vw→~74vw so the aspect-ratio:16/9 frame grows the video in both dims (still width-bound, under the 88vh cap). Per operator: sound toggle (.hero__film-toggle) + × (.hero__film-close) NOT scaled — untouched, controls stay their rev3/rev3b size on the now-larger video. Transforms + mobile override (left:0/right:0) untouched. Reviewed clean by Claude. committed @ 951cce8 — ready for operator verify. Not pushed. Note: if the left ~5vw gap still reads too wide (or 19vw ever crowds expanded CLOTHES on some width), it's a one-value nudge.
- 2026-07-01 — Phase M3-rev3b: enlarge film × close to match rev3 controls (operator follow-up) — 671c6fe — build:green check:green — global.css .hero__film-close only: width/height 30→44px, font 22→28px (line-height 26px→1), bg .22→.5, added display:inline-flex + align/justify center so the × stays centered in the bigger box; position/border/color/z-index/neon-hover unchanged. Reviewed clean by Claude. committed @ 671c6fe — ready for operator verify. Not pushed.
- 2026-07-01 — Phase M3-rev3: film larger/re-centered off right edge + bigger sound toggle (operator revision) — 184b2ad — build:green check:green (Claude re-ran: 0 err/0 warn/6 hints) — global.css ONLY (video file + rev2 JS/state-machine/markup untouched). GEOMETRY: .hero__film right:0→4.5vw (real right margin), padding:0 2vw 0 0→0, left stays max(27vw,240px) (~2vw menu gap); .hero__film-frame now aspect-ratio:16/9 + width:100% + max-width:calc(88vh*16/9) + max-height:88vh + margin:auto — the 16:9 frame fills the box width-first, precisely caps at 88vh tall, centered; .hero__film-video width:100%/height:100%/object-fit:contain fills the frame edge-to-edge (both 16:9 → NO pillarbox, root cause of rev2's dead-paper/right-hug fixed) so ×/mute/centered controls sit on the TRUE video corners. Bigger both dims, balanced. Transforms byte-identical. SOUND TOGGLE .hero__film-toggle: display:inline-flex/align-items:center/min-height:44px, padding 4px7px→9px12px, font 12→14px, bg .22→.5 (stronger legibility), border + neon hover kept. Reviewed clean by Claude. committed @ 184b2ad — ready for operator verify. Not pushed.
- 2026-07-01 — Phase M3-rev2: film presence + classic centered play/pause glyph + bottom-left mute (operator revision) — 1a31085 — build:green check:green (Claude re-ran: 0 err/0 warn/6 hints) — video file UNTOUCHED (HeroVideo.astro + global.css only). PRESENCE: .hero__film left:max(30vw→27vw,240px); .hero__film-frame + .hero__film-video now width:100% (width-first, fills panel width), max-height 78vh→86vh, object-fit contain native aspect — video now commands the space, minimal side dead paper. CENTERED PLAYBACK: new <button class="hero__film-playback" data-film-playback> centered in frame (62px, 58px mobile), two inline-SVG glyphs (filled triangle --play / two rounded bars --pause), ink #000 with white drop-shadow halo for legibility (no chrome/circle), neon-green on hover (@media hover:hover). State machine via updateFilmPlayback + filmHasStarted flag: hidden=isPlaying (controls vanish while playing); default(no class)=▶; .is-paused-after-start (filmHasStarted && paused)=⏸; filmHasStarted set on first 'play'; clicking glyph OR video toggles. MUTE: bottom-left .hero__film-toggle repurposed to data-film-mute, same lowercase-mono style + neon hover; label 'sound on'⇄'sound off' wired to video.muted; resetFilmMute() (muted=false) on init + closeStage + on leaving film via transitionToStage. Reviewed clean by Claude (full diff). committed @ 1a31085 — ready for operator verify. Not pushed. FLAGS for operator: (1) PER SPEC the PAUSED-after-start state shows the PAUSE glyph ⏸ (conventional players show ▶ when paused) — one-glyph swap (.is-paused-after-start rule) if you want it flipped after seeing it; (2) 'all controls vanish while playing' implemented as the CENTERED playback glyph hiding while playing — the × and mute stay accessible (so you can close/mute without pausing first); say if you want those to auto-hide-on-play + reveal-on-hover too; (3) mute also resets to sound-on when you switch from film to another stage (not just on ×) — matches 'reset when the stage closes'.
- 2026-07-01 — Phase M3-rev: film panel contained clear of the menu + visible play control (operator revision, screenshot-verified) — 5b4e851 — build:green check:green (Claude re-ran: 0 err/0 warn/6 hints) — LAYOUT ONLY, video file untouched (only HeroVideo.astro + global.css changed). .hero__film re-geometried from inset:0/margin:auto (centred in full viewport → spilled into menu) to position top:0/right:0/bottom:0/left:max(30vw,240px) (matches .hero__catalog), flex-centred, padding 0 2vw 0 0 — confined RIGHT of the menu, never overlapping menu/about/cart. Slide transforms KEPT byte-identical (off-screen translateX(calc(50vw+100%)), shared active translateX(0), shared exit translateX(-110%)). New wrapper <div class="hero__film-frame"> (position:relative; inline-flex; fit-content; max-height:78vh) shrink-wraps the video so the × (top-right) + play/pause (bottom-left) buttons anchor to the VIDEO corners, not the letterbox — buttons' own CSS unchanged, just reparented. Video: width/height auto, max-width:100%, max-height:78vh, object-fit:contain (native aspect, no crop). .hero__film-toggle:hover stays neon-green in the @media(hover:hover) group; video-click toggle + updateFilmToggle unchanged; no autoplay, audio stays. Mobile: .hero__film top:clamp(88px,16vh,132px)/left:0/right:0, padding 0 4vw (clear of horizontal menu tabs), frame+video max 100%. Reviewed clean by Claude (full diff). committed @ 5b4e851 — ready for operator verify. Not pushed. ASSET HOUSEKEEPING (operator decisions): new-about-homepage.mp4 DELETED (unused, superseded) — commit prior; about-film.mp4 kept at 32MB (preload=metadata → downloads only on demand) — CANDIDATE FOR A LATER OPTIMIZE PASS (lighter encode) when convenient, not blocking.
- 2026-07-01 — Phase M2b: stencil white by default, neon-green on hover (operator revision to M2) — 58e8030 — build:green check:green — global.css 2 lines: .hero__stencil background-color var(--neon-green)→#ffffff (white house as before, via mask fill); hover rule filter:brightness(1.28)→background-color:var(--neon-green) inside @media(hover:hover). Now matches the menu-text hover language (white→green only while hovered, signals clickable); touch devices stay white (no stuck green). Mask/sizing/aspect-ratio/transform/exit-left untouched. Reviewed clean by Claude. committed @ 58e8030 — ready for operator verify. Not pushed.
- 2026-07-01 — Phase M3: click house → about film stage (Wave 3; establishes the 4th-stage pattern L3 copies) — 0e5a442 (code) + 32d2e21 (asset) — build:green check:green (Claude re-ran independently: 0 err/0 warn/6 hints; confirmed dist/videos/about-film.mp4 (32MB) + hero__film markup in dist/index.html). ASSET DECISION (operator asked which path): new-about-homepage.mp4 REJECTED — ffprobe showed a different 17.7s cut (vs master 64.4s), 1920×1080 not native, and NO audio track (spec requires audio). Encoded fresh from master about-original.mp4 → public/videos/about-film.mp4: H.264 high, CRF20, native 2048×1152 (16:9), no crop, AAC stereo audio copied, +faststart; 32MB (large but quality was the stated priority). CODE (HeroVideo.astro + global.css): added 'film' to HeroStage+PanelStage; getStagePanel/getStageClass/is-film; element queries filmPanel/filmVideo/filmToggle/filmClose/filmOpen; is-film added to both returnStencilFromRight class-lists + the cart-hide rule + the stencil exit-left rule (house slides out left). openFilm() mirrors openMusic(). Trigger: [data-film-open] (M2 button) guarded to landing-only → setMenuSectionState(null)+openFilm(). <aside class="hero__film"> = <video src=withBase(/videos/about-film.mp4) preload=metadata playsinline, no autoplay/loop/muted, controls hidden> + × close [data-film-close] + lowercase-mono play/pause [data-film-toggle] bottom-left (real buttons, M1 neon hover). Manual playback: click video OR toggle → play/pause; play/pause/ended events keep the label synced; play() promise .catch guarded. PAUSE ON EVERY EXIT verified: transitionToStage pauses when previousStage==='film' (menu-header switch) AND closeStage pauses + resets label; currentTime NEVER reset → reopen resumes from position. Panel box = stencil's (height:min(82vh,76vw)/max-width:84vw) but aspect-ratio:16/9 + max-height:47.25vw so the film shows at native 16:9 centered where the house was, object-fit:contain no crop; enters-from-right 550ms; z-index:2; mobile override. Reviewed clean by Claude (full script+CSS read). committed @ 0e5a442+32d2e21 — ready for operator verify. Not pushed. Operator: (a) browser-verify the film↔catalog/preorder/music/landing matrix is flicker-free + audio plays on user-initiated play; (b) 32MB asset — fine per quality priority, flag if you want a lighter encode; (c) superseded new-about-homepage.mp4 (4.95MB, tracked, now unused) can be deleted — left in place pending your OK.
- 2026-07-01 — Phase M2: house stencil white→neon-green + clickable (Wave 3, out of order, operator-authorized) — 193e0b8 — build:green check:green — HeroVideo.astro + global.css. <img class="hero__stencil"> → <button type="button" class="hero__stencil" data-film-open aria-label="about & son" style="--stencil-mask-url:url('<withBase /images/hero-stencil.png>')"> (base-aware mask URL via inline CSS var). CSS: background-color:var(--neon-green) + mask-image/-webkit-mask-image:var(--stencil-mask-url), mask-repeat:no-repeat/position:center/size:contain (+ -webkit-); button reset (border:none/appearance:none/padding:0/display:block); pointer-events none→auto + cursor:pointer; @media(hover:hover) filter:brightness(1.28). KEY: added aspect-ratio:1547/1600 — required because an empty <button> has no intrinsic ratio (an <img> did), and it matches hero-stencil.png's EXACT native dims (verified 1547×1600 via sips) → box ratio == mask ratio, contain fills with no letterbox, clickable area == visible green shape, same size/position as the old img. Preserved byte-identical: inset:0/height:min(82vh,76vw)/max-width:84vw/margin:auto/z-index:1, transform:translateX(0)+transition:transform .55s, the exit-left rule (.is-catalog/.is-preorder/.is-music), and returnStencilFromRight()'s inline-transform dance (script queries stencil as HTMLElement, uses only style.transform/.transition/offsetWidth/transitionend — no <img> assumptions). Green mask used (no fallback). Click does nothing yet — M3 wires data-film-open. Reviewed clean by Claude. committed @ 193e0b8 — ready for operator verify. Not pushed. Operator: visually confirm the green house renders (mask is runtime, not build-checkable) + hover brightens.
- 2026-07-01 — Phase M1b: persistent neon-green on OPEN sub-folder headers — 7dcfa82 — build:green check:green — global.css one-liner (operator feedback on Wave 1): added `.hero__menu-item--group.is-open > .hero__menu-subheader{color:var(--neon-green)}` at line 482, immediately after the top-level analog (`.hero__menu-section.is-open > .hero__menu-header`), OUTSIDE the @media(hover:hover) block (line 506) so it's a persistent open-state, not hover. CATEGORIES + DESIGNERS subheaders now stay green while expanded, collapse back to ink — mirroring the top-level section header. Reviewed clean by Claude. committed @ 7dcfa82 — shipped with Wave 1.
- 2026-07-01 — Phase M1: universal neon-green hover on clickable homepage text — 76c1c30 — build:green check:green — global.css only. Consolidated (not just added): removed the old scattered unguarded `:hover{text-decoration:underline}` rules (.hero__cart, .hero__preorder-close, .hero__catalog-close, .product-card__title, .hero__menu-header, .hero__menu-link, .hero__menu-subheader) and rebuilt them inside ONE @media (hover:hover) block adding color:var(--neon-green). Hover honesty verified: uses `a.hero__menu-link:hover` (anchor-only prefix) + `.hero__menu-link[data-shop-all]:hover` so the inert <span> placeholders are excluded (they also lose their old misleading hover-underline — correct). .hero__cart green via currentColor. Active/pressed states untouched (.is-open>.hero__menu-header, .hero__menu-link.is-active stay solid green). No TopBar/--accent touched. Reviewed clean by Claude. committed @ 76c1c30 — ready for operator verify. Not pushed.

## Log (Phase J — Codex appends newest at top)

- 2026-07-01 — Phase J1: footer scroll gated to clean hero state — 1bae334 — build:green check:green — HeroVideo.astro + global.css only; added updatePageScrollLock() (clean = activeStage==='landing' && no .hero__menu-section.is-open → toggles .is-scroll-locked on <html>; scrollTo(0,0) on lock-engage; no-hero guard), called from setMenuSectionState, both transitionToStage paths, and closeStage; CSS html.landing.has-footer.is-scroll-locked{overflow:hidden;height:100%} (homepage-only, source-ordered to win), other landing pages untouched, inner scroll contexts (menu overflow, catalogue pager, preorder iframe) + overscroll-behavior:contain unchanged. Reviewed clean by Claude. committed @ 1bae334 — ready for operator verify. Not pushed.

## Log (Phase I — Codex appends newest at top)

- 2026-07-01 — Phase I3: about block in-flow at bottom of menu column, no animation — 75aa11b — build:green check:green — HeroVideo.astro + global.css only; moved .hero-info to be last child inside <nav class="hero__overlay"> (line 182, after </ul> of .hero__menu, sibling to it); deleted all H3 keyframes/transform/transition + the .is-catalog/.is-preorder/.is-music/:has(...is-open) animate rules + the now-moot reduced-motion .hero-info block; .hero__overlay now display:flex flex-direction:column, .hero-info margin-top:auto (docks bottom when menu short) + .hero__menu margin-bottom:clamp(30px,5vh,54px) gap (covers tall-menu case); removed the old absolute positioning + H3 padding-bottom hack; overscroll-behavior-y:contain; top-anchored so CLOTHES stays locked at top, scroll down reveals block, no overlap. Mobile: .hero-info flows at end (font-size:10px). Reviewed clean by Claude (confirmed DOM: .hero-info is direct flex child of .hero__overlay). committed @ 75aa11b — ready for operator verify. Not pushed. FLAG: mobile menu is horizontal-tab layout — worth a quick visual check that the docked about block reads sensibly there.
- 2026-07-01 — Phase I2: OBJECTS empty-fetch fix (retry/backoff in catalog.ts) — 97c57a5 — build:green check:green — catalog.ts only; FETCH_SPACING_MS 125→250; added retry-with-backoff in fetchCatalogProducts (3 attempts, exp backoff 500ms→8s cap), honors Retry-After (seconds or HTTP-date), AbortController 15s timeout, graceful [] only after retries exhausted, single warn w/ attempt count. content.ts handles UNCHANGED. Verify rebuild: all 5 OBJECTS categories populate — house-1:48, house:27, kitchen:5, library:11, seating:6 (no swallowed failures). Reviewed clean by Claude. committed @ 97c57a5 — ready for operator verify. Not pushed. FLAGS for operator: (a) the empty-OBJECTS failure did NOT reproduce in this build session (rate-limiting is intermittent) — resilience fix is preventive; (b) LIVING/`house` returns 27 from products.json vs the expected 11 (raw feed includes sold-out; filtering to available variants ≈14) — left as-is per I2 scope (fetch-only); decide separately if you want in-stock filtering / a different LIVING backer.
- 2026-07-01 — Phase I1: cart link top-right, out to Shopify cart — 3a7fff1 — build:green check:green — HeroVideo.astro + global.css only; <a class="hero__cart" href="https://shopandson.com/cart" target=_blank rel=noopener> as first child of .hero-video (z5, top:4vh right:2vw, black 22px). SVG is VERBATIM from the live header (fetched /tmp/sas.html around <a class="cart-icon--bubble" id="cart-link" href="/cart">, icon-bag shopping-bag). Collision handled: cart hidden (opacity:0/visibility:hidden/pointer-events:none) on .is-catalog + .is-preorder (panels with their own ×); left visible on .is-music (no × there). Mobile override present. Reviewed clean by Claude. committed @ 3a7fff1 — ready for operator verify. Not pushed.

## SHIPPED ON DEV — Phase H (H1–H5)

> Committed on `dev`; operator confirmed the changes are made. Kept for reference.

**Status:** shipped
**Task:** Phase H — homepage accuracy pass. FIVE independent sub-tasks (H1–H5).
Do them **in order, one focused commit each** (5 commits), running `npm run build`
**and** `npx astro check` green after every one. Scope: `homepage/` only.

Ground truth for all data below = a live scan of **shopandson.com** on 2026-07-01
(its `wear` + `designers` dropdowns and its `/collections/<handle>/products.json`
feeds). Every handle listed here was verified to resolve with real stock.

---

### H1 — Fix Shopify data (correct handles + real designer/category lists)

**Why:** our menu shows designers the store no longer lists ("hallucinated"), and
several collection handles are wrong, so the catalogue pulls the wrong/empty feeds.
Fix `src/data/content.ts` so CLOTHES + OBJECTS mirror the live store's dropdowns.

**File:** `src/data/content.ts` (the `heroMenu` array only).

**Replace the entire `CLOTHES` section `items` with this** (order matches the live
`wear` + `designers` dropdowns exactly; note `CATEGORIES` loses its old `suffix:" |"`
— the +/− indicator now comes from the component in H2):

```ts
{
  label: "CLOTHES",
  items: [
    { label: "SHOP ALL", collection: "clothing-1", collectionLabel: "CLOTHES — SHOP ALL" },
    {
      label: "CATEGORIES",
      children: [
        { label: "JACKETS / OUTERWEAR", collection: "jackets-outerwear", collectionLabel: "JACKETS / OUTERWEAR" },
        { label: "SHIRTS · BUTTONS / SNAPS", collection: "shirts-with-buttons-snaps", collectionLabel: "SHIRTS · BUTTONS / SNAPS" },
        { label: "KNITWEAR", collection: "knitwear", collectionLabel: "KNITWEAR" },
        { label: "TEES", collection: "tees", collectionLabel: "TEES" },
        { label: "TROUSERS", collection: "trousers", collectionLabel: "TROUSERS" },
        { label: "SHORTS", collection: "shorts", collectionLabel: "SHORTS" },
        { label: "SHOES & ACCESSORIES", collection: "accessories", collectionLabel: "SHOES & ACCESSORIES" },
        { label: "SUNGLASSES", collection: "sunglasses", collectionLabel: "SUNGLASSES" },
        { label: "APOTHECARY", collection: "apothecary", collectionLabel: "APOTHECARY" },
        { label: "JEWELRY", collection: "jewelry", collectionLabel: "JEWELRY" },
      ],
    },
    {
      label: "DESIGNERS",
      children: [
        { label: "ANCELLM", collection: "ancellm", collectionLabel: "ANCELLM" },
        { label: "AN IRRATIONAL ELEMENT", collection: "an-irrational-element", collectionLabel: "AN IRRATIONAL ELEMENT" },
        { label: "ARCHIE", collection: "archie", collectionLabel: "ARCHIE" },
        { label: "BLANC YM", collection: "blanc-ym", collectionLabel: "BLANC YM" },
        { label: "CARTER YOUNG", collection: "carter-young", collectionLabel: "CARTER YOUNG" },
        { label: "CONFECT", collection: "confect", collectionLabel: "CONFECT" },
        { label: "DE DAM FOUNDATION", collection: "de-dam-foundation", collectionLabel: "DE DAM FOUNDATION" },
        { label: "DOCUMENT", collection: "document", collectionLabel: "DOCUMENT" },
        { label: "FACTORS", collection: "factors", collectionLabel: "FACTORS" },
        { label: "FAIRLY NORMAL", collection: "fairly-normal", collectionLabel: "FAIRLY NORMAL" },
        { label: "GRAZIANO & GUTIÉRREZ", collection: "graziano-gutierrez", collectionLabel: "GRAZIANO & GUTIÉRREZ" },
        { label: "HENDER SCHEME", collection: "hender-scheme-1", collectionLabel: "HENDER SCHEME" },
        { label: "MATSUFUJI", collection: "matsufuji", collectionLabel: "MATSUFUJI" },
        { label: "MITTAN", collection: "mittan", collectionLabel: "MITTAN" },
        { label: "MONOSTEREO", collection: "monostereo", collectionLabel: "MONOSTEREO" },
        { label: "NEVER CURSED", collection: "never-cursed", collectionLabel: "NEVER CURSED" },
        { label: "OSHIN", collection: "oshin", collectionLabel: "OSHIN" },
        { label: "PARATODO", collection: "paratodo", collectionLabel: "PARATODO" },
        { label: "POLYPLOID", collection: "polyploid", collectionLabel: "POLYPLOID" },
        { label: "REFOMED", collection: "refomed", collectionLabel: "REFOMED" },
        { label: "RICE NINE TEN", collection: "rice-nine-ten", collectionLabel: "RICE NINE TEN" },
        { label: "SAGE NATION", collection: "sage-nation", collectionLabel: "SAGE NATION" },
        { label: "SMALL TALK", collection: "small-talk", collectionLabel: "SMALL TALK" },
        { label: "SILPHIUM", collection: "silphium-1", collectionLabel: "SILPHIUM" },
        { label: "SONNY", collection: "sonny", collectionLabel: "SONNY" },
        { label: "SOSHIOTSUKI", collection: "soshi-otsuki", collectionLabel: "SOSHIOTSUKI" },
        { label: "SUB SUN", collection: "sub-sun", collectionLabel: "SUB SUN" },
        { label: "URU", collection: "uru", collectionLabel: "URU" },
        { label: "WILLIAM ELLERY", collection: "william-ellery", collectionLabel: "WILLIAM ELLERY" },
        { label: "WILLIAM FREDERICK", collection: "william-frederick", collectionLabel: "WILLIAM FREDERICK" },
        { label: "Y — YLEVE", collection: "y-by-yleve", collectionLabel: "Y — YLEVE" },
        { label: "YAHAE", collection: "yahae-1", collectionLabel: "YAHAE" },
      ],
    },
  ],
},
```

Changes vs current: SHOP ALL `clothing`→`clothing-1`; HENDER SCHEME `hender-scheme`→
`hender-scheme-1`; SILPHIUM `silphium`→`silphium-1`. **Dropped** (not on the live
dropdown): AURORA, BINU BINU, HEREU, SAMUEL FALZONE, SATTA, SEVEN X SEVEN.
**Added** (live dropdown, verified stock): ANCELLM, BLANC YM, CONFECT, DE DAM
FOUNDATION, DOCUMENT, FACTORS, GRAZIANO & GUTIÉRREZ, MITTAN, POLYPLOID,
SOSHIOTSUKI, SUB SUN, WILLIAM ELLERY, Y — YLEVE. Delete the old commented-out
"hidden — no current listings" designer lines (11.11, KUON, XENIA TELUNTS, YUKETEN —
all verified empty; keep them out).

**OBJECTS section:** change only SHOP ALL's collection `house`→`house-1`
(the real "shop all house" feed, 32 items). Leave LIVING/KITCHEN/LIBRARY/SEATING
as-is (all resolve with stock). Leave the commented-out TABLES/LIGHTING/FURNITURE
out (verified empty).

**Operator note (surface, don't act unless told):** the live `wear` dropdown also
has a **SALE → `clothing-sale`** entry (27 items) that we omit to match Beckett's
pasted category list. Also `Y — YLEVE` is shown on the live nav simply as "y" — I
expanded it for clarity; say if you want the bare "Y".

**Done when:** build + check green; opening CLOTHES → CATEGORIES/DESIGNERS lists the
exact labels above; clicking each pulls a non-empty catalogue (no 404/empty grids).

---

### H2 — Collapsible CATEGORIES / DESIGNERS sub-folders

**Why:** today, opening CLOTHES dumps the full CATEGORIES + DESIGNERS lists at once.
Beckett wants CLOTHES to expand to just two collapsed sub-folders — **`CATEGORIES +`**
and **`DESIGNERS +`** — each of which expands on click to reveal its children (toggle
to `–` when open), same +/− convention as the top-level sections.

**Files:** `src/components/blocks/HeroVideo.astro` (group markup + script),
`src/styles/global.css`.

- **Markup:** for a group item (`item.children?.length`), render the label as a real
  toggle **button** (not a span): `class="hero__menu-subheader"`,
  `aria-expanded="false"`, `data-menu-subgroup`, containing the label + a
  `<span class="hero__menu-subtoggle">+</span>`. Keep the existing
  `<ul class="hero__menu-nested">` of children, but it is now hidden by default and
  shown only when the group is open.
- **Script:** add a listener for every `[data-menu-subgroup]` → toggles `.is-open` on
  its parent `.hero__menu-item--group`, swaps the subtoggle text `+`⇄`–`
  (en-dash `–`, matching `setMenuSectionState`), and updates `aria-expanded`.
  Sub-folders are **independent** (CATEGORIES and DESIGNERS can each be open or closed
  on their own). When a CLOTHES section closes/reopens, reset its sub-folders to
  collapsed. Do NOT disturb the collection-button (`data-shop-all`) click wiring on
  the leaf links.
- **CSS:** nested list visibility now keys off the GROUP, not the section:
  `.hero__menu-item--group .hero__menu-nested{display:none}` and
  `.hero__menu-item--group.is-open .hero__menu-nested{display:block}`. Update/replace
  the current desktop rules (around the `.hero__menu-section.is-open .hero__menu-nested`
  / `…--group > .hero__menu-link` block, ~lines 498–514) so they no longer force the
  nested lists open when the section opens. Style `.hero__menu-subheader` to match the
  current group-label look (uppercase, ~`clamp(10px,.95vw,13px)`, `cursor:pointer`,
  no button chrome) with the `+/–` toggle sitting after the label like the section
  headers. SHOP ALL (a leaf, no children) stays a plain link — unaffected.

**Done when:** build + check green; opening CLOTHES shows `SHOP ALL`, `CATEGORIES +`,
`DESIGNERS +`; clicking a sub-folder expands its list and flips to `–`; the two toggle
independently; leaf links still open the catalogue.

---

### H3 — About block: drop tagline + downward dock, always visible

**Why:** the bottom-left store-info block currently slides off-screen and hides the
moment anything opens. Beckett wants it to instead animate **downward** and dock at
the **very bottom of the left menu column**, staying visible on every open panel, with
a clear margin between it and the last menu section. And the tagline line is removed.

**Files:** `src/components/blocks/HeroVideo.astro` (`.hero-info` markup),
`src/styles/global.css` (`.hero-info` rules ~lines 799–828, `.hero__overlay`).

- **Remove the tagline** `<p>mostly clothes,<br />some objects,<br />and a little
  music</p>` entirely. `.hero-info` keeps only the address `<p>` and the contact `<p>`.
  (Leave the separate `content.ts` `about.cardFoot` string alone — it's unused by the
  hero; only the hero markup matters here.)
- **Always visible + downward animation:** delete the hide rules that currently set
  `.hero-video.is-catalog/.is-preorder/.is-music/:has(.hero__menu-section.is-open)
  .hero-info { transform:translateX(-100% - 6vw); visibility:hidden }`. The block must
  stay visible in every state. Replace the horizontal slide with a **downward** motion:
  when a section/stage opens (or closes), the block animates in vertically — it slips
  down out of view and drops back into its docked bottom-left spot (e.g. a keyframe
  from `translateY(120%)`/opacity 0 → `translateY(0)`/opacity 1, ~.55s, matching the
  existing stage timing). End state: docked bottom-left, fully visible.
- **Docked at the very bottom with a margin gap:** keep `.hero-info` pinned
  bottom-left (`position:absolute; left:5.7vw; bottom:6vh; z-index:3`), and ensure a
  visible gap between the scrolling menu and the about block — add enough
  `padding-bottom` to `.hero__overlay` (≥ the about block's height + a subtle margin)
  so a long expanded menu never sits flush against or behind the about block. It reads
  as a distinct block at the base of the menu column (as in Beckett's mockup, under
  `PRE-ORDER +`).
- Preserve `prefers-reduced-motion` handling (no transform animation under reduce; just
  show it docked and visible).

**Done when:** build + check green; landing shows address + contact (no tagline); the
block stays visible when CLOTHES/OBJECTS/MUSIC/PRE-ORDER open; its entrance is a
downward drop, not a sideways disappearance; there's clear space between the menu and
the about block; reduced-motion users see it static + visible.

---

### H4 — Product cards: stop cropping + enlarge the catalogue

**Why:** some Shopify product photos come back oddly cropped/"corrupt" because the
card forces `object-fit:cover`. Show each image at its true aspect ratio, uncropped.
Also enlarge the catalogue into the empty left space (but not too much).

**File:** `src/styles/global.css`.

- **No crop:** change `.product-card__media img{ … object-fit:cover }` (~line 449) to
  `object-fit:contain`, so the whole product image shows at its native aspect ratio and
  is never cropped or distorted. Keep `width:100%; height:100%` and the existing media
  background so the contained image reads intentionally (letterbox is fine). Do NOT
  change the fixed-height 3-up row grid — the row pager must keep working.
- **Enlarge into the empty left area:** the catalogue currently starts at
  `left:max(36.5vw,260px)` (shared `.hero__catalog,.hero__preorder` rule ~line 367).
  Give **`.hero__catalog`** its own wider override — `left:max(30vw,240px)` — so the
  product panel eats further into the empty space and the cards grow. Optionally trim
  `.hero__catalog` left padding slightly. Keep it moderate ("not too much"): the open
  menu column (enlarged headers) must stay clear and uncrowded. **Leave
  `.hero__preorder` at its current `left:max(31vw,220px)`** — this change is
  catalogue-only.

**Done when:** build + check green; product images display fully (no cropping/odd
crops) at their real aspect ratios; the catalogue is visibly larger, eating into the
left space, without colliding with the expanded menu; pre-order panel unchanged; row
paging still works.

---

### H5 — Footer: scroll-to-reveal, clone the real shopandson.com footer

**Why:** add the real site footer. Beckett wants the homepage to **scroll down past the
full-screen hero to reveal the footer at the bottom** (hero stays as screen one), and
the footer to **clone the live shopandson.com footer's look**, not just its content.

**Files:** `src/layouts/Base.astro` and/or `src/pages/index.astro` (enable scroll +
mount footer), new `src/components/Footer.astro`, `src/styles/global.css`, asset into
`homepage/public/images/`.

- **Enable scroll on the homepage without losing the locked hero.** Today
  `html.landing, html.landing body{ overflow:hidden; height:100% }` (global.css ~line
  20) hard-locks the landing page. Allow vertical page scroll on the homepage so the
  100vh hero remains the first screen and the footer sits directly beneath it. Cleanest:
  add a distinct flag/class for "landing hero + footer" (e.g. index passes a `footer`
  prop, or a `has-footer` class on `<html>`) that keeps `landing` behavior (no TopBar,
  no IndexOverlay) but removes the `overflow:hidden`/`height:100%` lock. Do NOT globally
  un-lock other `landing` pages. The hero's in-panel wheel paging (catalogue) must keep
  working — the footer is only reached by scrolling the page.
- **Mount the footer** after `<HeroVideo />` on the index page (inside the Base slot),
  as a new `Footer.astro` component.
- **Footer content — exact, from the live site (all links go OUT to shopandson.com,
  external, `rel="noopener"`, full https URLs — do NOT use `withBase`):**
  - **Newsletter block:** the "& son chronicle" logo image, an italic tagline
    *"be the first to know about new product, pop ups & the general going ons of &
    son"*, an email input, and a **Subscribe** button. Save the logo into
    `homepage/public/images/footer-chronicle.png` (source:
    `https://shopandson.com/cdn/shop/files/chronicle_outline_png.png?v=1761744479`) and
    reference via `withBase("/images/footer-chronicle.png")`. Wire Subscribe to
    Shopify's newsletter (a standard Shopify customer newsletter form POST to
    `https://shopandson.com/contact#contact_form`, `form_type=customer`,
    `contact[tags]=newsletter`); if that's fiddly, a plain email field that submits to
    the store is acceptable — flag it for operator review.
  - **Primary link row:** `contact` → `/pages/contact`, `return policy` →
    `/pages/customer-service`, `about` → `/pages/about`, `& son radio` →
    `/pages/son-radio`, `gift card` → `/products/gift-card`, `social` →
    `https://www.instagram.com/shopandson/` (all prefixed `https://shopandson.com`
    except social).
  - **Policy bar:** `Refund policy` → `/policies/refund-policy`, `Privacy policy` →
    `/policies/privacy-policy`, `Terms of service` → `/policies/terms-of-service`,
    `Contact information` → `/policies/contact-information`, plus a region label
    `US ($)`.
  - **Copyright:** `© 2026 Shop And Son`.
- **Clone the look (operator chose visual-clone, not just content):** replicate the live
  footer's structure/visual rhythm — centered newsletter block up top (chronicle logo,
  italic line, email + subscribe), then the primary links, then a bottom bar with the
  policy links + region + copyright. Paper/white background, black text, generous
  spacing. Aim to match the live footer's proportions; the operator will verify visual
  fidelity on `dev` and we iterate.

**Done when:** build + check green; the homepage scrolls past the hero to a footer that
visually reads like the live shopandson.com footer; newsletter + all links present and
pointing to the correct live URLs; hero/stage interactions unaffected; other `landing`
pages still locked.

---

### QUEUED (do not start — blocked)

- **Phase C2 — always-current data.** SUPERSEDED by Phase K (K1/K2 implement exactly
  this: client-side Storefront fetch over the `PUBLIC_` vars). Kept for history only.

### SHIPPED / committed on dev (awaiting operator verify + deploy)
- **Phase A** — hero menu type → 2/3. Committed `a2f93f8`, pushed, in PR #1 (`dev → main`).
- **Phase B** — clean hero video + separate centered stencil overlay layer (`.hero__stencil`). Committed `f4276a8` (assets + HeroVideo.astro + CSS). Claude verified via a composited preview frame. NOT yet pushed (kept off PR #1 until operator verifies).
- **Phase C1** — catalogue interaction + slide animation + mock product grid. Committed `47ded3b`. Claude reviewed clean. NOT yet pushed (kept off PR #1 until operator verifies). C2 (live Shopify) still blocked on token + handles.

---

## Brief template (Claude fills this in)

```
**Status:** ready for Codex
**Task:** <one-line summary>
**Files / area:** <paths or component(s) under homepage/>
**What to change:** <precise, ordered steps>
**Style / structure constraints:** <fonts, colors, spacing, markup shape>
**Done when:** npm run build + npx astro check green; <task-specific check>
```

---

## Log (Codex appends newest at top: date — task — result/commit)

- 2026-07-02 — K4: Storefront Cart API + on-site drawer — this commit — build:green check:green — new cart.ts Storefront Cart API module (hydrate from andson:cart-id, cartCreate/lines add-update-remove, no-token no-ops, cart:updated/cart:open wiring), new CartDrawer.astro (drawer, scroll lock, line controls, checkoutUrl handoff, badges), homepage/product cart buttons rewired + drawer mounted, global.css drawer/badge styles. FLAG: homepage cart button stays hidden during catalogue/preorder stages per I1 collision CSS, so adding from a catalogue view still opens the drawer even though the icon is hidden; whether the icon should stay visible in panels is an operator call. Not pushed.
- 2026-07-01 — Phase H5: scroll-to-reveal footer, visual clone of shopandson.com — ffce968 — build:green check:green — index.astro (Base landing footer + <Footer/>), Base.astro (footer? prop → has-footer on html/body, landing behavior kept), new Footer.astro, global.css (scroll unlock scoped: html.landing:not(.has-footer) keeps lock; html.landing.has-footer enables vertical scroll/overflow-x:hidden — other landing pages untouched; refined footer clone CSS), asset footer-chronicle.png (1.1MB) downloaded to public/images. Footer content exact: chronicle logo via withBase, italic tagline, Shopify newsletter form (form_type=customer, contact[tags]=newsletter, contact[email]) POST to shopandson.com/contact; primary links + policy bar all external full-https rel=noopener (no withBase), US ($), © 2026 Shop And Son. Reviewed clean by Claude. committed @ ffce968 — ready for operator verify. Not pushed. FLAGS for operator verify: (a) chronicle PNG is 1.1MB — candidate for a later optimize pass; (b) confirm the cross-origin newsletter Subscribe actually submits to the live Shopify store from dev.
- 2026-07-01 — Phase H4: product cards no-crop + wider catalogue — ba80d9a — build:green check:green — global.css only, 2 lines; .product-card__media img object-fit:cover→contain (native aspect ratio, no crop; width/height 100% kept); .hero__catalog own left:max(30vw,240px) override (source-ordered after shared rule → wins); .hero__preorder (left:max(31vw,220px)) + 3-up row grid untouched. Reviewed clean by Claude. committed @ ba80d9a — ready for operator verify. Not pushed.
- 2026-07-01 — Phase H3: about block always-visible + downward dock, tagline dropped — ed545d5 — build:green check:green — HeroVideo.astro + global.css only; removed "mostly clothes…" tagline (address+contact kept); replaced translateX/visibility:hidden hide rules with heroInfoDockDown/-Active keyframes (translateY(120%)/opacity0→0/1, .55s) re-firing on open+close; kept bottom-left dock (left:5.7vw bottom:6vh z3); .hero__overlay padding-bottom → max(18vh,150px) desktop / max(16vh,132px) mobile for the gap; reduced-motion block includes BASE .hero-info (static+visible, animation:none). Reviewed clean by Claude. committed @ ed545d5 — ready for operator verify. Not pushed.
- 2026-07-01 — Phase H2: collapsible CATEGORIES/DESIGNERS sub-folders — b209a47 — build:green check:green — HeroVideo.astro + global.css only; group items render .hero__menu-subheader toggle buttons (aria-expanded, data-menu-subgroup, +/en-dash .hero__menu-subtoggle); script setMenuSubgroupState/resetMenuSubgroups, independent toggles, reset-on-section-close, data-shop-all leaf wiring untouched; CSS nested visibility keys off .hero__menu-item--group.is-open, re-scoped old ~498-514 rules (:not(--group) leaf font, > .hero__menu-subheader group label). Reviewed clean by Claude. committed @ b209a47 — ready for operator verify. Not pushed.
- 2026-07-01 — Phase H1: fix Shopify handles + real designer/category lists — 00abc16 — build:green check:green — content.ts only; handles clothing→clothing-1, hender-scheme→hender-scheme-1, silphium→silphium-1, OBJECTS house→house-1 (LIVING stays house); dropped 6 hallucinated designers (AURORA, BINU BINU, HEREU, SAMUEL FALZONE, SATTA, SEVEN X SEVEN); added 13 (ANCELLM, BLANC YM, CONFECT, DE DAM FOUNDATION, DOCUMENT, FACTORS, GRAZIANO & GUTIÉRREZ, MITTAN, POLYPLOID, SOSHIOTSUKI, SUB SUN, WILLIAM ELLERY, Y — YLEVE); deleted 4 stale hidden comments; suffix " |" dropped from CATEGORIES; order matches spec; both operator flags preserved (SALE omitted, "Y — YLEVE" label). Reviewed clean by Claude. committed @ 00abc16 — ready for operator verify. Not pushed.
- 2026-06-29 — Phase C-rev3: neon-green click feedback + smooth house return on exit — e0c4689 — build:green check:green — --neon-green active states; header-click exits catalogue; returnStencilFromRight() flicker-free right→left glide (transition-off → off-right → reflow → rAF → center). Reviewed clean. Not pushed.
- 2026-06-29 — Phase C-rev2: image lag fix + bigger portrait cards — cf32922 — build:green check:green — CDN width-resize (1.7MB→~120-210KB) via getSizedShopifyImageUrl (cdn.shopify.com only) + srcset 700/1100/1600; catalogue left 42vw→36.5vw, padding/gap cut so 3 cards dominate. Menu-left confirmed in docs. Reviewed clean. Not pushed.
- 2026-06-29 — Phase C-rev fix: resilient build-time fetch — 9a0311f — build:green check:green — getCatalogProducts now try/catches → warn + return [] (deploy can't break on a network blip). Not pushed.
- 2026-06-29 — Phase C-rev: real products+images, full stencil exit, large 3-up cards, scroll-paged rows — 468f53d — build:green check:green — build-time fetch of shopandson.com products.json (clothing 60 + house 27, real CDN images), translateY row-pager (wheel/touch, CSS-var driven), mobile scroll fallback. Reviewed clean (caught + fixed the throw-on-fetch-fail in 9a0311f). Not pushed.
- 2026-06-29 — Phase C1: catalogue interaction + slide animation + mock grid — 47ded3b — build:green check:green — Codex implemented per brief; reviewed clean by Claude (gated on .is-catalog, menu z-index→3, rows of 3, race-guarded render, getCatalogProducts isolates data for C2). Superseded by C-rev. Not pushed.
- 2026-06-29 — Phase B: clean video + separate centered stencil overlay — f4276a8 — build:green check:green — Claude prepped assets (4K→1080p 2.5MB, white stencil IMG_4242→hero-stencil.png); Codex did HeroVideo.astro + CSS; reviewed clean + composite-previewed. Not pushed.
- 2026-06-29 — Codex commit access enabled — `--add-dir` could not lift the seatbelt `.git` block, so per operator's informed choice the dispatch now runs Codex unsandboxed (`--dangerously-bypass-approvals-and-sandbox`); Codex committed this scaffolding itself on `dev`. Commits stay on dev (no push/merge); Claude reviews after.
- 2026-06-29 — shrink hero menu typography (Phase A) — a2f93f8 — build:green check:green — Codex implemented per brief; reviewed clean by Claude (exactly the 4 font-size values, nothing else); Codex sandbox couldn't write repo-root .git, so Claude committed
- 2026-06-29 — shrink hero menu typography — no commit (sandbox blocked `.git/index.lock`) — build:green check:green — CSS implemented; commit step blocked by read-only Git metadata
- (empty)
