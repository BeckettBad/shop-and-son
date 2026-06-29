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

**Status:** ✅ committed `47ded3b` on dev (Claude reviewed: clean, in-scope, build+check green). Awaiting operator verify on dev + the C2 token. Animation feel/visual polish not browser-verified (no headless browser available) — needs operator's eyes.
**Task:** Phase C1 — catalogue interaction + slide animation, with MOCK product data (live Shopify fetch is C2, blocked on the token). Clicking SHOP ALL under CLOTHES or OBJECTS slides the stencil off-left and slides a scrollable product catalogue (rows of 3) in from the right over the still-looping video. The menu stays visible (user can switch collections); a close control returns to the landing stencil.

**Layout reality (important):** `.hero__overlay` (the menu) is on the LEFT — `left:0; width:42vw; max-width:560px` desktop; horizontal tabs at the top on mobile (`max-width:760px`). The stencil is centered (`.hero__stencil`, z-index 1, with `transform`/`transition` already in place from Phase B). Build the catalogue to fill the area to the RIGHT of the menu so the menu stays visible and clickable.

**Files / area:**
- `src/data/content.ts` — give the CLOTHES and OBJECTS `SHOP ALL` items a `collection` handle + a display label (use `"clothing"` / `"house"` as placeholders — to be confirmed for C2).
- `src/components/blocks/HeroVideo.astro` — render `SHOP ALL` items that have a `collection` as a `<button data-shop-all data-collection data-collection-label>`; add the catalogue panel markup; add a client `<script>` for the interaction.
- `src/styles/global.css` — catalogue panel + product-card styles + the slide-in/out animation states.
- `src/lib/catalog.ts` (NEW) — `export async function getCatalogProducts(collection: string)`: for C1 return MOCK data (≈9 items per collection: `{ title, vendor, price, url, image? }`, image optional → card shows a neutral placeholder box). Add a clear `// TODO C2:` marker showing where the live Storefront fetch swaps in. Do NOT wire live Shopify in C1.

**Behavior:**
1. State on the `.hero-video` section: toggle class `is-catalog` (+ keep the active collection). Default (no `is-catalog`) MUST render identically to Phase B — catalogue only appears on click.
2. Click a SHOP ALL button → add `is-catalog`, set the catalogue header to its label, render the grid from `getCatalogProducts(collection)`.
3. Stencil slides off-left: `.hero-video.is-catalog .hero__stencil{ transform:translateX(-130%) }` (reuses the existing transition).
4. Catalogue panel `.hero__catalog`: absolutely positioned, `z-index:2` (below the menu), occupies right of the menu (desktop `left:max(42vw,280px)` → right edge; mobile full width below the tabs). Default off-screen right + hidden (`transform:translateX(110%); opacity:0; visibility:hidden`); active `.hero-video.is-catalog .hero__catalog{ transform:translateX(0); opacity:1; visibility:visible }`. Transition transform+opacity ~.55s.
5. Catalogue contains a header (collection label + a close "×" button `[data-catalog-close]`) and a scrollable grid `.hero__catalog-grid` — `grid-template-columns:repeat(3,1fr)` with `overflow-y:auto` (rows of 3, scroll for more). Mobile: 2 columns (or 1 on very narrow).
6. Product card `.product-card`: placeholder image area (neutral box if no image) + title + vendor + price; whole card links to `url`. Editorial/brutalist mono styling consistent with the site.
7. Close button → remove `is-catalog` → stencil slides back in, catalogue slides out.
8. Switching collections while open: clicking another SHOP ALL just repopulates header + grid.
9. Z-order: video 0 < stencil 1 < catalogue 2 < menu/overlay (bump `.hero__overlay` to `z-index:3`). Menu stays clickable throughout.

**Style / structure constraints:** Default landing unchanged (Phase B look). Keep the existing skin (mono fonts, restrained palette, the menu styling). Don't change Phase A type sizes or the stencil rule except adding the `.is-catalog` transform. No live Shopify, no external image dependencies, no instructional/internal text on the page.

**Done when:** `npm run build` and `npx astro check` both green; default landing identical to Phase B; clicking CLOTHES→SHOP ALL or OBJECTS→SHOP ALL slides the stencil out and a 3-up scrollable mock catalogue in from the right; close returns to landing; menu stays usable; `getCatalogProducts` isolates the data source for an easy C2 swap.

---

### QUEUED (do not start — blocked)

- **Phase C2 — live Shopify fetch.** Replace the mock in `getCatalogProducts` with a client-side Storefront API fetch (public `PUBLIC_SHOPIFY_STORE_DOMAIN` + `PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN`, exposed to the browser since it's read-only), querying by collection handle, mapping to the card shape. Blocked: no token/domain in `homepage/.env`, and need the confirmed CLOTHES/OBJECTS collection handles. Everything else (the panel, animation, cards) is done in C1.

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

- 2026-06-29 — Phase C1: catalogue interaction + slide animation + mock grid — 47ded3b — build:green check:green — Codex implemented per brief; reviewed clean by Claude (gated on .is-catalog, menu z-index→3, rows of 3, race-guarded render, getCatalogProducts isolates data for C2). Not pushed.
- 2026-06-29 — Phase B: clean video + separate centered stencil overlay — f4276a8 — build:green check:green — Claude prepped assets (4K→1080p 2.5MB, white stencil IMG_4242→hero-stencil.png); Codex did HeroVideo.astro + CSS; reviewed clean + composite-previewed. Not pushed.
- 2026-06-29 — Codex commit access enabled — `--add-dir` could not lift the seatbelt `.git` block, so per operator's informed choice the dispatch now runs Codex unsandboxed (`--dangerously-bypass-approvals-and-sandbox`); Codex committed this scaffolding itself on `dev`. Commits stay on dev (no push/merge); Claude reviews after.
- 2026-06-29 — shrink hero menu typography (Phase A) — a2f93f8 — build:green check:green — Codex implemented per brief; reviewed clean by Claude (exactly the 4 font-size values, nothing else); Codex sandbox couldn't write repo-root .git, so Claude committed
- 2026-06-29 — shrink hero menu typography — no commit (sandbox blocked `.git/index.lock`) — build:green check:green — CSS implemented; commit step blocked by read-only Git metadata
- (empty)
