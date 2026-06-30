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

---

## ACTIVE BRIEF

**Status:** ✅ committed `468f53d` (revision) + `9a0311f` (resilient fetch). Claude reviewed clean; verified real data baked (clothing 60 + house 27, all CDN images). On dev, not pushed. Animation feel still needs operator's eyes (no headless browser here).
**Task:** Phase C-rev — revise the C1 catalogue (`47ded3b`): (1) REAL products + images from the live store, (2) the stencil exits the screen FULLY, (3) larger 3-up cards filling the right region, (4) a scroll-PAGED row interaction (one row of 3 at a time; scrolling spawns the next 3 animating upward). Keep C1's open/close + slide-in framework; change data, card size, and scroll behavior.

**Layout:** menu (`.hero__overlay`) is on the LEFT (42vw); catalogue fills the area to its right. Default landing must stay identical to Phase B. Build + `astro check` green.

**1 — REAL products + images (build-time fetch, NO token needed).**
- Rework `src/lib/catalog.ts` to fetch the store's PUBLIC product feed at BUILD time (Node fetch in Astro frontmatter — NOT in the browser; the feed has no CORS so client-side is blocked, but build-time and the `cdn.shopify.com` `<img>` URLs both work fine):
  `https://shopandson.com/collections/<handle>/products.json?limit=250`. Confirmed handles: CLOTHES→`clothing`, OBJECTS→`house`.
- Map each product → `{ title, vendor, price, image, url }`:
  `title`=`product.title`; `vendor`=`product.vendor`; `price`=`"$"+product.variants[0].price` with a trailing `.00` stripped (`355.00`→`$355`, keep non-zero cents); `image`=`product.images[0]?.src` (placeholder box if absent); `url`=`https://shopandson.com/products/${product.handle}`.
- Cap at **60 products per collection** for now (note the cap in a comment; house=27, clothing=250 — we can raise/paginate later).
- Bake the data into the page so the client reads it without a runtime fetch: fetch in `HeroVideo.astro` frontmatter and emit `<script type="application/json" id="catalog-data" set:html={JSON.stringify(data)}></script>` (escape any `<` to avoid breaking out of the script tag); the client script parses that instead of the old async mock. Keep one clean seam so a future LIVE Storefront swap (C2) is easy.

**2 — Stencil exits FULLY.** Change `.hero-video.is-catalog .hero__stencil` so the drawing leaves the viewport completely (e.g. `transform:translateX(calc(-50vw - 100%))` or `-200%` — no sliver left). Keep the existing transition.

**3 — Larger cards, exactly 3 visible.** The catalogue (right of the menu) shows ONE row of 3 LARGE cards filling the width with comfortable outer padding + a gap, and most of the height. The image is dominant (`object-fit:cover`, fills the card), title/vendor/price beneath. NOT the small overflow grid from C1.

**4 — Scroll = paged rows of 3, animating upward.** Replace C1's `overflow-y:auto` grid with a vertical ROW-PAGER:
- `.hero__catalog-viewport` (overflow hidden, fills height under the header) → `.hero__catalog-track` (`transform:translateY(calc(-100% * rowIndex))`, `transition:transform ~.5s ease`) → one `.hero__catalog-row` per 3 products (`height:100%; display:grid; grid-template-columns:repeat(3,1fr)`).
- Wheel/touch advances ONE row per gesture: wheel down → `rowIndex++` (clamp to last), wheel up → `rowIndex--`; `preventDefault` so the page doesn't scroll; throttle so one gesture = one row (ignore further wheel until the transition ends). Add touch swipe (up=next, down=prev). `rowIndex`=0 on open / collection switch.
- The next row slides UP from below into place as the old one moves up and out (the translateY track does exactly this).
- Mobile (≤760px): skip the scroll-jacking — fall back to a simple vertical scroll of the cards (1–2 columns).

**5 — Keep from C1:** open on SHOP ALL, slide-in from the right, close (×), collection switching, menu on top (`z-index:3`) and clickable, non-destructive default landing.

**Style / structure constraints:** Keep the editorial/brutalist skin. Don't change Phase A type sizes or Phase B's base stencil rule (only its `.is-catalog` transform). No instructional/internal text. Keep the data seam clean for the future live (C2) swap.

**Done when:** `npm run build` + `npx astro check` green; SHOP ALL shows REAL products with REAL images (3 large cards filling the right region); the stencil fully leaves the screen; scrolling down advances to the next 3 (animating upward), up goes back; close returns to landing; default landing unchanged.

---

### QUEUED (do not start — blocked)

- **Phase C2 — (optional) always-current data.** Real products+images already flow via the BUILD-TIME fetch of `shopandson.com/collections/<handle>/products.json` (refreshes on each deploy). C2 is now only needed if the operator wants products to update WITHOUT a redeploy → switch the data seam to a client-side **Storefront API** fetch (`PUBLIC_SHOPIFY_STORE_DOMAIN` + `PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN`; Storefront API IS CORS-enabled, unlike products.json). Needs the token. Not blocking anything visual now.

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

- 2026-06-29 — Phase C-rev fix: resilient build-time fetch — 9a0311f — build:green check:green — getCatalogProducts now try/catches → warn + return [] (deploy can't break on a network blip). Not pushed.
- 2026-06-29 — Phase C-rev: real products+images, full stencil exit, large 3-up cards, scroll-paged rows — 468f53d — build:green check:green — build-time fetch of shopandson.com products.json (clothing 60 + house 27, real CDN images), translateY row-pager (wheel/touch, CSS-var driven), mobile scroll fallback. Reviewed clean (caught + fixed the throw-on-fetch-fail in 9a0311f). Not pushed.
- 2026-06-29 — Phase C1: catalogue interaction + slide animation + mock grid — 47ded3b — build:green check:green — Codex implemented per brief; reviewed clean by Claude (gated on .is-catalog, menu z-index→3, rows of 3, race-guarded render, getCatalogProducts isolates data for C2). Superseded by C-rev. Not pushed.
- 2026-06-29 — Phase B: clean video + separate centered stencil overlay — f4276a8 — build:green check:green — Claude prepped assets (4K→1080p 2.5MB, white stencil IMG_4242→hero-stencil.png); Codex did HeroVideo.astro + CSS; reviewed clean + composite-previewed. Not pushed.
- 2026-06-29 — Codex commit access enabled — `--add-dir` could not lift the seatbelt `.git` block, so per operator's informed choice the dispatch now runs Codex unsandboxed (`--dangerously-bypass-approvals-and-sandbox`); Codex committed this scaffolding itself on `dev`. Commits stay on dev (no push/merge); Claude reviews after.
- 2026-06-29 — shrink hero menu typography (Phase A) — a2f93f8 — build:green check:green — Codex implemented per brief; reviewed clean by Claude (exactly the 4 font-size values, nothing else); Codex sandbox couldn't write repo-root .git, so Claude committed
- 2026-06-29 — shrink hero menu typography — no commit (sandbox blocked `.git/index.lock`) — build:green check:green — CSS implemented; commit step blocked by read-only Git metadata
- (empty)
