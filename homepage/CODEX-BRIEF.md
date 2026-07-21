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

> **CURRENT TASK (2026-07-21): Phase BB1 — render Shopify designer placeholders without fake
> catalogues. Live Storefront evidence: Ben already added `wright + doyle (FW26)` under
> `main-menu → designers`, but it is a SEARCH item with no Collection resource. `menu.ts`
> currently drops every child without a collection handle, so the site silently omits it. Preserve
> non-collection items under DESIGNERS only as typed, inert placeholders; keep collection-backed
> designers clickable. Partition placeholders after all collection designers while preserving
> Shopify order within each group. Render placeholders with the exact existing bullet typography
> and green pointer hover, but as non-focusable/non-clickable spans with no URL/stage action and no
> “coming soon” copy. One shared DOM path must cover desktop and mobile. Categories/Objects remain
> collection-only. Add regression tests and update the Ben upkeep documentation. Scope: homepage
> code/tests/docs plus root `DEPLOY-PLAN.md` documentation only; no worker, operations, archive, or
> preorders changes. Verify preview and production against the real WRIGHT + DOYLE menu item.**
>
> **PRIOR: AH1 @ ea6beba / AG1 @ 514cf81 — eager loading + onerror retry. Harmless hardening,
> kept, but they did NOT fix the blanks (see AI diagnosis above).**
>
> **PRIOR: AF1 @ 6f2999f reviewed CLEAN — hero video releases memory on hide, restores+plays on return (reduces iOS tab-discard reloads; cannot guarantee zero). On dev, opening deploy PR.**
> so iOS is less likely to DISCARD + reload the tab when the user returns from the Instagram app
> (root cause = iOS tab discarding, verified not self-inflicted; this reduces it, cannot guarantee).
> Spec under "## PHASE AF". Dispatch now. Integrates with AE1's resume handlers.**
>
> **PRIOR: AE1 @ d97e097 reviewed CLEAN — hero video resumes
> on return (visibilitychange/pageshow/focus -> tryPlayHeroVideo). Pushed to dev, now IN PR #27.
> PR #27 (dev->main) is ONE merge from deploying: in-app designer link (AD1) + subscribe box
> fix (AC1, + CI token corrected to write-scoped) + hero-video resume (AE1). Operator merges.**
>
> **PRIOR: AD1 @ 8981c1c reviewed CLEAN — designer/vendor now
> opens the collection IN-APP (openCatalog, fallback to in-app search), ZERO shopandson.com
> links added. AC1 subscribe fix @ 4a3a61e reviewed CLEAN. Both awaiting operator dev/phone verify.
> QUEUED next: search-bar left-relocation + spacing (catalogue "x"). Later: convert nav + policy
> browse links to in-app per DEPLOY-PLAN.md (repo root). PR #26 unmerged (needs subscribe verify).
> Prior on dev reviewed clean: V/W/X + IG Y1/Y1b/Y1c + mobile Y2→Z1. AB1 (7bf4411) superseded by AD1.**
>
> **PRIOR, AWAITING OPERATOR VERIFY: Phase V (footer removed + subscribe moved to
> hero-info) — V1 @ 434b0ef, V2 @ a19324e, Claude-reviewed CLEAN, not pushed/merged.
> Open visual note: mobile hero-info__legal 6px (desktop 9px), operator to refine.
> Log:
>   2026-07-09 — V2 hero subscribe box — a19324e — build:green check:green — clean.
>   2026-07-09 — V1 remove footer entirely — 434b0ef — build:green check:green — clean.
>   2026-07-09 — U1 footer subscribe wiring — 1cb3651 — SUPERSEDED by Phase V; reused.**

> **Phases G–J are SHIPPED** (merged `dev → main` @ `012f918`, live). Do not re-do
> any of them; their brief text lives in this file's git history + the sections below.

**Status:** implementing Phase BB1 directly per operator instruction. Everything below BB1 is
history, not instruction.

**DISPATCH PROTOCOL — one sub-task per `./dispatch-codex.sh` run, one commit
each.** Claude reviews the real diff against that sub-task's **Done when** +
risks before the next dispatch. Before each dispatch, Claude updates the line
below so Codex has ONE target; everything else in this file is context.

> **ACTIVE SUB-TASK: BB1 — retain non-collection Shopify designer entries as inert bottom-of-list
> text, test, preview, and publish through an isolated PR.**
> Log: 2026-07-21 — BA1 store hours 11 AM–7 PM — dev `5be6ef0`, PR #43, main `9fa965d`
> — tests:green (9/9) check:green build/deploy:green — Cloudflare preview verified at 11:47 ET
> with body hours 11/19 and live Spotify track; production verified at 11:49 ET with body hours
> 11/19, `/now` requested, live track rendered, and zero console errors. PR was isolated from 17
> unrelated commits parked on dev; main merged back into dev afterward.
> Log: 2026-07-12 — AM2 route newsletter signup through worker — 2c4b2c0 — build:green check:green
> — reviewed CLEAN. Endpoint env-driven: PUBLIC_SUBSCRIBE_URL override else derived from
> PUBLIC_NOW_PLAYING_URL origin + /subscribe (prod needs NO new repo var; CSP connect-src already
> carries the worker origin, NO CSP change). Verified: dist data-subscribe-url exact worker URL,
> zero customerCreate in dist, zero Storefront token in dist/scripts/base.js, old form attrs gone;
> live worker with browser-identical requests: 200 {ok:true}, 400 invalid, CORS headers on both,
> OPTIONS 204, GET 405, /now 200. CAVEATS: (1) local `npm run dev` submit shows the SHAKE because
> worker CORS only allows shopandson.com origins; UX states verify locally, submit verifies live
> post-merge. (2) build-machine 429s: the build's products.json snapshot feed is per-IP throttled;
> 5 rapid builds tripped a long throttle window (GraphQL unaffected). Wait it out; CI unaffected.
> Config log 2026-07-12: PUBLIC_NOW_PLAYING_URL added to gitignored homepage/.env; KV
> subscribe-rate key for the build machine IP deleted (--remote) to un-throttle live verify. Test
> customer +am2verify@gmail.com created (delete list in the handoff doc).
> Log: 2026-07-12 — AM1d fix newsletter Admin API query — 08e5d90 — dry-run:green — DEPLOYED
> (version 8debc6f5). Worker verified live: 3 sequential creates ok, rapid double-submit both ok
> (AM1c race retry), CORS/405/400/429/now-playing/no-leak all pass. NOTE: concurrent bursts can
> hit Shopify Admin API THROTTLE -> transient 502 (real signups are sequential, unaffected);
> optional future hardening = retry-on-THROTTLED. Root causes this session: AM1c added `code`
> (invalid on Admin customerCreate userErrors, Storefront-only) -> AM1d removed it; the Shopify
> customer SEARCH is eventually consistent -> AM1c retry-after-taken. Client-credentials auth
> (AM1b) solid. TEST CUSTOMERS to delete in admin: beckettnotbadertscher+{amtest,amrace,amdiag2,
> seqa,seqb,seqc,seqrace}@gmail.com (plus any +amfinal/+amdiag that got created).
> — Prior: AM1c @ 049cdfb handled the create-then-resubmit race, but
> the worker /subscribe upsert (Shopify customer search is eventually consistent, so a lookup
> right after a create misses the record, the worker re-creates, Shopify returns TAKEN, and the
> handler 502s). Per "## PHASE AM1c". Worker-only; deploys via wrangler. Do not push.**
> Log: 2026-07-12 — AM1b migrate Shopify worker auth — 8085016 — dry-run:green — reviewed CLEAN
> (client-credentials cache mirrors Spotify pattern, 401 force-refresh+retry, no secret logging);
> DEPLOYED (version a9216dd9) + verified: CORS ok, 405/400 ok, NEW customer create ok, rate-limit
> 429 ok, now-playing regression ok, no secret leak. GAP found -> AM1c.
> — Prior: AM1 @ b2d6f3e reviewed CLEAN (worker /subscribe: Admin-API upsert
> existing->consent-update / new->create, both SUBSCRIBED+SINGLE_OPT_IN; 5/hr per-IP KV rate
> limit; CORS incl OPTIONS 204; generic {ok:true} no enumeration; query-escaped; token from
> secret, never logged). BLOCKED on operator: create son-ops Admin app + `wrangler secret put
> SHOPIFY_ADMIN_TOKEN`, then Claude runs `wrangler deploy` + verifies live, THEN dispatches AM2
> (site base.js repoint to worker /subscribe) + AM3 (operator drops write scope off public token).**
> Log: 2026-07-12 — AM1 worker /subscribe endpoint — b2d6f3e — worker-build:green astro:green —
> reviewed clean; awaiting operator Admin token to deploy+verify.
> — Prior: AX1 @ 2a5812d reviewed CLEAN + Claude-verified (throttled iPhone
> profile): video autoplays after buffering with NO gesture (canplay retry works) AND the
> source survives a hidden/visible flip (release-guard works, was sabotaging external-link
> opens). SHIPPED. Operator to confirm on real iPhone: Safari w/ Low Power OFF (true test) +
> note if failure was in the Instagram in-app browser (hard-block, not code).**
> Log: 2026-07-10 — AX1 harden hero video autoplay retries — 2a5812d — build:green check:green.
> — Prior: AW1 @ 7aae0d4 SHIPPED (PR #40) + live-verified: og/twitter/description/canonical
> absolute on https://shopandson.com, real sitemap.xml 461 entries, robots Sitemap line.
> AV1 favicon SHIPPED (PR #39). Text-link Astro icon = iMessage CACHE of a pre-fix send (served
> metadata verified correct via facebookexternalhit crawler: og:image=storefront, favicon.png,
> zero astro), NOT a code bug — no phase.
> Log: 2026-07-10 — AW1 add SEO share metadata and sitemap — 7aae0d4 — build:green check:green.
> — Prior: AV1 @ 4e8dd15 SHIPPED (PR #39) + live-verified byte-identical to the original "&" mark.
> Log: 2026-07-10 — AV1 restore shop favicon — 4e8dd15 — build:green check:green — original
> "&" logo (exact Shopify center-crop renditions) replaces Astro logo; apple-touch-icon added;
> svg/ico leftovers deleted.
> Prior AV spec: restore the original &son favicon (operator:
> the Chrome tab currently shows the Astro logo; must show the old shopandson.com "&" logo).
> The correct assets are ALREADY STAGED (untracked) in `public/`: `favicon.png` (64x64, the
> exact Shopify center-crop the old theme served) and `apple-touch-icon.png` (180x180). Steps:
> 1. `src/layouts/Base.astro`: replace the `<link rel="icon" type="image/svg+xml" ...favicon.svg>`
>    line with `<link rel="icon" type="image/png" href={withBase("/favicon.png")} />` and add
>    `<link rel="apple-touch-icon" href={withBase("/apple-touch-icon.png")} />`.
> 2. Delete `public/favicon.svg` and `public/favicon.ico` (Astro-logo leftovers; grep first to
>    confirm nothing else references them).
> 3. Include the two staged PNGs in the commit. Build + check green
>    (PUBLIC_SHOPIFY_STORE_DOMAIN=shop-and-son.myshopify.com locally). Ship via standing process.**
> Log: 2026-07-10 — AU1 allow Cloudflare analytics CSP — f9f6a3d — build:green check:green —
> SHIPPED (PR #38) + live-verified (beacon 200, zero CSP violations).
> — Prior: AT1 @ 9de1f5a + AT2 @ 92a9e68 verified 10/10 (idle fade at 3s,
> instant restore on mouse/touch, paused persists, reopen resets, mobile first-tap reveals
> without pausing, keyboard focus still pins controls). SHIPPING per operator's standing
> auto-deploy authorization. NOTE for operator review: play/pause control is now visible during
> playback for 3s before fading (was hidden while playing) — required for the reveal-on-activity
> pattern; revert available if unwanted.**
> Log: 2026-07-10 — AT1 auto-hide film controls — 9de1f5a — build:green check:green — structure
> good, focus-guard bug found in review (mouse click pinned controls forever).
> Log: 2026-07-10 — AT2 respect keyboard focus for film idle controls — 92a9e68 — build:green
> check:green — full matrix 10/10.
> — Prior: AS1 @ 2da0538 SHIPPED (PR #36, operator-authorized auto-deploy)
> and VERIFIED LIVE on shopandson.com mobile: mag 284-324, x 334-374, zero overlap; expanded
> bar ends left of the x; catalog/product stages pixel-unchanged.
> Log: 2026-07-10 — AS1 dodge search icon on mobile search — 2da0538 — build:green check:green
> — live-verified post-deploy.
> — Prior: AP1+AQ1+AR1 SHIPPED (PR #35). SITE IS LIVE at shopandson.com (cutover completed
> 2026-07-10: Cloudflare Pages + checkout.shopandson.com primary, test orders verified).
> Log: 2026-07-10 — AR1 add old Shopify URL redirects — c35c6ec — build:green check:green —
> dist/_redirects confirmed, rules exact to spec.
> Log: 2026-07-10 — AQ1 unify catalog routing — b8c52ae — build:green check:green —
> Claude-verified full matrix: cold-load ?collection restore (342 cards, hero chrome, no
> flash), URL updates on shop-all/designer/product opens, back/forward chain
> landing<->catalog<->designer<->product, refresh restore, /product/?handle redirect lands
> in-app, search interplay intact. syncStageFromUrl = single URL->stage source for popstate+init.
> Log: 2026-07-10 — AP1 fix newsletter signup failures — 7576462 — build:green check:green —
> Claude-verified: real signup from the built site returns customer created, zero userErrors
> (was TOO_LONG 52-char password, silently masked as success). Non-TAKEN userErrors now fail
> honestly.
> — Prior: AN1 @ 50bc3da reviewed CLEAN + Claude-verified live: SHOP ALL
> renders exactly the 342-product online set (POS-only items gone), search excludes POS items
> (0 results for a POS-only title), deep link to a POS handle shows "no longer listed".
> Dev stack ready to ship: AI1+AJ1+AK1+AL1+AN1, held for PR #32 merge.**
> Log: 2026-07-10 — AN1 filter POS-only products — 50bc3da — build:green check:green —
> verified grid/search/deep-link against live API.
> — Staging rehearsal PASSED 14/14 on the cutover build (grids, search, live product, real cart,
> checkout URL on Shopify primary, policies, subscribe, all API calls on myshopify domain).
> — AL1 @ 599d82c reviewed CLEAN: 652 lines dead layer deleted, no dangling imports,
> dist/index.html hash-identical pre/post. content.ts documents heroMenu as the live menu seed.
> Log: 2026-07-10 — AL1 delete dead homepage content layer — 599d82c — build:green check:green
> — hash-identical output, verified no dangling refs.
> Log: 2026-07-10 — AK1 harden cart and catalog failures — 18a5ea9 — build:green check:green —
> Claude-verified: with ALL storefront API calls blocked, a stored cart id SURVIVES page load
> (was wiped before); ensureCart correctly refuses to mint a new cart while the stored one is
> unreachable; catalog build now THROWS on failed page fetch (guard already tripped on a real
> 429 during Codex's first build, then green on retry). pageshow/bfcache re-hydrate added.
> Log: 2026-07-10 — AJ1 unify production domains — 9fad0ff — build:green check:green (both
> default and cutover env) — Claude-verified: cutover dist has zero beckettbad//shop-and-son
> leftovers, CSP connect-src/form-action carry shop-and-son.myshopify.com, withBase clean at
> base "/". Cutover = 3 env vars at the host, no code change.
> — Prior: AI1 @ 3d22a4c committed, Claude-reviewed CLEAN, behaviorally
> VERIFIED (headed Chrome vs live Storefront API on the prod build): SHOP ALL renders 342
> snapshot → 368 reconciled cards, 0 blank, 0 unloaded; search "norway" = 0 imageless tiles
> with matching count; deep link to an imageless product renders the placeholder frame, no
> errors. Status: ready for operator verify on dev. Also for the operator IN SHOPIFY ADMIN:
> 121 old drafts were published to the headless channel 2026-07-09 (95 imageless, hidden by
> AI1 until images are uploaded; 26 WITH images are now visible/buyable on the new site while
> 404ing on the old Online Store — review whether those were staged on purpose).**
> Log: 2026-07-10 — AI1 filter imageless catalog products — 3d22a4c — build:green check:green — clean; verified as above.
> MECHANISM CORRECTION (2026-07-10, after operator's admin check found "Sales channel is
> Headless" = no products): nobody bulk-published drafts to a channel. The 2026-07-09 token
> swap (CI variable now = the custom app token ending 470c) moved the site onto that custom
> app's publication, which auto-includes EVERY Active product — publishedAt is 2026-07 for ALL
> 463 clothing-1 products, and exactly 121 have onlineStoreUrl:null (Active in admin, Online
> Store channel off, some created back to 2024). The old token's publication matched the Online
> Store; the new one exposes the store's full Active set. GOVERNANCE RULE going forward: product
> visible on the new site ⇔ status Active in admin (channel ticks are irrelevant to our token);
> Ben hides things by setting status Draft. Full list: repo-root
> HEADLESS-ONLY-PRODUCTS-2026-07-10.md (130 products incl. house, 97 imageless). AI1's imageless
> filter stands regardless — it is the safety net for exactly this class of product.
> — Prior: T15 @ 5b24468 SHIPPED: single 1080p source + CSP-safe interaction fallback (play on first tap/scroll) for iOS autoplay-decline/Low Power Mode. Chromium-verified plays+single-load+no CSP. Operator to confirm on iPhone (+ check Low Power Mode).
> its native PLAY BUTTON = autoplay DECLINED (Low Power Mode blocks all autoplay).
> Fix: single unconditional <source> + CSP-SAFE interaction fallback in the BUNDLED
> module script (play on first tap/scroll, window-level). One commit `T15:`, spec in
> "PHASE T15" below. Dispatch to Codex; deploy to main immediately when fixed.
> — Prior (all failed on real iOS): T14 no-JS <source media> (autoplay still
> declined), T13 inline (CSP-blocked), T12/T8 deferred JS. T14 note: — T14 @ 4194d59 DONE + VERIFIED (chromium w/ prod CSP:
> single <video> native autoplay plays/loops, only mobile 720p source loads, zero
> inline JS, no CSP violations). ROOT CAUSE of the whole hero saga: prod CSP
> `script-src 'self'` blocks ALL inline scripts, so every JS approach (T8/T12/T13)
> failed silently on the live/prod build. T14 = pure HTML native autoplay + <source
> media>, no JS. SHIPPING to main per operator. — Prior (superseded): T13 inline
> (CSP-blocked). Earlier: T12 (mobile loop dead +
> broken on real iPhone after T12; stuck on poster frame). Fix: arm the source
> SYNCHRONOUSLY at parse via an inline script + native autoplay + interaction
> fallback (T12's deferred load-event .play() is too late for iOS). One commit
> `T13:`, full spec in "PHASE T13" below. Dispatch to Codex; push to main
> immediately when fixed (operator authorized). — Prior: T12 HERO VIDEO FIX (mobile loop dead +
> lag). Root cause: T8 replaced native autoplay with a one-shot JS .play() on a
> preload=none video → fails silently on mobile, no retry, but load() churns the
> decoder → dead poster + laggy UI. Fix: re-added `autoplay` (self-retrying native
> playback) + removed the reduced-motion gate that also killed the loop; kept the
> deferred single-video source-load. VERIFIED via headless mobile Playwright:
> mobile video plays (currentTime 2.48→4.49), desktop stays unloaded. Ready to
> ship. — Prior: T11 media cleanup + film poster DONE on dev, build+
> check green. Deleted 10 dead assets (~27MB: about.mp4, new-arrivals.mp4, +block
> images/posters/chronicle/logo — old block components not rendered on any page).
> about-film.mp4 31→22M (CRF21, audio kept) + about-film-poster.webp (stencil film
> now shows a preview still). Landing unchanged (1.87MB; these are on-demand).
> Awaiting operator go to ship to main. NOTE: preorders piece.mp4 (43M) still
> uncompressed (separate page, ships as-is per AGENTS).**

---

## PHASE AM2 — subscribe box posts to the worker, not Shopify (operator-approved, 2026-07-12)

WHY: the hero subscribe box POSTs a Storefront `customerCreate` mutation straight to Shopify with
the public token, which is why that token still carries a write scope (AM3 removes it). The worker
`POST /subscribe` (same worker as now-playing, already deployed and live-verified) now does the
subscription server-side: it upserts the customer's email marketing consent and returns a generic
`{ok:true}` on success. Repoint the site at it. Site-only, ONE commit `AM2:`. Do NOT touch
`worker/` or `public/preorders/`. Keep the on-page UX byte-identical (idle -> typing placeholder ->
valid arrow -> neon check on success; failure = shake). No visual surface changes.

1. `src/components/blocks/HeroVideo.astro` frontmatter: build the endpoint env-driven, never
   hardcoded. `nowPlayingUrl` already exists (line 22). Add:
   `const subscribeUrlOverride = import.meta.env.PUBLIC_SUBSCRIBE_URL?.trim() ?? "";` then derive
   `let subscribeUrl = subscribeUrlOverride;` and, if that is empty and `nowPlayingUrl` is set,
   `subscribeUrl = new URL(nowPlayingUrl).origin + "/subscribe"` inside a try/catch that falls
   back to `""`. (The worker serves both features from one origin, so production needs NO new
   repo variable; `PUBLIC_SUBSCRIBE_URL` exists only as an override if the endpoint ever moves.)
2. Same file, the subscribe `<form>` (~line 267): replace the three attributes
   `data-shop-domain` / `data-sf-token` / `data-sf-version` with ONE attribute
   `data-subscribe-url={subscribeUrl}`. Then delete the now-unused frontmatter consts
   `shopifyStoreDomain`, `shopifyStorefrontToken`, `shopifyStorefrontVersion` (lines 25-27).
   Grep first to confirm the form was their only consumer in this file; the catalog layer reads
   the env vars itself (`src/lib/storefront-client.ts`, `src/lib/shopify.ts`) and must be
   untouched.
3. `public/scripts/base.js`: replace the body of `submitSubscriber` with a worker POST and delete
   the two helpers only it used, `getShopifyEndpoint` and `createThrowawayPassword`:
   `const endpoint = subForm.dataset.subscribeUrl?.trim(); if (!endpoint) return false;`
   then `fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ email }) })`; `if (!response.ok) return false;` then
   `const payload = await response.json().catch(() => null); return payload?.ok === true;`.
   Touch NOTHING else in base.js: every state handler (activate, placeholder typing, success,
   failure/shake, 20s success reset, submit listener) stays exactly as it is. The existing
   try/catch in the submit listener already turns a thrown fetch (network/CORS) into the shake.
4. CSP: NO change expected, verify only. `src/layouts/Base.astro` already derives a
   `connect-src` entry from `PUBLIC_NOW_PLAYING_URL`'s origin, which IS the worker origin.
   Do not edit Base.astro.

Done when: from `homepage/`, `npm run build` AND `npx astro check` are BOTH green (`.env` already
provides `PUBLIC_NOW_PLAYING_URL` plus the Shopify vars); built `dist/index.html` contains
`data-subscribe-url="https://shop-and-son-now-playing.shop-and-son.workers.dev/subscribe"` and its
CSP `connect-src` contains `https://shop-and-son-now-playing.shop-and-son.workers.dev`; grep of
`dist/` finds ZERO `customerCreate` anywhere and ZERO `Storefront-Access-Token` in
`dist/scripts/base.js` (the catalog bundles still legitimately contain the token header, leave
them alone).

---

## PHASE AM1d — fix AM1c regression (invalid `code` field) + log real GraphQL errors (2026-07-12)

BUG (doc-confirmed + live-verified): AM1c added `code` to `createSubscribedCustomer`'s
`userErrors { code field message }`. The ADMIN GraphQL API's customerCreate userErrors type has
only `field` and `message` (the `code` field is on the STOREFRONT API's CustomerUserError, a
different type). Requesting `code` makes the query invalid, so `shopifyAdminGraphql` sees
`result.errors` and throws 'Shopify Admin GraphQL request failed' -> the handler 502s on EVERY
create (confirmed: a brand-new email 502s on the first call; worker log shows the generic throw).
Worker-only. ONE commit `AM1d:`. Change nothing else (auth, rate limit, CORS, retry logic,
now-playing all stay).

1. In `createSubscribedCustomer`, change the selection back to `userErrors { field message }`
   (remove `code`). Change the taken-detection to message-only:
   `userErrors.some((e) => /taken/i.test(e?.message || ''))`. (Admin's "Email has already been
   taken" message reliably matches; `code` is unavailable here.)
2. Diagnostic hardening: in `shopifyAdminGraphql`, immediately BEFORE
   `throw new Error('Shopify Admin GraphQL request failed')`, add
   `console.error('Shopify Admin GraphQL errors', JSON.stringify(result.errors || []))`. Log ONLY
   `result.errors` (Shopify API error objects, safe). Do NOT log the query variables (they contain
   the customer email = PII) or any token/secret.
3. Leave the customerEmailMarketingConsentUpdate userErrors selection (already `field message`)
   and the AM1c retry flow unchanged.

Done when: worker dry-run build green; a brand-new email POST returns 200 {ok:true} (create
succeeds); a rapid double-POST of a new email returns 200 on both (race path works); any real
GraphQL error is now logged with its actual content.

---

## PHASE AM1c — worker /subscribe: handle the create-then-resubmit race (operator-approved, 2026-07-12)

BUG (found in live verification): Shopify's customer SEARCH is eventually consistent. In
`handleSubscribe` (worker/src/index.js), the flow is findCustomerId -> if found update, else
create. When the SAME email is resubmitted within a few seconds of being created, the lookup
misses the just-created record (index lag), so it calls `createSubscribedCustomer`, Shopify
returns a "taken" userError, `throwForUserErrors` throws, and the handler returns 502. The
create and update paths themselves both work; only this race is unhandled. Fix it gracefully.
Worker-only. ONE commit `AM1c:`. Do not change auth, rate limit, CORS, or now-playing.

1. In `createSubscribedCustomer`, add `code` to the userErrors selection
   (`userErrors { code field message }`). Instead of unconditionally throwing, detect the
   already-taken case: if any userError has `code === 'TAKEN'` or message matches /taken/i,
   RETURN `{ taken: true }`. For any OTHER userError, still throw (via throwForUserErrors). On
   success return `{ taken: false }`.
2. Add `findCustomerIdWithRetry(email, env, attempts = 4, delayMs = 800)`: calls `findCustomerId`;
   if it returns null, `await` a `delayMs` sleep (`new Promise(r => setTimeout(r, delayMs))`) and
   retry, up to `attempts` times; return the id or null. This absorbs the search-index lag.
3. In the handler upsert block: keep lookup-first. If `findCustomerId` finds an id -> update as
   today. Else call `createSubscribedCustomer`; if it returns `{ taken: true }`, call
   `findCustomerIdWithRetry` and, if an id is found, `subscribeExistingCustomer(id)`. If still not
   found after retries, `console.warn` a GENERIC message (do NOT log the email or any PII) and
   return `{ ok: true }` (the customer provably exists and was created subscribed by the
   concurrent request; erroring would be worse UX). A genuine create success also returns ok.
4. Net effect: new email -> create -> ok; existing (settled) -> lookup+update -> ok; rapid
   resubmit of a just-created email -> create returns taken -> retry-lookup+update -> ok (no 502).

Done when: worker dry-run build green; rapid double-POST of a brand-new email returns 200 {ok:true}
on BOTH calls (no 502); a single new email still creates+subscribes; a settled existing customer
still updates; rate limit / CORS / now-playing unchanged.

---

## PHASE AM1b — migrate worker Shopify auth to client-credentials grant (operator-approved, 2026-07-12)

WHY: the AM1 code reads a permanent `env.SHOPIFY_ADMIN_TOKEN` (X-Shopify-Access-Token). Shopify
closed new admin custom apps; our app is a Dev Dashboard app that authenticates via the CLIENT
CREDENTIALS grant (verified: doc + live token exchange + a real customer READ succeeded on the
single `write_customers` scope, which implies read). Migrate the Shopify auth ONLY. ONE commit
`AM1b:`. Do not change the /subscribe upsert logic, rate limit, CORS, or the now-playing code.

1. Add `getShopifyAdminToken(env, forceRefresh = false)` mirroring the existing `getAccessToken`
   pattern (module-level cache `shopifyTokenCache = { token: '', expiresAt: 0 }`, reuse
   `TOKEN_EXPIRY_SKEW_MS`):
   - If cached and `expiresAt > now + TOKEN_EXPIRY_SKEW_MS` and not forceRefresh, return cached.
   - Else POST `https://shop-and-son.myshopify.com/admin/oauth/access_token`, `Content-Type:
     application/x-www-form-urlencoded`, body `grant_type=client_credentials`,
     `client_id=env.SHOPIFY_CLIENT_ID`, `client_secret=env.SHOPIFY_CLIENT_SECRET` (URLSearchParams).
   - Parse `access_token` + `expires_in`; cache `expiresAt = now + expires_in*1000`. Throw
     `AuthError` on missing creds or `!response.ok` or missing access_token. NEVER log the secret
     or the token.
2. In the Admin GraphQL call helper (the fetch that currently sets
   `'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_TOKEN`, ~line 187): set the header to
   `await getShopifyAdminToken(env)`. On a 401 response, force-refresh once
   (`getShopifyAdminToken(env, true)`) and retry the call a single time (mirror the Spotify
   retry at ~line 337-339). Do not retry more than once.
3. In `handleSubscribe`, replace the `if (!env.SHOPIFY_ADMIN_TOKEN)` guard with
   `if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET)` returning the same generic 503.
   Remove all remaining references to `SHOPIFY_ADMIN_TOKEN`.
4. Do NOT hardcode any credential. No wrangler.toml [vars] for these (they are wrangler SECRETS
   set out of band: SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET).

Done when: worker dry-run build green; grep shows zero `SHOPIFY_ADMIN_TOKEN` references left; the
new token function mirrors the Spotify cache/skew/force-refresh shape; upsert/rate-limit/CORS/
now-playing untouched.

---

## PHASE AM1 — worker /subscribe endpoint: upsert customer marketing consent (operator-approved, 2026-07-12)

GOAL: newsletter signups (new AND existing customers) reliably land on the Shopify email-marketing
list as Subscribed, via a server-side upsert using an Admin API token, so the PUBLIC storefront
token can later drop its write scope. Single opt-in (immediate, no confirmation email; double
opt-in is OFF per operator). Scope: `worker/src/index.js` (+ `worker/wrangler.toml` if a var is
needed). This worker deploys via `wrangler deploy`, NOT the GitHub pipeline. ONE commit `AM1:`.
Do NOT touch the existing now-playing endpoints (/now, /toggle, /status) or the site.

Add `POST /subscribe` to the existing `shop-and-son-now-playing` worker:
1. Accept JSON `{ "email": "..." }`. Validate a basic email shape; reject others with 400 and a
   generic JSON error. Method other than POST -> 405. Handle CORS preflight (OPTIONS).
2. CORS: allow origin `https://shopandson.com` (and `https://www.shopandson.com`); respond with
   `Access-Control-Allow-Origin` accordingly, `Access-Control-Allow-Methods: POST, OPTIONS`,
   `Access-Control-Allow-Headers: Content-Type`.
3. Rate limit per IP using the existing `NOW_PLAYING_KV` binding: key on `cf-connecting-ip`, cap
   e.g. 5 requests / hour (increment a counter with TTL). Over cap -> 429 generic JSON. This is the
   abuse backstop for a public endpoint.
4. Upsert via Shopify ADMIN GraphQL API (`https://shop-and-son.myshopify.com/admin/api/2025-01/graphql.json`,
   header `X-Shopify-Access-Token: <SHOPIFY_ADMIN_TOKEN secret>`):
   a. Look up: `query { customers(first:1, query:"email:\"<email>\"") { nodes { id } } }`.
   b. If a customer exists -> `customerEmailMarketingConsentUpdate(input:{ customerId:$id,
      emailMarketingConsent:{ marketingState: SUBSCRIBED, marketingOptInLevel: SINGLE_OPT_IN } })`.
   c. If none -> `customerCreate(input:{ email:$email, emailMarketingConsent:{ marketingState:
      SUBSCRIBED, marketingOptInLevel: SINGLE_OPT_IN } })`.
   d. Check each mutation's userErrors; on failure return a generic 502 JSON (log server-side).
5. RESPONSE PRIVACY: always return the SAME generic `{ "ok": true }` on success whether the email
   was created or already existed (never reveal existence; no enumeration).
6. SECRET: read `env.SHOPIFY_ADMIN_TOKEN` (a wrangler secret the operator sets; never hardcode,
   never log the token). If the secret is missing, return 503 generic (do not crash).
7. Keep the worker's existing structure/style; add a short comment block above the handler.

Done when: worker builds; `wrangler deploy` succeeds (operator/Claude runs it after the secret is
set); a POST with a fresh email returns `{ok:true}` and the customer appears Subscribed in admin;
a POST with an existing non-subscribed customer flips them to Subscribed; over-rate returns 429;
now-playing endpoints unchanged. NOTE: verification needs the SHOPIFY_ADMIN_TOKEN secret, which is
operator-provided; do not proceed to the site repoint (AM2) until this endpoint is verified live.

---

## PHASE AX — mobile hero video: reliable autoplay on external-link opens (operator-critical, 2026-07-10)

SYMPTOM (real iPhone, operator): opening the site from Google / a text link / Instagram, the hero
background video does NOT autoplay, iOS shows its native center play button over the poster.
DIAGNOSIS (evidence-based, HeroVideo.astro ~lines 514-568): markup is the correct T15 wiring
(`<video autoplay muted loop playsinline webkit-playsinline preload="auto">` + single mp4 source).
Two CODE causes found:
  (A) The AF1 memory-saver `releaseHeroVideo()` runs on `visibilitychange -> hidden`, stripping the
      `<source>` and calling `load()`. Opening a link from an external app fires a hidden->visible
      flip DURING load, so it kills iOS's native autoplay before it can start, then `restoreHeroVideo`
      re-adds the source and calls play() (often before the video is ready). This churn sabotages the
      first autoplay specifically on the external-link path.
  (B) No retry when the video buffers: `tryPlayHeroVideo()` is called at parse (video not yet
      buffered on cellular, 2.66MB) and only re-fired on user gesture / pageshow / focus. There is
      NO `loadeddata`/`canplay` retry (verified: zero in file), so on mobile data it sits on the
      poster until a tap.
ENVIRONMENTAL CEILING (NOT code-fixable, do not try): iOS Low Power Mode and in-app browsers
(Instagram/Facebook WKWebView) hard-block autoplay regardless; the existing first-interaction
fallback is the only path there and must be preserved.

FIX, `src/components/blocks/HeroVideo.astro` client script ONLY, one commit `AX1:`. No markup,
CSS, or other-file changes. Preserve every existing behavior (interaction fallback, pageshow/focus
resume, the memory-release-on-background that AF1 added for iOS tab-discard).
1. Track first successful play: add `let heroVideoHasPlayed = false;` and a listener
   `heroVideo.addEventListener("playing", () => { heroVideoHasPlayed = true; }, { passive: true });`.
2. Guard the memory-saver so it NEVER interrupts the initial autoplay: in the
   `visibilitychange -> hidden` branch, only call `releaseHeroVideo()` if `heroVideoHasPlayed` is
   true. (Releasing a video that never started buys no memory and kills the pending autoplay.)
   Leave restore/pageshow/focus as-is.
3. Add buffer-ready retries: on the video element, attach passive listeners for `loadeddata`,
   `canplay`, and `canplaythrough` that call `tryPlayHeroVideo()` (NOT once, play() on an
   already-playing video is a harmless no-op). This makes autoplay fire the instant enough data
   arrives on cellular, without waiting for a user gesture.
4. Keep the existing `["pointerdown","touchstart","click","scroll","keydown"]` once-listeners as the
   true-hard-block fallback (LPM / in-app browser). Unchanged.

Build + astro check green (PUBLIC_SHOPIFY_STORE_DOMAIN=shop-and-son.myshopify.com locally). Do NOT
reintroduce per-device `<source media>` selection or any inline script (both are documented iOS/CSP
traps; single source + bundled module only).

Done when: build+check green; in a throttled mobile Chromium profile the video autoplays after
buffering WITHOUT a user gesture (proves the canplay retry path); code review confirms release only
fires post-first-play. NOTE: true iOS autoplay (LPM off) can only be confirmed by the operator on a
real iPhone, in Safari AND from the Instagram in-app browser.

---

## PHASE AW — SEO/share layer: og tags, meta description, canonical, real sitemap (operator-approved, 2026-07-10)

CONTEXT: the live site exposes ONE title tag and nothing else to crawlers/unfurlers: no meta
description, no og/twitter tags (shared links show a bare URL, blocks the launch email + IG
promotion), no canonical, and sitemap.xml is fake (SPA fallback serves the homepage HTML).
Fix the head + generate a real sitemap at build. ZERO visual changes. The og image asset is
ALREADY STAGED (untracked): `public/og-image.jpg` (1200x630 from the hero poster). ONE commit
`AW1:`. Build + check green (PUBLIC_SHOPIFY_STORE_DOMAIN=shop-and-son.myshopify.com locally).

1. `src/layouts/Base.astro` head, using `Astro.site` for all absolute URLs (env-driven, falls
   back to the GitHub origin on staging, becomes https://shopandson.com in prod builds):
   a. `<meta name="description" content={description} />` where description is a new optional
      Base prop defaulting to: "&son is an independent design shop at 138 Sullivan St, SoHo,
      New York. Clothing and objects from independent designers, curated by Ben."
   b. Open Graph: og:site_name ("&son"), og:type ("website"), og:title (the page title),
      og:description (same description), og:url (absolute current URL WITHOUT query params),
      og:image (absolute URL to /og-image.jpg), og:image:width 1200, og:image:height 630.
   c. Twitter: twitter:card ("summary_large_image"), twitter:title, twitter:description,
      twitter:image (same absolute image URL).
   d. `<link rel="canonical" href={absolute current path WITHOUT query params} />`.
2. Real sitemap: add `src/pages/sitemap.xml.ts`, a build-time endpoint that emits XML using
   `Astro.site` (fallback origin ok) with: `/`, `/policies/`, `/preorders/`, one entry per
   catalog collection (`/?collection=<handle>` for every collection handle referenced in
   `heroMenu` in src/data/content.ts), and one per product (`/?product=<handle>`) from the
   build-time snapshot (`getCatalogProducts`, same data HeroVideo bakes; dedupe handles).
   Escape XML entities (& in URLs -> &amp;). Keep it dependency-free.
3. `public/robots.txt`: ensure it ends with `Sitemap: https://shopandson.com/sitemap.xml`
   (hardcoded prod URL is fine here; note Cloudflare prepends its managed block, ours still
   serves).
4. Include the staged `public/og-image.jpg` in the commit. Do NOT touch CSP, scripts, styles,
   or any rendered markup outside `<head>`.

Done when: build green; dist/index.html head contains description/og/twitter/canonical with
ABSOLUTE https URLs; dist/sitemap.xml is real XML listing 3 static pages + ~48 collections +
~1100 products with proper escaping; robots.txt carries the Sitemap line.

---

## PHASE AU — allow Cloudflare Web Analytics beacon through the CSP (operator-approved, 2026-07-10)

CONTEXT: Cloudflare auto-injects its Web Analytics beacon (`https://static.cloudflareinsights.com/beacon.min.js`)
into the deployed pages; our CSP `script-src 'self'` blocks it, so no analytics are collected.
Operator wants viewership data. ONE commit `AU1:`. No visual change.

1. `src/layouts/Base.astro` CSP: add `https://static.cloudflareinsights.com` to `script-src`,
   and add `https://cloudflareinsights.com` to `connect-src` (the beacon POSTs its metrics
   there). Touch nothing else in the policy.
2. Comment (one line): Cloudflare Web Analytics beacon (auto-injected by Pages).

Done when: build + astro check green (use PUBLIC_SHOPIFY_STORE_DOMAIN=shop-and-son.myshopify.com
locally if the feed 429s); dist/index.html CSP contains both new origins.

---

## PHASE AT — film player: auto-hide controls after 3s inactivity, movie-style (operator, 2026-07-10)

SPEC (operator): when the stencil film (`.hero__film` player) is PLAYING, the controls (the "x"
`[data-film-close]`, the play/pause `[data-film-playback]`, and the sound toggle
`[data-film-mute]`) fade/blur away after **3 seconds of inactivity** (desktop: no mouse
movement; mobile: no touch), like YouTube/movie players. Any activity brings them back
instantly and restarts the timer. ONE commit `AT1:`. No visual redesign: same controls, same
positions, only visibility choreography.

Behavior rules (standard video-player pattern):
1. Idle state applies ONLY while the film is actually playing (not before start, not while
   paused, not ended). On `pause`/`ended` the controls show and stay; on `play` the 3s timer
   arms.
2. Activity = `pointermove`, `pointerdown`, `touchstart`, `focusin`, `keydown` scoped to the
   film player (`.hero__film`). Each occurrence: show controls, restart the 3s timer.
3. While idle on desktop, also hide the cursor over the player (`cursor:none`).
4. While idle, controls get `pointer-events:none`, so on mobile the FIRST tap only reveals the
   controls (it hits the frame, which is activity), the second tap operates a control, standard
   phone-player behavior.
5. Keyboard/a11y: `focusin` on any control (tabbing) shows the controls and prevents hiding
   while a control has focus.
6. Closing the film stage clears the timer and resets to visible for next open.

Implementation:
1. HeroVideo client script: a small idle controller (setTimeout id + arm/clear/reset functions)
   that toggles class `is-controls-idle` on `.hero__film`. Hook film `play`/`pause`/`ended`
   events (the existing updateFilmPlayback wiring area) + the activity listeners in rule 2.
   Clean up on film close (existing close path at filmClose / stage transitions).
7. `src/styles/global.css`: `.hero__film.is-controls-idle` -> the three control selectors get
   `opacity:0; filter:blur(6px); pointer-events:none;` with `transition: opacity .45s ease,
   filter .45s ease` on the controls in BOTH states (so fade-in is smooth too), and
   `.hero__film.is-controls-idle{cursor:none}`. Do not change any existing control styling
   otherwise.

Done when: build + astro check green; playing film + 3s no input -> controls faded/blurred out
and unclickable; mouse move / touch -> controls back instantly, timer restarts; pausing shows
controls persistently; before first play controls never hide; closing + reopening the film
starts visible.

---

## PHASE AS — mobile: magnifier icon must dodge left of the "x" in the SEARCH stage (operator, 2026-07-10)

BUG (measured live, iPhone 13 viewport): in the SEARCH results stage the collapsed magnifier
icon sits at EXACTLY the same box as the "x" close button (both 334-374px) — full overlap. In
the catalog/product stages it correctly dodges one slot left (284-324) because of the mobile
rule in `src/styles/global.css` (~line 1067): the dodge selector lists `.is-catalog` and
`.is-product` (plain + `.is-search-open.` variants) but NOT `.is-search`, which instead falls
into the translateY-only rule (~line 1050) alongside `.is-preorder`. Desktop measured fine, do
not touch desktop rules.

FIX, `src/styles/global.css` mobile media block ONLY, one commit `AS1:`:
1. Remove `.hero-video.is-search .hero__search,` from the translateY-only rule (keep
   `.is-preorder` there unchanged).
2. Add `.hero-video.is-search .hero__search,` and
   `.hero-video.is-search-open.is-search .hero__search,` to the dodge rule so the search stage
   gets `transform:translate(var(--hero-mobile-search-dodge-x),var(--hero-icon-stage-clearance))`
   exactly like catalog/product — same transition, same animation.
3. No markup/JS changes, no other selectors touched.

Done when: build + astro check green; on a 390px viewport in the search-results stage the
collapsed magnifier's box is one icon slot LEFT of the x (no overlap), the expanded search bar
in the search stage ends left of the x, and catalog/product behavior is pixel-unchanged.

---

## PHASE AQ — routing unification: shareable catalog URLs + retire the standalone product page (operator-approved, 2026-07-10)

CONTEXT: the site is already a query-param router on `/`: `?product=<handle>` (pushState at
~line 2749, restored on load ~line 2612, popstate handled) and `?search=/?scope=` likewise. Two
gaps: (1) the CATALOG stage (shop all / collections / designers, all collection handles) never
touches the URL, so those views cannot be shared/refreshed; (2) `/product/?handle=` renders a
bare standalone page whose look predates the hero experience, direct links land there. Operator
approved: extend the param router with `?collection=`, retire the standalone page via redirect.
ZERO visual/design/interaction changes. ONE commit `AQ1:`. Build + astro check green. No push.

1. `src/components/blocks/HeroVideo.astro` client script:
   a. Add `?collection=<handle>` to the URL machinery, mirroring the existing product param
      helpers (get/set/strip). When `openCatalog(collection, label)` runs from a user action,
      `history.pushState({ collection, label }, "", url-with-?collection=handle)`. When leaving
      the catalog stage (X back to landing, or switching to product/search which set their own
      params), strip/replace the param exactly the way product/search transitions already manage
      the URL. Params are mutually exclusive: product > search > collection when parsing.
   b. On-load restore: in the same init block that restores `?product` (~line 2612), if no
      product/search param but `?collection=` present, open that catalog directly, BEFORE the
      landing reveal so there is NO flash of landing (match how product restore behaves). Resolve
      the label from the SSR'd menu button (`[data-collection="<handle>"]`'s
      `data-collection-label`), falling back to the handle itself if no button matches (live-only
      collections still open; getLiveCollection resolves any handle).
   c. popstate: extend the existing handler so back/forward walks correctly across
      landing <-> catalog <-> product <-> search using the pushed state objects. Reuse the
      existing stage-transition functions; do not invent a parallel path.
   d. Keep intact: search session restore, scroll restoration on back-to-catalog, the
      savedStageReturn logic, designer:open flow (it funnels through openCatalog and gains the
      URL for free).
2. `src/pages/product.astro`: retire the standalone experience. The route stays but renders no
   visible UI: an empty shell (bare Base layout, blank body is fine) plus a BUNDLED module
   `<script>` (CSP: script-src 'self', NO inline) that reads `?handle` and immediately
   `location.replace(withBase("/?product=" + encodeURIComponent(handle)))`, or
   `location.replace(withBase("/"))` when absent. No flash of the old design. Keep
   `src/lib/product-view.ts` untouched (the hero imports it).
3. Do NOT touch styles, markup of the hero/product/cart components, or any visual behavior.

Done when: build+check green; `/?collection=clothing-1` cold-load opens SHOP ALL in the full
design with no landing flash; opening any collection/designer updates the address bar; refresh
mid-catalog returns to the same collection; back/forward traverses landing/catalog/product/search
correctly; `/product/?handle=X` lands on the in-app product view with hero chrome.

---

## PHASE AR — day-one redirects for old Shopify URLs (operator-approved, 2026-07-10)

CONTEXT: at cutover shopandson.com stops being the old theme; indexed/shared links to old theme
URLs must land on the equivalent new-site views. Cloudflare Pages natively reads a `_redirects`
file from the build output. Dispatch AFTER AQ1 (targets use its params). ONE commit `AR1:`.

1. Create `homepage/public/_redirects` (build copies it to dist root) with EXACTLY:
   /products/:handle /?product=:handle 301
   /collections/:collection/products/:handle /?product=:handle 301
   /collections/:handle /?collection=:handle 301
   /policies/refund-policy /policies/?policy=refund-policy 301
   /policies/privacy-policy /policies/?policy=privacy-policy 301
   /policies/terms-of-service /policies/?policy=terms-of-service 301
   /pages/* / 302
   /account https://checkout.shopandson.com/account 302
   /cart / 302
2. One comment line at the top (# old Shopify theme URLs -> new-site equivalents; Cloudflare
   Pages consumes this file). Note: /account depends on the checkout subdomain going live at
   cutover (documented in DEPLOY-PLAN).
3. Verify the file lands in dist/ after `npm run build`.

Done when: build green and `dist/_redirects` exists with the rules above.

---

## PHASE AP — newsletter: fix silent signup failure (password over Shopify's 40-char cap) (LAUNCH BLOCKER, operator, 2026-07-10)

DIAGNOSIS (verified on the Cloudflare deployment with a captured API response): every subscribe
submit fails with `customerUserErrors: TOO_LONG — Password is too long (maximum is 40
characters)` and the UI still shows success. Cause: `public/scripts/base.js`
`createThrowawayPassword()` returns `sns-` + 24 random bytes hex = 52 chars; Shopify caps
customer passwords at 40. Direct API tests with 32-char passwords succeed and subscribe the
email instantly (single opt-in confirmed working).

FIX: ONE commit `AP1:` in `public/scripts/base.js` only.
1. Change `createThrowawayPassword()` to `sns-` + 16 random bytes hex (36 chars total, same
   crypto.getRandomValues entropy source, comfortably under 40).
2. While there: the submit handler must treat a response with non-empty `customerUserErrors`
   (other than the existing TAKEN masking) as FAILURE (existing failure/shake path), not
   success — verify and fix if it currently ignores userErrors.
3. No UI/visual changes. Build + check green.

Done when: base.js emits a <=40-char password and non-TAKEN userErrors route to the failure
state.

---

## PHASE AN — render ONLY products published to the Online Store channel (POS-only exclusion) (operator, 2026-07-10)

CONTEXT (operator + Ben, 2026-07-10): the ~130 "headless-only" products (Active in admin but not
on the Online Store channel) are POS/in-store-only inventory: never meant to sell online. They
must NOT appear on the new site, and must NOT be drafted/deleted (that would break POS). The
owner's existing workflow is the signal: he publishes a product to the Online Store channel when
it should sell online. The Storefront API exposes this as `onlineStoreUrl` (null = not published
to Online Store). Verified live: exactly 130 of 520 products are null and they match the POS-only
list 1:1; all 390 online products have images. So: filter grids/search/detail to products with a
non-null onlineStoreUrl. The AI1 imageless filter STAYS as an independent safety net. Owner's
process is unchanged: tick Online Store = appears on the new site, untick = in-store only.
ONE commit `AN1:`. Build + astro check green. No push.

1. `src/lib/storefront-client.ts`: add `onlineStoreUrl` to the product fields of COLLECTION_QUERY,
   the predictive/search product fragments, and PRODUCT_QUERY. Map it into the product objects
   (CatalogProduct gains `onlineStoreUrl?: string | null`; ProductDetail likewise).
2. HeroVideo client script: extend the render gate. Where AI1 filters `hasCardImage`, the gate
   becomes "has image AND is published online". For SNAPSHOT products (baked from the Online
   Store products.json feed, which by definition only contains published products and carries no
   onlineStoreUrl field) treat missing property as PUBLISHED (undefined -> allowed); for LIVE
   products (field present) require non-null. Suggestion/search assembly paths use the same rule.
3. `src/lib/product-view.ts`: if the live product's `onlineStoreUrl` is null, render the existing
   "this piece is no longer listed" state instead of the product (POS-only items must not be
   reachable via deep link).
4. `src/lib/catalog.ts` (snapshot): no filter change needed (feed is Online-Store-only by
   definition) — add a one-line comment saying so.
5. Comment the gate with WHY: POS-only inventory is Active for the register but unpublished from
   the Online Store channel; the site must mirror the owner's Online Store publish decision.
   NOTE in code: if the Online Store channel app is ever uninstalled or the old storefront
   password-protected in a way that nulls onlineStoreUrl, this gate would blank the catalog —
   revisit before any such admin change (see DEPLOY-PLAN).

Done when: build + check green; against the LIVE API, SHOP ALL renders exactly the online
product set (~390 across clothing+house, currently 368 clothing-side), zero POS-only items
(e.g. handle "cle-panel-check-shirt" or any of the 33 with-image POS items) in grids or search,
and a deep link to a POS-only handle shows "no longer listed".

---

## PHASE AL — delete the dead content/component layer before handoff (operator, 2026-07-10)

CONTEXT: the live site renders ONLY HeroVideo (+ CartDrawer) on index, product-view on
/product/, policies on /policies/. Base.astro renders TopBar/IndexOverlay only when a page is
neither `landing` nor `bare`, and NO page qualifies, so they never render. The old block
components are imported by no page. This dead layer contains a SECOND designer roster and nav
config that look authoritative but do nothing, a proven trap for future edits. Delete it so
Ben-era maintenance has one source of truth. Everything is recoverable via git. ONE commit
`AL1:`. Dispatch AFTER AK1 lands. Build + astro check green. No push.

1. VERIFY with grep before each deletion that the target is imported nowhere outside the dead
   set itself. Expected dead set (confirm, do not assume):
   `src/components/TopBar.astro`, `src/components/IndexOverlay.astro`, and
   `src/components/blocks/About.astro`, `Clothing.astro`, `Objects.astro`, `Music.astro`,
   `Vault.astro`, `Preorders.astro`, `FlowerDivider.astro` (NOT HeroVideo.astro, NOT
   CartDrawer.astro). Delete the dead files.
2. `src/layouts/Base.astro`: remove the TopBar/IndexOverlay imports and their conditional
   renders (the `!landing && !bare` slots). Keep everything else identical.
3. `src/data/content.ts`: delete the now-unreferenced exports/properties: `site.nav` (and the
   `shop()` helper + `shopUrl` if only nav used them), `clothing` (incl. its 28-name designers
   roster), `about`, `objects`, `vault`, `catalog` (the "+ index" data), and `music.tracks` /
   `music.dispatch` IF unreferenced. KEEP: `site` basics actually used (brand, hours, contact
   fields referenced by live code), `heroMenu` (the LIVE menu seed), and `music.nowPlaying`
   (HeroVideo reads its label). Grep each before removal; keep anything with a live reference.
4. Add one comment at the top of content.ts: the live menu seed is `heroMenu`, hydrated at
   runtime from Shopify Navigation `main-menu`; new designer collections are added via Shopify
   admin Navigation, not here.
5. Done when: build + astro check green, `npm run build` output byte-identical for
   dist/index.html vs pre-change build except hash/whitespace differences (the pages never
   rendered these components, so output should not change materially). Note any unexpected
   output diff in the log instead of shipping it.

---

## PHASE AK — pre-launch robustness: cart survives flaky API, build refuses empty catalog (operator, 2026-07-10)

CONTEXT (from the 2026-07-10 security review): two real defects to fix before go-live. Dispatch
AFTER AJ1 lands (both touch catalog.ts). ONE commit `AK1:`. Build + astro check green. No push.

1. **Transient API failure must not wipe the customer's cart.**
   Today `storefrontFetch` returns `null` for BOTH transport failure (timeout/429/network/HTTP
   error) AND legitimate "no data", and `cart.ts` treats null as "cart gone" and calls
   `resetCart()` (clears the localStorage cart id) in `hydrateCart` and `handleMutationPayload`.
   One flaky request deletes a real cart silently.
   Fix, minimally invasive:
   a. In `src/lib/storefront-client.ts` add an exported
      `storefrontRequest<T>(query, variables): Promise<{ ok: true; data: T | null } | { ok: false }>`
      containing the current fetch logic (`ok: false` on abort/network/!response.ok/GraphQL
      errors; `ok: true, data` otherwise). Reimplement the existing `storefrontFetch` as a thin
      wrapper returning `data ?? null` so every existing caller is untouched.
   b. In `src/lib/cart.ts`, switch the CART_QUERY hydrate and the cart mutations to
      `storefrontRequest`. Rules: `ok: false` -> KEEP current cart and stored id, do NOT
      resetCart, `dispatchCartMessage` a short retryable notice ("cart is unavailable right now,
      try again"), and for hydrate leave `hydrated` false so a later interaction retries.
      `ok: true` with unusable/absent cart -> reset exactly as today (cart genuinely gone or
      expired). userErrors handling unchanged.
2. **Back-forward cache staleness:** after returning from Shopify checkout via the browser back
   button, the drawer shows the pre-checkout cart. Add a `window` `pageshow` listener (in cart.ts's
   init path) that, when `event.persisted` is true, forces re-hydration (reset the hydrated flag /
   hydration promise and re-run) so the drawer reflects reality.
3. **The build must refuse to ship an empty catalog.** In `src/lib/catalog.ts`,
   `fetchCatalogProducts` currently returns `[]` when `fetchCatalogProductPage` exhausts its 3
   retries (and discards previously fetched pages). Because this runs at BUILD time (HeroVideo
   frontmatter) and a daily cron redeploys main, one rate-limited morning silently blanks
   collections on the live site. Fix: when a PAGE fetch definitively fails (returns null), THROW
   an Error naming the collection instead of returning [] — the Astro build fails, the cron keeps
   yesterday's good deploy, and the failure is visible in Actions. A collection that legitimately
   returns zero products (feed 200, empty array) stays allowed.
4. Do not touch checkout handling, the reconcile, or UI markup beyond the cart message. Scope:
   `src/lib/storefront-client.ts`, `src/lib/cart.ts`, `src/lib/catalog.ts`.

Done when: build + check green; grep confirms no remaining `resetCart()` on the transport-failure
paths; a simulated failed fetch (e.g. temporarily point the domain at an unreachable host in a
local test) leaves localStorage's cart id intact.

---

## PHASE AJ — production domain unification (go-live prep, operator, 2026-07-10)

CONTEXT: the site goes live at shopandson.com SOON, replacing the old Shopify theme. At cutover,
shopandson.com stops being Shopify and becomes THIS site, so every hardcoded shopandson.com
reference that expects Shopify to answer must become env-driven. The store's permanent
Shopify-owned domain is **shop-and-son.myshopify.com** (verified: products.json 200 no-redirect,
Storefront GraphQL answers with our token). DESIGN RULE: all defaults preserve CURRENT behavior
exactly — a build with no new env vars must be byte-equivalent in behavior to today (still on
GitHub Pages). The new env vars only take effect when set at deploy time. ONE commit `AJ1:`.
Build + astro check green. No push/merge (an unrelated PR is open; Claude holds pushes).

1. `astro.config.mjs`: make site/base env-driven with today's values as defaults:
   `site: process.env.PUBLIC_SITE_ORIGIN ?? "https://beckettbad.github.io"`,
   `base: process.env.PUBLIC_BASE_PATH ?? "/shop-and-son"`.
   Then VERIFY `src/lib/url.ts` withBase() produces correct hrefs when base is "/" (no "//"
   doubles); fix withBase minimally if needed.
2. `src/lib/catalog.ts`: replace the hardcoded `PRODUCT_FEED_BASE_URL`/`PRODUCT_PAGE_BASE_URL`
   ("https://shopandson.com/...") with bases derived from `import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN`
   (fallback "shopandson.com" so current builds are unchanged). Check whether the snapshot
   `product.url` built from PRODUCT_PAGE_BASE_URL is consumed anywhere live (cards navigate via
   getProductHref in-app); if truly unused, keep the field but note it, do NOT rip it out in this
   phase.
3. `src/layouts/Base.astro`: derive the Shopify origin once from
   `import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN` (fallback "shopandson.com") and use it in:
   CSP `connect-src` (line ~26), CSP `form-action` (line ~38), and the preconnect link (line ~63).
   Keep `https://shopandson.com` ALSO present in connect-src during the transition (harmless
   duplicate when they match). Add `upgrade-insecure-requests` to the CSP (valid in meta).
4. `src/lib/product-view.ts` (~17-18) and `src/pages/policies.astro` (~37-50): the
   "buy on shopandson.com" and policy fallback links must use the same env-derived Shopify origin
   instead of the hardcoded domain. Keep link text generic ("view on the shop") if it currently
   names the domain.
5. `src/lib/shopify.ts`: confirm its endpoint/domain is already env-driven; align it to the same
   var + fallback if not.
6. `src/components/blocks/Preorders.astro` (~5-6, 22, 36, 49): replace hardcoded
   `https://beckettbad.github.io/shop-and-son/...` URLs with `withBase("/preorders/...")` links
   and asset paths.
7. `.env.example`: document PUBLIC_SITE_ORIGIN, PUBLIC_BASE_PATH, and note
   PUBLIC_SHOPIFY_STORE_DOMAIN should be shop-and-son.myshopify.com for production cutover.
8. Do NOT touch: checkoutUrl handling (correct as-is), src/data/content.ts (dead nav cleanup is a
   separate phase), deploy.yml (outside scope).

Done when: `npm run build` + `npx astro check` green with NO new env vars set AND with
`PUBLIC_SITE_ORIGIN=https://shopandson.com PUBLIC_BASE_PATH=/ PUBLIC_SHOPIFY_STORE_DOMAIN=shop-and-son.myshopify.com npm run build`
— and in that second build's dist/, `grep -r "beckettbad\|/shop-and-son/" dist | grep -v preorders`
returns no live-page hits, and `grep -r "shopandson.com" dist/index.html` shows only the
transition connect-src entry and mailto links.

---

## PHASE AI — never render imageless products in grids (TRUE fix for blank tiles) (TOP PRIORITY) (operator, 2026-07-10)

DIAGNOSIS (verified live, 2026-07-10): the blank tiles are NOT a loading, lazy, srcset, CDN, or
paint problem. They are products that exist in Shopify with NO images at all. On 2026-07-09,
121 old draft products were published to the headless sales channel (they remain unpublished on
the Online Store — `shopandson.com/products/<handle>.json` 404s). 95 of the 121 have
`featuredImage: null`, `images: []`, `media: []` in the Storefront API. Flow of the bug:
`renderCatalogContent` renders the baked snapshot (clean, all images), then the live reconcile
(`getLiveCollection` → `reconcileLiveProducts` → `renderCatalogGrid`) REPLACES the grid with the
live product list, which now includes the 95 imageless products. `createProductCard` hits its
`else` branch (no `product.image`) and paints the off-white placeholder background — the "blank
canvas". The reconcile snapshot-backfill can't help: these handles aren't in the snapshot.
Product detail for those products likewise has no carousel images.

FIX PRINCIPLE: a product with no preview image must not appear in any grid. When Ben uploads
images in Shopify admin they reappear automatically (live data already flows). Do NOT hide
products that HAVE images, and do NOT change fetching, the reconcile backfill, cart, or CSP.
Scope = `src/components/blocks/HeroVideo.astro`, `src/lib/catalog.ts`, and (only if the guard in
step 4 is needed) `src/lib/product-view.ts`. ONE commit `AI1:`. Build + astro check green. No
push/merge.

1. In HeroVideo's client script add one canonical helper near the other card helpers:
   `const hasCardImage = (product: CatalogProduct) => Boolean(product.image);`
2. Filter INSIDE `renderCatalogGrid` at its top (`products = products.filter(hasCardImage)`), so
   every grid render — collection view, live reconcile re-render, search results, designer views —
   goes through the same gate. If any caller computes a visible results COUNT or empty-state from
   the products array, make it use the same filtered array so counts match what renders.
3. Check the search index / suggestion paths built from `catalogData` (e.g. `searchIndex`,
   `getViewportProducts`): imageless products must not surface as suggestions or search tiles.
   Filter with the same helper at the point results are ASSEMBLED for display (do not mutate
   `catalogData` itself — prefetch/handle lookups may rely on full data).
4. Product detail defense: a user can still deep-link (`?handle=`) to an imageless product. Verify
   `product-view.ts` renders sanely with zero images (placeholder frame, no broken/empty carousel
   controls, no thrown errors). If it already degrades gracefully, leave it; otherwise add the
   minimal guard (placeholder block instead of the carousel).
5. Build-time consistency: in `src/lib/catalog.ts` `fetchCatalogProducts`, filter mapped products
   to those with `image` before returning (snapshot currently has none imageless; this keeps the
   invariant if a future feed changes).
6. Comment the filter with WHY in one line (drafts published to the headless channel without
   images must not render as blank tiles).

Done when: build + `npx astro check` green; opening SHOP ALL against the LIVE Storefront API
renders zero blank off-white tiles after the reconcile re-render (95 imageless products dropped,
368 with images shown); search for "norway" surfaces no imageless tiles; a direct product link to
an imageless product does not render a broken view.

---

## PHASE AH — catalogue images load EAGERLY (fix; supersedes AG1) (TOP PRIORITY) (operator, 2026-07-10)

DIAGNOSIS (rigorous): data + token are FINE (runtime live query returns all products with valid
image URLs; baked data 100% complete). The failure is client-side LAZY image loading. Catalogue
card images were lazy — native `loading="lazy"` originally, an IntersectionObserver in AG1. BOTH
defer loading until the browser judges an image "in view." But the catalogue panel slides in via a
CSS transform, and the grid images are added DURING that transition, so the browser's visibility
detection (native lazy AND the observer) defers them and never loads them for on-screen tiles (only
a later scroll re-triggers some). Result: titles/prices render but a good portion of in-view tiles
stay blank, on mobile AND desktop. AG1 did not fix it because it kept a lazy/deferred mechanism.

FIX: load catalogue preview images EAGERLY — set `src`/`srcset` directly when each card is created,
NO `loading="lazy"`, NO IntersectionObserver. Eager images load immediately regardless of the
transition/visibility, guaranteeing every tile renders. Only one collection is shown at a time so
the cost is bounded. Scope = `src/components/blocks/HeroVideo.astro`. No CSP change. ONE commit
`AH1:`. Build + astro check green. No push/merge.
1. In the product-card image creation (`renderProductCard`): set `image.src = product.image` and,
   if present, `image.srcset = product.imageSrcset` + the existing `image.sizes` DIRECTLY (eager).
   Set `image.loading = "eager"`, `image.decoding = "async"`, `image.alt = product.title`. Keep an
   `onerror` handler that retries the URL once, then leaves the no-image placeholder.
2. REMOVE the AG1 IntersectionObserver machinery entirely: `catalogImageObserver`,
   `observeCatalogImages()` (and every call to it, e.g. in `renderCatalogGrid`), `loadCatalogImage`,
   `setCatalogImageSource`, the `data-catalog-image` / `data-src` / `data-srcset` dataset approach,
   and `catalogEagerImageCount`. Images load directly now.
3. Leave the reconcile, srcset/sizes, sold-out overlay, and no-image placeholder branch unchanged.

Operator verifies on dev/live: open several collections (including large ones like SHOP ALL), scroll
each, confirm EVERY tile shows its image immediately with no blanks, on mobile and desktop.

---

## PHASE AG — catalogue preview images load reliably (TOP PRIORITY) (operator, 2026-07-09)

DIAGNOSIS (Claude, verified against the live baked data): the catalog data is COMPLETE — 48
collections, 1123 products, every product has a valid `cdn.shopify.com` image URL. So this is
NOT a rate-limit/data problem. Root cause is client-side image loading in the catalogue grid:
- Card images use native `loading="lazy"` (HeroVideo.astro ~line 1574) with NO IntersectionObserver,
  inside the custom scroll catalog viewport (`.hero__catalog-viewport`). Native lazy-loading is
  unreliable in a just-populated nested scroll container, so images intermittently never load.
- Compounded by the grid RE-RENDERING on live reconcile (`renderCatalogGrid` ~line 2257 replaces
  every `<img>` mid-load) and NO `onerror` retry for transient CDN failures.

FIX. Scope = `src/components/blocks/HeroVideo.astro` (+ minimal CSS only if needed). No CSP change.
ONE commit `AG1:`. Build + astro check green. No push/merge.
1. Make catalog card images load RELIABLY — do NOT depend on native `loading="lazy"` in the scroll
   container. Implement a robust loader in `renderProductCard`/the grid:
   - Eager-load the first ~15 cards of each rendered grid (set `src`/`srcset` directly).
   - For the rest, lazy-load via an `IntersectionObserver` whose `root` is the catalog scroll
     viewport (`.hero__catalog-viewport`), `rootMargin: "400px"`, assigning `src`/`srcset` (held in
     `data-src`/`data-srcset`) when the card approaches; unobserve each image once loaded.
   - If `IntersectionObserver` is unavailable, fall back to eager (set `src` immediately).
   - The grid re-renders (snapshot then live reconcile) must RE-OBSERVE the new images each render
     (create/reuse the observer per grid render; disconnect the old one).
2. Add an `onerror` handler per image: on the first error, retry once (re-assign the same URL, may
   cache-bust); on a second failure leave the existing no-image placeholder. Handles transient CDN
   hiccups.
3. Preserve the existing `srcset`/`sizes`, `alt`, `decoding="async"`, the sold-out overlay, and the
   no-image placeholder branch.

Operator verifies on dev/live: open several collections, scroll each, confirm ALL preview tiles
render reliably (no blank tiles) across repeated opens.

---

## PHASE AF — release hero video memory while backgrounded (operator, 2026-07-09)

Goal: reduce iOS Safari discarding the backgrounded tab (which causes a full-page reload when
the user returns from the Instagram app). The hero autoplay video is the page's biggest memory
user; freeing its decoded memory while the tab is hidden makes the tab far less likely to be
discarded. Restore + resume it on return. This REDUCES reloads; it cannot guarantee zero (iOS
controls tab lifetime). Scope = `src/components/blocks/HeroVideo.astro` ONLY (bundled hero
script). No CSP change. PRESERVE all existing hero behavior (autoplay/muted/playsinline, the
first-interaction fallback, the poster). ONE commit `AF1:`. Build + astro check green. No push/merge.

Implement near `tryPlayHeroVideo()` and the AE1 visibility/pageshow/focus handlers:
1. At init, capture the source URL once, e.g.
   `const heroVideoSource = heroVideo.querySelector("source")?.getAttribute("src") || heroVideo.currentSrc || "";`
   and a flag `let heroVideoReleased = false;`.
2. `releaseHeroVideo()`: if not already released and a source exists — `heroVideo.pause();`
   remove the `<source>` child(ren) (and any `src` attr on the video), then `heroVideo.load();`
   set `heroVideoReleased = true`. This frees the decoded video memory.
3. `restoreHeroVideo()`: if `heroVideoReleased` — re-create the `<source>` (`src = heroVideoSource`,
   `type="video/mp4"`), append it, `heroVideo.load();` set `heroVideoReleased = false;` then
   `tryPlayHeroVideo()`. If not released, just `tryPlayHeroVideo()`.
4. Wire into the EXISTING AE1 handlers (do not duplicate):
   - `visibilitychange`: `document.visibilityState === "hidden"` -> `releaseHeroVideo()`;
     `=== "visible"` -> `restoreHeroVideo()`.
   - `pageshow` and `focus` -> `restoreHeroVideo()`.
5. Guard everything on `heroVideo` existing; handle rapid hidden/visible toggles idempotently.
   Do not break the first-interaction fallback or leave the video without a source when visible.

Operator verifies on a real iPhone: tap IG, return, confirm the tab survives (no full reload)
and the background resumes (brief re-buffer is acceptable). Expected to reduce, not eliminate.

---

## PHASE AE — hero video resumes when the user returns to the site (operator, 2026-07-09)

Bug: on mobile, tapping the Instagram icon opens instagram.com in a new tab (backgrounds the
site). The browser pauses the hero background video, and on return it never resumes, the
background sits frozen. Fix: replay the hero video whenever the site becomes visible/focused
again. Scope = `src/components/blocks/HeroVideo.astro` ONLY (the bundled hero script). No CSP
change. ONE commit `AE1:`. Build + astro check green. No push/merge.

- Reuse the existing `tryPlayHeroVideo()` helper (it sets `muted=true` and calls
  `heroVideo.play().catch(...)`).
- After the existing interaction-fallback listener setup (the `["pointerdown","touchstart",
  "click","scroll","keydown"]` block), add resume handlers:
  - `document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tryPlayHeroVideo(); });`
  - `window.addEventListener("pageshow", () => tryPlayHeroVideo());` (bfcache restore)
  - `window.addEventListener("focus", () => tryPlayHeroVideo());` (extra robustness)
- Do not change the video attributes (keep `autoplay muted playsinline`) or break the existing
  first-interaction fallback. Guard on `heroVideo` existing (tryPlayHeroVideo already does).

---

## PHASE AD — designer link opens the in-app collection, not shopandson.com (operator, 2026-07-09)

RULE (operator): this site must NOT send users to the old shopandson.com theme. The
designer/vendor in the product detail must open that designer's collection IN-APP. This
reverses AB1 (which linked to `shopandson.com/collections/vendors?q=`). Scope =
`src/lib/product-view.ts` + `src/components/blocks/HeroVideo.astro` + `src/styles/global.css`.
No CSP change. ONE commit `AD1:`. Build + astro check green. No push/merge.

1. `product-view.ts` (the `.product-detail__vendor`, currently an `<a>` to shopandson.com from
   AB1): when `product.vendor` is non-empty, render it as a clickable element that keeps the
   neon-green `product-detail__vendor` styling and, on click, calls `preventDefault()` and
   dispatches `window.dispatchEvent(new CustomEvent("designer:open", { detail: { vendor:
   product.vendor } }))`. REMOVE the shopandson.com href entirely (no external link at all). If
   `product.vendor` is empty, render plain non-clickable text.
2. `HeroVideo.astro` (where `openCatalog` and the collection buttons live): add a `window`
   listener for `"designer:open"` that opens the matching designer collection in-app:
   - Match `detail.vendor` (case-insensitive, trimmed) to an existing in-app collection by its
     label, using the collection buttons (`getCollectionButtons()` / `dataset.collectionLabel`).
     Take that button's `dataset.collection` handle and call `openCatalog(handle, vendorLabel)`.
   - If no collection matches, fall back to opening the in-app search prefilled with the vendor
     name IF that is straightforward; otherwise do nothing. NEVER navigate to shopandson.com.
3. `global.css`: keep the AB1 neon-green vendor styling (`color:var(--neon-green)`,
   `cursor:pointer`, hover underline).

Operator verifies: on a product, the designer reads neon green and clicking it opens that
designer's collection within the site, with no jump out to shopandson.com.

---

## PHASE AC — subscribe box: fix regression, remove typo-suggester, loose validation (operator, 2026-07-09)

The hero-info subscribe box is currently broken (operator: on desktop clicking does not
reveal the email field and the submit/arrow does not work; the mobile focus animation is
gone; real personal emails won't go through). Fix it and simplify. Scope =
`src/components/blocks/HeroVideo.astro`, `public/scripts/base.js`, `src/styles/global.css`.
No CSP change. Build + astro check green. No push/merge. ONE commit `AC1:`.

1. **Fix the regression.** The reveal logic has existed since V2 (a19324e) and worked:
   `.hero-subscribe.is-active` fades in `.hero-subscribe__input-wrap`, `.is-valid` reveals
   the arrow. The heavy X2 pass (`200f614`: the `width:clamp(... --hero-subscribe-value-ch ...)`
   expanding input, the 20s reset, the red-shake) is the likely regression. Diagnose why
   activation / field visibility broke on desktop and why the mobile focus animation stopped,
   and fix so: clicking the box reveals the email input, typing a valid email reveals the
   arrow, Enter or the arrow submits and succeeds, and the mobile focus behavior works again.
   If it cannot be cleanly repaired in place, restore the box's interaction to the V2
   baseline and re-add only what still works.
2. **Remove the typo-suggester ENTIRELY** (X1). Delete the `hero-subscribe__suggestion`
   button markup, the Levenshtein / common-domain / TLD detection logic and its handlers in
   base.js, and its CSS. No "did you mean…?" UI at all.
3. **Keep validation LOOSE.** `getIsValidEmail()` uses ONLY the browser's `checkValidity()`
   on the `type="email"` input (permissive — all real emails pass). Do NOT add a stricter
   regex. The error state (the red-shake) fires only when the email clearly isn't valid
   (fails `checkValidity()`, e.g. no "@") or when an actual submit fails (Shopify / network).
4. **Placeholder stays "email"** (no caret) — as it is now.

Operator will verify on dev (desktop) and on a real phone (mobile focus). Note: with the
typo-suggester gone, seriously-misspelled-but-valid-format addresses (e.g. name@gmial.com)
will submit without a warning; Shopify + double opt-in are the backstop.

---

## PHASE AB — clickable neon-green designer in product detail (operator, 2026-07-09)

In the individual product view, the designer (vendor) shown next to the carousel should
be neon green (`var(--neon-green)`) to signal it is clickable, and clicking it links to
that designer's page on shopandson.com. This covers BOTH the hero product overlay and the
standalone product page (both render via `src/lib/product-view.ts`). Scope =
`src/lib/product-view.ts` + `src/styles/global.css`. No CSP change (it is a link). ONE
commit `AB1:`. Build + astro check green. No push/merge.
1. `product-view.ts` (~line 679, the `product-detail__vendor` element): when
   `product.vendor` is non-empty, render it as a clickable `<a class="product-detail__vendor">`
   (keep the class + text) with:
   - `href = "https://shopandson.com/collections/vendors?q=" + encodeURIComponent(product.vendor)`
     (Shopify's built-in per-vendor page — reliable for any designer, no handle map needed).
   - `target="_blank"` + `rel="noopener noreferrer"` (opens the designer's page without
     losing the product view; match how the existing shopandson.com buy links open).
   - If `product.vendor` is empty, keep it as plain non-link text.
2. `global.css` (`.product-detail__vendor`, ~line 1860 + the responsive rules at 1211 /
   2194): color the vendor `var(--neon-green)`, `cursor:pointer`, and underline on hover
   (or a subtle persistent underline) to signal clickable. Keep the existing font, size,
   and positioning.

---

## PHASE AA — subscribe placeholder: remove caret, read "email" (operator, 2026-07-09)

The hero-info subscribe box placeholder currently reads "|email.." (a blinking caret
plus the typed text "email.."). Operator wants it to read EXACTLY "email" — no caret,
no trailing dots — same font and styling, both mobile and desktop. ONE commit `AA1:`.
Scope = `src/components/blocks/HeroVideo.astro`, `public/scripts/base.js`,
`src/styles/global.css`. No CSP change. Build + astro check green. No push/merge.
1. `HeroVideo.astro` (~line 278): remove the caret span
   `<span class="hero-subscribe__placeholder-caret">|</span>` from the placeholder; keep
   the `data-hero-subscribe-placeholder-text` span.
2. `base.js` (~line 47): change `const placeholderValue = "email..";` to `"email"`.
3. `global.css`: remove the now-unused `.hero-subscribe__placeholder-caret` rule (~line
   1527) and its `@keyframes heroSubscribeCaret`.
Keep the existing fast type-out of the word and everything else unchanged.

---

## PHASE Z — mobile icon stack: correct the search dodge (operator, 2026-07-09)

MOBILE ONLY. Y2 (@ 3078e35) got the mobile icon animation wrong two ways: it set the
icon bases to `transform:none` (which lost the original stack spacing/placement), and it
moved the search UP-and-left (`dodge-y`) when it should move LEFT only. Correct it.
Scope = `src/styles/global.css` (mobile block). No CSP change. Build + astro check green.
No push/merge. ONE commit `Z1:`.

Desired end state (mobile):
1. **Restore the pre-Y2 stack spacing/placement.** Set the BASE transform of
   `.hero__instagram`, `.hero__cart`, `.hero__search` back to
   `translateY(var(--hero-icon-stage-clearance))` (Y2 changed these to `transform:none`).
   The stack stays top→bottom Instagram, cart, search with the same spacing and in the
   same place it had before Y2. Do NOT reintroduce the old cart/search SWAP.
2. **IG and cart stay STATIC** — `translateY(var(--hero-icon-stage-clearance))` in EVERY
   state; they never move.
3. **Search dodges HORIZONTALLY only.** Normally `translateY(var(--hero-icon-stage-clearance))`.
   When a catalogue or individual listing is open (the "x", `.hero__catalog-close` /
   `.hero__product-close`, is present — states `is-catalog` / `is-product` /
   `is-search-open.is-catalog` / `is-search-open.is-product`), move ONLY the search icon
   LEFT so it sits to the left of the x, keeping the SAME vertical position:
   `transform:translate(var(--hero-mobile-search-dodge-x), var(--hero-icon-stage-clearance))`.
   Keep `--hero-mobile-search-dodge-x` = `calc((var(--hero-icon-size) + var(--hero-icon-gap)) * -1)`
   (this horizontal amount was correct in Y2; tune if needed so it clears the x). Do NOT
   apply any vertical (`dodge-y`) offset. Return to `translateY(clearance)` when the x closes.
4. Keep all icons the same size. Do NOT change desktop or the icon group's top/right anchor.

Operator verifies on a real phone; this is the piece we've missed twice, so match the
above exactly and let the operator tune the horizontal offset.

---

## PHASE Y — icon spacing (desktop) + mobile icon choreography rework (operator, 2026-07-09)

Two sub-tasks. Scope = `src/components/blocks/HeroVideo.astro` + `src/styles/global.css`.
No CSP change. Build + astro check green. No push/merge.

### Y1 — desktop: even out IG spacing (commit `Y1:`)
The IG icon sits too close to the cart; the IG↔cart gap should match the cart↔mag gap
(operator's reference = the desktop cart-to-search spacing). The flex `--hero-icon-gap`
is uniform, but the search element's internal layout makes cart↔mag read wider, so IG
needs a touch more space to its right. Add a small `margin-right` to `.hero__instagram`
on DESKTOP (or equivalent) so the IG↔cart visual gap equals the cart↔mag visual gap —
i.e. nudge IG left. DESKTOP ONLY; do not change mobile here. Measure against cart↔mag.

### Y2 — mobile: trash the cart/search swap; only search dodges the "x" (commit `Y2:`)
Operator wants the mobile icon stack simplified. Today the catalog/search states swap
cart and search vertically (and drop IG) — TRASH all of that. New behavior:
- The stack is PERMANENTLY, top→bottom: **Instagram, cart, search**. IG and cart NEVER
  move on mobile. Remove the mobile state transforms that move `.hero__cart`
  (`--hero-mobile-cart-stage-y`), that lift `.hero__search` to the top slot
  (`--hero-mobile-search-collapsed-y`), and that drop `.hero__instagram` in
  `is-search-open`. Keep all three at their natural stacked positions in every normal
  state.
- The ONLY mobile icon animation: when a catalog or product is open — i.e. the close
  "x" (`.hero__catalog-close` / `.hero__product-close`) is present — and it would
  overlap the now-bottom search icon, animate ONLY `.hero__search` up-and-left to sit to
  the LEFT of the cart (out of the x's way), keeping its size unchanged. When the x is
  clicked / the catalog closes, animate the search back down into its bottom slot.
- Preserve the existing tap-to-open-search-input behavior; only the RESTING position of
  the search icon changes per the above. All icons stay the same size throughout.
- Compute the "left of cart" offset from `--hero-icon-size` / `--hero-icon-gap`. This is
  visual choreography — operator verifies on a real phone and we iterate.

---

## PHASE X — subscribe box UX: typo-suggest, invalid feedback, expand, reset (operator, 2026-07-09)

Edits to the hero-info subscribe box (built in V2). Reuse the existing hooks
(`data-hero-subscribe-*`, classes `hero-subscribe__*`, state classes
`is-active`/`has-value`/`is-valid`/`is-submitting`/`is-subscribed`) and the
customerCreate backend. TWO sub-tasks, one commit each. Scope =
`src/components/blocks/HeroVideo.astro`, `src/styles/global.css`,
`public/scripts/base.js`. SAME security gates as V2 (public unauthenticated token
only, handler in BUNDLED base.js with no inline script, do NOT change the CSP,
password never logged, defensive parsing). Build + astro check green. No push/merge.

### X1 — email typo-suggestion (mailcheck-style, vanilla, no deps) (commit `X1:`)
Add a lightweight, self-contained domain/TLD typo suggester in `base.js`. NO npm
dependency (base.js is static/unbundled) — hand-roll ~1-2KB vanilla, NO network,
CSP-safe:
- On blur (or debounced after a complete-looking entry), split the email at "@" and
  take the domain. If the domain is a near-match (edit distance 1-2, not exact) to a
  known common domain, or the TLD is a near-match to a common TLD, compute the
  corrected email and show a clickable suggestion.
  - Domains: gmail.com, googlemail.com, yahoo.com, ymail.com, hotmail.com, outlook.com,
    live.com, msn.com, icloud.com, me.com, mac.com, aol.com, proton.me, protonmail.com,
    comcast.net, verizon.net, att.net, sbcglobal.net.
  - TLDs: com, net, org, edu, co, io, us, ca, me, info.
  - Sørensen-Dice or Levenshtein; only suggest when close-but-not-equal.
- UI: a small clickable "did you mean {corrected}?" hint below the box (`--mono-ui`,
  small, subtle). Clicking sets the input to the corrected email, re-validates, and
  hides the hint. Advisory only — it NEVER blocks submit; hides when the email matches
  a known-good domain or the field is cleared.

### X2 — invalid feedback, expanding input, post-submit reset (commit `X2:`)
1. **Invalid-submit feedback:** when a submit is attempted with the arrow showing
   (email passed `checkValidity()`) but the submit FAILS (Shopify userError, network,
   or otherwise), turn the arrow icon RED and play a brief SHAKE animation, then settle
   back to the normal arrow so the user can retry. Replaces the current failure
   handling on the arrow. (True non-existence is not detectable client-side; this fires
   on real submit failures.)
2. **Expanding input:** as the user types a longer email, the input grows so the whole
   email is visible before submit. DESKTOP: grow horizontally to the RIGHT only, capped
   at ~45 characters wide (`max-width` ~45ch); beyond the cap the input scrolls
   internally. Do NOT hard-limit the email length — long valid emails must still be
   fully enterable. MOBILE: keep it fitting within `.hero-info` (your call: cap
   max-width to available space, scroll beyond). Drive width from value length (JS, ch
   units) or equivalent, capped.
3. **Post-submit reset:** after a LEGIT successful submit (green check shown), start a
   ~20s timer; if the box is untouched for ~20s, return it to the idle "subscribe"
   state. BUT if the box is clicked/focused again before ~20s, immediately reset to the
   FRESH input state (clear the field, run the typewriter placeholder, ready for a new
   email — same as first clicking "subscribe") so the user can submit another address.
   Cancel the timer on that interaction.

---

## PHASE W — Instagram icon in the hero icon stack (operator, 2026-07-09)

Add an Instagram icon into the existing hero icon stack (`.hero__icon-pair` in
`HeroVideo.astro`, currently cart + search), linking to
`https://www.instagram.com/shopandson/` (open in a new tab, `rel="noopener
noreferrer"`). ONE commit `W1:`. Scope = `src/components/blocks/HeroVideo.astro` +
`src/styles/global.css` ONLY. Build + astro check green. Do NOT push, do NOT merge,
do NOT change the CSP (a plain external link needs none).

Icon — inline SVG, matched to the cart/search sizing (~22px, `currentColor` #000):
```
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/>
  <circle cx="12" cy="12" r="4.2"/>
  <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/>
</svg>
```
Markup: add `<a class="hero__instagram" href="https://www.instagram.com/shopandson/"
target="_blank" rel="noopener noreferrer" aria-label="Instagram">…svg…</a>` as the
FIRST child of `.hero__icon-pair` (before `.hero__cart`), `pointer-events:auto`.

### Desktop (`.hero__icon-pair` base rules, ~line 274)
- The pair is a horizontal flex row (justify-end, `gap:var(--hero-icon-gap)`). As the
  first child, IG lands to the LEFT of cart with the existing gap = uniform spacing.
- Animation: give `.hero__instagram` the SAME treatment as `.hero__cart` — base
  `transform:translateX(var(--hero-icon-stage-clearance))` + the same transition, and
  in the active states (`.hero-video.is-catalog/.is-search/.is-product/.is-preorder
  .hero__instagram`) `transform:translateX(0)`. Give it a stagger `transition-delay`
  one step beyond cart (cart .08s → IG ~.16s) so the row cascades in. Mirror cart's
  opacity/visibility/pointer rules.

### Mobile (`.hero__icon-pair` media block, ~line 969) — the nuanced part
Goal (operator's words): IG sits at the TOP of the vertical stack at ALL times,
correctly spaced, and animates ONLY when search opens over a catalog/product. When
the user taps the mag to open search — the `is-search-open.is-catalog` /
`is-search-open.is-product` states, where `.hero__search` animates down/away to
become the input via `translate(var(--hero-mobile-search-stage-x),
var(--hero-mobile-search-stage-y))` — IG DROPS DOWN by one icon row to fill the slot
the mag vacated, and returns UP to the top when search is exited.

Integrate WITHOUT breaking the existing choreography: the mobile stack is a column
(cart DOM-first = top, search DOM-second); in `is-catalog`/`is-product` search lifts
to the top slot and cart drops to the bottom via `--hero-mobile-cart-stage-y` /
`--hero-mobile-search-collapsed-y`. Adding IG as a new flex item at the top would
shift cart/search down a row and throw those vars off, so EITHER (a) add IG as the
first flex child AND update the `--hero-mobile-*` stage-y vars so cart/search still
land in the same visual slots, OR (b) anchor IG independently (its own absolute
position at the stack top) so it does not disturb the cart/search flex flow and
animate its `translateY` on its own. Pick whichever keeps cart/search pixel-identical.

- Default / landing / catalog (search closed): IG at the very top, static, uniform
  gap, no movement.
- On search open (`is-search-open` + catalog/product): IG `translateY` down by one
  icon row (`--hero-mobile-cart-stage-y` distance = clearance + icon + gap) into the
  vacated mag slot; transition matching the others (~.55s ease-in-out).
- On search close: IG returns to the top slot.
- IG must never overlap cart/search in any state and keep uniform spacing.

Note: the mobile drop choreography is the part most likely to need a visual tune;
operator verifies on a real phone and we iterate. Build + astro check green. Commit
`W1: instagram icon in hero icon stack`. Do NOT push, do NOT merge.

### W2 — IG icon uniformity fix: boldness + spacing (operator, commit `W2:`)
Operator: the IG icon looks bolder and sits too close to its neighbor compared to the
cart and mag icons; make the three uniform. Scope = `src/components/blocks/HeroVideo.astro`
(the IG svg) + `src/styles/global.css`. No CSP change.
1. **Boldness:** the IG glyph is a stroked outline (`stroke-width:1.9`) while cart/search
   are filled, so it reads heavier. Tone the IG down to match the visual weight of the
   cart and mag icons — reduce the IG svg `stroke-width` (start ~1.5, go lower if it
   still looks heavier). Goal: IG does not look bolder than the others.
2. **Spacing/uniformity:** the flex gap (`--hero-icon-gap`) is already uniform, but the
   IG glyph fills more of its box than cart/search so it looks crowded. Reduce the IG
   glyph's rendered footprint to match the cart/mag glyph size (e.g., render the IG svg
   at ~19–20px instead of 22px, or inset the rect) so the IG↔cart gap VISUALLY equals
   the cart↔search gap. Reference = the current desktop cart↔mag spacing. Apply the same
   on mobile, where IG is currently too close to its neighbor. Keep the gap uniform in
   all states (idle and animated).
Build + astro check green. Commit `W2: uniform IG icon weight + spacing`. No push/merge.

---

## PHASE V — remove footer, move subscribe into hero-info (operator, 2026-07-09)

Operator decision: kill the footer entirely (NO footer anywhere) and repurpose the
subscribe into the hero about/contact block (`.hero-info` in `HeroVideo.astro`),
between the contact email and the legal links. TWO sub-tasks, ONE commit each,
dispatched separately. Reuse the security-reviewed customerCreate backend from
commit `1cb3651` (see `git show 1cb3651:homepage/public/scripts/base.js`).

**SECURITY GATES (unchanged from Phase U, hard requirements):** client-side uses
ONLY the public unauthenticated Storefront token, never Admin creds; subscribe
handler lives in the BUNDLED `base.js` (no inline `<script>`); do NOT change or
widen the CSP (stop + flag if it seems needed); random throwaway password per
submit, never logged; parse responses defensively so a malformed/failed response
NEVER shows a false success.

### V1 — remove the footer entirely (commit `V1:`)
Restore the pre-footer state of the shared files and delete the footer assets:
- `git checkout dc62771 -- src/layouts/Base.astro src/styles/global.css public/scripts/base.js`
  (dc62771 = the commit before the first footer commit; this removes the
  `<SiteFooter/>` wiring, the footer CSS, the landing scroll-unlock, and the
  overscroll-behavior `contain→auto` change, restoring the original hero scroll).
- `git rm src/components/SiteFooter.astro public/images/chronicle-neon.png public/images/chronicle-neon.webp`
- Grep to confirm no remaining reference to `SiteFooter` or `chronicle-neon`.
- `npm run build` + `npx astro check` green. Commit `V1: remove footer entirely (repurposing subscribe)`.

### V2 — subscribe box in hero-info (commit `V2:`)
Scope: `src/components/blocks/HeroVideo.astro`, `src/styles/global.css`,
`public/scripts/base.js`.

Placement: inside `.hero-info`, insert the subscribe box BETWEEN the
`<p>contact:...info@shopandson.com</p>` and `<p class="hero-info__legal">...</p>`.

Box design (single sleek box, `--mono-ui` font, black border/style matching the
site; SIZING IS A SENSIBLE DEFAULT — the operator will refine sizing later):
- **Idle:** one box, centered text "subscribe".
- **On click/focus:** "subscribe" disappears; an email input activates showing a
  FAST typewriter placeholder of "email.." preceded by a blinking caret "|" (looks
  like `|email..`). No existing typewriter in the codebase — build a new one (JS
  types the placeholder quickly + CSS blinking caret). Keep it fast.
- **On valid email** (use `checkValidity()`/regex — this also filters junk/spam
  submits): a SECOND segment appears on the right (email field grows, a smaller box
  appears at right) holding a RIGHT-POINTING ARROW icon. This arrow box appearing IS
  the "valid email" feedback.
- **Submit on Enter OR click the arrow** → run customerCreate (reuse the 1cb3651
  backend: public token, random password, `acceptsMarketing:true`, defensive
  parsing, `TAKEN`/`CUSTOMER_DISABLED` = success).
- **On success:** the arrow icon swaps to a GREEN CHECK icon (`var(--neon-green)`) in
  the same position. On failure: keep the arrow, allow retry, never a false success.

Spacing:
- **Desktop:** the vertical margin from the bottom of the homepage (footer now gone)
  to the top of the `hero-info__legal` (ToS) text must stay the SAME as it is now. It
  is OK to slightly reduce the `hero-info__legal` (refund/privacy/tos) size to make
  room so nothing looks crowded.
- **Mobile:** reduce the `hero-info__legal` size so the box fits without taking too
  much space.

`npm run build` + `npx astro check` green. Commit `V2: subscribe box in hero-info`.
Do NOT push, do NOT merge.

---

## PHASE U — footer newsletter subscribe (SECURE) (operator, 2026-07-09)

Wire the footer's email field to a real Shopify newsletter signup, securely. The
footer shell is already on dev @ a4c53c5; this phase ONLY adds the subscribe
behavior. **ONE commit `U1:`**, scope = `homepage/src/components/SiteFooter.astro`
+ `homepage/public/scripts/base.js` ONLY. Build + check green. Do NOT push, do NOT
merge, do NOT touch the CSP or any other file.

**Verified Shopify facts (Claude tested the live Storefront API 2026-07-09 — do not
re-test by creating customers from CI):**
- Endpoint: `https://{PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json` (domain
  is `shopandson.com`).
- The Storefront token in `.env` (`PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN`) has
  `unauthenticated_write_customers` plus the read scopes. Reads confirmed working.
- `customerCreate` works in `2025-01`; `acceptsMarketing: true` IS a valid
  `CustomerCreateInput` field and is what marks the customer subscribed.
  `emailMarketingConsent` is NOT accepted — do not use it.
- CSP already permits the call (`connect-src` includes `https://shopandson.com`).
  **Do NOT change the CSP.**

**Implementation:**
1. `SiteFooter.astro` frontmatter: read `PUBLIC_SHOPIFY_STORE_DOMAIN` and
   `PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN` from `import.meta.env`; const
   `sfVersion = "2025-01"`. Render them on the form as `data-shop-domain`,
   `data-sf-token`, `data-sf-version`. Remove the placeholder hidden Shopify
   contact `<input>`s and the `action`/`method` attributes.
2. `base.js` (BUNDLED/static file — never an inline `<script>`): replace the
   placeholder subscribe handler with one that:
   - Reads domain/token/version from the form dataset.
   - Validates the email (`type=email` + `checkValidity()`); on invalid,
     `reportValidity()` and stop.
   - Generates a random throwaway password with `crypto.getRandomValues` (the
     subscriber never sees or uses it). Never log it.
   - POSTs `customerCreate(input:{ email, password, acceptsMarketing:true })` with
     header `X-Shopify-Storefront-Access-Token`.
   - Success (a `customer` returned, OR a `customerUserErrors` code of `TAKEN` /
     `CUSTOMER_DISABLED` meaning already registered): add `.is-subscribed`, text →
     "subscribed", disable the button, set the email read-only.
   - Other userError or network failure: button text "try again", re-enable; NEVER
     show a false "subscribed".
   - If domain/token are absent: flip optimistically (dev fallback), do not error.

**SECURITY REQUIREMENTS (operator's explicit emphasis — treat as hard gates):**
- Client-side uses ONLY the unauthenticated, public Storefront token. NEVER
  reference the Admin API key/secret or any Admin token in a component, script, or
  built page. This is Shopify's sanctioned client-side signup path; the Storefront
  token is public by design.
- Handler stays in the BUNDLED/static `base.js`. No inline script (prod CSP
  `script-src 'self'` blocks inline).
- Do NOT widen or edit the CSP. If the implementation seems to need a new origin,
  STOP and flag it in the commit message rather than adding anything.
- The generated password is random per submit and is never logged, stored, or
  shown.
- No secrets in the commit; `.env` stays gitignored. The public token appearing in
  built HTML via the data attribute is expected and acceptable for an
  unauthenticated Storefront token.
- Parse every Shopify response defensively (optional chaining, no assumptions); a
  malformed/again response lands in "try again", never a false success.

**Done when:** `npm run build` and `npx astro check` both green; one commit `U1:`;
only the two in-scope files changed; no CSP change; no Admin creds client-side.
State in the commit that the subscribe was compiled only, not live-fired from CI.

**Operator verify (after Codex + Claude review):** on dev, enter an email → button
turns neon "subscribed"; Shopify admin → Customers → the email shows Email
subscription Subscribed (or Pending if double opt-in is on). Then delete the
earlier `son-newsletter-test@example.com` record.

**Hardening (NOT in U1 — future Phase U2 if the operator wants it):** route the
signup through the existing Cloudflare Worker so the token lives server-side, and
add Cloudflare Turnstile + rate limiting to block bot signups (protects list
quality / deliverability). More infra; flagged, not built here.

---

## PHASE T9 — bias the hero video over other videos in render priority (operator, 2026-07-08)

Operator wants the background hero video favored over the section films in render
priority (quality half is done: mobile hero already re-encoded to CRF22 720p 1.9MB,
same filename, no code change for it). ONE commit `T9:`, scope = `src/components/
blocks/HeroVideo.astro` (+ `src/layouts/Base.astro` if needed for the head preload).
Build + check green. Do NOT push. Keep the T8 deferred-hero behavior intact (only
device hero loads, after first paint, behind poster).

Changes (progressive hints; do not break anything if a browser ignores them):

1. **Preload the hero poster at high priority** so the hero is the first paint.
   Add two device-conditional preload links to the document `<head>`:
   `<link rel="preload" as="image" href={withBase("/videos/hero-poster.webp")} media="(min-width:761px)" fetchpriority="high">`
   and the mobile one with `href=".../hero-poster-mobile.webp" media="(max-width:760px)"`.
   The `<head>` lives in Base.astro — **scope these to pages that actually render the
   hero (the homepage)**, not every page (don't preload an unused image on product/
   policy pages). Use whatever Astro mechanism is cleanest (a head slot the homepage
   fills, a prop/flag, or a conditional). The poster URL matches the `<video poster>`
   so the browser fetches once, just at high priority + early.

2. **Hero video = high priority:** add `fetchpriority="high"` to both hero `<video>`
   elements (the `--desktop` and `--mobile` ones). It already loads first (T8 JS,
   after paint) — this reinforces it.

3. **Section videos = low priority:** add `fetchpriority="low"` to the section
   videos (the about-film `<video>` ~line 311, and any about / new-arrivals video
   elements) so that when they load on demand they never compete with the hero.
   They are already `preload="none"`; leave their sources/quality unchanged.

Done when: the hero poster is preloaded high-priority on the homepage only; hero
videos carry fetchpriority high and section videos fetchpriority low; the hero still
loads/plays as before (deferred, one device video, behind poster); no other page
preloads the hero poster; build + check green.

## PHASE T15 — hero: interaction fallback for iOS autoplay-decline (operator-critical, 2026-07-09)

NEW EVIDENCE: on the operator's real iPhone the hero shows iOS's native centered
PLAY BUTTON = iOS is DECLINING autoplay entirely (almost certainly Low Power Mode,
which blocks ALL autoplay until a user gesture — no HTML attribute overrides it;
also the play button sits under the .hero__stencil so the tap is intercepted).
T14's `<source media>` may also be unreliable on Safari. Every prior fix assumed
autoplay would fire — it won't in this state. Fix = remove the media-source
variable + add a CSP-SAFE interaction fallback (play on first user gesture).

KEY: the fallback goes in the EXISTING BUNDLED module `<script>` in HeroVideo.astro
(Astro bundles it to /_astro/*.js served from 'self' → ALLOWED by the CSP). Do NOT
use `<script is:inline>` (CSP blocks inline). The bundled module script already
runs on the live site (menus/catalog work), so this is safe.

ONE commit `T15:`, scope = `src/components/blocks/HeroVideo.astro` (+ global.css only
if needed). Build + check green.

Changes:
1. Hero `<video>`: keep `autoplay muted loop playsinline preload="auto"` + poster +
   fetchpriority. Add the legacy `webkit-playsinline` attribute too (older iOS).
   Replace the two `<source media>` sources with ONE unconditional source:
   `<source src={withBase("/videos/homepage-hero.mp4")} type="video/mp4" />`
   (single 1080p file for all — removes the Safari `<source media>` risk; getting
   it to PLAY takes priority over per-device sizing, which we can revisit later).
2. In the existing bundled module `<script>` in HeroVideo.astro, add a robust hero
   play routine (runs on script load):
   - `const heroVideo = hero?.querySelector<HTMLVideoElement>("video.hero-video__media");`
   - if present: set `heroVideo.muted = true` (iOS needs the muted *property*, not
     just the attribute, for programmatic play), then a `tryPlay()` that calls
     `heroVideo.play()` and swallows rejection; call `tryPlay()` once immediately.
   - Add a ONE-TIME first-gesture fallback bound to the WINDOW (so any tap works
     even though the stencil overlaps the play button):
     `["pointerdown","touchstart","click","scroll","keydown"].forEach(ev =>
       window.addEventListener(ev, tryPlay, { once: true, passive: true }));`
     (tryPlay is idempotent — safe if autoplay already succeeded.)
3. Keep everything else (CSP unchanged, poster preload, section-video preload=none).
   The mobile 720p file becomes unused — leave it (cleanup later).
Done when: single hero `<video>` with one source; the bundled module script forces
muted+play and plays on first interaction; build + check green; NO inline script,
CSP untouched. (Real test = operator's iPhone: the loop should start on load, and
if iOS blocks autoplay, on the first tap/scroll anywhere.)

## PHASE T14 — mobile hero autoplay, NO-JS / CSP-safe (operator-critical, 2026-07-09)

CRITICAL DISCOVERY: T13's inline `<script is:inline>` is BLOCKED by the production
CSP in Base.astro (`script-src 'self'` — no `'unsafe-inline'`, no hash). So the
inline script never runs, the `<source>` src is never set, and the hero stays a
dead poster frame. (Confirmed: dist has the script but the video has no src at
runtime; script-src is 'self'.) DO NOT use any inline/JS approach for the hero
video — it will be blocked. The fix must be pure HTML + native autoplay.

GOAL: hero autoplays+loops reliably on iOS, CSP-safe (no JS), single-video load,
per-device quality. ONE commit `T14:`, scope = `src/components/blocks/HeroVideo.astro`
+ `src/styles/global.css` + `src/layouts/Base.astro`. Build + check green.

Wiring (pure HTML, no JS):
1. In HeroVideo.astro, REPLACE the two `<video>` elements AND the T13 inline
   `<script is:inline>` with a SINGLE `<video>`:
   ```
   <video class="hero-video__media" autoplay muted loop playsinline preload="auto"
          {...heroVideoPriorityAttrs} poster={withBase("/videos/hero-poster.webp")}>
     <source src={withBase("/videos/homepage-hero-mobile.mp4")} media="(max-width: 760px)" type="video/mp4" />
     <source src={withBase("/videos/homepage-hero.mp4")} type="video/mp4" />
   </video>
   ```
   - Real `src` in the HTML at parse (native autoplay ⇒ reliable iOS playback), NO
     data-src, NO inline script.
   - Mobile source FIRST with `media` so mobile loads the 720p; desktop the 1080p.
     The browser loads only the matching source (single-load). If a browser ignores
     `media` on `<source>`, it uses the first (mobile) source — still single-load
     and still plays (acceptable). Mobile source first guarantees iOS mobile gets a
     working source regardless.
2. Remove the now-unused two-element markup and any leftover hero-video JS in the
   module script (loadActiveHeroVideo etc. were already removed in T13 — verify
   none remains; remove unused consts).
3. global.css: replace the `.hero-video__media--desktop` / `--mobile` display-toggle
   rules with styling for the single `.hero-video__media` (full-bleed background
   cover exactly as the videos render now — object-fit:cover, positioning, etc.).
4. Base.astro: simplify the hero-poster preload to the single poster
   `/videos/hero-poster.webp` (remove the mobile-poster preload + the two media
   conditions); keep it landing-scoped + `fetchpriority="high"`.
5. Keep everything else (fetchpriority attrs, reducedMotionQuery for the typewriter,
   section-video preload=none, etc.). Leave the now-unused homepage-hero-mobile
   poster file in place (cleanup later).
Done when: exactly ONE hero `<video>` with native `autoplay` and `<source>` in the
HTML (NO inline/JS for the hero); it autoplays+loops; only one source loads per
viewport; build + `astro check` green; the CSP is unchanged (still no unsafe-inline).
Claude will verify in Chromium that the video plays with the CSP applied and only
one source loads; operator confirms on iPhone.

## PHASE T13 — mobile hero MUST reliably autoplay+loop on iOS (operator-critical, 2026-07-09)

CRITICAL: on real iOS Safari the mobile hero is stuck on the poster frame (no
loop). Root cause: T8/T12 set the video `<source>` src and call `.play()` from a
`load`-event / requestIdleCallback — that's TOO LATE for iOS autoplay (iOS only
grants muted-inline autoplay during initial parse/load, not from a late deferred
callback). Chromium is lenient so it looked fine in tests; iOS is not.

GOAL: the mobile hero autoplays + loops reliably on iOS from first display, at
quality (desktop full 1080p homepage-hero.mp4, mobile 720p homepage-hero-mobile.mp4),
while still loading ONLY the device's video. ONE commit `T13:`, scope =
`src/components/blocks/HeroVideo.astro`. Build + check green.

Wiring (the key change: arm the source SYNCHRONOUSLY during parse, not deferred):
1. Keep both hero `<video>` with `autoplay muted loop playsinline preload="auto"`
   + their existing `poster`. Keep `<source data-src=...>` (NO `src` at parse) so
   neither video loads until selected.
2. Add a `<script is:inline>` IMMEDIATELY AFTER the two `<video>` elements (must be
   `is:inline` so it renders inline and runs SYNCHRONOUSLY during parse, before
   first paint — this timing is the whole fix). It must:
   - pick the viewport-matching video: `window.matchMedia("(max-width: 760px)").matches`
     → `.hero-video__media--mobile`, else `.hero-video__media--desktop`;
   - set that video's `<source>` `src` from `data-src`, remove the `data-src`, call
     `video.load()`;
   - call `video.play()` and swallow rejection; retry once on the video's `canplay`;
   - add a ONE-TIME global fallback: first `pointerdown`/`touchstart`/`scroll`
     (once, passive) → call that video's `.play()` (covers iOS Low Power Mode,
     which blocks all autoplay until an interaction);
   - leave the non-matching video's `data-src` untouched (it never loads).
3. REMOVE the now-obsolete `loadActiveHeroVideo` / `scheduleHeroVideoLoad` and the
   `document.readyState`/`load`-event trigger from the module `<script>` (they are
   superseded and were the broken deferral). Keep `reducedMotionQuery` (still used
   by the typewriter). Remove any consts left unused by this deletion.
4. Do NOT touch: the poster preload links in Base.astro, fetchpriority attrs, the
   CSS `--desktop`/`--mobile` display toggle, or the video files.
Done when: the visible mobile hero autoplays+loops from load (currentTime advances)
and only the device video loads (non-matching stays unloaded); desktop unaffected;
build + `astro check` green. (iOS is the real test — Claude will chromium-verify
single-load + playback, then ship; operator confirms on iPhone.)

## PHASE T8 — media/perf pass: hero delivery + WebP images (operator, 2026-07-08)

Perf pass from a measured Lighthouse audit (mobile, sim 4G): LCP 7.9s, total 8.9MB,
TBT 0 / CLS 0 (our code is clean — this is all media). Root causes: BOTH hero
videos download (2.6MB each; one is wasted), plus heavy PNG/JPG. Goal: cut landing
weight with ZERO quality loss to product imagery (Shopify CDN, untouched) and the
watched films (untouched). ONE commit `T8:`, scope = `src/components/blocks/
HeroVideo.astro` (+ verify no CSS breakage). Build + check green. Do NOT push.

ASSETS ALREADY CREATED + PLACED by Claude (do not regenerate):
- `public/videos/homepage-hero-mobile.mp4` — already replaced with a right-sized
  1280×720 version (2.5MB→1.0MB, near-lossless). Just reference it as today.
- `public/videos/hero-poster.webp` (desktop, 32K), `public/videos/hero-poster-mobile.webp` (mobile, 9K) — poster stills.
- `public/images/dj-in-action-cutout.webp` (150K), `public/images/hero-stencil.webp` (228K), `public/images/fam-tattoo.webp` (192K) — high-quality WebP, dims + alpha preserved. Originals (.png/.jpg) are kept alongside for now — do NOT delete them (quality validation; cleanup later).

Changes:

1. **Hero video: load ONLY the device's video, deferred, with a poster.** Today two
   `<video autoplay muted loop playsinline preload="metadata">` (lines ~52-72) both
   download on load (5.2MB, one wasted). Rework so:
   - Add posters: desktop video `poster={withBase("/videos/hero-poster.webp")}`,
     mobile video `poster={withBase("/videos/hero-poster-mobile.webp")}` — the
     poster paints immediately for a fast LCP.
   - Defer + single-load: remove `autoplay`, set `preload="none"`, and move each
     source URL off the eager `<source src>` into a `data-src` (so nothing downloads
     on load). Then in the hero script, AFTER first paint (window `load` event, or
     `requestIdleCallback` with a `setTimeout` fallback), pick ONLY the
     viewport-matching video via `matchMedia("(max-width:760px)")`, set its source
     from `data-src`, then `.load()` + `.play()` (muted, so autoplay-by-JS is
     allowed). The non-matching video never loads. Keep `muted loop playsinline`.
   - Respect `prefers-reduced-motion`: if reduced, keep the poster and do not
     autoplay the video.
   - Net: one hero downloads, after first paint; poster shows instantly; mobile
     uses the right-sized file.

2. **Swap the three images to the WebP already placed:**
   - Line ~79: `--stencil-mask-url` `/images/hero-stencil.png` → `.webp` (this is a
     CSS mask; WebP alpha works as a mask in modern browsers — verify the stencil
     still masks correctly).
   - Line ~83: `dj-in-action-cutout.png` → `.webp`.
   - Line ~327: `fam-tattoo.jpg` → `.webp`.

3. **Section videos `preload="none"`** (minor): the film/section videos (e.g.
   about-film ~line 311, and any about / new-arrivals videos) — set `preload="none"`
   so they cost nothing until played. Do not change their sources or quality.

Done when: the landing downloads only ONE hero video, after first paint, with its
poster showing instantly; the three images load as WebP and render correctly
(stencil mask, dj cutout, fam image); section videos preload none; the hero still
plays as a muted looping background once loaded; reduced-motion shows the poster;
build + check green. (Claude will rebuild + re-run Lighthouse to confirm the win.)

## PHASE T7 — about indent + full-width finish divider + bigger +/− (operator, 2026-07-08)

Follow-up to T4/T5/T6. ONE commit `T7:`, scope = `src/components/blocks/HeroVideo.astro`
+ `src/styles/global.css`. Build + check green. Do NOT push. Keep all other T4-T6
behavior (word-by-word typing, fast speeds, collapse<expand, variants, reduced-
motion, the slide-down-to-divider finish).

Three changes:

1. **Slightly indent the about text (universal).** The about description should
   sit BELOW the designer name AND be slightly indented (shifted right) relative
   to the name. Add a small left indent to `.hero__catalog-description` (its text),
   ~1–1.5em, on BOTH variants and BOTH mobile + desktop. The finished divider bar
   (change 2) must stay FULL width — do NOT indent the bar, only the text.

2. **The finished bar must be a FULL-WIDTH divider, like the original section
   divider.** Today (T6) the finished typewriter line spans only the about column
   width (it lives inside `.hero__catalog-description`, which is the flex:1 column,
   narrower than the head because the × sits to its right). The operator wants the
   settled bar to be a FULL bar — the same full-head-width line that divides the
   designer name/about from the catalogue in the collapsed state (the
   `.hero__catalog-head` `border-bottom`, `1px solid rgba(0,0,0,.5)`), same weight
   and full width. Behavior: on typewriter finish, the descending typewriter bar
   "falls into place" and BECOMES this full-width section divider at the (now
   lower) adjusted position — exactly like the normal divider was before expanding,
   just lower. Recommended implementation: keep the head `border-bottom` transparent
   ONLY while actively typing (`.is-typing`); on finish (`.is-expanded`/finished)
   bring the full-width head `border-bottom` back as the divider and fade the thin
   typewriter cursor out as it lands on it (or relocate the cursor to be a full-
   head-width element that ends as the divider) — whichever yields ONE clean full-
   width line, matching the collapsed divider's width and weight, with the catalogue
   position unchanged. Collapsed state keeps its full-width divider as now. Collapse
   reverses cleanly (no double bar, no width pop).

3. **Make +/− even bigger.** The about `+`/`−`
   (`.hero__catalog-description-separator`) is currently `font-size:1.5em`. Make it
   noticeably bigger — clearly LARGER than the menu's `+` toggles (which render at
   the menu header size `clamp(16px,1.6vw,21px)`). Bump to roughly `2em` (tune for
   balance) and confirm it reads clearly bigger than the menu +/− on BOTH mobile
   and desktop; keep the neon highlight on `+`, dim on `−`, baseline aligned.

Done when: about text is indented under the name (both variants, both platforms);
after expanding, the settled divider is ONE full-width line matching the collapsed
section divider's width + weight, reached by the typewriter falling into place;
catalogue position unchanged; collapse reverses cleanly; `+`/`−` are clearly bigger
than the menu +/− on both platforms; build + check green.

## PHASE T6 — typewriter bar becomes the section divider (operator, 2026-07-08)

Follow-up to T5. ONE commit `T6:`, scope = `src/components/blocks/HeroVideo.astro`
(cursor finish logic) + `src/styles/global.css` (cursor / head divider). Build +
check green. Do NOT push. Keep all other T4/T5 behavior intact (speeds, full-width
line, bigger +/−, variants, reduced-motion).

PROBLEM: after the typewriter finishes there are TWO horizontal lines: (1) the
typewriter cursor line resting at the bottom of the about text
(`.hero__catalog-description-cursor.is-finished`, at the description's bottom),
and (2) the section divider below it (`.hero__catalog-head` `border-bottom`, above
the catalogue). The operator wants only ONE.

DESIRED (operator confirmed the exact behavior): when the last word is typed, the
typewriter line does NOT stop at the bottom of the text — it CONTINUES animating
downward and falls into place exactly at the section-divider location (where the
head border-bottom sits now), becoming the single divider. **The catalogue does
NOT move** — the divider location is unchanged; only the typewriter line travels
down to it. End state: exactly ONE horizontal line, at the current section-divider
position, with the about text above it and the catalogue below (unchanged).

Implementation guidance (Codex's call on exact method, but hit these points):
- Keep the section-divider position fixed so the catalogue never shifts.
- On finish, animate the cursor line's vertical position DOWN from the last text
  line to the section-divider location as a smooth transition ("fall into place"),
  then resolve to a single line there (e.g. slide the cursor onto the divider and
  hide the cursor so only the divider shows, or make the cursor the divider and
  drop the head border-bottom — whichever yields one clean line and no catalogue
  shift).
- The cursor currently lives inside `.hero__catalog-description`, which has
  `overflow:hidden` — that will CLIP the cursor as it slides below the text. Handle
  this (relax/skip the clip during the slide, or position the finishing line
  relative to a non-clipping ancestor like `.hero__catalog-head`) so the downward
  slide is visible.
- COLLAPSED state must still show its single divider under "NAME +" exactly as
  now (do not remove the divider that separates the collapsed head from the
  catalogue). Only the EXPANDED finish should avoid the double line.
- Collapse (−): reverse cleanly back to the collapsed single-divider state; do not
  introduce a transient second bar on collapse.
- Reduced motion: no slide; settle directly to the single-divider end state.
Done when: after expanding a designer about, exactly ONE horizontal line remains
(no double bar), reached by the typewriter sliding down into the divider spot; the
catalogue does not move; collapsed state still shows its single divider; collapse
reverses cleanly; build + check green.

## PHASE T5 — T4 typewriter revision (operator, 2026-07-08)

Revision of the T4 designer-about feature (@ 540bf07). ONE commit `T5:`, scope =
`src/components/blocks/HeroVideo.astro` (T4 cursor logic + timing constants) and
`src/styles/global.css` (T4 CSS: `.hero__catalog-description`,
`.hero__catalog-description-cursor`, `.hero__catalog-description-separator`).
Build + check green. Do NOT push. Keep everything else about T4 intact (word-by-
word typing, reduced-motion instant fallback, +→− state + neon highlight, both
variants ?about=name/preview, catalog drops fast then types, no overlay).

Five changes:

1. **The typewriter line IS the about↔catalogue separator (full-width bar), not a
   short word-cursor.** Today `.hero__catalog-description-cursor` is a ~word-width
   bar that tracks the last word and only becomes full-width on `is-finished`.
   Change it so the cursor is a FULL-WIDTH horizontal line (the separator between
   the about section and the catalogue) THROUGHOUT the animation: it sits just
   below the currently-typed last line and descends line-by-line as words print,
   then rests as the final divider between about and catalogue. JS
   (`updateCatalogDescriptionCursor`) should keep positioning it vertically under
   the last typed line, but width is always full (not the last word's width). This
   matches the original T4 intent ("the bar drops below each line then drops into
   place as the divider").

2. **Desktop: the line goes full width.** `.hero__catalog-description` is currently
   `width:min(100%,76ch)`, which caps the line on desktop. Make the about section
   (and thus the separator line) span the FULL available width on desktop (remove
   the 76ch cap). Mobile is already full width (`width:100%`) and its spacing is
   good — leave mobile width as is. The full-width line should read as the divider
   spanning the about column.

3. **Bigger +/− icons.** Increase `.hero__catalog-description-separator` from
   `font-size:1.18em` to roughly `1.5em` (tune for balance) so both the highlighted
   `+` and the dim `−` are clearly bigger, on mobile AND desktop. Keep the neon
   `var(--neon-green)` highlight on `+` and the dim `.is-minus` on `−`; keep
   baseline alignment clean.

4. **Much faster typewriter, universally.** Reduce the timing constants in
   HeroVideo.astro: `aboutExpandWordMs` (28 → ~9), `aboutCollapseWordMs` (19 → ~5),
   `aboutHeadAnimationMs` (320 → ~150), and lower the CSS `height` transition on
   `.hero__catalog-description` (`.32s` → ~`.16s`) and the cursor transitions to
   match. Tune so it feels snappy and elegant, not janky.

5. **Collapse faster than expand.** Keep the collapse per-word interval strictly
   less than expand (e.g. ~5ms vs ~9ms) so reverse-typing is visibly quicker.

Done when: on desktop the descending typewriter line and final divider span the
full width of the about column; `+`/`−` are clearly bigger on both platforms;
typing is much faster with collapse quicker than expand; the descending line is
the full-width separator throughout (not a word-width bar); no overlay/clipping;
reduced-motion still instant; build + check green.

## Log (Phase T)

- 2026-07-08 — T10 & fam vs hero-info overlap (mobile) — build:green check:green — REVERTED T1 (fam panel back to original: image max-height calc(Xvh-7.5em), copy/kicker natural); condensed .hero-info on mobile (font 10→8px, line-height 1.24, p margin 1em→.3em, legal 9→7px) so the bottom-fixed info block clears the centered & fam panel with no overlay. Direct CSS. NOTE: hero-info is NOT hidden on the is-fam view (unlike other stages), which is why it coexists there.
- 2026-07-08 — T9 bias hero media priority — bacd501 (+ CRF22 hero/poster assets) — build:green check:green — hero videos fetchpriority=high, about-film fetchpriority=low, hero-poster preload links (device-conditional, high) scoped to landing pages only (Base.astro). Mobile hero re-encoded CRF22 720p (1.0MB→1.9MB, operator chose the higher-quality tier since deferred = no LCP cost). Reviewed clean.
- 2026-07-08 — T8 media/perf pass (hero delivery + WebP) — 3a632d6 — build:green check:green — measured mobile Lighthouse (sim 4G) BEFORE→AFTER: total 8.9MB→1.87MB (−79%), LCP 7.9s→5.1s, perf 70→75, TBT/CLS 0. Only device hero loads (deferred + poster), mobile hero right-sized 2.5MB→1.0MB, dj-cutout 2MB→150K / fam 929K→192K / stencil 552K→228K WebP. Reviewed clean. PENDING: operator quality-check WebP on preview; then remove original .png/.jpg (cleanup) + optional LCP-image right-size.
- 2026-07-08 — T7 about indent + full-width finish divider + bigger +/− — 9407cea — build:green check:green — description padding-left 1.2em (text indent); on finish the cursor animates left/right to full head width (computed --finish-left/right from head vs description rects) + slides down, then after 170ms is-divider-settled fades the cursor out and restores the full-width head border-bottom as the divider; separator 1.5em→2em. Reviewed clean, dev hot-reloaded no error. Note: separator line-height .58 is tight — operator to eyeball +/− alignment.
- 2026-07-08 — T6 typewriter bar merges into section divider — bad0887 — build:green check:green — on finish the cursor translateY's down to the head bottom (dividerY computed from head rect) with overflow:visible so it isn't clipped; head border-bottom goes transparent while .is-typing/.is-expanded (via :has) so only one line shows; catalogue position unchanged; collapsed state keeps its border divider. Reviewed clean, dev hot-reloaded no error.
- 2026-07-08 — T5 about typewriter revision — 8083181 — build:green check:green — cursor now full-width line (left:0/right:0, JS sets translateY only) descending line-by-line then resting as divider; description width min(100%,76ch)→100% (desktop full width); separator +/− 1.18em→1.5em; speeds head 320→150, expand 28→9, collapse 19→5, height transition .32s→.16s. Collapse<expand kept. Reviewed clean, dev hot-reloaded no error.
- 2026-07-08 — T3b raise mobile search magnifier — 535a6cc — build:green check:green — collapsed magnifier to translateY 0 (var --hero-mobile-search-collapsed-y) for a more even gap above the cart, mobile catalogue/product only. Direct live-tune, operator confirmed mobile spacing.
- 2026-07-08 — T4 designer about +/− typewriter expand — 540bf07 — build:green check:green (Claude re-ran both) — separator "—"→"+" (var(--neon-green), 1.18em, clickable button row), expands to "−" dim on finish; word-by-word typewriter with a 1px cursor bar (Range-positioned, tracks last line) that becomes the full-width bottom divider on is-finished; description height animates .32s cubic-bezier(.16,1,.3,1) so catalog drops fast to fixed position then types; collapse reverse-types faster (19ms vs 28ms/word); reduced-motion→instant; both collapsed variants via ?about=name(default)/preview; description now flex:0 0 inside head so viewport shrinks (no overlay). Verified --neon-green=#1faa2e exists, no stray refs to old markup. Reviewed clean.
- 2026-07-08 — T3 relocate mobile search magnifier above cart — a72118c — build:green check:green — gated the left-of-× transform behind .is-search-open for is-catalog/is-product; collapsed falls to base translateY(14px) = one slot above the cart (64px), same x; opens straight to left-of-× via existing .55s transform. Mobile-only, desktop untouched. Reviewed clean, global.css only.
- 2026-07-08 — T2 now-playing mobile card clickable after renav — 231f23f — build:green check:green — 3-part: HeroVideo section-header handler now calls closeStage when mobile+is-now-playing-open (clears is-music/is-now-playing-open via clearStageCleanup); now-playing.js clears card href in hideNowPlaying+stop; now-playing.css .hero__now-playing[hidden]{display:none}. Traced closeStage for cross-section + collapse + × paths, all correct. Reviewed clean.
- 2026-07-08 — T1 fam panel copy collision — e1f5425 — build:green check:green — image now flex:1 1 0 (shrinks, object-fit:contain), copy+kicker flex:0 0 auto (always full), .hero__fam min-height:0, mobile image max-height:none. Reviewed clean, global.css only.

## PHASE T — operator edits, "no overlay" pass (2026-07-08)

OVERRIDING PRINCIPLE for T1–T4: **no text overlay anywhere, especially on mobile.**
Four independent commits `T1:`…`T4:`, one dispatch + one Claude review each, in
order. All work in `homepage/` only. `npm run build` AND `npx astro check` green
each. Do NOT push or merge; operator verifies all four on `dev` first.

File map (from a code audit; verify before editing, line numbers approximate):
- Designer catalog header + `& fam` panel: `src/components/blocks/HeroVideo.astro`.
- Styles: `src/styles/global.css`. Mobile = `@media (max-width:760px)`; desktop =
  `@media (min-width:761px)`.
- Now-playing: poller `public/scripts/now-playing.js`, styles
  `public/styles/now-playing.css`.

### T1 — `& fam` about-copy collision (commit `T1:`, CSS-only)
Problem: in `.hero__fam` (HeroVideo.astro ~L319-325) the interview-series copy
`.hero__fam-copy` overlaps the tattoo image `.hero__fam-image`. Cause (global.css
~L517-536 desktop, ~L896-907 mobile): `.hero__fam` is a centered flex column with
`max-height` and NO overflow handling, and the image height is capped at
`calc(Xvh - 7.5em)` — a fixed 7.5em reservation for copy+kicker+gaps. The copy
wraps past 7.5em (worse on mobile, narrower column) and overflows onto the image.
Fix (mobile + desktop): the panel must show image, then FULL copy, then
"coming soon…", cleanly stacked with a clear gap and NO overlap and NO clipped
text. Allowed approaches: let the image shrink to the space left by the text
(`min-height:0`, size image off remaining space instead of the fixed 7.5em),
and/or reduce copy/kicker size, and/or let the column size to content. Test
~320-430px mobile widths and desktop.
Done when: no overlap and no clipped text at any mobile width or desktop; image
above, full copy + "coming soon…" below.

### T2 — now-playing card stays clickable after mobile renavigation (commit `T2:`)
Bug: on mobile, after leaving the now-playing stage (tapping another section
header, collapsing the folder, or the ×), the Spotify song card link stays live/
clickable. Root causes: (a) HeroVideo.astro (~L2293-2326 section-header handler):
when another section opens on mobile while now-playing is open, `closeStage` is
skipped (guard `if (!mobileQuery.matches || !isOpen)`), so `is-now-playing-open`
+ `is-music` stay on `.hero-video` and the CSS open rule (now-playing.css
~L206-212) keeps the card `visibility:visible; pointer-events:auto`. (b)
now-playing.js: `hideNowPlaying()` (~L95-101) and `stop()` (~L308-316) clear only
the MENU link; the CARD link (`data-now-playing-link`) href is cleared ONLY in
`renderEmptyState()` (~L191).
Fix (do all three, defense-in-depth):
1. HeroVideo.astro: when navigating to another section / collapsing on mobile
   while now-playing is open, tear down the stage state via the existing
   `setMobileNowPlayingOpen(false)` / `closeStage` path so `is-now-playing-open`
   and `is-music` clear. Don't break the existing collapse-to-landing or × paths.
2. now-playing.js: in `hideNowPlaying()` and `stop()`, also
   `link?.removeAttribute("href")` (mirror renderEmptyState) so the card is a dead
   link whenever hidden.
3. now-playing.css: add `.hero__now-playing[hidden]{ display:none; }` so `hidden`
   is a real gate (currently `.hero__now-playing{display:flex}` beats UA hidden).
Done when: on mobile, entering now-playing then (a) tapping another section
header, (b) collapsing via the MUSIC header, (c) the × back button each leave the
song card immediately non-clickable (no Spotify navigation) and gone. Desktop
unaffected; normal show/hide still works.

### T3 — relocate mobile search magnifier above the cart (commit `T3:`, mobile CSS)
MOBILE ONLY (inside `@media (max-width:760px)`). In the catalogue-listing and
product stages the COLLAPSED search magnifier currently sits at the panel top row
(left of ×), overlapping the catalog title/about text. Move the collapsed
magnifier to sit directly ABOVE the cart (vertical stack: magnifier top, cart
bottom). When opened it animates in a straight line down to its CURRENT end spot
(left of the ×) — that end position is UNCHANGED. Pure CSS; the class toggles
`is-open`, `is-search-open`, and stage classes already exist (no JS).
Implementation (global.css mobile ~L961-974 + `.hero__search` ~L930-936): the
icon pair is a top-right vertical column; in these stages the cart is at
`translateY(var(--hero-mobile-cart-stage-y))` (~64px). Put the COLLAPSED
`.hero__search` in those stages directly above the cart, at
`translateY(var(--hero-icon-stage-clearance))` (~14px) with the same right-edge x
as the cart, so it reads magnifier-top / cart-bottom. Add an OPEN override keyed
on `.hero-video.is-search-open` (scoped to mobile + those stages) applying the
current end transform `translate(var(--hero-mobile-search-stage-x),
var(--hero-mobile-search-stage-y))`. Existing `transform .55s ease-in-out` gives
the straight-line move; no keyframes. Do NOT touch desktop (`min-width:761px`) or
the input-width expand.
Done when: on mobile in a catalogue listing AND a product listing, the collapsed
magnifier sits directly above the cart with NO overlap of the about text; tapping
it animates straight down to the (unchanged) left-of-× spot and expands the input;
closing reverses; desktop unchanged.

### T4 — designer about: `+` toggle + typewriter expand (commit `T4:`, THE BIG ONE)
Context: the designer "about" is the live Shopify collection description, rendered
in the catalog header `.hero__catalog-head` (HeroVideo.astro ~L270-283) as a
baseline flex row `.hero__catalog-title` containing `.hero__catalog-title-text`
(NAME), `.hero__catalog-description-separator` (currently an em-dash "—", hidden
until a description exists), and `.hero__catalog-description` (the about text,
currently `-webkit-line-clamp:2`, global.css ~L624-630). The catalog grid is in
`.hero__catalog-viewport` (flex:1, scrollable) below. `renderCatalogHeader(title,
description)` (~L1492-1500) fills these; the FULL description is available as
`reconciledLiveCollection.description` (~L1828). Head is `flex:0 0` so growing it
shrinks the scroll viewport (does not reflow the grid).

Requirements:
1. **Separator → `+`.** Replace the em-dash separator with a `+` that is a
   PERMANENTLY HIGHLIGHTED icon using the site's existing neon accent color,
   slightly BIGGER than the current separator, mobile + desktop. It signals the
   row is clickable.
2. **Clickable row.** The whole "NAME +" row is the tap target; the `+` is the
   visual cue. Click toggles expand/collapse of the full description.
3. **Collapsed state → BUILD BOTH VARIANTS behind a dev switch** so the operator
   can compare: Variant A "name-only" (collapsed shows just "NAME +", no about
   text) and Variant B "preview" (collapsed shows "NAME +" plus the current
   1-2 line clamp preview). Expand/typewriter behavior is IDENTICAL in both; only
   the collapsed rendering differs. Switch via a URL query param
   `?about=name` (default, Variant A) vs `?about=preview` (Variant B), read once
   on load; note the exact mechanism in the commit message + Log.
4. **Expand animation (elegance is explicitly important).** On click, the full
   description types out WORD-BY-WORD below the designer name, rapid + elegant. A
   thin cursor "bar" sits just below the line currently being written; when a line
   fills it wraps (carriage-return) and the bar drops to the next line, staying
   under the current line until the whole description is printed. When finished
   the bar settles into place as the divider between the about section and the
   catalog, with the site's normal about↔catalog margin (adjusted for the taller
   about). The catalog animates DOWNWARD to a fixed position FAST as the about
   grows, then stays put while text types (animate the head height / a max-height,
   easing ~cubic-bezier(.16,1,.3,1), ~250-400ms). When the about is full, the `+`
   becomes `−` and LOSES its highlight (dim).
5. **Sizes.** About text slightly bigger than current (mobile + desktop). Keep the
   expanded about proportionate — it must not eat too much of the catalog; the
   viewport shrinks/scrolls but stays usable.
6. **Collapse.** Clicking `−` reverse-types back to "NAME +" in the same
   typewriter style but ~1.3-1.5× QUICKER than expand; catalog animates back up;
   `−` returns to highlighted `+`.
7. **Reduced motion.** If `prefers-reduced-motion: reduce`, skip the typewriter —
   show/hide the full about instantly (still toggle + / −).
8. Applies to every designer catalogue (one shared component). Keep existing
   catalog open/close, search, and product flows intact.
Layout note: the about moves from an inline 2-line-clamped element after the name
to a block BELOW the name that expands. Remove the clamp on the EXPANDED
description; collapsed hides it (A) or shows a small clamp preview (B). NO overlap
or clipping with the catalog, the "search all" row, or the × at any size, mobile +
desktop (the no-overlay principle).
Risks / review focus: most complex change. Verify typewriter elegance; no overlay/
clipping at mobile widths; catalog still scrollable and not over-compressed; the
+/− + highlight toggle; reduced-motion path; the variant switch; existing catalog/
search/product flows unbroken; build + check green. Land ONE cohesive `T4:` commit.

## PHASE S — functionality-sweep fixes (audit, 2026-07-08)

Three fixes to `homepage/public/scripts/now-playing.js`, ONE commit `S1:`. Scope
is that single file. Build + check green. Do not touch the worker, `wrangler.toml`,
`Music.astro`, or anything else. Source: `SITE-FUNCTIONALITY-SWEEP-2026-07-08.md`
(M1, M2, plus the scdn low).

### S1 (all three, one commit)

1. **BUG (medium, M1): store-hours gate silently fails on iOS Safari.**
   `getEasternHour()` (~line 103) does
   `new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }))`.
   On iOS 16.4+ Safari / JavaScriptCore the localized time string uses a narrow
   no-break space (U+202F) before AM/PM that `Date` refuses to parse, so it
   returns `Invalid Date` → `getHours()` is `NaN` → `isStoreOpen()` is false and
   the track never shows during open hours for the in-store iPad and every iPhone
   visitor. Fix: compute the hour with `Intl.DateTimeFormat(...).formatToParts`,
   which never round-trips through string parsing. Example:
   ```js
   const getEasternHour = () => {
     const parts = new Intl.DateTimeFormat("en-US", {
       timeZone: "America/New_York",
       hour: "numeric",
       hour12: false,
     }).formatToParts(new Date());
     const hour = Number(parts.find((p) => p.type === "hour")?.value);
     return Number.isFinite(hour) ? hour % 24 : Number.NaN;
   };
   ```
   `% 24` guards the "24" some ICU builds emit at midnight; returning `NaN` on
   failure keeps `isStoreOpen()` failing closed exactly as today.
   **Done when:** the hours gate no longer parses a `Date` from a localized
   string, and `isStoreOpen()` returns the correct open/closed result on WebKit.

2. **BUG (medium, M2): freshness + progress depend on the visitor's wall clock.**
   `isFresh()` (~line 129) compares `Date.now()` against the worker's `fetchedAt`,
   and `getProgressRatio()` / `scheduleTrackEndCheck()` (~lines 139, 179) compute
   elapsed as `Date.now() - fetchedAtMs`. A visitor whose device clock is more
   than `staleAfterMs` (45s) fast sees a genuinely-playing track rejected as stale
   ("nothing playing"), and any skew warps the progress bar. Fix: anchor both to a
   LOCAL receipt timestamp captured when the payload is rendered, not the server's
   clock.
   - In `renderNowPlaying`, capture `const receivedAtMs = Date.now();` and store it
     on `renderedProgress` in place of `fetchedAtMs` (rename the field to
     `receivedAtMs`). Keep `progressMs` clamped as it is.
   - `getProgressRatio()` and `scheduleTrackEndCheck()` compute elapsed as
     `Date.now() - renderedProgress.receivedAtMs`.
   - For the render-time freshness guard, keep validating that `fetchedAt` parses
     to a finite number (reject garbage payloads via `getFetchedAtMs`), but drop
     the `Date.now() - fetchedAtMs <= staleAfterMs` wall-clock comparison — the
     payload was just fetched, so it is fresh at receipt. If `staleAfterMs` is then
     unused, remove it.
   Residual drift is bounded by the worker's 8s `/now` cache, which is acceptable
   and far better than unbounded clock skew.
   **Done when:** neither freshness nor progress math reads the server `fetchedAt`
   as an offset against `Date.now()`; a device clock set 5 min fast still shows a
   playing track and a sane progress bar.

3. **LOW (scdn CSP match): tighten album-art host to `i.scdn.co`.**
   `getAlbumArtSrc()` (~line 53) accepts any `*.scdn.co`, but CSP `img-src`
   (`Base.astro:31`) allows only `https://i.scdn.co`, so art from any other scdn
   subdomain passes the JS check and is then blocked by CSP (broken image). Since
   the worker only ever surfaces single-track art (served from `i.scdn.co`),
   tighten the JS host check to `url.hostname === "i.scdn.co"` so JS and CSP agree.
   Leave the track-link host check (`getSpotifyTrackHref`) unchanged.
   **Done when:** `getAlbumArtSrc` returns `""` for any host other than
   `i.scdn.co`.

**Risks / review focus:** M2 is a small refactor of the progress/freshness path —
review that `renderedProgress` is read consistently everywhere after the field
rename, and that the reduced-motion and track-end timers still behave. Confirm
`npm run build` and `npx astro check` both green.

## Log (Phase S)

- 2026-07-08 — S1 now-playing functionality-sweep fixes — 2a7df65 — build:green check:green — getEasternHour via Intl.formatToParts (M1, iOS-Safari silent-hide), freshness+progress off local receivedAtMs not visitor clock (M2, dropped staleAfterMs/isFresh), album-art host tightened to i.scdn.co (scdn CSP match). Reviewed clean, only now-playing.js staged. Ready for operator verify; not yet on main.

## Log (Phase R security/correctness)

- 2026-07-08 — R15 now-playing hardening — ef95cc8 — build:green check:green — fetch nowPlayingEndpoint (base-URL ship-blocker fixed, verified hits /now), track-link href allowlist (https+spotify.com, rejects javascript:/evil), album-art i.scdn.co host-check
- 2026-07-08 — worker security (direct, not Codex) — constant-time TOGGLE_SECRET compare + worker/.gitignore (blocks .dev.vars/.wrangler); syntax-checked

## PHASE R SECURITY/CORRECTNESS — pre-ship fixes (audit, 2026-07-08)

Three fixes to `homepage/public/scripts/now-playing.js` from the pre-ship
security + functionality audits. One commit `R15:`. Build + check green.

### R15 (all three, one commit)
1. **CORRECTNESS (ship-blocker): fetch the normalized endpoint, not the raw
   URL.** The script computes `nowPlayingEndpoint = new URL(nowPlayingUrl).origin + "/now"`
   (~line 8) but the actual `fetch()` (~line 261) uses the raw `nowPlayingUrl`.
   The production `PUBLIC_NOW_PLAYING_URL` is the worker BASE url (no `/now`), so
   the live site currently fetches the root → 404 → always "nothing playing."
   Fix: `fetch(nowPlayingEndpoint, …)` at ~line 261 (keep `cache:"no-store"` +
   the AbortController signal). `.env.example` documents the base-URL form; this
   makes it actually work. CSP `connect-src` already allows the origin.
2. **SECURITY (medium): allowlist the track-link scheme/host before assigning
   href.** `track.url` is assigned to the card `<a>` href (~line 209) and the
   menu-item `<a>` href via `setMenuLinkState` (~line 43). Today the only guard
   is `new URL(trackUrl)` not throwing — which permits `javascript:` (blocked by
   prod CSP but NOT in dev) and, worse, ANY `https://evil…` origin (a one-click
   phishing/open-redirect link that CSP does NOT prevent). Fix: after parsing,
   require `u.protocol === "https:"` AND the host is Spotify
   (`u.hostname === "open.spotify.com"` or ends with `.spotify.com`); if it
   fails, `renderEmptyState(); return;` (do not set either href). Apply so BOTH
   the card link and the menu link only ever receive a validated Spotify https
   URL.
3. **DEFENSE-IN-DEPTH (low): host-check the album art before `img.src`.**
   `track.art` is assigned to `art.src` (~line 227) with no check; prod CSP
   restricts `img-src` to `i.scdn.co` but dev has no CSP. Fix: only set
   `art.src` when `track.art` parses as an `https:` URL whose host is
   `i.scdn.co` (or ends with `.scdn.co`); otherwise leave the art hidden (don't
   fail the whole render — art is optional, unlike the link).

- **Done when:** build + check green; with `PUBLIC_NOW_PLAYING_URL` set to the
  BASE worker url (no /now) the site fetches `…/now` and renders live/empty
  correctly (was broken); a payload with `url:"javascript:alert(1)"` or
  `url:"https://evil.test/x"` yields the empty state and sets NO href on either
  anchor; a valid `https://open.spotify.com/track/…` still links normally; a
  non-scdn art URL is not loaded but a valid track still renders; dormancy
  (env unset) unchanged.

---

## Log (Phase R polish 4)

- 2026-07-08 — R14c hide booth during now-playing collapse — 440815f — build:green check:green — visibility:hidden on booth elements (position-independent) fixes the slide-across; booth invisible all frames, verified
- 2026-07-08 — R14b booth-flash attempt (superseded by R14c) — a83db74 — build:green check:green — animation:none was insufficient (is-music removed mid-collapse shifts booth reference)
- 2026-07-08 — R14 mobile MUSIC collapse to landing — 8bcf6dd — build:green check:green — removed the re-tap-returns-to-booth special case; MUSIC header now collapses whole folder to stencil; × still returns to booth

## PHASE R POLISH 4 — mobile MUSIC collapse from now-playing (2026-07-08)

---

## PHASE R POLISH 4 — mobile MUSIC collapse from now-playing (2026-07-08)

Same hard rules: `dev`; never merge; build+check green; one commit `R14:`.

### R14 — one tap on MUSIC collapses the whole folder to landing, coherently
Operator: on mobile, when a user is INSIDE the now-playing feature and taps the
main MUSIC header to collapse, it currently just pops back to the DJ booth (the
now-playing gets unselected) — wrong. It should collapse the ENTIRE MUSIC folder
in ONE tap and return to the landing stencil, regardless of whether the user is
viewing the now-playing panel or the booth.
- Root cause: the section-header click handler (`HeroVideo.astro` ~2268) has a
  mobile special case:
  `if (isMusicSection && !isOpen && mobileQuery.matches && hero.classList.contains("is-now-playing-open")) { closeMobileNowPlaying(); return; }`
  — this intercepts the MUSIC-collapse tap and only closes the now-playing
  panel (back to booth). REMOVE this special case so the tap falls through to
  the normal collapse (`setMenuSectionState(null)` + `closeStage()`), which
  already closes now-playing (`setMobileNowPlayingOpen(false)`) and returns the
  stencil (`returnStencilFromRight()`). This supersedes R6's "re-tap MUSIC
  returns to booth" — now MUSIC header = collapse-all-to-landing.
- Keep the in-panel `×` back control returning to the booth (that stays the
  "back within the feature" affordance; only the MAIN MUSIC header changes).
- ANIMATION COHERENCE (the important part): animate whatever asset the user is
  currently viewing off-screen in the site's established exit direction, then
  animate the stencil back on — with NO intermediate booth flash:
  - From the now-playing panel: the now-playing panel animates OFF-screen
    (match the site's stage-exit direction; it entered from the right) while
    the stencil returns from the right; the DJ booth must NOT slide back in
    mid-transition. Note: `closeStage()`'s `setMobileNowPlayingOpen(false)`
    today would let the booth slide back from the left — suppress that during a
    collapse-to-landing so only the now-playing exits + stencil enters.
  - From the booth view: only the booth animates off + stencil in (existing
    behavior — keep it coherent).
- Desktop unaffected (the special case is mobile-gated; desktop MUSIC collapse
  already returns to landing).
- Done when: build+check green; at 390px, from the now-playing panel ONE tap on
  MUSIC collapses the whole section → now-playing slides off + stencil animates
  in (no booth flash, now-playing not left selected, lands on the resting
  stencil); from the booth view one tap → booth off + stencil in; the in-panel
  × still returns to the booth; MUSIC reopen still works; desktop 1440
  unchanged.

---

---

## Log (Phase R polish 3)

- 2026-07-08 — R13 collapse end-flash fix — 58a7cf8 — build:green check:green — fill:forwards + animate height/padding/margins to 0; no end-flash or residual gap; reopen restores (cancel filled anim); sections+subgroups, 1440+390 verified
- 2026-07-08 — R12 mobile stage reset on collapse — d8e947f — build:green check:green — closeStage() now also runs on mobile when closing a section; & FAM/MUSIC collapse returns to landing stencil

## PHASE R POLISH 3 — mobile stage reset + collapse-animation glitch (2026-07-08)

Same hard rules: `dev`; never merge; build + check green each; one focused
commit each prefixed `R<n>:`.

### R12 — mobile: collapsing a main folder returns to the resting stencil
Bug (mobile only): when a section that owns a stage is opened (& FAM → tattoo
stage, MUSIC → DJ booth, PREORDER), then collapsed by tapping its header again,
the STAGE content stays on screen instead of returning to the landing stencil.
Desktop is correct. Root cause: in the section-header click handler
(`HeroVideo.astro` ~2266) the closing branch runs
`setMenuSectionState(isOpen ? section : null); if (!mobileQuery.matches) { closeStage(); }`
— `closeStage()` (returns to landing) is gated to desktop only, so mobile never
resets the stage on collapse.
- Fix: also call `closeStage()` on mobile when the section is being CLOSED
  (i.e. when `isOpen` is false). Simplest: `if (!mobileQuery.matches || !isOpen) closeStage();`.
- Leave the early-return branches untouched (opening MUSIC/FAM/PREORDER, and the
  mobile now-playing-close case). Don't touch the mobile collection-open path
  (the `[data-shop-all]` handler) or desktop behavior.
- Done when: build+check green; at 390px opening & FAM (tattoo rolls in) then
  tapping & FAM again returns to the landing stencil (no leftover fam content);
  same for MUSIC (booth) and any stage-owning section; desktop 1440 unchanged;
  mobile collection open/close + now-playing still work.

### R13 — fix the collapse-animation flash / residual spacing (both viewports + subgroups)
Bug (after R10, both viewports; sections AND subgroups like CATEGORIES/
DESIGNERS): right at the end of a folder collapse there's a brief "weird
spacing" — the panel flashes back toward full height / leaves a gap just before
it disappears. Root cause in `animateMenuCollapse` (`HeroVideo.astro` ~1003):
the WAAPI height animation has NO `fill` mode, so when it finishes the element
reverts to its natural height (still `display:block` under `is-collapsing`) for
the frame(s) before the `.then()` removes `is-collapsing`; and the panel's
top padding (`.hero__menu-panel{padding:0.35em 0 0}`) isn't collapsed, leaving
residual height during the slide.
- Fix so the collapse ends cleanly with no flash and no leftover gap:
  - Hold the fully-collapsed end state (e.g. `fill:"forwards"`/`"both"` on the
    animation, or commit the end styles) so it never reverts to full height
    before hiding. CRITICAL: keep the `menuCollapseAnimations` bookkeeping
    correct so a filled animation is still cancelled on reopen — reopening a
    collapsed section must restore full height (no stuck-collapsed panel).
    (Note today's `animateMenuCollapse` deletes the animation from the map
    after `finished`; a filled animation must remain cancellable by
    `cancelMenuCollapse` on the next open.)
  - Ensure the panel collapses to truly zero visible height — account for the
    `0.35em` top padding (animate/zero it too, or include it) so no residual
    gap remains during or after the slide.
- Reduced-motion path (instant collapse) must stay correct.
- Applies to both the section panel and the subgroup nested list (same
  function).
- Done when: build+check green; at 1440 AND 390, collapsing a section OR a
  subgroup (CATEGORIES/DESIGNERS) slides smoothly to nothing with NO end-flash
  and NO residual spacing; reopening a just-collapsed folder restores it fully
  (not stuck collapsed); mid-collapse reopen still clean (R10).

---

---

## Log (Phase R polish 2)

- 2026-07-08 — R11 desktop card nudge left — 3e92c2a — build:green check:green — right margin ~43px→~163px (moved 120px toward booth); size/vertical unchanged
- 2026-07-08 — R10 instant menu collapse — 2a70034 — build:green check:green — is-open removed immediately + is-collapsing keeps panel sliding; header black/+ within ~110ms both viewports; subgroups too; reopen-mid-collapse clean

## PHASE R POLISH 2 — menu collapse snappiness + desktop nudge (2026-07-08)

Same hard rules: work on `dev`; never merge; build + check green before each;
one focused commit each prefixed `R<n>:`.

### R10 — collapse the menu header state instantly (both viewports)
Bug (regression, both mobile + desktop): when a section/subgroup is open and the
user opens a DIFFERENT main folder, the old one's neon highlight + open look
persist for the WHOLE 550ms slide-out and slightly after, instead of clearing at
once. Root cause: `closeMenuSection` (`HeroVideo.astro` ~1079) and the subgroup
collapse (~1047) remove the `is-open` class only in the animation's `.then()`
(after `stageDuration`=550ms), and the neon (`global.css:722`
`.hero__menu-section.is-open > .hero__menu-header`) + the open glyph are keyed to
`is-open`. So the header stays lit the whole animation.
Fix — decouple the header's open appearance from the panel slide:
- On collapse, remove `is-open` IMMEDIATELY (so neon clears + the toggle glyph
  flips to `+` at once via the existing `aria-expanded` sync), and add a
  transient class (e.g. `is-collapsing`) to the section so the panel stays
  displayed while the WAAPI height animation runs; remove `is-collapsing` in
  the animation's `.then()` (replacing the current `is-open` removal there).
- Apply the SAME pattern to the subgroup collapse (the `.hero__menu-item--group`
  nested panel) so CATEGORIES/DESIGNERS unhighlight instantly too.
- CSS: wherever the panel is shown via `.is-open .hero__menu-panel{display:…}`
  (global.css ~730, ~809, ~1025) and the nested-group panel, add a matching
  `.is-collapsing …` (and group `.is-collapsing`) selector so the panel/nested
  stays visible during the slide. Keep the neon rule (722) and the group
  subheader neon keyed to `.is-open` ONLY, so dropping `is-open` clears neon
  immediately. Do NOT change the `is-current` rules (R9 mobile in-collection
  cue is intended to persist).
- Preserve the collapse-token logic: reopening a section mid-collapse must
  cancel the animation + `is-collapsing` and restore `is-open` cleanly (no
  stuck panels).
- Reduced-motion path already collapses instantly — keep it working.
- Done when: build + check green; at 1440 AND 390, opening a folder then
  clicking a different main folder flips the old header to `+` and removes its
  neon IMMEDIATELY (no 550ms lag) while its panel still slides closed smoothly;
  same for subgroups; reopening mid-collapse works; R9's mobile in-collection
  neon still behaves.

### R11 — nudge the desktop now-playing card left ~1.25in (~120px)
Operator: the R8 card is still too far right. Move it LEFT by ~120px (1.25in at
96px/in), toward the DJ booth. Desktop only (`≥761px`): increase the card's
right offset by ~120px (current right margin is ~`clamp(36px,3vw,54px)`≈43px →
new ≈160px). Keep size/vertical position from R8. Operator will fine-tune again.
Done when: build+check green; at 1440 the card's right gap is ~150–170px (was
~43); size + vertical center unchanged; mobile byte-identical.

---

---

## Log (Phase R polish)

- 2026-07-08 — R9 mobile menu is-current — 3329d7d — build:green check:green — section holding active collection shows −+neon on mobile (sub-lists stay collapsed); desktop untouched
- 2026-07-08 — R8 desktop card enlarge+lower — d56cd40 — build:green check:green — 331x159 ~2:1, right margin ~43px, vertical center ~41%
- 2026-07-08 — R7 menu item neon — 4337a82 — build:green check:green — mobile green while panel open; desktop hover/active only

## PHASE R POLISH — now-playing highlight, desktop placement, mobile menu state (2026-07-08)

Operator review of the redesign. Same hard rules: work on `dev`; never merge;
`npm run build` + `npx astro check` green before each; one focused commit each
prefixed `R<n>:`; feature dormant when `PUBLIC_NOW_PLAYING_URL` unset.

**Operator decisions:** desktop NOW PLAYING highlight = hover/press only (it's
an external link, no persistent state). Mobile in-collection menu = top header
only (flip the section to `−` + neon; keep sub-lists collapsed for catalogue
room).

### R7 — NOW PLAYING · IN STORE menu item neon highlight
Make the new menu item highlight neon green like the other subfolders, per the
two decisions:
- Mobile (`≤760px`): while the mobile now-playing panel is open
  (`is-now-playing-open`), the `[data-now-playing-menu-item]` shows neon green
  (var(--neon-green)) — the "you're in this subfolder" active state, matching
  how an open section/subgroup reads. Returns to normal when the panel closes.
- Desktop (`≥761px`): hover/press only — the item gets the same neon hover +
  `:active` treatment as the site's other menu links (it currently may render
  inert-styled when idle from R5; ensure hover/active still flash neon). No
  persistent green.
- Don't disturb R5's live/inert href logic; this is styling only.
- Done when: build+check green; at 390px opening the now-playing panel turns
  the menu item neon and closing it clears it; at 1440 the item flashes neon on
  hover/press only; empty vs live unaffected.

### R8 — desktop now-playing placement: lower + enlarged (match the markup)
The R5 block sits too high (top ~198px on a 900-tall viewport, ~22%). The
operator's original markup put it as a taller box on the RIGHT, centered around
the upper-middle. Reposition + resize on desktop only (`≥761px`):
- Move it DOWN so the block's vertical center is roughly 40% of the viewport
  height (was ~24%) — clear below the cart/search icons, sitting in the
  right-middle like the markup's black rectangle.
- Enlarge it: it is currently a wide-short strip (~430×74). Make it a taller,
  more substantial card (target roughly 300–340px wide × ~140–160px tall, ~2:1)
  with LARGER album art and comfortably larger type, still in the site's style.
  Keep it right-aligned within the stage with a comfortable right margin (not
  hugging the very edge).
- Exact numbers are operator-tunable after review — land it in the
  right-middle, clearly bigger. Mobile unchanged (this is desktop-only CSS).
- Done when: build+check green; at 1440 the live block is a larger ~2:1 card in
  the right-middle (not up under the icons); empty state matches the new
  size/position; 390px mobile byte-identical.

### R9 — mobile menu state: top header reflects the open collection
Bug: on mobile, opening a collection (e.g. tapping SHOP ALL) collapses the
parent section so its header wrongly reads `CLOTHES +`. Desktop is correct and
must stay unchanged. Fix (mobile `≤760px`), "top header only" per operator:
- When a collection is active (`hero.dataset.activeCollection` set) on mobile,
  the section that CONTAINS that collection shows its header as `CLOTHES −` in
  neon green — the current-section cue — even though its sub-lists stay
  collapsed (so the catalogue keeps its room).
- Likely mechanism: the `+`/`−` glyph and neon color are driven by `is-open`
  today; decouple by adding an `is-current` (or similar) class to the section
  that holds the active collection, and make the header show `−` + neon when
  the section is `is-open` OR `is-current`. Set/clear `is-current` wherever
  `activeCollection` is set/cleared. Keep the sub-list panel collapsed on mobile
  in the `is-current`-but-not-`is-open` case.
- Desktop behavior must not change (desktop already shows the full open branch).
- Done when: build+check green; at 390px, tapping SHOP ALL (or any category)
  leaves the parent section header reading `−` + neon while the catalogue shows;
  leaving the collection clears it; the correct section is marked when switching
  between CLOTHES/OBJECTS collections; desktop 1440 unchanged.

---

---

## Log (Phase R redesign)

- 2026-07-08 — R6b mobile DJ slide-off fix — 96ef9fd — build:green check:green — animation:none lets the translate win over idle-sway; booth clears left edge, panel centered
- 2026-07-08 — R6 mobile click-in stage — 4886093 — build:green check:green — default hides now-playing; menu item slides DJ off-left + now-playing in from right; × back + re-tap MUSIC; .55s ease-in-out; reduced-motion instant
- 2026-07-08 — R5 desktop relocate + menu link — 34f88c2 — build:green check:green — block upper-right; menu item opens current song when live, inert when idle; empty art frame hidden
- 2026-07-08 — R4 foundation — 504ceec — build:green check:green — NOW PLAYING·IN STORE menu item (dormant-gated), secondary playlist box removed both viewports, quiet 'nothing playing right now' empty state, fetch URL hardened to origin+/now

## PHASE R REDESIGN — music section (operator markup, 2026-07-08)

Reworks the now-playing feature (R1–R3) per an operator markup of the MUSIC
stage. The worker (R1) is untouched. Honesty gate from R2 stays intact — never
show a stale/old song. Everything reuses the site's existing fonts, sizes, and
animation timing/easing. **Hard rules per commit:** work on `dev`; never merge;
`npm run build` + `npx astro check` green before each; one focused commit each,
prefixed `R<n>:`; the feature stays dormant when `PUBLIC_NOW_PLAYING_URL` is
unset (byte-identical MUSIC stage).

**Decisions locked by the operator:**
- New MUSIC dropdown: below `& SON OFFICIAL PLAYLIST`, add a second item
  `NOW PLAYING · IN STORE`.
- Empty state (nothing genuinely playing — store closed, paused, toggle off,
  device gated, stale, or worker error): show a quiet "nothing playing right
  now" state in the site's voice. Do NOT hide the feature; never show an old
  song.
- Remove the secondary "hear it in store? follow the whole rotation" playlist
  box on BOTH viewports (the playlist stays reachable via the
  `& SON OFFICIAL PLAYLIST` menu item).
- Mobile return from the enlarged now-playing: BOTH a back/close control AND
  re-tapping the MUSIC header return to the DJ booth.

### R4 — foundation: menu item, remove playlist box, quiet empty state, URL hardening
Both viewports; structural.
- `src/data/content.ts`: in the `heroMenu` MUSIC section (`music: true`,
  currently one item `& SON OFFICIAL PLAYLIST`), add a second item directly
  below it labelled `NOW PLAYING · IN STORE`. It is NOT a plain external link —
  mark it with a flag (e.g. add `nowPlaying?: boolean` to the
  `HeroMenuSubItem` type and set `nowPlaying: true`) so markup/JS can target
  it; its click behavior is wired in R5 (desktop) and R6 (mobile).
- `HeroVideo.astro`: remove the secondary "hear it in store? follow the whole
  rotation" playlist box from the now-playing block markup (both viewports).
  Keep the now-playing card itself. The playlist link now lives only in the
  menu item.
- `public/scripts/now-playing.js`: replace the current "hide when not live"
  behavior with the quiet empty state. When the gate is NOT satisfied
  (show:false / stale / store closed / fetch error), render the
  `NOW PLAYING · IN STORE` label plus a mono "nothing playing right now" line
  (site voice) instead of hiding the block. When live+fresh, render the song
  exactly as today (art, title — artist, progress bar, live pulse). The block
  still only exists within the MUSIC stage (desktop) / the clicked-in panel
  (mobile, R6).
- URL hardening (fixes an operator-facing footgun): build the fetch target as
  `new URL(nowPlayingUrl).origin + "/now"` so `PUBLIC_NOW_PLAYING_URL` can be
  the plain worker base URL (e.g. `https://…workers.dev`) OR a full `…/now`
  URL — both resolve. Update `.env.example` to document it as the worker's
  base URL. (CSP origin derivation in Base.astro already uses `.origin` —
  leave it.)
- **Done when:** build + check green; env UNSET → MUSIC stage byte-identical to
  pre-R4 (dormant); env set (dev) → block shows a song when live and "nothing
  playing right now" when not, secondary box gone, new menu item present;
  fetch works whether the env var has `/now` or not.

### R5 — desktop: relocate the block + wire the menu link
Desktop only (`≥761px`); do not change mobile.
- Move the now-playing block from its current bottom-center-right spot to the
  UPPER-RIGHT of the MUSIC stage: right-aligned, upper third, comfortable
  margin from the top and right edges, clear of the cart/search icons and the
  DJ figure. Keep the block's existing styling and size (do not enlarge).
  Exact position is operator-tunable after review — land it cleanly in the
  upper-right.
- Wire the desktop `NOW PLAYING · IN STORE` menu item: when a live song is
  showing, it is an active link opening the current track's Spotify URL in a
  new tab (`target=_blank rel=noopener`), mirroring the block's own link —
  clicking the menu item does what clicking the block does. Keep its href in
  sync as the track updates. When not live (empty state), the menu item is
  inert: no navigation, default cursor, no hover underline.
- Also (shared polish, applies both viewports — R4 left it): in the empty
  state, hide the album-art FRAME element too (not just the img), so the quiet
  state is only the `NOW PLAYING · IN STORE` label + "nothing playing right
  now" line, with no empty bordered square. This is a small `now-playing.js`/
  css tweak; keep it minimal.
- **Done when:** build + check green; at 1440 a live song sits upper-right and
  the menu item opens that song; with nothing playing the block shows just the
  label + "nothing playing right now" (no empty art box) and the menu item is
  inert; mobile unchanged (byte-check the mobile block).

### R6 — mobile: click-in now-playing stage
Mobile only (`≤760px`); do not change desktop.
- Default mobile MUSIC view shows ONLY the DJ booth + notes (no now-playing
  block by default — it is removed from the default stage).
- Tapping the `NOW PLAYING · IN STORE` menu item animates the DJ booth
  figurine OFF-screen to the LEFT and animates the now-playing panel IN from
  the RIGHT to center, enlarged to sit as the primary screen feature (fit the
  mobile viewport with the site's standard margins). Use the site's existing
  transition timing/easing (match the menu-drawer / stage transitions in
  global.css). The panel shows the live song enlarged, or the "nothing playing
  right now" empty state.
- Return to the DJ booth by EITHER (a) a back/close control in the site's
  style (× or ← back, matching the product/film close controls) OR (b)
  re-tapping the MUSIC header — both reverse the animation (now-playing slides
  out right, DJ booth slides back in from left).
- `prefers-reduced-motion`: no slide — swap instantly, consistent with the
  site's other reduced-motion handling.
- **Done when:** build + check green; at 390px default MUSIC shows only the DJ
  booth; tapping the menu item slides DJ out / now-playing in enlarged; BOTH
  the back control and re-tapping MUSIC return to the booth; reduced-motion
  swaps without sliding; desktop unchanged (byte-check desktop block).

---

## PHASE R — now playing in store (operator intent notes, 2026-07-07)

The store's Spotify (hello@shopandson.com, Premium) plays the shop speakers
via "Benjamin's iPad" (Bluetooth → speakers, so Spotify reports the iPad as
the playing device). A visitor opening the MUSIC stage sees the song playing
in the store right now — live, clickable, honest. Operator notes are intent,
not spec: make reasonable calls, keep the site's editorial voice.

**Hard rules for all three commits:** work on `dev`; never merge; from
`homepage/`, `npm run build` + `npx astro check` green before each commit;
one focused commit each, prefixed `R<n>:`. R1 creates a NEW top-level folder
`worker/` at the REPO ROOT (sibling of `homepage/`) — this is explicitly
authorized by the operator for R1 only; R2/R3 stay inside `homepage/`.
The site deploy must NEVER depend on the worker: env unset → site identical
to today.

### R1 — the messenger (Cloudflare Worker, repo root `worker/`)
Self-contained folder: `worker/wrangler.toml`, `worker/src/index.js` (module
worker, vanilla JS), `worker/scripts/authorize.mjs`, `worker/README.md`.
Free tier only (one KV namespace for persistence).

- Config: `SPOTIFY_CLIENT_ID` var = `8890a3933d484ade825a44278a8f5792`;
  secrets (NEVER in the repo, set via `wrangler secret put`):
  `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `TOGGLE_SECRET`.
  `ALLOWED_DEVICES` var, comma-separated, initial value `Benjamin's iPad`
  (matching case-insensitive, trimmed).
- Spotify: refresh-token flow (Authorization Code, no PKCE needed server-side;
  access token cached in-isolate until expiry, one retry on 401). Use ONLY
  `GET /v1/me/player` (Get Playback State — survived the Feb 2026 Development
  Mode cuts and includes the playing device). Scope: `user-read-playback-state`.
- `GET /now` (public, CORS `*`, always 200 JSON, ~8s in-isolate cache):
  show the track ONLY when ALL of: toggle on (KV) · `is_playing` ·
  `currently_playing_type === "track"` · `item` present and not
  `item.is_local` · `device.name` in ALLOWED_DEVICES. Then:
  `{show:true, track:{name, artists, album, art, url}, progressMs,
  durationMs, fetchedAt}`. EVERY other case — podcasts, ads, local files,
  paused, idle, no device, gated device (phone), toggle off, Spotify error,
  auth dead — returns `{show:false}` (optional private `reason` field is
  fine). Never a non-200, never an error shape. Remote-controlling playback
  from a phone keeps device = iPad and must keep working (no logic keyed to
  the controlling device).
- `GET|POST /toggle?state=on|off&secret=…` (accept both methods so an iOS
  Shortcut stays trivial; also accept header auth): checks `TOGGLE_SECRET`,
  writes KV, returns `{toggle:"on"|"off"}`; bad secret → 403. Missing state →
  return current value.
- `GET /status` (public, no secrets): `{auth:"ok"|"error", toggle,
  allowedDevices, lastSpotifyOkAt, lastShowAt}` — enough for the operator to
  spot a revoked authorization at a glance (KV-stamped, throttled writes).
- `worker/scripts/authorize.mjs`: one-time local handshake — starts an http
  server on `127.0.0.1:8888/callback` (the registered redirect URI), prints
  the authorize URL (scope `user-read-playback-state`), exchanges the code
  (client id + secret prompted via env/stdin, never persisted), prints the
  refresh token for `wrangler secret put SPOTIFY_REFRESH_TOKEN`.
- `worker/README.md`: deploy steps (wrangler login/KV create/secrets/deploy),
  handshake steps while logged into the store account, iOS Shortcut wiring
  for the toggle (iPad + optionally phone), updating ALLOWED_DEVICES if the
  iPad is renamed/replaced, re-auth steps when the connection dies, and a
  test-day checklist: skip, pause, play from a phone (must vanish), remote-
  control from phone (must stay), toggle off/on, closing time — site checked
  through each.
- No file anywhere may contain the client secret, a refresh token, or a
  toggle secret value. Build/check for `homepage/` still green (R1 touches
  nothing inside homepage/, but run them anyway to prove it).

### R2 — the site display (MUSIC stage, inside homepage/)
- Env: `PUBLIC_NOW_PLAYING_URL` (worker origin). UNSET today and stays unset
  in this commit: with it unset the built site must be byte-equivalent to
  today's MUSIC stage (no visible markup, no network calls, no console
  noise). Document it in `homepage/.env.example`.
- Placement: the live MUSIC stage is the `.hero__dj` panel in
  `HeroVideo.astro` (~line 81, DJ cutout + notes). There is NO live
  now-playing markup — the old editorial block exists only in
  `src/data/content.ts` (`music.nowPlaying`, label "NOW PLAYING · IN STORE")
  and the retired `Music.astro`; reuse that label string from content.ts,
  build the block into the dj panel in the stage's own style.
- The block, editorial not glossy: mono uppercase label · song — artist ·
  thin hairline progress bar ticking in real time (local tick between
  heartbeats from progressMs + elapsed, clamped to duration) · small album
  art with the site's 1px ink border · Spotify's mark small and monochrome
  (inline SVG) · the whole block one `<a>` (target=_blank rel=noopener) to
  the track URL. Beside it, the existing official-playlist link (URL already
  in content.ts nav/music data) with the line "hear it in store? follow the
  whole rotation." Neon green appears EXACTLY once: a small live pulse dot,
  shown only when the answer is fresh. `prefers-reduced-motion`: bar static,
  no pulse.
- Honesty gate, all client-side, in order: store OPEN (reuse the existing
  hours source — body `data-open-hour`/`data-close-hour` written by
  Base.astro from site.hours, same America/New_York math as
  public/scripts/base.js — do NOT duplicate the hours values) AND worker
  says show:true AND fetchedAt fresh (stale > ~45s = not fresh). Any failure
  → the block hides entirely and the stage looks exactly as today. An old
  song must NEVER render as now playing.
- Freshness without user action: fetch when the MUSIC stage opens; heartbeat
  every ~25s only while the stage is open AND the tab visible
  (visibilitychange-aware, immediate re-check on tab return); one extra
  check scheduled at expected track end (+~1.5s) so changes land moments
  after the room hears them; every timer cleared on stage close / tab
  hidden.
- CSP (Base.astro meta, PROD only — added in Phase P): append the worker
  origin to `connect-src` ONLY when `PUBLIC_NOW_PLAYING_URL` is set at build
  time (derive origin from the env var); add `https://i.scdn.co` to
  `img-src` unconditionally now (Spotify album art CDN, harmless while
  unused). With env unset the connect-src stays exactly as shipped.
- Keep it vanilla (no deps), scoped to the music stage script lifecycle.

### R3 — outline revision (inside homepage/, separate commit)
Remove the neon frame from CATALOGUE product listings on BOTH desktop and
mobile: delete the `.product-card__media::after` frame rules added by Q4
(desktop min-width block) and Q5/Q5b (mobile block, 1px). Revert the
`.product-card__sold-out` z-index bump if it was only there for the frame.
INDIVIDUAL product listings keep their frames exactly as-is (desktop 3px,
mobile 2px inset overlays, glow, lightbox suppression — untouched). No other
outline/highlight changes anywhere.

---
>
> **Q5 spec.** Make the catalog-card + product-view neon frame system
> universal across viewports, proportioned for mobile:
> 1. Product view (individual listing), mobile: REPLACE the current
>    `outline:2px solid var(--neon-green)` on `.product-detail__carousel`
>    (mobile block ~1898) with the same inset overlay used on desktop:
>    `::after { content:""; position:absolute; inset:0; border:2px solid
>    var(--neon-green); pointer-events:none; z-index:1 }` — same visible
>    weight as today (operator wants the current mobile size kept), but
>    hugging the carousel frame exactly and unclippable. Keep the existing
>    mobile glow `::before` exactly as-is. Carry over the lightbox
>    suppression on mobile the same way desktop does (border transparent
>    while `body.is-product-lightbox-open`; check what the mobile block
>    currently does with the outline in that state and mirror it for the
>    overlay). Remove the now-dead outline rules (including the
>    `transition:outline-color` line) — don't leave both mechanisms active.
>    Carousel arrows must stay above the border line and clickable (they are
>    z-index:2 on desktop; verify mobile stacking).
> 2. Catalog/search cards, mobile: add the `.product-card__media::after`
>    frame in the mobile block too, at reduced weight for the compact
>    2-column cards — 1.5px solid var(--neon-green) (judgment range 1-2px,
>    constraint: the product-view 2px frame must still read a visible step
>    stronger on a phone). Sold-out chip stays above (z-index parity with
>    the desktop change).
> Verify: build + check green; at 390px the catalog grid shows subtle neon
> frames on every card, an opened product shows the 2px frame hugging the
> image exactly (no drift from the old outline position), lightbox opens
> clean with no border bleed, arrows work; at 1440 desktop is pixel-identical
> to Q4 (3px product, 2px cards).**
>
> **Q4 spec.** Two coordinated changes forming a visual hierarchy:
> 1. Catalog/search cards: apply the Q3b inset-overlay treatment to every
>    catalogue listing image on desktop — target `.product-card__media`
>    (ensure `position:relative`), add `::after { content:""; position:
>    absolute; inset:0; border:2px solid var(--neon-green);
>    pointer-events:none; }` with z-index above the img but below the
>    sold-out chip (`.product-card__sold-out`) — check its stacking and keep
>    the chip on top. Cards are DOM-built in HeroVideo.astro (media class at
>    ~1273); the pure-CSS overlay needs no JS change. Scope to desktop so the
>    mobile 2-col cards stay untouched (the catalog grid's mobile block is
>    ~1109; mirror that split).
> 2. Individual product view: make its frame slightly more apparent than the
>    cards — bump the Q3b carousel overlay border from 2px to 3px (both
>    `.hero__product` and `.product-detail--standalone` desktop contexts).
>    Mobile's own outline stays 2px, untouched.
> Verify: build + check green; at 1440 every card in the catalog grid AND in
> search results shows the 2px neon frame on its image tile (sold-out chip
> still on top, sold-out opacity treatment intact); an opened product shows
> the 3px frame reading a step stronger; 390px mobile pixel-unchanged (no
> card borders, product outline still 2px).**
>
> **Q3b spec.** Operator verified Q3 on dev: the outline is invisible on most
> products and shows only along the bottom on others. Root cause: `outline`
> paints OUTSIDE the border box, and the desktop carousel sits flush against
> overflow-clipped ancestors, so the outline is clipped wherever the image
> fills its container (tall images = all edges clipped except any slack side).
> Replace the desktop treatment with an INSET overlay that cannot be clipped:
> - Remove the desktop `outline`-based neon rules Q3 added (both
>   `.hero__product` and `.product-detail--standalone` contexts), including
>   any now-orphaned glow `::before` desktop rules if they are also clipped
>   into invisibility — judgment: keep the glow only if it actually renders.
> - Add, desktop contexts only (`.hero__product .product-detail__carousel`
>   and `.product-detail--standalone .product-detail__carousel`):
>   `::after { content:""; position:absolute; inset:0;
>   border:2px solid var(--neon-green); pointer-events:none; }` with a
>   z-index just high enough to sit above the image but below the carousel
>   arrows/counter chips (check their stacking; arrows must stay clickable
>   and visually above the border line where they overlap it).
> - The carousel is `position:relative` already (verify; add if a context
>   lacks it).
> - Lightbox parity with Q3: while the product lightbox is open the border
>   must not glow through — carry over the existing suppression state
>   (border-color transparent under `body.is-product-lightbox-open`), and the
>   lightbox itself gains no border.
> - Mobile (≤760px) keeps its current outline+glow exactly as-is.
> Verify: build + check green; at 1440, opening several products from the
> catalog (landscape AND tall portrait assets) shows the full 2px neon frame
> on ALL FOUR edges hugging the image; same on /product/?handle=…; arrows
> and lightbox still work; 390px mobile unchanged.**
>
> **ACTIVE SUB-TASK: PHASE Q2 then Q3 (operator desktop pass, 2026-07-07).
> Two ordered commits, one dispatch each, Claude reviews between. DESKTOP
> ONLY — mobile must stay pixel-identical in both. Specs below.**
>
> **Q2 spec — catalog rows back to 3-across (desktop).** `.hero__catalog-track`
> (global.css ~672) is `grid-template-columns:repeat(4,minmax(0,1fr))` on
> desktop. Change to `repeat(3,minmax(0,1fr))` — the old catalogue dimensions.
> Cards enlarge automatically (fractional columns). This one grid serves the
> catalog rail, the search results, and the search "more like this" fallback,
> which is exactly the operator's intent (every multi-listing catalogue grid
> on desktop). The mobile override (~1109, `repeat(2,...)`) stays untouched.
> Before committing, grep the catalog/search JS (HeroVideo.astro, catalog.ts)
> for any logic coupled to a 4-column count (page-size math, batch/fill
> counts, "row" calculations) and reconcile with 3 if found — QA found only a
> generic slice(limit); confirm. Verify: build + check green; at 1440 the
> catalog and search grids show 3 larger listings per row; at 390 mobile still
> shows 2.
>
> **Q3 spec — neon carousel border on desktop product views.** Mobile already
> frames the product-detail carousel in neon green (mobile block ~1898:
> `.product-detail__carousel{outline:2px solid var(--neon-green)}` plus the
> soft radial glow `::before`). Recreate that same treatment on DESKTOP for
> every individual product view: the in-page product stage
> (`.hero__product .product-detail__carousel`) and the standalone page
> (`/product/`, `.product-detail--standalone`). Notes:
> - The carousel element is `display:inline-flex; width:fit-content`, so it
>   already hugs the rendered asset frame — the outline will fit each
>   product's carousel dimensions automatically, which is the requirement.
>   Do not fix the width/aspect; the border adapts per product.
> - Desktop currently kills it explicitly (~1751:
>   `.hero__product .product-detail__carousel{outline:0; box-shadow:none}`) —
>   that rule (and any sibling suppressors) is what you're overriding/removing
>   for the outline; check the lightbox-open state (~1915) still behaves (no
>   double border or stray glow while the lightbox is up, and the lightbox
>   itself gains no border).
> - Same neon (`--neon-green`), same 2px weight and glow as mobile so the
>   language matches.
> Verify: build + check green; at 1440 a product opened from the catalog AND
> /product/?handle=… show the neon-framed carousel hugging the image; sold-out
> and multi-image products frame correctly; mobile (390px) pixel-unchanged.**
>
> **PHASE Q1 spec.** DESKTOP ONLY (the existing desktop media block for the
> hero menu, where indentation is currently flattened flush-left — see
> `global.css` ~795-804; mobile keeps its current look, pixel-unchanged).
> Goal: when a menu folder is open, its contents indent one subtle step per
> nesting level, signaling the folder tree:
> - Level 0, no indent: `.hero__menu-header` (CLOTHES / OBJECTS / MUSIC /
>   & FAM).
> - Level 1, one step: everything directly inside an open section's
>   `.hero__menu-panel` — subgroup headers (`.hero__menu-subheader`, e.g.
>   CATEGORIES, DESIGNERS) AND direct links (`.hero__menu-link--dash`, e.g.
>   OBJECTS' entries, MUSIC's playlist link).
> - Level 2, two steps: entries inside `.hero__menu-nested` (SHOP ALL,
>   JACKETS / OUTERWEAR, designer names, …).
> Implementation: one CSS variable (e.g. `--menu-indent: 14px`) on the hero
> menu, levels indent by calc multiples of it, so the operator can tune a
> single number. Rules must be STRUCTURAL (by the classes above), not
> per-section, so any future subfolders (e.g. under & FAM) indent
> automatically. The search-breadcrumb and any catalog/product states of the
> menu must not shift (scope the rules to the open-menu tree lists only).
> Keep the existing open/close animations intact. Verify: `npm run build` +
> `npx astro check` green; at 1440 CLOTHES→CATEGORIES→SHOP ALL shows the
> stepped tree; OBJECTS and MUSIC level-1 entries indent; mobile (390px)
> unchanged.

> **PHASE P COMPLETE on `dev`, ready for operator
> verify. All 7 commits reviewed clean: P1 @ ab0c046, P2 @ 10dc58d, P3 @
> 75ba18f + 42144bc (CSP is PROD-only; the layout's is:inline
> clock/overlay/header script was externalized to public/scripts/base.js to
> satisfy script-src 'self'), P4 @ d6be23c, P5 @ 8c58f4d, P6 @ 7da4540.
> Final Playwright verification on the production build (desktop + mobile):
> zero console errors / zero CSP violations across menu, search, catalog,
> product, add-to-cart, film, and policy flows; /legacy/ 404s; robots.txt
> ships; badges pin to the bag icon unclipped; hit areas expanded. Do NOT
> push to main / NO PR until the operator says "ship Phase P".**

## Log (Phase R)

- 2026-07-07 — R3 catalogue frames removed (both viewports) — 332b9ea — build:green check:green — product frames untouched (3px/2px), sold-out z reverted
- 2026-07-07 — R2 music now-playing display — ed78afa — build:green check:green — dormant with env unset (dj subtree byte-identical, no script ref, no console calls); hours gate reuses body data attrs; CSP gains worker origin only when env set, img-src +i.scdn.co
- 2026-07-07 — R1 now-playing worker (repo root worker/) — 908081b — build:green check:green — /now /toggle /status, fail-closed toggle, device gate, refresh-token flow, handshake script + README; no secrets in repo

## Log (Phase Q)

- 2026-07-07 — Q5b mobile card frame 1.5px→1px — 25a93fd — build:green check:green — operator tone-down; one value
- 2026-07-07 — Q5 mobile neon frame parity — f209c23 — build:green check:green — mobile product outline→inset ::after 2px (glow kept, lightbox suppression ported), mobile cards 1.5px; desktop pixel-identical
- 2026-07-07 — Q4 catalog card neon frames + 3px product frame — 55d2fb1 — build:green check:green — .product-card__media::after 2px desktop-only, sold-out chip z-index 2, carousel overlay 2px→3px; verified 1440 + mobile 0px
- 2026-07-07 — Q3b inset neon carousel frame (desktop) — 35f197a — build:green check:green — replaces Q3 outline; 4-edge pixel-verified portrait+landscape, stage+standalone; arrows/lightbox stack intact
- 2026-07-07 — Q3 desktop neon carousel border — 1fa8189 — build:green check:green — superseded by Q3b (outline clipped by overflow ancestors)
- 2026-07-07 — Q2 catalog rows 3-across (desktop) — 817767f — build:green check:green — one grid value + img sizes hint 16vw→22vw; search + more-like-this share the track; mobile 2-col untouched
- 2026-07-07 — Q1 desktop menu tree indent — 5308070 — build:green check:green — one --menu-indent var (14px), levels 0/1/2, structural so future subfolders inherit; verified 1440 + mobile unchanged

## Log (Phase P)

- 2026-07-07 — P6 robots.txt — 7da4540 — build:green check:green — ships at /robots.txt
- 2026-07-07 — P5 cart badge anchoring — 8c58f4d — build:green check:green — mobile hero + product header pinned to bag glyph; desktop hero untouched
- 2026-07-07 — P4 mobile tap targets — d6be23c — build:green check:green — additive ::after hit areas ≤760px, no visual change
- 2026-07-07 — P3 fix: CSP PROD-only + externalize Base inline script — 42144bc — build:green check:green — public/scripts/base.js; zero violations on preview
- 2026-07-07 — P3 CSP meta tag — 75ba18f — build:green check:green — full-directive policy in Base.astro head
- 2026-07-07 — P2 sanitizer hardening — 10dc58d — build:green check:green — allowlist URL schemes, xlink:href, base/meta/link/style stripped; sanity vectors verified dead
- 2026-07-07 — P1 retire legacy page — ab0c046 — build:green check:green — dist/legacy gone, components/assets kept

---

## PHASE P — production hardening (pre-launch QA + security sweep, 2026-07-07)

Source: full-site Playwright QA (desktop 1440x900 + mobile 390x844) plus a
3-agent security audit. Everything functional passed; these six commits close
the punch list. **Hard constraints for every commit:** zero visual change at
1440 desktop unless the sub-task says otherwise; do not break any existing
behavior (menu, search, catalog, product view, cart, film, policies, preorders);
`npm run build` AND `npx astro check` green before each commit; one focused
commit per sub-task, message prefixed `P<n>:`.

### P1 — retire the legacy page
`src/pages/legacy.astro` is the pre-overlay editorial homepage. It is unlinked
from the live experience, still builds/deploys/is crawlable, and is the only
page with real layout defects (15px horizontal overflow on mobile). The
operator approved removing it.
- **Delete `src/pages/legacy.astro` and nothing else.** Keep every component it
  imports (`About`, `Clothing`, `Objects`, `Music`, `Preorders`, `Vault`, plus
  `FlowerDivider`/`TopBar`/`IndexOverlay` if now unused) and all assets on
  disk — reference material; unused components are not bundled.
- First grep `legacy` across `src/` — if anything else references the page,
  stop and report instead of improvising.
- **Done when:** `dist/legacy/` no longer exists after build; build + check
  green; the only file changed is the deleted page.

### P2 — harden sanitizeShopifyHtml (allowlist URL schemes)
`src/lib/storefront-client.ts:153-172` `sanitizeShopifyHtml()` is a denylist
feeding `innerHTML` (`product-view.ts:695`, `policies.astro:65`). Known
bypasses: whitespace-obfuscated schemes (`java\tscript:` passes the
`startsWith("javascript:")` check but executes on click), namespaced
`xlink:href` never checked (attribute name is `xlink:href`, code compares
`=== "href"`), and injected `<base>`/`<meta>` survive. Rewrite the function's
internals (same export, same signature, same call sites):
- Element strip list becomes: `script, iframe, object, embed, form, base,
  meta, link, style`.
- Iterate `getAttributeNames()` on every element. Remove any attribute whose
  lowercased name starts with `on`.
- URL-bearing attributes — `href`, `src`, `action`, `formaction`, `srcset`,
  and any name ENDING in `:href` (covers `xlink:href`) — validate the value:
  make a lowercased copy with all `[\x00-\x20]` chars stripped, then ALLOW only
  values starting with `http:`, `https:`, `mailto:`, `tel:`, `/`, `./`, `../`,
  `#`, `?`, or values containing no `:` at all. Anything else (`javascript:`,
  `data:`, `vbscript:`, unknown schemes) → remove the attribute.
- Dependency-free vanilla TS — no DOMPurify, no new packages in this pass.
- **Done when:** build + check green; `/policies/?policy=refund-policy` still
  renders its body in `npm run dev` with no console error; sanity test pasted
  into stdout: running the function on
  `<a href="java\tscript:alert(1)">x</a><svg><a xlink:href="javascript:alert(1)">y</a></svg><base href="//evil">`
  yields output with no `<base>` and no surviving `javascript` URL.

### P3 — Content-Security-Policy meta tag
GitHub Pages cannot set response headers; a `<meta http-equiv>` CSP in
`src/layouts/Base.astro` `<head>` is the only available mitigation and is the
second layer behind P2. Facts already verified from the built output: all
executable scripts are same-origin module files (the only inline `<script>` is
`type="application/json"`, which CSP does not execute); styles are
Astro-inlined `<style>` tags + Google Fonts CSS; images come from self +
`cdn.shopify.com`; runtime fetches go to `https://shopandson.com` (Storefront
GraphQL + products.json); the only iframe is same-origin `/preorders/`;
Spotify is a plain link, no embed. Add exactly:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://cdn.shopify.com; media-src 'self' https://cdn.shopify.com; connect-src 'self' https://shopandson.com; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://shopandson.com;" />
```
Place it in `<head>` before the font `<link>` tags. Do NOT touch
`public/preorders/index.html` (ships as-is and uses an inline `onclick`; the
iframe content is not governed by the parent page's CSP).
- **Done when:** build + check green; in `npm run dev` there are ZERO
  CSP-violation console messages while: opening the menu, running a search
  (cdn.shopify.com thumbnails load), opening a product (images render,
  add-to-cart opens the drawer), opening the film, and loading
  `/policies/?policy=refund-policy`. If a violation appears, report it in
  stdout — do not loosen the policy on your own.

### P4 — mobile tap-target hit areas (NO visual change)
Mobile-only (`≤760px`, matching the existing mobile media blocks in
`src/styles/global.css`). QA measured these controls far under the 44px floor:
`.hero__menu-header` (90x25), the hero footer links (`info@…` mail link +
refund/privacy/terms, ~11-13px tall), `.product-detail__carousel-arrow`
(28x28), `.cart-line__step` (28x26), `.cart-line__remove` (28x28),
`.policy-page__back` + `.product-detail__back` (40x12),
`.product-detail__home-link` (59x12).
- Technique: enlarge the HIT AREA only — `position:relative` on the control
  plus a transparent `::after { content:""; position:absolute; inset:<negative
  offsets>; }` bringing the effective target to ≥44px in the short dimension.
  Where `::after` is already used for styling, use `::before` or
  padding+negative-margin instead — per element, never restyling anything
  visible.
- Risks to manage: adjacent controls swallowing each other (the cart line's
  − / count / + / remove sit in a row — cap horizontal expansion there;
  vertical is free); pseudo-elements intercepting clicks meant for other
  elements (keep them on the control, no z-index changes).
- **Done when:** build + check green; at 390px each listed control's effective
  tap box is ≥40px in its short dimension; zero visible change at 390px and
  1440px; menu open/close, qty steppers, remove, and back buttons still work.

### P5 — cart-count badge anchoring (mobile hero + standalone product header)
`global.css:344-352` places `.hero__cart-count` / `.product-detail__cart-count`
at `top:-7px; right:-8px` of the BUTTON. On mobile the hero cart button's box
is taller than the bag glyph, so the badge floats detached above the icon; on
`/product/` the header hugs the viewport top so the badge rides the edge.
- Fix so the badge visually pins to the bag icon's top-right corner in all
  three contexts: hero desktop (1440), hero mobile (≤760px), and the
  `/product/` standalone header. Cleanest is anchoring relative to the SVG's
  box (inner wrapper span around the svg, or context-specific offsets in the
  mobile media query) — your judgment, but the badge must never be viewport-
  clipped and never overlap the search icon.
- Desktop hero at 1440 must stay pixel-identical (it is already correct there;
  if you restructure markup, reproduce the current desktop position exactly).
- **Done when:** build + check green; with one item in the cart the badge
  touches the bag's top-right corner at 390px hero and on
  `/product/?handle=<any real handle>`, unclipped; desktop hero unchanged.

### P6 — robots.txt
Add `public/robots.txt` (homepage project's public dir):
```
User-agent: *
Allow: /
```
No sitemap this pass — deliberate skip for a 4-page site.
- **Done when:** `dist/robots.txt` exists after build; build + check green;
  nothing else changed.

### Out of scope for Codex (operator/Ben actions, recorded here)
- Shopify admin: confirm the Storefront token's scopes are read-only.
- Shopify admin: refund-policy text has a stray `]` after "NY 10012".
- `public/preorders/images/fam-tatoo.jpg` (repo root) is untracked AND
  unreferenced — operator decides commit-or-delete; Codex must not touch it.
- `WebSA.md` relocated to the Studio vault by Claude (business doc, wrong repo).

---

## PHASE J2 — menu / catalogue / product / legal / alignment (operator voice-memo)

Scope every commit: `homepage/` only, on `dev`, never merge. ONE focused commit
each, `npm run build` AND `npx astro check` green after every one. The operator's
spec below is adapted to the CURRENT code (H/I/K/L/M/N + Wave Mobile shipped —
old line numbers are void; find current rules by the class names).
Deferred — do NOT implement: DJ-as-white-stencil, pre-order 5-week dropdown
structure, "what's playing now".

**J2-C1 — menu text styling (headers/markers/hover).** global.css only.
(a) Opening a section must NOT enlarge its header: remove/equalize the desktop
`@media(min-width:761px) .hero__menu-section.is-open > .hero__menu-header{font-size:clamp(20px,2vw,30px)}`
so open = closed size (base header stays `clamp(16px,1.6vw,21px)`); KEEP the
neon-green active color. All sections.
(b) Swap the CLOTHES open-state sub-menu sizes in the min-width:761px block:
`.hero__menu-section.is-open .hero__menu-item--group > .hero__menu-subheader`
(currently `clamp(10px,.95vw,13px)`) takes the LARGER
`clamp(14px,1.3vw,18px)`, and the open-state nested/leaf link rule (currently
`clamp(14px,1.3vw,18px)`) takes the SMALLER `clamp(10px,.95vw,13px)` — a
straight swap of the two values. (Mobile 12px/10.5px rules untouched.)
(c) Remove `.hero__menu-link--dash::before{content:"- "}` and
`.hero__menu-link--bullet::before{content:"o "}` entirely; KEEP
`.hero__menu-nested` indent (mobile `gap:0.4em` flex rule can stay — harmless).
(d) In the `@media(hover:hover)` block: menu hovers (`.hero__menu-header`,
`.hero__menu-subheader`, `a.hero__menu-link`, `.hero__menu-link[data-shop-all]`)
lose `text-decoration:underline` — hover = green only. Leave `.is-active`
underline and non-menu hovers (cart/product-card/closes) alone.

**J2-C2 — drawer open animation.** `.hero__menu-panel` opens with a subtle
downward slide/drawer reveal (~.3–.4s ease) instead of the display:none→block
snap — e.g. grid-template-rows 0fr→1fr or max-height+transform technique; must
work with the existing display toggle & JS untouched; closing may snap (only
HOW it opens changes). `prefers-reduced-motion`: no animation. Both desktop and
mobile panels. global.css (+ HeroVideo.astro ONLY if a class hook is missing).

**J2-C3 — SHOP ALL into the CATEGORIES drawer.** content.ts: remove the
top-level CLOTHES item `{ label:"SHOP ALL", collection:"clothing-1", … }` and
insert it as the FIRST child of the CATEGORIES group (above JACKETS /
OUTERWEAR), same collection/label. **CRITICAL adaptation:** `src/lib/menu.ts`
(K6 hydration) rebuilds CATEGORIES children from the live Shopify nav (it
excludes "shop all" from those children — see CLOTHING_SHOP_ALL_HANDLE) — it
must now PREPEND the SHOP ALL leaf as the first CATEGORIES child after
hydration so the move survives live menus. OBJECTS' flat SHOP ALL unchanged.

**J2-C4 — catalogue: continuous smooth scroll + smaller cards.** Replace the
measured row-pager: `.hero__catalog-viewport` becomes a normal
`overflow-y:auto` smooth-scroll container; products render as a flowing
responsive grid (desktop can flatten rows like mobile's `display:contents` or
render flat); DELETE the `--catalog-row-offset` translateY on
`.hero__catalog-track`, and in HeroVideo.astro remove the pager JS
(`setRowIndex`, `pageRows`, the wheel/touch hijack handlers, row transition
plumbing). **Adapt N2's product return-point:** it currently saves/restores
`rowIndex` — save/restore the viewport `scrollTop` instead (card→product→×
must land back at the same scroll position; direct-load/popstate paths too).
Cards get a bit SMALLER than today (ease back part of H4): e.g. 4-up desktop
rows or reduced card width — images keep their native aspect (current
`--card-aspect` + cover ≈ uncropped; ensure nothing is cut off). Keep the SWR
live-refresh + sold-out + in-site links intact. Mobile keeps its smooth-scroll
grid (unify onto the new mechanism where possible).

**J2-C5 — product page image carousel.** product-view.ts `renderProduct`:
replace the stacked `.product-detail__gallery` column with a one-at-a-time
CAROUSEL — left/right arrow buttons, touch swipe on mobile, small index
counter (e.g. "2 / 5") or dots; all images reachable; first image
eager/fetchpriority high as now, others lazy. Matching CSS in global.css
(paper/ink/mono language, M1 neon hover on arrows). Works in BOTH the in-hero
product stage and standalone /product/ (shared renderer) and with MOB-6's
mobile two-column layout (carousel = the left column on mobile).

**J2-C6 — stack policy links vertically.** The Refund/Privacy/Terms links in
`.hero-info__legal` (HeroVideo.astro hero-info block — NOTE: Footer.astro was
DELETED in L1; there is no footer) stack one per line (drop the `·`
separators), links/targets unchanged. Check nothing else renders that link
group (policies.astro is the standalone page — leave it). Mobile: the
bottom-centered about block simply grows 3 lines — verify it still clears the
stage art sensibly.

**J2-C7 — hide PRE-ORDER for launch.** content.ts: remove the `preorder:true`
section from `heroMenu`. Pre-order page/iframe/component/route stay intact —
menu unlink only. Verify: desktop menu shows 4 sections; mobile rows become
3 + 1 (& FAM centered alone on row 2 — acceptable); no JS errors from absent
`[data-preorder]` section (guards exist — confirm); preorder stage code dormant.

**J2-C8 — even parallel headers (STRICT).** Align the right panel title's top
line (`.hero__catalog-title` header row — and the product stage title if it
uses a separate rule) with the left menu headers' first line so the two
columns read even — nudge the panel title DOWN to the menu's line (or menu to
meet it, whichever reads even). Touch ONLY the menu-section headers' and panel
title's text position (margin/padding/top on those text elements). Do NOT move
the video/stencil/DJ/grid/cart/close/about block; no global margin changes.
Operator fine-tunes on dev.

**After C8:** stop; report 8 hashes + verify results to operator. No push, no
PR until an explicit "ship" (and PR #9 must merge first).

## PHASE SRCH — product search (APPROVED 2026-07-06 — operator's REVISED picks: thin MAGNIFIER GLYPH trigger matching the bag's line weight · suggestion rows WITH small thumbnails · empty query shows nothing. Everything must match the site's style/taste and be implemented efficiently + thoroughly.)

Scope: homepage/ only, on dev (PERF shipped to main via PR #10 first), one
focused commit per sub-task, build+check green each, NO push until ship.
Desktop-first: hide the whole feature ≤760px (mobile placement joins the
mobile round). Design tokens: lowercase mono utility voice, green-only
affordance (no underline states beyond the input rule), menu-drawer easing.

**SRCH-C1 — trigger + slide-out input.** HeroVideo.astro + global.css.
Markup inside .hero-video next to the cart: `<div class="hero__search"
data-search>` with `<button class="hero__search-toggle" data-search-toggle
type="button" aria-label="search">…magnifier svg…</button>` — the trigger is
a THIN MAGNIFIER GLYPH, not a word: inline SVG viewBox 0 0 20 20, circle +
angled handle, `stroke="currentColor" fill="none" stroke-width:~1.5` sized
~20-22px so its optical line weight matches the bag icon beside it
(the bag is the 20×20 icon-bag path — eyeball-match the weight); ink color,
green on hover/open like the bag's hover — and `<input class="hero__search-input"
data-search-input type="text" placeholder="search…" aria-label="search
products" autocomplete="off">`. Position: absolute, same top as the cart
(top:5vh), right: calc(2.25vw + 56px) so it sits LEFT of the bag with a
clean gap; z-index 5. Behavior: toggle click → `.is-open` on .hero__search →
input slides out leftward width 0→~190px (.3s, the menu-drawer cubic-bezier),
focus; toggle turns green while open; Esc closes+clears; click-away with
empty input closes; `/` keypress opens+focuses (ONLY when no input/textarea
is focused and the cart drawer is closed). Styling: toggle 12px lowercase
mono ink→green hover; input bare with 1px bottom border ink, 12px mono
lowercase, muted placeholder. VISIBILITY: mirror the cart's stage show/hide
rules exactly (hidden on is-catalog/is-preorder/is-product desktop states,
same transition); display:none ≤760px. Reduced-motion: no slide animation.
No data wiring yet. Done when: corner reads `[magnifier]  [bag]` with matched
line weights, opens/closes per above, all stage/menu behavior untouched.

**SRCH-C2 — instant local suggestions.** HeroVideo.astro (+ a small module if
cleaner). Build one in-memory index at init from the catalogue data the page
already carries (the build-time snapshot products used by the catalogue —
flatten across collections, dedupe by handle; fields: handle/title/vendor/
price/image). On input (every keystroke, no debounce): lowercase substring
match over title+vendor; up to 6 rows in `<div class="hero__search-suggest">`
below the input, right-aligned, width ~340px: row = SMALL THUMBNAIL at left
(40×40, the product's snapshot image via getSizedShopifyImageUrl at a small
width (~120) if available — object-fit:cover, no border-radius, 1px ink
border matching the site's card language; loading=lazy decoding=async) then
title (ellipsized) + `vendor · $price` muted meta; hover green on the title; ArrowUp/Down walk rows
(aria-activedescendant or .is-active class), Enter opens the active row,
click opens the row: → the EXISTING product stage via the same openProduct
path (pushState ?product=…), and fire prefetchProduct(handle) on row
pointerenter (PERF cache). Empty input → no rows (approved). Esc clears rows
then closes. Done when: typing "sock"/"vase" shows instant rows with zero
network; row click lands in the product stage; keyboard path works.

**SRCH-C3 — Storefront predictive merge.** storefront-client.ts: add
`predictiveSearch(query)` using the same GraphQL client (Storefront
`predictiveSearch` query, products only, first 8; fields handle/title/vendor/
price range/featured image; map through the existing mapper conventions +
getSizedShopifyImageUrl). In the search UI: debounce 250ms after local rows
render; merge results deduped by handle (local first, predictive appended up
to the 6-row cap... if a predictive hit ranks an exact-title match, fine to
just dedupe+append — keep it simple); ANY api failure = silent local-only
(no error UI — the site's degradation pattern). Done when: a query matching a
product NOT in the snapshot (verify live) appears after ~250ms; api blocked
→ local rows unaffected.

**SRCH-C4 — results stage + deep link.** Enter on a free query (no active
row) or a final `all results for "q" →` row opens a SEARCH results stage:
reuse the catalogue panel + renderer (renderCatalogRows/header machinery)
with title `SEARCH — "q" (n)`; data = local index filter merged with a
Storefront full `search` (or predictiveSearch first 24) deduped by handle;
sold-out/prefetch/in-site links come free. URL sync `?search=q` mirroring the
?product pattern (pushState, popstate, direct-load opens the stage,
strip-on-close); × closes to bare hero; opening it closes other stages the
standard way; menu-over-stage hides it state-preserved (MOB-2 selector family
— add the stage class to those lists). Done when: enter shows the grid with
count, deep link works cold, back button behaves, menu interplay clean.



Proposal drafted + interactive mock published to the operator. Concept: a quiet
lowercase-mono `search` word left of the bag → slide-out underlined input
(terminal-flavored) → instant suggestions (local snapshot index) merged with
Shopify Storefront `predictiveSearch` (published-only guaranteed by the
Headless channel) → suggestion click = existing product stage (PERF prefetch);
enter = a `?search=` results stage reusing the catalogue panel/renderer.
Plan: SRCH-C1 trigger+input · C2 local suggestions · C3 predictive merge ·
C4 results stage. Desktop first; mobile placement joins the mobile round.
Awaiting Ben's three taste picks: word-vs-icon trigger, text-only-vs-thumbnail
rows, empty-query behavior.

**CAROUSEL-CONTROLS (one-off, operator-directed 2026-07-06) — a0ca7ec — universal control placement — build:green check:green.** product-view.ts + global.css: frame now derives its aspect (and width, via min(galleryWidth, maxHeight×aspect)) from the ACTIVE slide's image — frame edge == image edge for any asset; arrows inset 16px from the image edges at mid-height, counter 12px in the image's bottom-right; controls not rendered at all when images.length < 2 (incl. seed/loading path); Phase-K viewport-fit intact. VERIFIED matrix: portrait 512×768 + landscape 512×342 both insets 16/16 + counter 12,12 + arrowMidY 0; cross-ratio arrowing holds 16; single-image ufo-tumbler renders zero controls; mobile landscape inset 16; no page scroll. Not pushed.

**O-C16 (QUEUED after C15 — operator 2026-07-07): mobile search field must collapse on navigation-away.** After a search has been made on mobile (magnifier green, input populated/open), the search UI currently lingers when the user navigates elsewhere. Collapse it (input closes with its usual animation, magnifier returns to normal ink state; query may remain stored for reopen per O-C9 convention) whenever the user: (a) opens OR collapses a main menu folder (e.g. tapping a section header — the search-from-menu breadcrumb flow from O-C13 still opens search deliberately, that stays; this is about navigating the MENU while search sits open), (b) clicks into a product listing from search results (the input/icon should collapse as the product stage opens — results context returns via the title if they come back). Mobile only; desktop unchanged. Verify at 380: search made → tap a menu header → input+green state gone, menu navigable; search made → tap a result card → product opens with search UI collapsed.

**PHASE O ROUND 5 STATUS: COMPLETE + VERIFIED (2026-07-07). Shipping tonight per operator.**
- O-C16 — 52b94fa — mobile search collapses on navigation-away (menu-header nav ✓, result-card click ✓ — both verified; O-C13 breadcrumb flow unaffected).
- O-C15 — c457190 — two-way drawer animation (upward collapse on close; visible mid-close, display:none after animationend; closed geometry unchanged).
- O-C14 — f4a719c — lightbox backdrop tap/click dismisses like the × (verified mobile + desktop).
- O-C13 — e9dd5ef — cascade returns on menu retarget; search-from-menu collapses subfolders w/ breadcrumb highlight, non-breadcrumb headers fade (hidden not removed), input clean; title↔input context hand-off verified through Return.
- O-C12 — bf4cce1 — mobile search unscoped (chip/escape-row/scope logic gone ≤760; desktop scoped system intact).

### PHASE O ROUND 5 (operator 2026-07-07; reconstruction of one truncated sentence confirmed in chat)
- **O-C12 — mobile search is UNSCOPED:** at ≤760px remove the scope system entirely — no scope chip, no `search all products →` escape row, no scoped filtering; every mobile search runs against all products (title `SEARCH — "q" (n)`). Desktop scoped system unchanged. URL scope param never set from mobile; a scoped deep link opened on mobile degrades gracefully to unscoped (judgment).
- **O-C13 — icon cascade returns when the menu retargets + search-from-menu flow:** (a) BUG: with a stage open (icons cascaded at the ×), tapping a top menu tab leaves them stuck — they must animate back to the resting stack when a menu section opens over a stage (stage hides state-preserved per MOB-2; icons follow the rest layout). (b) Tapping the magnifier while a menu folder is expanded: the expanded subcategories/panel COLLAPSE upward (animated, the two-way drawer language of O-C15), the section's top tab KEEPS its green highlight as a breadcrumb, and search proceeds exactly like from the clean homepage (rest-position input, no overlay of menu text, unscoped per C12).
- **O-C14 — lightbox backdrop tap = dismiss:** tapping/clicking anywhere outside the enlarged image asset dismisses identically to the × (returns to the product view as it was). Both views. Keep ×/tap-image/Esc paths.
- **O-C15 — two-way drawer animation:** closing a folder or subfolder (− → +) animates the panel/nested list collapsing UPWARD (mirror of the .55s downward reveal) instead of snapping — main sections + CATEGORIES/DESIGNERS, both views; requires delaying the display:none until the collapse animation ends (JS animationend or equivalent — do NOT reintroduce the in-flow closed-box bug from J2-C2's first attempt); reduced-motion: instant.

- O-C11 — 3881ce1 — mobile outline suppressed while the lightbox is open (fades out on enlarge, returns on dismiss — verified 2px→hidden→2px at 380). Operator alternative (gone-for-good after first tap) is a one-liner if preferred.
- O-C10 — cf53e27 — outline scoping: lightbox/enlarged image outline REMOVED universally (both views measured none); desktop product-listing outline REMOVED entirely (enlarge + zoom-in cursor kept); mobile 2px flush outline stays (measured 2px neon at 380).
- O-C9 — c4185b0 — mobile Return commits the search: input blurs + collapses (keyboard dismissed), results stage + title + scope intact (verified: SEARCH — "VASE" (9) remains, 9 cards); magnifier reopen restores the query; enterkeyhint=search; desktop Enter unchanged.

**PHASE O ROUND 4 STATUS: COMPLETE ON DEV (2026-07-07) — verified with screenshots. NOT pushed.**
- O-C8 — 3a9b45f — mobile search cascade: rest stack unchanged (bag 24/mag 74); on ×-stage open both icons drop-cascade (bag → mag's old slot above the ×; mag → beside the × at its row); tapping opens the input on its own clean line below the icon row with the scope chip carrying the collection context — ZERO text overlaps measured with input open + scoped query rendering; stage close reverses exactly (24/74 restored). Stage-language easing, reduced-motion safe.
- O-C7 (rework) — ad8f8e6 — structural frame shrink-wrap (img drives layout; NO aspect math): frame gaps 0,0,0,0 + arrows 16/16 + counter 12,12 measured on ALL of: lizard-brain direct s1+s2, lizard-brain seeded via card click, portrait, vase, desktop lightbox, mobile view, mobile lightbox. First attempt (decoded-pixels re-assert, 8d7e40f) REJECTED by measurement (57px bands, slide-2 asymmetry) and replaced. The rule is structural — future listings self-place controls + outline with no manual edits.

**O-C8 (QUEUED — dispatch after O-C7): mobile search-bar cascade (operator 2026-07-07).**
PROBLEM: on mobile, opening the magnifier overlays the input across the menu
header text — visually overwhelming. THE FLOW: (a) REST (no stage open):
vertical stack unchanged (bag top, magnifier below). (b) When a panel stage
with an × opens (catalog/search/product — ASSUMPTION: all ×-stages, operator
may narrow to catalog-only): both icons ANIMATE a drop-down cascade — bag
slides down into the magnifier's old slot (sitting ABOVE the ×), magnifier
drops further to sit LEFT of the × on the ×'s row; that spot IS the search
trigger there — tapping opens the input LEFTWARD along the ×'s row. NO TEXT
OVERLAY is the hard rule — the MEANS is judgment (operator 2026-07-07): the
input width cap is ONE option, but the collection title / description /
designer about-blurb may instead be REMOVED, REORIENTED, truncated, or
temporarily collapsed/faded while the input is open, so the search isn't
necessarily cramped — find what reads best so BOTH features coexist
comfortably (e.g. description fades while typing, or the header reflows).
Whatever the solution: input edge keeps ≥16px clear of any remaining text,
and the description returns when the input closes. Screenshot every state. (c) Closing the stage reverses the cascade back to
the rest stack. Timing/easing: the site's stage language (.55s family,
subtle stagger like N2); reduced-motion: reposition without slide. ALSO
verify DESKTOP: opening the search input in every state overlays no text
(landing + catalog + product at 1440); mobile menu-open (non-stage) state:
magnifier input must not overlay header text either — if the rest-position
input would, cap/reposition it similarly. No text crowded or overlaid
anywhere, both views. ONE commit, build+check green, screenshots at 380 for
rest/cascade/input-open states.

**PHASE O ROUND 3 STATUS: COMPLETE ON DEV (2026-07-07) — verified. NOT pushed.**
- O-C6 — 989f746 — DESKTOP port (operator-ordered desktop change): flush 2px neon outline + zoom-in cursor on desktop product carousels (gaps 0,0,0,0 to the image); click → same lightbox (transparent bg, blur(2px) saturate(.62) brightness(1.06) distant treatment), image contains in viewport caps, controls inside at 16px/12,12, Esc/×/click-image dismiss, scroll locked. Mobile regression-checked: C5 behavior intact.
- O-C5 — e714068 — mobile refinements: outline 1px+3px-offset → 2px FLUSH on the image edge (measured 0-gap all sides); lightbox white wash REMOVED → transparent + blur/desaturate/brightness (site blends behind, distant).

**PHASE O ROUND 2 STATUS: COMPLETE ON DEV (2026-07-07) — verified. NOT pushed.**
- O-C4 — dfd7514 — universal control frame == rendered image (both dims, active slide, natural-dims fallback, re-assert on slide change + resize) across desktop stage / standalone / mobile view / lightbox. MEASURED: arrows 16px inside at exact mid-height + counter 12,12 inside bottom-right on ALL of: desktop short-asset (vase, cross-slide — the operator's bad case), desktop portrait, desktop landscape, mobile product view, mobile lightbox. Touches desktop intentionally (operator-reported desktop bug).
- O-C3 — d491bd0 — lightbox scrim now translucent (rgba(255,255,255,.76) + 1.5px blur — site state visible, faded) + 1px neon-green outline (3px offset) on the pressable mobile carousel. Mobile-only.

**O-C6 (QUEUED — dispatch after O-C5 lands): DESKTOP port of the enlarge feature.**
Operator (2026-07-07): bring the mobile tap-to-enlarge experience to DESKTOP,
near-identical — this deliberately amends the desktop-unchanged rule for the
product views. Inherit O-C5's final characteristics exactly: flush neon
border (var(--neon-green), same weight family) directly on the carousel
image's edge signaling clickability on BOTH desktop product surfaces (hero
stage + standalone /product/); click → the same lightbox with the
transparent "distant" backdrop treatment (no white wash; blur/desaturate of
the live site behind); universal control mapping inside (frame==image,
arrows 16px mid-height, counter 12,12 — already universal); × / click-image
/ Esc dismiss; scroll lock; reduced-motion. RESCALE for desktop: enlarged
image caps to the viewport generously (e.g. contain within ~92vh/~90vw with
comfortable margins), controls may scale up slightly if they read small at
desktop size (judgment); hover cursor:pointer + the site's neon hover
language on the bordered carousel. Verify 1440: border flush on the image,
click enlarges, controls inside at the settled margins on short/portrait/
landscape assets, dismiss paths, backdrop distant; mobile behavior unchanged
from O-C5.

### PHASE O ROUND 2 (operator 2026-07-07, with desktop screenshot of the vase bad-case)

**O-C3 — lightbox backdrop + tappable-carousel affordance (mobile).**
(a) The lightbox backdrop is NOT solid paper: the CURRENT site state stays
visible behind, slightly faded — a translucent scrim (e.g. paper-tone rgba at
~.72-.8 alpha, judgment; optional slight backdrop-blur if it reads well) so
focus shifts to the enlarged carousel + its controls. (b) The mobile product
carousel's tap affordance gets LOUDER: a clearly visible neon-green outline
around the pressable carousel (site theme — e.g. 1px solid var(--neon-green)
outline/border with a whisper of the existing wash behind; visible but not
garish) signaling it can be pressed → pressing enlarges. Mobile only; desktop
pixel-unchanged.

**O-C4 — UNIVERSAL control mapping: frame == rendered image, everywhere.**
Operator's screenshot shows the DESKTOP product stage failing for a small/
short asset (vase 3/3): arrows render completely OUTSIDE the image because
the carousel frame stays wider than the displayed image when the height cap
doesn't bind (aspect chain falls through). Build ONE robust system used by
EVERY control surface (desktop product stage, standalone /product/, mobile
product view, AND the mobile lightbox): the control frame must equal the
RENDERED image box in BOTH dimensions for the ACTIVE slide — derive from the
slide image's natural dims (data dims → naturalWidth/Height on load →
re-assert on slide change AND window resize; never leave the frame wider or
taller than the displayed image). Controls keep the settled spec: arrows
INSIDE the image at mid-height with 16px insets, counter INSIDE bottom-right
at 12px — correct margins at ANY image ratio (portrait/landscape/square/
small). In the lightbox, the same system maps to the enlarged image (its own
frame). Verify the vase case (mokuzai/grid-vase style short asset, slide 3/3)
on desktop + a portrait + a landscape, and the lightbox on mobile — arrows/
counter inside the image with correct margins in all of them. This commit MAY
touch desktop (it fixes the operator-reported desktop bug).

**PHASE O STATUS: COMPLETE ON DEV (2026-07-07) — 2 commits, verified 380px + desktop-unchanged 1440. NOT pushed.**
- O-C2 — f3efec6 — mobile tap-to-enlarge lightbox (.product-lightbox: full-bleed paper overlay, contain image, swipe/arrows/counter live inside — verified 1/3→2/3, × AND tap-image dismiss, scroll locked, reduced-motion gated) + neon wash behind the mobile product carousel (::before radial rgba(31,170,46,.055) — barely perceptible per spec). Desktop: no lightbox fires, no wash, layout pixel-unchanged.
- O-C1 — ccf84cc — mobile menu type scaled: headers 12.5→16.5px, subheaders 14px, nested 12.75px + breathing room; 2-row wrap, 38px clear of the bag, no overflow; desktop 21px/x82 untouched.

## PHASE O — mobile-first polish (operator 2026-07-07). Everything MOBILE-ONLY (≤760px); desktop pixel-unchanged, verified after each commit at 1440. Two focused commits; judgment granted on sizing/structure.

**O-C1 — bigger mobile menu type.** Scale the WHOLE mobile menu up for
comfortable reading/tapping: section headers (currently 12.5px → ~16-17px),
panel links + subheaders (12px → ~14px), nested designer/category items
proportionally, with matching breathing room (line-height/margins/taps).
Keep hierarchy proportions feeling right; header rows must still wrap
cleanly at 380 clear of the icon stack (retune clearance if the larger type
needs it); open panel stays full inner width; no horizontal overflow.

**O-C2 — tap-to-enlarge product carousel + faint green backing (mobile).**
(a) Tapping the product carousel image (in-hero product stage AND standalone
/product/, shared renderer) enlarges it — judgment: a full-bleed paper-toned
lightbox overlay fitting the phone (image contain, no crop), swipe + arrows +
counter still functional inside it, dismissed via a × (site convention) or
tapping the image again; Esc/back-safe; body scroll locked while open;
reduced-motion: no zoom animation. (b) On the mobile product view, an
EXTREMELY subtle neon-green wash/glow behind the carousel — barely
perceptible (think ~4-6% alpha radial wash or soft box-shadow using
--neon-green), erring too-subtle. Desktop carousel/layout untouched.

**PHASE N2 STATUS: COMMITTED ON DEV (2026-07-06) — fc7d8ce — verified. NOT pushed.**
- Animated cart+search pair: desktop order SWAPPED to cart-left/search-right (search takes the corner, 32px inset); desktop cart-hide rules on panel stages RETIRED — pair always visible, sliding over by --hero-icon-stage-clearance on panel-stage entry (.55s ease-in-out, 80ms stagger: search leads in, cart follows; delays invert on exit) sitting 12px clear of the ×; mobile pair stacked vertical, translateY choreography; reduced-motion settles in place. Verified 1440 (rest + catalog: bag visible, pair clear of ×, order correct, hero scroll 0) + 380 (stacked, no overflow). FLAG for operator: pair-to-× gap is 12px — snug; one variable to widen.

**PHASE M2 STATUS: COMPLETE ON DEV (2026-07-06) — 4 commits + 2 fixes, all verified 380px + desktop 1440. NOT pushed.**
- M2-C1 — a8a133d — mobile headers cluster on top (display:contents + order), open panel below; desktop column untouched (82px line verified).
- M2-C2 — 10de952 — stencil fades under expanded non-stage sections (mobile), restores on collapse; stage-exit transform preserved.
- M2-C3 — fce17be (amended) — search surfaced ≤760px: magnifier below the bag (matched 22px glyph/40px box), same toggleSearch machinery, live search stage works from mobile; header row clearance 112px (headers 28px clear of bag).
- M2-C4 — 5cc7757 — catalogue 2-col at ALL phone widths (420px 1fr override removed), title 12px/meta 10.5px, smooth scroll intact.
- FIX — 0ca5d0c — open panel escapes the header clearance (negative margins): full inner width (350/350 @380), no overflow.
- **HOTFIX — 56fab28 — PRODUCTION BUG (live on main too, predates M2/SRCH): opening a catalog on desktop scrolled .hero-video 82px left (menu flush to edge, dead right band). Fixed: overflow:hidden→clip + scrollLeft/Top reset in transitionToStage. Verified: catalog + product stages hold menu at x=82, scrollLeft 0. Ships with this batch and fixes live behavior.**

## PHASE N2 — animated cart+search icon pair (operator 2026-07-06; logged N2 — Phase N shipped Jul 2). QUEUED — dispatch ONLY after M2-C3/C4 land (same files).

Intent (operator; judgment granted on structure/selectors/timing/distances):
the cart and search icons read as ONE coordinated pair, top-right, ALWAYS
visible at rest in every state (this RETIRES the desktop cart-hide rules on
is-catalog/is-search/is-product/is-preorder — the × keeps the extreme corner
on panel stages, the pair sits gracefully beside/clear of it). Whenever a
panel stage fills the page (catalog/search/product/preorder) the pair
animates as a flourish IN SYNC with the .55s stage transitions: search
settles in from the ×/close area, cart follows into place beside it
(staggered ~60-90ms); reversing on stage exit. FIXED decisions: desktop pair
is horizontal, CART LEFT, SEARCH RIGHT (search nearest the corner — note
this SWAPS the current desktop order); mobile pair animates vertically (up
off the top / back down) — mobile stack from M2-C3 stays search-below-cart
unless vertical choreography reads better flipped (judgment). Function
unchanged (drawer, live search). prefers-reduced-motion: settle in place
(opacity), no slide. Feel: the site's existing motion language, not a
separate effect. ONE commit, build+check green, verify desktop 1440 +
mobile 380 across landing/catalog/product/music transitions.

Log:
- 2026-07-06 — PHASE N2 animated cart+search icon pair — build:green check:green — desktop pair swapped to cart-left/search-right with panel-stage clearance; mobile stack animates vertically; browser geometry verified at 1440×900 and 380×844.

## PHASE M2 — MOBILE-ONLY pass (operator 2026-07-06; logged M2 — Phase M/film shipped Jul 1)

HARD RULE: every change gated to the mobile sheet (~max-width:760px); desktop
visually unchanged — verify BOTH after every commit (mobile at ~380px wide,
desktop at 1440). homepage/ only, dev, one commit each, build+check green.
NOTE current mobile state: menu is ALREADY centered wrapping rows (Wave
Mobile); an open section's panel currently renders INSIDE its section box and
reflows the rows — C1 fixes that. PRE-ORDER is gone (4 headers). Search is
currently display:none ≤760px — C3 surfaces it.

**M2-C1 — headers cluster on top; open panel full-width below.** Mobile only:
the four section headers (CLOTHES/OBJECTS/MUSIC/& FAM) form a wrapping row(s)
pinned at the top of the menu, ALWAYS clustered together; the open section's
panel renders BELOW the header rows at FULL width. Suggested mechanism (CSS
only, mobile-gated): `.hero__menu-section{display:contents}` so header+panel
become direct flex items of the wrapping `.hero__menu`; all
`.hero__menu-header{order:0}` and `.hero__menu-panel{order:1; flex-basis:100%;
width:100%; max-width:none}` — headers cluster first, the (single) open panel
wraps to its own full-width line beneath. Neutralize the mobile
`.hero__menu-break` (display:none ≤760px) so the 4 headers wrap naturally;
keep them clear of the top-right icon stack (existing max-width clearance —
retune if needed). Verify menu handlers (open/close, subgroups, MOB-2
stage-hide selectors that reference .hero__menu-section.is-open) still work —
display:contents changes layout only, not the DOM. Desktop untouched.

**M2-C2 — hide the stencil under an expanded menu (mobile).** ≤760px: when a
NON-stage section is open (`:has(.hero__menu-section.is-open:not([data-music
="true"]):not([data-fam="true"]))` family — same pattern as the existing
mobile hide rules), fade `.hero__stencil` out (opacity/visibility, ~.25s,
reduced-motion: none) so the expanded shopping menu reads clean; restore on
collapse/landing. Desktop stencil untouched.

**M2-C3 — mobile search icon below the cart, same machinery.** ≤760px: remove
`display:none` on `.hero__search`; position the EXISTING magnifier toggle
(data-search-toggle → toggleSearch — the same live-search build) as a glyph
directly BELOW the bag at top-right, matching the bag's size/weight (22px
glyph in a 40px tap box, same color/hover). The input opens leftward from
that spot (width ~min(200px, 58vw)); the live results stage (is-search →
catalogue panel) already works on mobile. Ensure: no collision between the
2-icon stack and the header rows at 380px (retune row clearance/top offsets
as needed); the mobile stage-hide rules that hide .hero__cart on catalog/
product/etc must NOT hide search (search stays reachable at all times —
that's the point); scope chip/status positioning sane on mobile (chip may
wrap under the input). Flag anything ambiguous for the operator.

**M2-C4 — mobile catalogue grid: 2 columns, larger cards.** ≤760px: the
catalogue grid stays/becomes 2 columns at ALL phone widths — REMOVE the
`@media(max-width:420px){.hero__catalog-track{grid-template-columns:1fr}}`
override so ~380px shows 2-up; tune gap + card type (title ~12px, vendor/
price ~10.5px) so cards read larger and cleaner; keep the continuous smooth
scroll + scroll-restore + content-visibility intact. Desktop 4-up untouched.

**After C4:** report 4 hashes + verify results (mobile 380 + desktop-unchanged
checks per commit). NO push/PR until operator ship.

### SRCH ROUND 2 (operator 2026-07-06): live full-panel results + always-available scoped search
Research-informed (Baymard search-within-category study: 94% of sites lack it, avoid unintentional scope-jumping, zero-results must fall back to all-category matches; NN/g Scoped Search: default scope ALL, strong visible scope labeling at box + results, one-click escape to site-wide, unscoped path as the first suggestion; users refine AFTER seeing results). Desktop; mobile still hidden pending the mobile round.

**SRCH-C5 — live full-panel results (the dropdown dies).** Typing (debounced ~250ms; local index renders instantly, predictive merges in) drives the EXISTING `is-search` catalogue-panel stage LIVE — the results grid IS the suggestion surface (massively larger, right-hand side). Remove the small `.hero__search-suggest` dropdown entirely. Title `SEARCH — "q" (n)` updates per keystroke; count announced via aria-live polite. Input keeps focus + query while the stage updates; Enter is a no-op commit; Esc with text clears query (stage closes back to prior state); × on the panel closes stage and search. ?search= URL sync stays (replaceState per keystroke, not pushState spam — one history entry per search session). ALSO: search becomes ALWAYS VISIBLE on desktop — remove its stage-hide mirror of the cart; its corner slot composition: glyph left, right neighbor = bag (landing/music/fam/film) or the stage × (catalog/product/preorder — × already occupies the cart's spot on those stages, same footprint, no collision; verify visually).

**SRCH-C6 — scoped search within an open folder.** If a catalogue collection stage is open (or a product stage with a saved return-point collection) when the user searches: scope = THAT collection. Requirements (NN/g/Baymard compliance): (a) scope LOUDLY labeled: panel title `SEARCH IN <COLLECTION LABEL> — "q" (n)` AND a small scope chip right of the input (lowercase mono, e.g. `in: clothes — shop all ×`) whose × drops scope to all with one click; (b) an always-present escape row in the panel head: `search all products →` re-runs unscoped; (c) ZERO results in scope → NO dead end: render the message `nothing matches "q" in <label>` in site voice + automatically show all-products matches beneath a `more like this — all products` heading; (d) clearing the query / Esc restores the folder's full listing EXACTLY (rows kept alive, scroll reset OK); (e) opened from bare hero → scope ALL (default-all rule). Scope encoded in URL (?search=q&scope=handle) for deep links + popstate.

**SRCH-C7 — matching quality + a11y polish (production-grade).** Local index: case + diacritic folding (NFD strip), rank title word-prefix > title substring > vendor match, stable order; predictive results merge AFTER local ranking, dedupe by handle. Input: autocomplete=off spellcheck=false; combobox-lite a11y (aria-expanded on the search wrapper, aria-controls the panel, aria-live count). No behavior change otherwise.

**SRCH ROUND 2 STATUS: ALL 3 COMMITTED ON DEV (2026-07-06) — verified end-to-end. NOT pushed.**
- SRCH-C7 — 947b3b0 — diacritic/case folding + prefix>substring>vendor ranking + combobox-lite a11y.
- SRCH-C6 — 519aa08 — scoped search: SearchScope from active collection/product return-point; title `SEARCH IN <LABEL> — "q" (n)` + chip `in: <label> ×` + `search all products →` row; zero-in-scope → "more like this — all products" fallback grid; ?search=&scope= URL; clear/Esc restores folder exactly.
- SRCH-C5 — 930f507 — dropdown deleted; typing drives the is-search panel LIVE (instant local + debounced merge), one history entry per session (push-then-replace, session return URL), aria-live count, search always visible on desktop.
- VERIFIED (1440×900): live "sock"(12)→"socks in black"(2); Esc-with-text clears+closes; CLOTHES-scoped "linen"(34) w/ chip+escape+URL scope; "vase"(0-in-scope) → more-like-this 9 cards; escape→all(9); clear→CLOTHES—SHOP ALL restored; cold deep link ?search=linen&scope=clothing-1 correct.

**PHASE SRCH STATUS: ALL 4 COMMITTED ON DEV (2026-07-06) — ready for operator verify. NOT pushed. (PERF shipped separately via PR #10 @ 56650bc before SRCH began.)**

**Log (build:green check:green each):**
- SRCH-C4 — 1eea848 — results stage `is-search` reusing catalogue panel/renderer; title `SEARCH — "q" (n)`; ?search= URL sync (pushState/popstate/direct-load/strip-on-close). Verified: enter → 39-card grid for "linen"; cold deep-link ?search=vase → 17 cards.
- SRCH-C3 — df90a7a — Storefront predictiveSearch (first 8, mapped + sized images) debounced 250ms, deduped by handle after local rows; silent local-only on failure. Verified: 0 graphql before debounce, fires after.
- SRCH-C2 — cd9acbc — instant local suggestions from the flattened snapshot index: 6 rows + all-results row, 40px bordered thumbnails, keyboard nav (arrows/enter), row click → product stage, prefetchProduct on row hover, empty = nothing.
- SRCH-C1 — de23a16 (amended from 0dd0339 per operator's revised pick) — thin magnifier glyph (20×20 stroke 1.5 currentColor, weight-matched to icon-bag), green hover/open; slide-out underlined input (.3s), Esc / click-away / `/` shortcut; mirrors cart stage-visibility; display:none ≤760px (mobile round places it).
- Operator's final picks: magnifier glyph · thumbnail rows · empty shows nothing.

## PHASE PERF — image/product loading speed (operator-approved, 2026-07-06)

> Diagnosis (measured): product-open is a SERIAL waterfall — click → Storefront
> getProduct roundtrip → only then image requests → CDN download. Warm-network
> total 255ms; cold/slow networks stretch each leg serially to the operator's
> observed 2–3s. No preconnect to cdn.shopify.com or the API host; carousel
> first image not reusing the card's cached image. Scope: homepage/ only, on
> dev, one focused commit each, build+check green each, NO push (operator
> verifies on dev). Functionality unchanged across the board.

**PERF-C1 — preconnect.** src/layouts/Base.astro head: add
`<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>` and a
preconnect to the Storefront API host (the store domain used by
storefront-client — check PUBLIC_SHOPIFY_STORE_DOMAIN usage; hardcode the
public https://shopandson.com host as the site does elsewhere). Leave the
existing font preconnects alone. Done when: both links render in built HTML.

**PERF-C2 — intent prefetch + carousel cache-seed.**
(a) In HeroVideo.astro: on catalog card `pointerenter` AND `touchstart`/
`pointerdown` (passive), prefetch the product: call a cached-promise
`prefetchProduct(handle)` (add a Map<handle,Promise> cache around getProduct
in storefront-client or product-view — openProduct/mountProductView must
CONSUME the same cache so a click after hover does zero extra fetches; cache
entries evict on failure so errors retry).
(b) Cache-seed: when opening the product stage from a card, pass the card
img's CURRENT currentSrc/src to the product view (e.g. via openProduct arg →
mountProductView option); the carousel's FIRST slide renders that exact URL
immediately (browser cache hit = instant paint) and upgrades in place to the
1100/srcset version once loaded (keep aspect vars correct; no layout jump;
alt/dimensions from live data when it lands). Standalone /product/ direct
loads (no card context) behave exactly as today.
Done when: hover→click on a card fires exactly ONE getProduct request
(observed in network), and the first slide paints from cache immediately.

**PERF-C3 — adjacent-slide preload + cheap big grids.**
(a) product-view.ts carousel: when slide N becomes active, ensure slide N+1
(and N-1) images start loading (they are lazy now) — flip their loading to
eager / create Image() preloads for the sized URL; arrows should feel instant.
(b) global.css: `content-visibility:auto` + a sane `contain-intrinsic-size`
on `.product-card` so SHOP ALL (~250 cards) skips render work off-screen —
verify scroll restore (J2-C4 scrollTop) still lands correctly with it (if it
fights scroll restore, scope it out and say so).
Done when: build+check green; arrow to slide 2 shows no visible load gap on
throttled network; SHOP ALL scrolls smoothly; scroll-restore still exact.

**After C3:** re-run the waterfall measurement, report before/after numbers.
NOT pushed until operator ship.

**PHASE PERF STATUS: ALL 3 COMMITTED ON DEV (2026-07-06) — ready for operator verify. NOT pushed.**

**Log (build:green check:green each):**
- PERF-C3 — 9bc9bb6 — carousel neighbor preload (N±1 eager + Image() warmers, cleanup set) + `.product-card{content-visibility:auto; contain-intrinsic-size:0 420px}`; verified slide-2 complete before arrowing on a 3-image product; J2 scrollTop restore re-verified EXACT (1200→1200) with content-visibility active.
- PERF-C2 — 198b0ed — intent prefetch: card pointerenter/pointerdown/touchstart → prefetchProduct(handle) (shared promise cache in storefront-client, consumed by mountProductView; evicts on failure) + carousel first-slide cache-seed from the clicked card's currentSrc (upgrades in place; standalone direct loads unchanged). Verified: hover→click = 0 graphql after click, first image rendered 21ms.
- PERF-C1 — ce3da15 — preconnect cdn.shopify.com + shopandson.com in Base head (both render in built HTML).

**Measured result:** product-open first-image render 255ms (warm baseline) → **21ms after hover-prefetch with zero network requests at click**; cold clicks paint the card's cached image instantly while live data lands behind. Arrow taps instant (neighbor preloaded).


## PHASE K2 — design-tuning pass on J2 (operator voice-memo, 2026-07-06)

> Named K2 because Phase K (commerce core) shipped 2026-07-02. Scope:
> `homepage/` only, on `dev`, never merge, one focused commit each,
> build+check green each, NO push/PR until operator "ship".

**K2-C1 — menu link states.** global.css only.
(a) `.hero__menu-link.is-active{color:var(--neon-green); text-decoration:underline}`
→ drop the underline; green only. NO underline in ANY state (hover already
green-only from J2-C1). (b) Nested folder items — desktop open-state rule
`.hero__menu-section.is-open .hero__menu-nested .hero__menu-link` (currently
`clamp(10px,.95vw,13px)`) → slightly LARGER (e.g. `clamp(11px,1.05vw,14px)`)
+ slightly more vertical space per entry (line-height or small margin between
`.hero__menu-nested > li`). Subtle, not a big jump. CATEGORIES + DESIGNERS
lists both (they share the rule). Mobile 12px rule untouched.

**K2-C2 — drawer animation, slower + sub-folders.** global.css only.
(a) `heroPanelReveal` .36s → ~.55s with a softer ease (e.g. cubic-bezier ease-out
family) on `.hero__menu-section.is-open .hero__menu-panel`. (b) Sub-folders:
`.hero__menu-item--group.is-open .hero__menu-nested` currently snaps
(display:none→block). Give it the SAME keyframe reveal (animation fires on
display flip — proven by J2-C2; do NOT switch to an always-in-flow max-height
box, that broke closed geometry once already). Same duration/easing as (a).
NOTE for operator: main panels animate OPEN only (close snaps — J2 spec);
sub-folders will match. Reduced-motion: none on both levels.

**K2-C3 — standalone product page fits one screen, no page scroll.** Scope
STRICTLY to the standalone page (`.product-detail` rules NOT under
`.hero__product`, + `src/pages/product.astro` for a page-level hook if needed)
— the in-hero product stage and the MOB-6 mobile layout are phone-verified and
must NOT change. Desktop (min-width:761px):
- Page does not scroll (one-screen view; e.g. lock overflow on the page root
  via a product.astro class — do NOT touch the global `html.landing` rules).
- Cap the carousel so image + arrows + counter fit within the viewport with a
  small bottom margin: gallery/media max-height ≈ calc(100vh - top bar - small
  margin), image scales DOWN (no crop), carousel sits slightly higher.
- Details column (vendor/title/price/variants/add/description): if taller than
  the viewport, ONLY that column scrolls internally (overflow-y:auto,
  scrollbar hidden per site convention). FLAG for operator — he may prefer
  shrinking the description instead.
- Catalogue/multi-product views keep their J2 continuous scroll. Mobile
  standalone page unchanged (keeps current scroll).

**After C3:** stop; report 3 hashes + verify results. No push/PR until "ship".

### K2-C4 — product view: fixed in place + uniform carousel sizing + bottom margin (DESKTOP ONLY)

**Status:** ready for Codex
Operator (2026-07-06, with reference screenshot = the IN-HERO product stage,
socks product, "perfect layout"): all product views fixed in place (no
scrolling), carousel bottom NEVER touches the page bottom — subtle margin —
and sizing made uniform. Desktop only (min-width:761px); mobile later.

- **In-hero product stage (`.hero__product`, the operator's screenshot):**
  desktop: the panel becomes FIXED (no internal page-like scroll): gallery
  column capped so the carousel (image + arrows + counter) ends with a subtle
  bottom margin (~2-3vh) above the viewport bottom; if the DETAILS column
  overflows, ONLY it scrolls internally (mirror K2-C3's standalone approach).
  Keep the × close, stage transitions, and add-to-cart untouched.
- **Uniform sizing:** cap the carousel media height with ONE shared rule for
  both stage and standalone — target: top stays parallel to the CLOTHES
  header line (current alignment), bottom = 100vh minus that top offset minus
  a ~2-3vh margin. TALL images scale DOWN (object-fit:contain, no crop, no
  upscaling of small images — use max-height, NOT fixed height); SMALL images
  stay exactly as-is (operator: only listings that would touch the bottom
  change). It's acceptable if a very tall image's top-parallel breaks slightly
  — prefer keeping the parallel top and shrinking.
- **Standalone `/product/`:** K2-C3 already fits it; align its cap values with
  the shared rule so stage + standalone read uniformly.

**Done when:** build+check green; at 1440×900 AND 1280×800: socks-like
products unchanged; tall-portrait products (e.g. 50-50-belted-trouser) show
the full image with bottom margin ≥ ~15px, top parallel to CLOTHES, no crop,
no page/stage scroll; details column scrolls internally when long; mobile +
hero catalog untouched.

### K2-C5 — cart icon: lower-left nudge to the parallel line (DESKTOP ONLY)

**Status:** queued — dispatch after C4 review
Operator: the desktop bag icon sits too far into the corner, disconnected
from the parallel rhythm. Move it slightly LOWER and slightly LEFT so the TOP
of the bag glyph is approximately parallel with the CLOTHES header's top line
(not pixel-perfect). Desktop `.hero__cart` rule only (currently ~top:4vh
right:2vw) — MEASURE the menu header's rendered top and set the bag top to
match it (≈8vh at 900h — verify live), right offset slightly increased.
Mobile cart untouched. Nothing else moves.

**Done when:** build+check green; at 1440×900 the bag glyph's top edge is
within ~6px of the CLOTHES header's top; visibly left of the previous corner
position; mobile unchanged.

---

**PHASE K2 STATUS: SHIPPED — operator ordered "push all changes to main" 2026-07-06; PR #9 merged @ 43ee927 carrying Wave Mobile (MOB-1–7) + Phase J2 (8 commits) + Phase K2 (8 commits). Pages deploy run 28822275396 green; live site verified updated (hero__menu-break present, last-modified 20:50Z). Next: operator's mobile revision round.**

**Log addendum (C4–C6 + C5b; build:green check:green each):**
- K2-C7 — 7714b3c — italic left-edge glyph shear (operator report: the g in "green tea incense") — the scrolling details panel clipped left-overhanging italic strokes at its padding box (title left == panel left, paddingLeft 0). Fix: glyph gutter padding-left:clamp(8px,0.6vw,14px) on both stage + standalone panels (desktop). Verified before/after on ?product=green-tea-incense; demo artifact published for operator.
- K2-C6 — d0e7afd — universal product-text crop fix — product-view.ts bindPanelOverflowHint (scroll+resize+ResizeObserver, cleanup on unmount) toggles `is-more-below`; global.css: panel gets a soft bottom mask fade ONLY while more content is below (clears at scroll end — verified: trouser fades on load, clears at end; vase never fades); title line-height .98→1.12 (italic serif box safety); panel bottom padding → clamp(44px,7vh,88px). Applies to stage + standalone (shared classes).
- K2-C5b — 9321f2b — operator-directed one-liner (Claude edited directly per instruction): cart → top:5vh right:2.25vw — measured EXACTLY matching the product-page × position (top 45px / right-gap 32px at 1440×900). Supersedes C5's parallel-line placement.
- K2-C5 — 937aa24 — desktop cart nudge (superseded by C5b): top:4vh→calc(8vh-4px), right:2vw→3.1vw.
- K2-C4 — a8b8e99 — desktop product views fixed + uniform carousel cap: shared CSS vars (--product-carousel-top-offset 8vh stage / 68px standalone; --product-carousel-bottom-clearance clamp(18px,2.4vh,27px)) cap carousel+viewport max-height for BOTH .hero__product stage and standalone; stage overflow:hidden (no scroll), details panel internal overflow-y:auto, × repositioned absolute top:5vh right:2.25vw (stays clear — cart is hidden on is-product per N2 rule). Verified 1440×900: tall product (4000×6000) image top==CLOTHES top (72==72), bottom margin 60px, no crop, stage doesn't scroll, × visible, details scroll internally; socks reference product top 72/margin 111 — unchanged small-image behavior. Uses max-height (no upscaling of small images).

**Log (newest first; every commit build:green check:green):**
- K2-C3 — 88c4f5e — standalone product page one-screen fit — product.astro adds `product-detail--standalone` class; global.css min-width:761px block scoped ENTIRELY to it (hero__product stage + mobile untouched, html.landing untouched): page 100dvh flex column overflow:hidden (no page scroll), carousel/viewport capped calc(100dvh-88px), details panel overflow-y:auto internal scroll. Verified at 1440×900 with a 4000×6000 portrait product (50-50-belted-trouser): pageScrolls:false, image fully on-screen (bottom 870/900 = small bottom margin), object-fit:contain (no crop — letterboxed on transparent), counter+arrows visible, panel scrolls internally. FLAG for operator: wordy products scroll the details column internally — say if you'd rather shrink the description.
- K2-C2 — dbb56cf — drawer reveal .36s→.55s cubic-bezier(.16,1,.3,1) on main panels AND the same keyframe now on sub-folder `.hero__menu-nested` reveals (fires on display flip; no in-flow box — the J2 lesson); reduced-motion: none on both. NOTE: both levels animate OPEN only; close still snaps (matches J2 spec) — flag if two-way close animation is wanted.
- K2-C1 — fe0aa10 — `.is-active` underline dropped (green is the only affordance in every state); nested folder links clamp(10px,.95vw,13px)→clamp(11px,1.05vw,14px), line-height 1.22→1.28, +.14em per-item margin (desktop open-state rule only; mobile untouched).

---

**PHASE J2 STATUS: SHIPPED via PR #9 @ 43ee927 (2026-07-06) — see K2 status note.**

**Log (newest first; every commit build:green check:green):**
- J2-C8 — b142a32 — panel title aligned to menu header line — global.css one-liner: `.hero__catalog-title{margin-top:clamp(20px,3vh,32px)}` (desktop block); measured delta 0px at 1440; REWORKED from Codex's first attempt (menu-header `top:-3vh` caused OBJECTS+ to overprint DESIGNERS+ — reverted). No other element moved.
- J2-C7 — fc78b1a — PRE-ORDER removed from heroMenu (content.ts, 5-line deletion); page/iframe/route intact; 4 sections render; mobile rows 3+1; no JS errors from absent [data-preorder].
- J2-C6 — 33469aa — policy links stacked vertically in .hero-info__legal (`<br/>` for `&middot;`); Footer.astro N/A (deleted in L1).
- J2-C5 — 37c724e — product gallery → one-at-a-time carousel (product-view.ts + CSS): arrows (neon hover), touch swipe, "n / m" counter (aria-live), first eager/rest lazy; verified on /product/ desktop (counter 1/2→2/2) + mobile (MOB-6 two-col intact); applies to hero product stage too (shared renderer).
- J2-C4 — ddf26c9 — catalogue continuous smooth scroll: pager JS (setRowIndex/pageRows/wheel+touch hijack) deleted (~99 lines), track = flat 4-col grid (cards smaller per operator), viewport overflow-y:auto smooth; N2 return-point rowIndex→scrollTop (instant post-layout restore — AMENDED: CSS scroll-behavior:smooth was animating/truncating the programmatic restore); verified: wheel scrolls (1200px), card→product→× restores scrollTop 1200→1200; mobile same container; SWR/sold-out/links intact.
- J2-C3 — d1cbdf0 — CLOTHES SHOP ALL moved to first CATEGORIES child (content.ts) + menu.ts hydration PREPENDS it post-live-rebuild (uses live clothing parent handle); OBJECTS SHOP ALL untouched; verified in dist.
- J2-C2 — c805c46 — drawer reveal via @keyframes heroPanelReveal (opacity/translate/clip-path .36s ease) on `.is-open .hero__menu-panel`; display:none↔block mechanics UNCHANGED (REWORKED: first attempt's always-in-flow max-height panel added closed-state padding height on desktop + width:max-content inflated mobile closed sections breaking the 2-row tabs — reverted to keyframe-on-display-flip, closed geometry verified byte-equal); reduced-motion: none.
- J2-C1 — 023d231 — no header blow-up on open (desktop is-open font rule removed; green kept); CLOTHES open-state size swap: subheaders → clamp(14px,1.3vw,18px), NESTED links → clamp(10px,.95vw,13px) (AMENDED: first pass also shrank direct leaves = OBJECTS list; split the shared rule — direct leaves keep the larger size, CLOTHES-only per operator); `- `/`o ` ::before markers deleted (indent kept); menu hovers green-only (underline removed; .is-active underline kept).

---
>
> **STANDING RULE (operator, 2026-07-06): the desktop site must NOT change during Wave Mobile — every revision scoped inside ≤760px. Mobile should EMULATE the original desktop experience, condensed and clean — no overlays, no visual distortion.**
>
> (Prior state, for the record: Wave 2 + Phase N SHIPPED to main via PR #8 on 2026-07-02 — the ship gate was passed. A 2026-07-06 mobile scout found the published mobile experience has structural overlap bugs; WAVE MOBILE fixes them before official publish. Deferred: "now playing in store" idea (needs Ben's OK). Operator has further small site-wide design tweaks queued — briefs to come later, one at a time.)

---

## WAVE MOBILE — mobile revision pass (2026-07-06 scout: 9 findings, P0–P2)

Scout findings (screenshots with the operator): the mobile menu overlay spans the
full viewport at z-index 3 above the stage panels (z-index 2) — it eats taps on
products/add-to-cart and prints menu + about text over product content. Plus tab-row
collisions (cart icon), PRE-ORDER cut off / horizontal page shift, film × styling.
Sub-tasks will be dispatched ONE at a time; MOB-1 is first (operator-directed).

### MOB-1 — mobile: about block drops to bottom-center under the stage art

**Status:** committed @ 751a960 — ready for operator verify (on-phone via
`http://192.168.50.200:4321/shop-and-son/`, dev server running with `--host`)

**Log:**
- 2026-07-06 — MOB-1: mobile about block fixed bottom-center under stage art — 751a960 — build:green check:green — global.css only, ≤760px blocks only, desktop untouched. `.hero-info` → position:fixed bottom-center (bottom:max(3.5vh,safe-area), translateX(-50%), centered text, z:3 < drawer's 80); hidden (opacity/visibility/pointer-events + .18s fade, reduced-motion:none) on .is-catalog/.is-product/.is-preorder/.is-film AND any open menu section that isn't data-music/fam/preorder. Reviewed clean by Claude + headless-verified at 390×844: landing/MUSIC/& FAM show it centered under the art; catalogue + open CLOTHES hide it. FLAG for operator: (a) film stage currently hides it — one-selector flip if you want it under the film frame; (b) block hides even when CLOTHES is open collapsed (3 rows), not just fully expanded — reads clean, flag if unwanted. Not pushed.
**Task:** on the MOBILE sheet only (≤760px), `.hero-info` (address + contact +
legal links) leaves the menu-column flow and docks **bottom-center of the
viewport**, so it sits subtly BELOW the centered stage art (house stencil on
landing, DJ booth on MUSIC, & FAM tattoo block). It is HIDDEN on product
listings. ONE focused commit. `npm run build` **and** `npx astro check` green.
**Scope:** `homepage/` only. **Desktop (>760px) byte-identical — do not touch
the desktop rules.**

**Files:** `src/styles/global.css` (primary; the ≤760px media block).
`src/components/blocks/HeroVideo.astro` ONLY if a state hook is genuinely
missing (prefer pure CSS via the existing `.is-*` stage classes / `:has()`).

- **Placement (≤760px):** take `.hero-info` out of the `.hero__overlay` flow:
  `position:fixed; left:50%; transform:translateX(-50%); bottom:max(3.5vh, env(safe-area-inset-bottom)); text-align:center; width:max-content; max-width:88vw; z-index:3`.
  Keep the existing mono lowercase style, sizes, and the `.hero-info__legal`
  line — content unchanged, just re-anchored + centered. Links stay tappable
  (`pointer-events:auto` on links as now). Must stay BELOW the cart drawer
  (z 80/81) — z:3 is fine.
- **Show it on (≤760px):** bare landing (house stencil), `.is-music` (DJ booth),
  `.is-fam` (tattoo block). These are the three "animated block" states — the
  block reads as a caption under the art.
- **Hide it on (≤760px):** `.is-catalog`, `.is-product`, `.is-preorder` (product
  listings / shop iframe — operator explicitly excludes these), `.is-film`
  (video is the focus — FLAG: operator may want it under the film frame instead;
  keep it a one-selector flip), and **while a CLOTHES or OBJECTS menu list is
  expanded** — i.e. any `.hero__menu-section.is-open` that is NOT
  `[data-music]`/`[data-fam]`/`[data-preorder]` — so the fixed block never
  overlaps the tall scrolling lists. Hide = `opacity:0; visibility:hidden;
  pointer-events:none` with a short `.18s` opacity transition (respect
  `prefers-reduced-motion`: no transition).
- **No layout side-effects:** removing `.hero-info` from the overlay flow must
  not change the tab row or panel offsets; `margin-top:auto` etc. can stay on
  desktop — override only inside the ≤760px block.

**Done when:** build + check green; at 390×844: landing shows address/contact
centered below the house stencil; MUSIC and & FAM same; catalogue/product/
pre-order/film show NO about block; expanding CLOTHES/OBJECTS hides it;
closing back to bare hero brings it back; desktop rendering unchanged.

### MOB-2 — mobile: stage/menu exclusivity — STATE-PRESERVING (P0 root fix)

**Status:** committed @ c6259d5 — ready for operator verify

**Log:**
- 2026-07-06 — MOB-2: stage/menu exclusivity, state-preserving — c6259d5 — build:green check:green — HeroVideo.astro + global.css. JS: mobileQuery(≤760px); [data-shop-all] leaf → openCatalog + setMenuSectionState(null) on mobile only; plain-section header click skips closeStage() on mobile (stage survives hidden under menu — desktop closeStage unchanged). CSS ≤760px: non-stage open section (`:not([data-music/fam/preorder])`) hides .hero__catalog/__product/__preorder/__film/__fam/__dj via opacity/visibility/pointer-events + .18s fade (reduced-motion: none) — state/DOM untouched. Reviewed clean by Claude + headless REAL-TAP verified at 390 AND 360: card tap opens product, ADD TO CART opens drawer (full CART drawer w/ qty + CHECKOUT), menu-over-product hides then restores the SAME product on collapse. Not pushed.
**Task:** on ≤760px only, an expanded CLOTHES/OBJECTS menu list and a visible
stage panel never coexist — but the stage's STATE IS NEVER DESTROYED by the
menu. Operator's UX decision (2026-07-06): an accidental menu tap must cost the
user nothing — close the menu and you're exactly where you were; only choosing
a NEW destination replaces the old one. ONE focused commit. Build + check green.
**Scope:** `homepage/` only. **Desktop (>760px) byte-identical.**

**Files:** `src/components/blocks/HeroVideo.astro` (client script),
`src/styles/global.css` (≤760px rules).

- **JS — opening a stage collapses the menu (mobile only):** add
  `const mobileQuery = window.matchMedia("(max-width: 760px)")`. When a stage is
  opened from a menu LEAF — the `[data-shop-all]` collection buttons (catalog) —
  after the stage transition is initiated, if `mobileQuery.matches` call
  `setMenuSectionState(null)` so the expanded list collapses and the overlay
  shrinks to the tab rows. Do NOT do this for the header-opened stages
  (MUSIC / & FAM / PRE-ORDER) — their section staying open (`–`) IS the design.
  Do not change any desktop code path.
- **CSS — opening the menu hides (not kills) the stage (mobile only):** when a
  NON-stage section is open —
  `.hero__menu-section.is-open:not([data-music="true"]):not([data-fam="true"]):not([data-preorder="true"])`
  — hide every stage panel visually, preserving all state/DOM:
  `.hero__catalog, .hero__product, .hero__preorder, .hero__film, .hero__fam`
  and the music stage panel (use its real class — check the component) →
  `opacity:0; visibility:hidden; pointer-events:none`, `.18s` fade,
  `prefers-reduced-motion` → no transition. Do NOT touch `activeStage`, do NOT
  unmount/re-render anything, do NOT change close/× logic. Collapsing the
  section back must reveal the stage exactly as it was (same catalogue row,
  same product, video still paused where it was).
- **Tap landing:** with all sections collapsed, the overlay's box (height:auto)
  must not cover the stage area — audit the ≤760px overlay rules for anything
  forcing full-viewport height and remove it if found. Product cards, ADD TO
  CART, and the panel × buttons must receive real taps.

**Done when:** build + check green; at 390×844: open catalogue → menu list
auto-collapses, cards tappable → card opens product → ADD TO CART opens the
cart drawer (real tap, not JS dispatch); with product open, tapping CLOTHES
hides the product, collapsing CLOTHES brings the same product back; MUSIC /
& FAM / PRE-ORDER header flows unchanged; desktop unchanged.

### MOB-3 — mobile: stacked two-row menu + cart always visible

**Status:** committed @ 445d522 — ready for operator verify

**Log:**
- 2026-07-06 — MOB-3: stacked two-row mobile menu + cart always visible — 445d522 — build:green check:green — HeroVideo.astro + global.css. Markup: `<li class="hero__menu-break" aria-hidden>` after 3rd section (display:none desktop / flex-basis:100% mobile) → row 1 CLOTHES+/OBJECTS+/MUSIC+, row 2 centered & FAM+/PRE-ORDER+. Overlay overflow-x auto→hidden + menu width:max-content→wrap/center/max-width:calc(100%-48px) — horizontal scroll GONE (preorder shift verified dead: scrollX 0, docW==winW at both widths → old MOB-4 resolved, no separate task needed). Header font 14→12.5px, panel links 11→10.5px wrap-enabled. Cart: z5 + forced visible on is-catalog/product/preorder/film/fam (mobile only; desktop hide rules untouched); badge renders. Reviewed clean by Claude + headless-verified 390+360: two centered rows, PRE-ORDER visible, bag clear in all states, panels push row 2 down. Not pushed. FLAG for operator: row 2 re-centers under an open row-1 panel (drops below accordingly per your spec) — check the feel; and panel lists are now center-ish under centered headers — flag if you want them left-aligned within their column.
**Task:** on ≤760px, replace the single sideways-scrolling tab strip with a
STACKED, CENTERED, two-row header (operator's design, 2026-07-06):
row 1 `CLOTHES +  OBJECTS +  MUSIC +`, row 2 centered beneath
`& FAM +  PRE-ORDER +`. Section panels open in flow BELOW their header, pushing
what's beneath down (no overlap). The cart bag is visible and tappable AT ALL
TIMES on mobile. ONE focused commit. Build + check green.
**Scope:** `homepage/` only. **Desktop (>760px) byte-identical.**

**Files:** `src/styles/global.css` (primary),
`src/components/blocks/HeroVideo.astro` (only if a row-break element is the
cleanest wrap mechanism).

- **Rows:** ≤760px `.hero__menu` becomes centered wrapped rows
  (`display:flex; flex-wrap:wrap; justify-content:center;` tuned row/column
  gaps). Force the break after MUSIC (3rd section): cleanest is a static
  `<li class="hero__menu-break" aria-hidden="true">` after the 3rd section
  (`display:none` desktop, `flex-basis:100%; height:0` mobile) — or a pure-CSS
  mechanism if genuinely reliable. Section order comes from `content.ts`
  (clothes, objects, music, fam, preorder) — do not reorder data.
- **Kill horizontal scrolling entirely** on the mobile overlay: remove the
  `overflow-x:auto` / `width:max-content; min-width:100%` strip behavior and
  `white-space:nowrap` where it forces overflow. Both rows must fit 360px wide
  with zero sideways scroll — trim tab font (14px → down to ~12.5px if needed)
  and gaps to make it true. THIS ALSO must eliminate the old "page shifts left
  with a white band when opening PRE-ORDER" bug (old MOB-4) — verify it's gone.
- **Cart always visible (mobile):** on ≤760px REMOVE/override the stage
  cart-hide rules (`.is-catalog`/`.is-preorder`/`.is-product` etc. hiding
  `.hero__cart`) — operator wants the bag accessible at all times. Keep it
  pinned top-right (`top:max(3vh,safe-area) right:4vw`, z above panels, below
  drawer 80/81). Reserve it space: the menu rows get enough right padding (or
  max-width) that no tab ever sits under the bag at 390px AND 360px. Check it
  clears each panel's × close button (they sit lower — confirm visually).
  Desktop cart-hide behavior UNCHANGED.
- **Panels in flow:** opening a row-1 section pushes row 2 (and everything
  below) down — natural document flow, no absolute overlay of the rows. The
  MOB-1 fixed about block + MOB-2 hide rules keep working unchanged.

**Done when:** build + check green; at 390 AND 360 wide: two centered rows
exactly as specified, PRE-ORDER visible with no sideways scroll anywhere, bag
never overlapped in any state (landing, each section open, each stage open),
opening CLOTHES pushes & FAM/PRE-ORDER down; stages all open/close normally;
desktop unchanged.

### MOB-5 — mobile polish: film stage controls + tap targets

**Status:** committed @ 6738a1d — ready for operator verify

**Log:**
- 2026-07-06 — MOB-5: film controls unboxed + centered, tap-target pass — 6738a1d — build:green check:green — global.css only, all ≤760px. Film: frame flex-centered (top clamp 78-104px), ×/sound-toggle/playback → transparent bg, white ink + dark text/drop-shadow (legible over video), 40px tap boxes; menu links/subheaders min-height 36px flex; catalog/product/preorder × → 40px; cart 32→40px box (22px glyph). About block stays hidden on film per default. Reviewed clean by Claude + headless-verified at 390. Desktop untouched. Not pushed. NOTE: 36px tap rows make the expanded DESIGNERS list even taller — MOB-7 (operator picking treatment) addresses the list itself.
**Task:** two contained mobile polish fixes. ONE focused commit. Build + check
green. **Scope:** `homepage/` only; ALL rules inside ≤760px — desktop
byte-identical.

**Files:** `src/styles/global.css` (expect CSS-only; touch
`HeroVideo.astro` only if a class is genuinely missing).

- **Film stage controls (≤760px):** the × close (`[data-film-close]`) and the
  sound toggle currently render as opaque paper-colored boxes sitting ON the
  video — clunky in the condensed window. Mobile override: strip the box
  (`background:transparent; border:none`), render glyph/text directly over the
  video in white with a subtle dark drop-shadow/text-shadow for legibility
  (matches the site's minimal ink language). Keep the lowercase mono for the
  sound label. Give both a ≥40px effective tap box (padding — visual size can
  stay small). Also VERTICALLY CENTER the film frame in the stage area below
  the tab rows (it currently floats low with dead space above) — flex
  centering on the ≤760px `.hero__film`, transforms/animations untouched.
  About block stays HIDDEN on film (operator default — MOB-1 flag stands).
- **Tap-target pass (≤760px):** without changing the visual type scale:
  `.hero__menu-link`, `.hero__menu-subheader` → min-height ~36px effective tap
  (line-height/padding, text can stay 10.5px); every panel × close
  (`[data-catalog-close]`, `[data-product-close]`, `[data-preorder-close]`,
  `[data-film-close]`) → ≥40px tap box; `.hero__cart` tap box 32→40px (icon
  glyph stays 22px). Verify nothing shifts layout (padding inward, not margin
  outward).

**Done when:** build + check green; at 390: film stage centered with clean
un-boxed controls that are still legible over bright video; all listed
controls have the enlarged tap boxes; desktop unchanged.

### MOB-6 — mobile product page: images LEFT, text RIGHT (emulate desktop)

**Status:** committed @ 549834a — ready for operator verify

**Log:**
- 2026-07-06 — MOB-6: mobile product two-column (images left 54% / detail right / desc full-width below) — 549834a — build:green check:green — global.css only, ≤760px. `.product-detail__content` float-left gallery (54%, CSS vars for gutter/edge), vendor/title/price/control margin-tracked into the right column, serif title clamp(20px,7.2vw,30px), variants/add wrap-enabled, desc clear:both full-width; same rules cover `.hero__product` stage overrides so in-hero stage + standalone /product/ match. Reviewed clean by Claude + headless-verified 390+360 (stage AND standalone): images left, SUB SUN/title/$/ADD TO CART right, desc below. Desktop product view verified unchanged at 1440 (landing/catalog/product screenshots). Not pushed.
**Task:** operator (2026-07-06): the mobile product view must read like the
original website — images on the left, text on the right — instead of the
current single stacked column. Applies to BOTH the in-hero product stage and
the standalone `/product/` page (they share the `.product-detail*` CSS — keep
them consistent). ONE focused commit. Build + check green. **Scope:**
`homepage/` only; ≤760px only — the desktop 55/45 grid is the reference and
must not change.

**Files:** `src/styles/global.css` (goal: CSS-only re-grid of the existing
`.product-detail*` structure; consult `src/pages/product.astro` +
`src/lib/product-view.ts` for the real class names — do not restructure their
markup).

- **Layout (≤760px):** the product content becomes a two-column grid echoing
  the desktop split, condensed: **gallery LEFT ~54%** (images stacked, scroll
  with the page, full-bleed within their column), **detail panel RIGHT ~46%**
  (vendor → serif title → price → variant selector → add-to-cart), with the
  **description spanning FULL WIDTH below** both columns (at ~46% of a phone
  the description would be unreadably narrow — full-width below keeps it
  clean; flag for operator if he'd rather have it in-column).
- Scale the serif title down for the narrow column
  (`clamp()` — it currently renders huge on mobile), tighten variant buttons
  to fit the column (wrap allowed), keep the M1 neon hover/active language.
- The in-hero product stage (`.hero__product` overrides) inherits the same
  two-column read; its own scroll context/close behavior untouched.
- Sticky behavior on mobile: keep it simple — both columns flow (no sticky) to
  avoid iOS jank inside the stage panel; standalone page may keep sticky only
  if it verifiably doesn't fight the narrow viewport.

**Done when:** build + check green; at 390 AND 360: product opens with images
left / text right, description full-width below; add-to-cart still fires the
drawer; the standalone `/product/?handle=` page matches; desktop product view
pixel-identical.

### MOB-7 — mobile: nested menu lists in TWO columns (operator picked)

**Status:** committed @ 06f8182 + review-fix f554b4a — ready for operator verify

**Log:**
- 2026-07-06 — MOB-7 review-fix: mobile menu markers glued (OANCELLM) — f554b4a — build:green check:green — the MOB-5 `display:flex` on .hero__menu-link collapsed the trailing space of the `::before` markers (`"- "` / `"o "`); fixed with `gap:0.4em` inside the ≤760px rule only. Desktop markers untouched. Verified: "O ANCELLM" / "- SHOP ALL" spaced correctly.
- 2026-07-06 — MOB-7: nested menu lists in two columns — 06f8182 — build:green check:green — global.css only, ≤760px: .hero__menu-nested columns:2 (sequential halves per operator's approved preview) + column-gap:18px + break-inside:avoid on li; panel cap 260→min(88vw,340px). Verified 390+360: two balanced columns, all 32 designers visible, zero horizontal overflow; OBJECTS panel single-column unchanged; desktop unchanged. FLAG for operator: with the wide DESIGNERS panel open, the tab rows reflow — CLOTHES centers on top and the other four tabs drop BELOW the open panel (reads as a focus state; say if you want the two rows pinned instead). Not pushed.
**Task:** operator picked (2026-07-06): the expanded nested lists (DESIGNERS —
32 names — and CATEGORIES) render in **two compact columns** on mobile — all
names visible at once, NO internal scrolling, halving the wall-of-text height.
ONE focused commit. Build + check green. **Scope:** `homepage/` only; ≤760px
only — desktop single-column nested lists unchanged.

**Files:** `src/styles/global.css` only.

- **≤760px `.hero__menu-nested`:** `columns:2` (CSS multi-column — fills the
  FIRST half of the alphabet down the left column, second half down the right,
  matching the operator's approved preview; do NOT use grid auto-flow row,
  which would pair a/b across) with `column-gap` ~16-20px and
  `break-inside:avoid` on the `<li>`s so a name never splits across columns.
- **Give it room:** the parent `.hero__menu-panel` mobile cap
  (`max-width:min(84vw,260px)`) is too narrow for two columns — widen the cap
  for panels/nested lists as needed (up to ~88vw) so both columns fit 360px
  without horizontal overflow. Names keep `overflow-wrap:anywhere` and the
  MOB-5 36px tap rows.
- Direct panel items that are NOT nested (e.g. OBJECTS' short brand list,
  `- SHOP ALL`) stay single column.

**Done when:** build + check green; at 390 AND 360: CLOTHES → DESIGNERS shows
two balanced columns (sequential halves, all 32 visible, no scroll, no
overflow-x); CATEGORIES same treatment; OBJECTS panel unchanged; desktop
unchanged.

### MOB-8 — mobile menu: PAPER TAKEOVER + bigger type + badge fix (Proposal A)

**Status:** committed @ 6062af5 — ready for operator phone verify (LAST item before ship gate)

**Log:**
- 2026-07-06 — MOB-8: paper takeover + lowercase-mono 12px lists + 14px headers + badge fix — 6062af5 — build:green check:green — global.css only, all ≤760px. Takeover: `.hero-video::after` fixed inset:0 z2 bg var(--paper), opacity-fade .25s (reduced-motion: none), driven by the non-stage `:has()` selector — video/stencil fully hidden behind solid paper while CLOTHES/OBJECTS open; music/fam/preorder stages untouched (verified: DJ stage visible with MUSIC open). Type: headers 12.5→14px (gap .88→.7rem — closed 2-row structure verified intact at 390+360, cart clear), panel links + subheaders → var(--mono) lowercase 12px (markers, 2-col designers, 36px taps all kept). Hairline under tab row while takeover active (FLAG: operator judges on phone). Badge: .hero__cart-count top:3px right:3px — fully visible ("1" verified). 0px overflow both widths. Desktop untouched. Reviewed clean by Claude + headless-verified. Not pushed. FLAG (pre-existing, unchanged): an open section's wide panel still reflows the tab rows (MUSIC drops to its own line while its playlist panel is open).
**Task:** operator picked Proposal A (2026-07-06). Three parts, ONE focused
commit. Build + check green. **Scope:** `homepage/` only; every rule ≤760px —
desktop byte-identical.

**Files:** `src/styles/global.css` (goal: CSS-only; `HeroVideo.astro` only if
a hook is genuinely missing).

**(1) Paper takeover.** On ≤760px, when a NON-stage menu section is open
(same selector family as MOB-1/2:
`.hero__menu-section.is-open:not([data-music="true"]):not([data-fam="true"]):not([data-preorder="true"])`),
a **solid paper layer covers the full viewport BEHIND the menu** so the video,
house stencil, and shadows disappear — the menu reads on calm ground like the
live shopandson.com drawer:
- Implement as a pseudo-element (e.g. `.hero-video:has(<selector>)::after`)
  with `position:fixed; inset:0;` background = the hero's cream paper tone
  (match the site's paper — check the existing `--paper`/background values;
  NOT stark white), z-index ABOVE the video/stencil/panels (panels are z2 and
  already hidden by MOB-2 when this state is active) and BELOW `.hero__overlay`
  (z3) and `.hero__cart` (z5).
- Fade in/out with a ~.25s opacity transition; `prefers-reduced-motion` → no
  transition. Closing the last section returns the video hero.
- Do NOT touch the music/fam/preorder header-open states — their stages must
  stay visible behind their small panels.
- Add a subtle hairline (`1px solid` low-alpha ink) separating the tab-row
  block from the expanded panel while the takeover is active — like the live
  drawer's rules. (FLAG it in the log — operator judges the hairline on
  phone; easy to remove.)

**(2) List typography — lowercase mono, BIGGER (operator: mobile type is too
hard to access; increase sizes).** While keeping the section headers in the
uppercase Helvetica +/− voice:
- `.hero__menu-header` (CLOTHES/OBJECTS/MUSIC/& FAM/PRE-ORDER): 12.5px →
  **target 14px** (absolute floor 13.5px). Both rows MUST still fit 390 AND
  360 with zero horizontal overflow and clear daylight to the cart bag glyph —
  tune `column-gap`/row max-width as needed; verify visually at 360.
- Panel/leaf links (`.hero__menu-link`, incl. nested) + subheaders
  (`.hero__menu-subheader`): switch to the site's mono stack (same family as
  `.hero-info` — check the var/font used there) with
  `text-transform:lowercase`, sized **12px** (up from 10.5px), keeping the
  `- ` / `o ` ::before markers, the MOB-7 two columns (widen the panel cap if
  12px mono needs it, still no overflow), the 36px tap rows, and the MOB-2
  state behavior. `- SHOP ALL` and subheaders (categories/designers) render
  lowercase mono too — matching the live drawer's voice.

**(3) Cart badge clip fix.** `.hero__cart-count` currently renders half-clipped
at the viewport corner on mobile. Keep it fully visible: anchor it INSIDE the
40px cart box's top-right (small mono count, may overlap the bag glyph corner),
respecting `env(safe-area-inset-top)`. Mobile only.

**Done when:** build + check green; at 390 AND 360: opening CLOTHES/OBJECTS
fades in solid paper (no video/stencil visible anywhere behind the menu),
designers list reads lowercase mono 12px in two columns, headers ≥13.5px with
zero overflow and clear cart, closing returns the video hero; MUSIC/& FAM/
PRE-ORDER stages unaffected; badge fully visible with items in cart; desktop
unchanged.

### Exit gate (unchanged)

Re-scout + operator verify on real iPhone (browse → product → add to cart →
drawer → checkout hand-off; every stage; pre-order on live build) → explicit
**"ship wave mobile"**.

---

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

### K7 — Availability sort: in-stock first, sold-out last (every catalogue)

**Why:** in every collection view (designers, categories, objects, shop-alls),
in-stock products should sort to the TOP and sold-out to the BOTTOM — sold-out
stays fully visible + clickable, just last.

**Files:** `src/components/blocks/HeroVideo.astro` (the render-prep point only).

- **Stable partition by `available` in the ONE place products are prepared for
  rendering** — `renderCatalogRows(products, targetRowIndex)` (~line 787), which
  BOTH the snapshot paint (`renderCatalogContent`) AND the live refresh call. Sort
  there so snapshot and post-refresh order are identical (no reshuffle flicker).
- Stable partition: `available !== false` first, `available === false` last;
  WITHIN each group PRESERVE the incoming collection order (JS `Array.prototype.sort`
  is stable — sort a COPY by `Number(a.available === false) - Number(b.available === false)`;
  do not mutate the input array).
- The row pager already re-measures rebuilt rows (K2) — nothing else to change.
- NO UI chrome, NO headers between the two groups — the dimmed cards + `sold out`
  chips already communicate the split.

**Done when:** build+check green; opening any designer/category/objects/shop-all
with mixed stock shows all available items first, sold-out trailing (dimmed,
clickable); order within each group matches Shopify's collection order; the
snapshot paint and the post-live-refresh order agree.

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

## PHASE N — product view as an in-page stage (ships WITH Wave 2)

Operator decisions (made 2026-07-02, do NOT re-ask): Wave 2 holds and ships
together with Phase N; the standalone `/product/` page STAYS (direct links, new
tabs, shares) and URLs sync; product images are a free-scrolling stack; closing a
product returns to the catalogue where the user left off. TWO sub-tasks, one
commit each, **N1 before N2**.

### N1 — Extract the shared product-detail renderer (NO behavior change)

Refactor K3's product page so the detail VIEW (image stack, details column,
variant selector, add-to-cart `cart:add` dispatch + interim buy-on-shopandson,
sanitized `descriptionHtml`, and the loading / not-found / no-token states) is
built by ONE shared client module (DOM-builder pattern, like `createProductCard`)
consumed by BOTH the `/product/` page (now) and the hero panel (N2).

- New module e.g. `src/lib/product-view.ts`: exports a mount function that renders
  the detail view + drives its states INTO A PROVIDED CONTAINER — e.g.
  `mountProductView(container: HTMLElement, handle: string)` (loading → getProduct →
  render / not-found / unconfigured-fallback). Move product.astro's render logic
  (renderProduct, gallery, panel, renderVariantSelector, makeButtonOrLink,
  renderMessage, renderStorefrontFallback) into it verbatim. Keep the same class
  names + markup so CSS is unchanged.
- NO page-specific assumptions: the module must NOT rely on document-level scroll
  or on being the whole page — it renders into the given container, which owns its
  scroll context. `/product/` keeps its own header (← back + cart icon) OUTSIDE the
  container and just calls the module.
- `product.astro` becomes a thin consumer: header chrome + a container + one
  `mountProductView(container, handle)` call.

**Done when:** build+check green; `/product/?handle=…` behaves + renders
PIXEL-IDENTICAL to today (all states); the module has no page-specific assumptions
(renders into a provided container with its own scroll context).

### N2 — The product stage inside the hero

Clicking a catalogue card no longer navigates — the listings row phases out
(existing exit animation) and the product view slides in on the same page; the
menu + about block stay put.

- **STAGE:** add `"product"` to the stage machinery (`PanelStage`, `getStagePanel`,
  `getStageClass` → `is-product`, `openProduct(handle)`). It is the ONLY stage
  entered FROM catalog, not from the menu. On open: keep the catalogue panel's DOM
  ALIVE (hide + aria-hidden — do NOT re-render it) and SAVE `{collection, rowIndex}`.
  Product panel = same bounds discipline as the catalogue (right-of-menu), × top-
  right; content via the N1 module `mountProductView(panelContainer, handle)`
  (loading while it fetches; not-found per N1).
- **CLOSE = BACK TO CATALOGUE:** × or Esc restores the SAVED catalogue — same
  collection, same rowIndex, re-measured — reverse animation (product exits the way
  it came, catalogue re-enters). If the mirrored animation fights the existing
  keyframes, matching the standard stage transition is acceptable — FLAG it, operator
  judges feel. The catalogue's OWN × still exits to the bare hero. Opening any menu
  section / other stage while a product is open closes BOTH layers cleanly.
- **CARD CLICKS — progressive enhancement, EXACTLY this:** cards KEEP their
  `/product/?handle=…` hrefs. Intercept PLAIN LEFT-CLICKS only (no cmd/ctrl/shift/
  middle-click — those still open the standalone page in a new tab) → `preventDefault`
  → open the stage.
- **URL SYNC (implement + test each of the four paths):**
  1. Open via card click → `history.pushState` `?product=<handle>` onto the homepage
     URL (base-path aware).
  2. Close via ×/Esc → if WE pushed that state, call `history.back()` and let the
     popstate handler do the actual close (never pushState a "closed" entry — no
     history littering).
  3. Browser back/forward → popstate handler opens/closes the stage to match,
     including restoring the catalogue on back.
  4. Direct load of the homepage WITH `?product=<handle>` → after hydration, open the
     product stage directly (no catalogue underneath); closing it then goes to the
     bare hero and `replaceState` strips the param.
- **SCROLL:** page stays scroll-locked; the IMAGE STACK is the panel's OWN scroll
  context (`overflow-y:auto; overscroll-behavior:contain`), details column sticky
  within the panel. The panel MUST sit OUTSIDE `[data-catalog-viewport]` so the
  catalogue's wheel-hijack listener never captures its scroll. Mobile: single
  scrollable panel, images then details, × reachable.
- **CART:** add-to-cart uses the same `cart:add` → drawer flow (K4). Verify the
  drawer z-index sits ABOVE the product stage, and Esc priority: if the drawer is
  open, Esc closes the DRAWER, not the product.
- The `/product/` page keeps working for direct links, new tabs, shares.

**Done when:** build+check green; catalogue → product → × returns to the same
collection at the same row; browser back does the same; refresh mid-product reopens
that product; cmd-click opens the standalone page; add-to-cart from the panel through
Shopify checkout works; all other stages + menu interactions close the product layer
cleanly; mobile sane.

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

- 2026-07-02 — Phase N2: product stage inside the hero — e8aaa43 — build:green check:green (Claude re-ran: 0/0/6, 4 routes; product-stage markup in dist/index.html; /product/ + /policies/ still build). HeroVideo.astro + global.css. STAGE: "product" added to HeroStage/PanelStage, getStagePanel→productPanel, getStageClass→is-product, is-product added to reset lists + returnStencilFromRight + stencil-exit CSS + cart-hide CSS + closeStage. New <aside class="hero__product"> is a SIBLING of .hero__catalog, OUTSIDE [data-catalog-viewport] (so the catalogue wheel-hijack can't capture its scroll); contains × [data-product-close] (sticky top-right) + [data-product-view] container. openProduct(handle, saveReturnPoint): clears productView, saves {collection,label,rowIndex} only when leaving catalog, activeProductHandle=handle, transitionToStage("product", ()=>mountProductView(productView,handle)) (N1 module). CARD INTERCEPT: delegated on [data-catalog-track], .product-card[href] plain-LEFT-click only (bails on defaultPrevented/button!==0/meta/ctrl/shift/alt → standalone page opens in new tab), parses ?handle from href, preventDefault → pushState + openProduct. URL SYNC (4 paths): (1) card click → pushState {product:handle} ?product=<handle> (base-aware); (2) ×/Esc → if history.state.product → history.back() (popstate does real close, no litter) else actualCloseProduct(stripUrl); (3) popstate → syncProductStageFromUrl (single source of truth: ?product present & not showing → openProduct; absent & product open → actualCloseProduct → restores saved catalogue via transitionToStage('catalog', re-assert activeCollection+title+setActiveButton+setRowIndex, rows kept ALIVE not re-rendered); (4) direct load ?product → syncProductStageFromUrl() on init opens product with NO saved catalog → close = bare hero + replaceState strips param. prepareToLeaveProductForStage() called at the top of EVERY openX (catalog/preorder/music/fam/film) → clears product state + strips ?product + deactivates the kept-alive catalog, so opening any menu section/stage closes BOTH layers cleanly. SCROLL: .hero__product own context (overflow-y:auto, overscroll-behavior:contain), right-of-menu bounds like catalog, details sticky within panel; scoped .hero__product .product-detail__{content,panel,title} overrides so the /product/ full-page styles fit; mobile single-column static panel. CART: add-to-cart still dispatches cart:add→drawer (N1); .hero__product z-index:2 (shared bounds rule) BELOW the drawer's 80/81; product Esc bails if .cart-drawer.is-open (drawer gets Esc first). /product/ standalone UNCHANGED. FLAG (operator pre-approved): product→catalogue CLOSE uses the STANDARD transitionToStage animation (not a bespoke mirrored reverse) — operator to judge feel. Reviewed clean by Claude (full state machine: open/close/actualClose/prepareToLeave/syncFromUrl + card intercept + markup placement + CSS bounds/scroll/z-index traced). committed @ e8aaa43 — pushed to origin/dev. Interactive URL-sync/cmd-click/back-forward paths are operator hand-verify (not headless-testable). 
- 2026-07-02 — Phase N1: extract shared product-detail renderer (pure refactor, no behavior change) — e70e5ae — build:green check:green (Claude re-ran: 0/0/6, 4 pages) — NEW src/lib/product-view.ts (253 lines) exports mountProductView(container, handle): sets container "loading" → guards no-handle/!isStorefrontConfigured (renderStorefrontFallback → shopandson.com/products/<handle>) → getProduct → not-found ("this piece is no longer listed") or renderProduct. ALL of product.astro's render logic moved VERBATIM (gallery .product-detail__gallery, panel .product-detail__panel, renderVariantSelector, makeButtonOrLink incl. window.__cartReady interim buy-on-shopandson + cart:add CustomEvent, renderMessage, renderStorefrontFallback, variant resolution) — same class names/markup/data-attrs → pixel-identical, global.css untouched. Renders ONLY into the provided container (no document-scroll reliance) → reusable by N2's hero panel. product.astro (254 lines removed) now thin: <Base bare> shell + header (← back + cart button/badge unchanged) + [data-product-state] container + one mountProductView(state, handle) call. HeroVideo/global.css untouched. Reviewed clean by Claude (mountProductView flow + moved logic + product.astro thinness). committed @ e70e5ae — pushed to origin/dev. N2 next.
- 2026-07-02 — Phase K5: freshness ops — nightly rebuild + PUBLIC_ token into the Pages deploy build — (deploy.yml; committed with brief) — CLAUDE-AUTHORED (the documented homepage-only scope EXCEPTION; the dispatch script hard-fences Codex to homepage/, and deploy.yml is at repo-root .github/workflows/). Changes: (1) added `schedule: - cron: "0 8 * * *"` (daily ~08:00 UTC ≈ 4am ET) alongside push[main]/workflow_dispatch — redeploys main as-is to keep the build-time products.json snapshot fresh (runtime Storefront layer already revalidates; this keeps the instant-paint snapshot + no-token fallback from rotting). (2) added `env:` to the "Build site" step passing PUBLIC_SHOPIFY_STORE_DOMAIN + PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN from `${{ vars.* }}` (repo Actions Variables, NOT Secrets — public token) so Astro inlines them into the deployed client bundle → the live site gets catalogue/cart/menu features. Unset (forks/PRs) → K1 quiet degradation → build stays green. Operator confirmed + Claude verified the two Actions Variables exist by name (gh variable list). YAML validated (js-yaml: triggers [push, workflow_dispatch, schedule], cron ok); local build green (workflow change doesn't affect local build). deploy.yml effect lands when Wave 2 merges to main. Reviewed by Claude (self). committed with brief — pushed to origin/dev.
- 2026-07-02 — Phase K7: availability sort (in-stock first, sold-out last) in every catalogue — 93694bf — build:green check:green (Claude re-ran: 0/0/6) — HeroVideo.astro renderCatalogRows only (the SINGLE render-prep point both snapshot paint + live refresh call): `const sorted = [...products].sort((a,b)=>Number(a.available===false)-Number(b.available===false))` then build rows from `sorted`. Stable partition on a COPY (no mutation) → available-first, sold-out-last, preserving Shopify collection order within each group (Array.sort is stable). Because it's the one render point, snapshot and post-refresh order agree (no reshuffle flicker); the SWR diff (unsorted) still just detects change. No chrome/headers between groups (dimmed cards + sold-out chips show the split); pager re-measures rebuilt rows (K2). Reviewed clean by Claude. committed @ 93694bf — pushed to origin/dev.
- 2026-07-02 — Phase K6: live hero nav menus mirror Shopify admin — 3dc8053 — build:green check:green (Claude re-ran: 0/0/6). NEW src/lib/menu.ts: getLiveHeroMenu() → getMenu("main-menu") (K1), maps the 3 top items to {categories, designers, objects} entry lists (label uppercased, collection from collectionHandle); categories = clothing.items minus shop-all/clothing-1; returns null on empty/missing item (→ content.ts fallback). HeroVideo.astro: collectionButtons array → getCollectionButtons() re-query (works on reconciled DOM); [data-shop-all] catalogue-open switched from per-button binding to a SINGLE delegated listener on .hero__menu (survives node replacement); hydrateLiveMenu() on load reconciles 3 leaf lists — CLOTHES>CATEGORIES + CLOTHES>DESIGNERS nested <ul> (rebuilt as hero__menu-link--bullet), OBJECTS panel leaves after SHOP ALL (rebuilt as --dash) — each with an entriesMatch equality guard (skip if collection+label identical), rebuilding buttons with identical data-shop-all/data-collection/data-collection-label markup + active state; section/subgroup is-open + [data-menu-subgroup] toggles + section headers untouched (only leaf lists swap → open state preserved); SHOP ALL parents (clothing-1/house-1) kept. No token / fetch fail / missing item → no-op, content.ts stands. content.ts UNTOUCHED (fallback). Reviewed clean by Claude (menu.ts + full reconcile/delegation read; getMenu('main-menu') live-verified returns 3 items). committed @ 3dc8053 — pushed to origin/dev. ⚠️ OPERATOR FLAG: OBJECTS now mirrors the LIVE nav = 4 BRANDS (binu binu, danny d's mud shop, mark patrick harrington, shino takeda) + SHOP ALL(house-1), REPLACING the homepage's LIVING/KITCHEN/LIBRARY/SEATING categories on load — the live shopandson.com objects dropdown is brand-based (verified: only main-menu exists; its objects item = those 4 brands). Want categories back → add them to the live Shopify "objects" menu in admin (K6 follows admin) OR say and I'll exempt OBJECTS. CLOTHES CATEGORIES also gains "sale" (clothing-sale). — RESOLVED 2026-07-02: operator ACCEPTED Option A (OBJECTS = the 4 live brands, as shipped; no change).
- 2026-07-02 — Phase K4-fix2: restore the cart open/close SLIDE animation (regression from K4-fix specificity) — 42d1cca — build:green check:green — K4-fix's `html.cart-ready .cart-drawer{transition:...visibility 0s linear .55s}` (spec 0,2,1) was OVERRIDING the open rule `.cart-drawer.is-open{transition:...visibility 0s}` (spec 0,2,0), so opening used the CLOSE transition's DELAYED visibility → drawer slid while hidden then popped in after 550ms (no visible animation). FIX: removed the transition from `.cart-drawer.is-open` (kept transform/visibility) and added `html.cart-ready .cart-drawer.is-open{transition:transform .55s ease-in-out,visibility 0s}` (spec 0,3,1) so the OPEN transition (visibility immediate) wins on open while the base cart-ready rule (visibility delayed) drives the close. Now: open = visible slide-in R→L; close = visible slide-out L→R; load = still no animation (cart-ready gating preserved). CSS only. Reviewed clean by Claude (specificity traced). committed @ 42d1cca — pushed to origin/dev. K4 verify-gate continues.
- 2026-07-02 — Phase K4-fix: stop the cart drawer animating off-screen on page load (operator bug) — d48790e — build:green check:green — first-paint transition flash: the .cart-drawer/.cart-backdrop slide+fade `transition` lived on the BASE rule, so the browser animated the element into its closed translateX(100%) position on first paint. FIX: removed the transition from the base .cart-drawer + .cart-backdrop rules; re-added them gated behind `html.cart-ready .cart-drawer{transition:...}` / `html.cart-ready .cart-backdrop{transition:opacity...}`; CartDrawer script adds `cart-ready` to documentElement via double requestAnimationFrame (after first paint). Net: closed drawer is painted instantly on load (no flash); open/close still slide 550ms. is-open transition + all cart behavior/markup unchanged. Reviewed clean by Claude. committed @ d48790e — pushed to origin/dev. Part of the K4 verify-gate (still awaiting operator hand-check of the full add→drawer→checkout flow).
- 2026-07-02 — Phase K4: Storefront Cart API + on-site drawer (checkout → Shopify) — 6b4710e — build:green check:green (Claude re-ran: 0/0/6, 4 routes) + **live cart pipeline PROVEN via API**: cartCreate → cartLinesAdd(real in-stock variant) → userErrors:[], totalQuantity:1, subtotal 195.0→"$195", checkoutUrl present (shopandson.com/cart/c/…), line "pig jet cap in sand beige / Default Title" (Default Title correctly skipped in drawer). NEW src/lib/cart.ts (459 lines): CART_FRAGMENT + cart(id) query + cartCreate/cartLinesAdd/cartLinesUpdate/cartLinesRemove; window.__cartReady=true ONLY if isStorefrontConfigured (no-token → K3 buy-on-shopandson fallback stays); localStorage andson:cart-id hydrate (checked-out/errored/null → isUsableCart(id&&checkoutUrl) false → reset id, lazy recreate); mapCart (subtotal+line price via shared formatMoney, variantTitle 'Default Title'→'', thumb getSizedShopifyImageUrl 200); getCart/ensureCart/addLine(qty≥1)/updateLine(qty≤0→remove)/removeLine; EVERY mutation → document 'cart:updated' (detail=Cart); userErrors → 'cart:message' + console.warn, NEVER alert; listens 'cart:add' (K3) → addLine → 'cart:open' (auto-open); queueMicrotask initial hydrate for badges; all fns no-op gracefully when unconfigured. NEW src/components/CartDrawer.astro (228): right slide-over + backdrop, header cart+×, line rows (thumb→product link, title, variant/vendor, −/+ stepper→updateLine, ×→removeLine, line price), footer subtotal + 'shipping + tax at checkout' + black CHECKOUT (disabled/hidden when empty) → location.href=checkoutUrl, 'nothing yet' empty state, quiet inline cart:message (auto-hide 4.5s); open on 'cart:open', close on ×/backdrop/Esc; is-cart-open scroll-lock on html+body; updates ALL [data-cart-count] badges + subtotal + checkout state on cart:updated; [data-cart-toggle]→dispatch cart:open; initial getCart().then(render). HeroVideo cart <a href=shopandson.com/cart> → <button data-cart-toggle> + .hero__cart-count badge (I1 hide-on-catalog/preorder CSS kept). product.astro cart <a> → <button data-cart-toggle> + badge; <CartDrawer/> mounted on index + product; K3 interim buy-on-shopandson branch left in place (now inert, __cartReady true — still the correct no-token fallback). global.css .cart-drawer/backdrop/line/stepper/checkout/badge (paper skin, black CHECKOUT, M1 neon hover, 550ms slide, scroll-lock). Reviewed clean by Claude (full cart.ts + CartDrawer read + wiring + live API test). committed @ 6b4710e — pushed to origin/dev. **K4 IS THE VERIFY-GATE** — awaiting operator hand-check: add-to-cart from a product page → drawer opens w/ line, stepper/remove, badge tracks, reload persists, CHECKOUT lands on Shopify with the items, completed checkout returns an empty cart. FLAG (per brief): homepage cart button stays hidden during catalog/preorder stages (I1 CSS kept) — adding from a catalogue view still opens the drawer though the icon's hidden; whether the icon should stay visible in panels is an operator call.
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
