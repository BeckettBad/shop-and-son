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
**Task:** Phase E — PRE-ORDER section. Add a 5th hero-menu top-level **PRE-ORDER** (after `& FAM`). Clicking it opens the existing preorders page — embedded as a SCALED desktop view in the right-side panel — using the same "stage" transition as the catalogue (whatever's on the right exits LEFT + fades; the new content enters from the RIGHT). The preorders source has ALREADY been stripped of its top nav (by Claude) and is served at `/preorders/` (via a symlink); you only build the homepage embed.

**Files:** `src/data/content.ts`, `src/components/blocks/HeroVideo.astro`, `src/styles/global.css`. (Do NOT touch `public/preorders/` — already done.)

**1 — content.ts:** add `preorder?: boolean` to the `HeroMenuSection` type, and a 5th `heroMenu` section AFTER `& FAM`: `{ label: "PRE-ORDER", preorder: true, items: [] }`. No sub-items.

**2 — Markup + open behavior:**
- Render the PRE-ORDER header like the other top-level headers (same style + `+`/`–` toggle for parity) but mark it `data-preorder`; it renders NO panel/sub-list.
- Add a right-side panel `<aside class="hero__preorder" aria-hidden="true">` holding `<iframe class="hero__preorder-frame" src={withBase("/preorders/")} title="Pre-order" loading="lazy"></iframe>`.
- Clicking PRE-ORDER opens the preorder stage (does NOT expand a list); it closes any open menu section and replaces any open catalogue. Reuse the neon-green active state on the header while preorder is the active stage. The existing close (×) / clicking another header returns to landing (house returns) — same as catalogue.

**3 — Scaled desktop embed (keep it horizontal):** show the FULL desktop preorders rendering scaled DOWN to fit the panel (NOT reflowed to narrow). Approach: iframe at a fixed desktop base `width:1280px`, `transform:scale(<panelWidth/1280>); transform-origin:top left;`, iframe height sized so the scaled result fills the panel height; wrap in `.hero__preorder` with `overflow:hidden` + a small margin (slight background gutter), occupying the same right-of-menu area as `.hero__catalog` (left ~36.5vw). Scroll + video inside the iframe must still work. Mobile (≤760px): allow it to reflow/scroll normally — don't force the desktop scale if it breaks.

**4 — The "stage" transition (operator's key ask — match the homepage feel).** The right side is a single "stage" holding ONE of: centered stencil (landing), a catalogue, or the preorder embed. When the active content CHANGES, the OUTGOING slides out to the LEFT + fades and the INCOMING slides in from the RIGHT:
- landing → preorder: stencil exits left (reuse the existing `.is-catalog` stencil transform), preorder enters from right.
- catalogue → preorder (e.g. on SHIRTS, click PRE-ORDER): the catalogue panel exits LEFT + fades (NEW — today it only exits right on close), preorder enters from right.
- preorder → catalogue, and catalogue → catalogue: same rule (outgoing exits left, incoming enters right).
- ANY → landing (× / collapse the active header): keep EXISTING behavior — active panel exits and the house returns from the right (`returnStencilFromRight`).
Implement as a small shared helper so catalogue + preorder share the exit-left / enter-right treatment. Smooth (ease-in-out, ~.55s), no flicker; prefer a simpler version over anything janky.

**Keep unchanged:** catalogue data/rows/images, Phase A–D, neon-green, house return, default landing (on load: stencil centered, nothing open).

**Done when:** build + `astro check` green; PRE-ORDER is the 5th section; clicking it slides the current right-side content off-left and slides the scaled, menu-less preorders embed in from the right; the embed is interactive (scroll/video work); ×/switching follows the stage rules; default landing unchanged.

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
