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
**Task:** Phase C-rev3 — interaction polish: (1) clicked menu fields turn a darker-hued neon green, (2) clicking a top-level menu header while the catalogue is open EXITS it so the house stencil animates back to center (reverse) — make this return smooth. Files: `HeroVideo.astro` (script) + `global.css`.

**1 — Click feedback: darker-hued neon green.**
- When the user clicks a menu field, that field's TEXT turns a darker-hued neon green (vivid but a shade deeper than pure neon — around `#1faa2e`; define a CSS var, e.g. `--neon-green:#1faa2e`, tune to taste). It indicates the active/selected field and persists while selected; reverts when deselected.
- Apply to: the open section header (`.hero__menu-section.is-open > .hero__menu-header`) and the active SHOP ALL / selected item (`.hero__menu-link.is-active`). Keep it consistent so any clicked field reads green while active.

**2 — Exit reverses the house animation (this is the crucial bit — make it smooth).**
- TODAY: clicking a SHOP ALL opens the catalogue → house slides off-LEFT (`.hero-video.is-catalog .hero__stencil`). BUG: clicking a top-level header (CLOTHES/OBJECTS/MUSIC/& FAM) while the catalogue is open only toggles the dropdown — it does NOT close the catalogue, so the house never comes back.
- FIX: when the catalogue is open and the user clicks ANY top-level menu header, also close the catalogue (remove `is-catalog`) — in addition to the normal dropdown toggle — so the house animates back to center. (The existing close "×" should keep working too.)
- The house must REAPPEAR smoothly and settle CENTER (where it sits on first load). Operator's stated preference: it sweeps in from the RIGHT, moving right→left to center. Implement that cleanly: while the stencil is still off-screen, with its `transition` momentarily disabled, reposition it to off-screen-RIGHT (`translateX(calc(50vw + 100%))`), force a reflow, then re-enable the transition and move it to center (`translateX(0)`) — the off-screen left→right jump is invisible, so the user only sees a smooth right→left glide in. As the house enters, the catalogue panel slides out to the right (its existing reverse). **Priority is SMOOTHNESS** — if a flicker-free right-entry isn't achievable, fall back to the clean reverse (house glides back from the left to center) rather than ship anything janky. Tune easing (ease-in-out) + duration (~.55s) so house-in and catalogue-out feel coordinated.
- Reset state cleanly (active collection cleared, `is-active`/green cleared, `rowIndex`=0) on exit.

**Keep unchanged:** everything from `cf32922` (real sized products, big portrait cards, row-pager), Phase A/B, non-destructive default landing.

**Done when:** `npm run build` + `npx astro check` green; clicking a menu field turns its text the neon green; with the catalogue open, clicking a top-level header (or ×) smoothly brings the house back to center while the catalogue slides out; no flicker/jank; default landing unchanged.

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

- 2026-06-29 — Phase C-rev2: image lag fix + bigger portrait cards — cf32922 — build:green check:green — CDN width-resize (1.7MB→~120-210KB) via getSizedShopifyImageUrl (cdn.shopify.com only) + srcset 700/1100/1600; catalogue left 42vw→36.5vw, padding/gap cut so 3 cards dominate. Menu-left confirmed in docs. Reviewed clean. Not pushed.
- 2026-06-29 — Phase C-rev fix: resilient build-time fetch — 9a0311f — build:green check:green — getCatalogProducts now try/catches → warn + return [] (deploy can't break on a network blip). Not pushed.
- 2026-06-29 — Phase C-rev: real products+images, full stencil exit, large 3-up cards, scroll-paged rows — 468f53d — build:green check:green — build-time fetch of shopandson.com products.json (clothing 60 + house 27, real CDN images), translateY row-pager (wheel/touch, CSS-var driven), mobile scroll fallback. Reviewed clean (caught + fixed the throw-on-fetch-fail in 9a0311f). Not pushed.
- 2026-06-29 — Phase C1: catalogue interaction + slide animation + mock grid — 47ded3b — build:green check:green — Codex implemented per brief; reviewed clean by Claude (gated on .is-catalog, menu z-index→3, rows of 3, race-guarded render, getCatalogProducts isolates data for C2). Superseded by C-rev. Not pushed.
- 2026-06-29 — Phase B: clean video + separate centered stencil overlay — f4276a8 — build:green check:green — Claude prepped assets (4K→1080p 2.5MB, white stencil IMG_4242→hero-stencil.png); Codex did HeroVideo.astro + CSS; reviewed clean + composite-previewed. Not pushed.
- 2026-06-29 — Codex commit access enabled — `--add-dir` could not lift the seatbelt `.git` block, so per operator's informed choice the dispatch now runs Codex unsandboxed (`--dangerously-bypass-approvals-and-sandbox`); Codex committed this scaffolding itself on `dev`. Commits stay on dev (no push/merge); Claude reviews after.
- 2026-06-29 — shrink hero menu typography (Phase A) — a2f93f8 — build:green check:green — Codex implemented per brief; reviewed clean by Claude (exactly the 4 font-size values, nothing else); Codex sandbox couldn't write repo-root .git, so Claude committed
- 2026-06-29 — shrink hero menu typography — no commit (sandbox blocked `.git/index.lock`) — build:green check:green — CSS implemented; commit step blocked by read-only Git metadata
- (empty)
