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

**Status:** ready for Codex
**Task:** Phase D — category nav. Make every wear subcategory, designer, and objects subcategory a clickable item that opens the EXISTING animated catalogue (its own collection, its own header). Replace the placeholder items in `content.ts` `heroMenu` with the REAL lists (exact handles below). And make clicking a top-level header (CLOTHES/OBJECTS/MUSIC/& FAM) expand its subsections into the left side in an ENLARGED, left-anchored version of the menu font (accordion — one open at a time). Structure stays the 4 tabs; Designers is a sub-group under CLOTHES.

**Reuse, don't reinvent:** the catalogue (open / slide / rows / close / house-return / neon-green) already works off `data-shop-all` + `data-collection` + `data-collection-label` on a `<button>`. Generalize so ANY leaf item that has a `collection` renders as that same button → a designer or subcategory click opens its catalogue exactly like SHOP ALL does today. Don't touch the catalogue/card/animation code beyond making more items trigger it.

**1 — content.ts `heroMenu` data (exact handles — copy verbatim).**
CLOTHES items:
- SHOP ALL → collection `clothing`, label `CLOTHES — SHOP ALL`
- group `CATEGORIES` (suffix " |") children (each clickable): JACKETS / OUTERWEAR→`jackets-outerwear`, SHIRTS · BUTTONS / SNAPS→`shirts-with-buttons-snaps`, KNITWEAR→`knitwear`, TEES→`tees`, TROUSERS→`trousers`, SHORTS→`shorts`, SHOES & ACCESSORIES→`accessories`, SUNGLASSES→`sunglasses`, APOTHECARY→`apothecary`, JEWELRY→`jewelry`
- group `DESIGNERS` children (each clickable), IN THIS ORDER: 11.11→`11-11`, AN IRRATIONAL ELEMENT→`an-irrational-element`, ARCHIE→`archie`, AURORA→`aurora`, BINU BINU→`binu-binu`, CARTER YOUNG→`carter-young`, FAIRLY NORMAL→`fairly-normal`, HENDER SCHEME→`hender-scheme`, HEREU→`hereu`, KUON→`kuon`, MATSUFUJI→`matsufuji`, MONOSTEREO→`monostereo`, NEVER CURSED→`never-cursed`, OSHIN→`oshin`, PARATODO→`paratodo`, REFOMED→`refomed`, RICE NINE TEN→`rice-nine-ten`, SAGE NATION→`sage-nation`, SAMUEL FALZONE→`samuel-falzone`, SATTA→`satta`, SEVEN X SEVEN→`seven-by-seven`, SILPHIUM→`silphium`, SMALL TALK→`small-talk`, SONNY→`sonny`, URU→`uru`, WILLIAM FREDERICK→`william-frederick`, XENIA TELUNTS→`xenia-telunts`, YAHAE→`yahae-1`, YUKETEN→`yuketen`

OBJECTS items:
- SHOP ALL → collection `house`, label `OBJECTS — SHOP ALL`
- subcategories (clickable): LIVING→`house`, KITCHEN→`kitchen`, LIBRARY→`library`, SEATING→`seating`, TABLES→`tables`, LIGHTING→`lighting`, FURNITURE→`furniture`

MUSIC and & FAM: leave their items unchanged (not products). Each clickable item's `collectionLabel` is the header shown over its catalogue (e.g. `KNITWEAR`, `HENDER SCHEME`).
Note: the nested `HeroMenuNestedItem` type needs `collection?` + `collectionLabel?` added (like `HeroMenuSubItem` already has), and the component must render nested children that HAVE a `collection` as the catalogue `<button>` (today only top-level items do).

**2 — Left-nav expand (enlarged, left-anchored, accordion).**
- Clicking a top-level header opens that section and CLOSES the others (one open at a time). Keep all 4 headers visible so the user can switch.
- An open section renders its subsections (the CATEGORIES + DESIGNERS sub-groups and their items) in an ENLARGED version of the current menu font — clearly bigger than the Phase-A sizes — text anchored LEFT, filling the left side. Size so the full list fits where reasonable; if long (Designers = 29), let the open panel scroll vertically within the left column rather than overflow the page. Enlarged baseline to tune: headers ~`clamp(20px,2vw,30px)`, items ~`clamp(14px,1.3vw,18px)`.
- Sub-group headers (CATEGORIES, DESIGNERS) stay smaller labels above their items.
- Clicking a leaf item with a `collection` opens its catalogue on the right (existing animation + neon-green active). Catalogue/stencil behavior unchanged.

**Keep unchanged:** the whole catalogue system (rows, sized images, close, house return), Phase A/B, neon-green, and the default landing (on load nothing is expanded — same as now). Mobile: keep the horizontal-tab behavior usable; the enlarged-expand is a desktop concern — don't break mobile.

**Style / structure constraints:** keep the editorial skin + the existing menu font family (just larger when expanded), left-anchored. No instructional/internal text. Don't rewrite the catalogue card/animation code.

**Done when:** build + `astro check` green; CLOTHES expands to the real subcategories + 29 designers (OBJECTS to its subcategories) in an enlarged left-anchored list, one section open at a time; clicking any subcategory/designer opens its collection's catalogue with the correct header; default landing unchanged.

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
