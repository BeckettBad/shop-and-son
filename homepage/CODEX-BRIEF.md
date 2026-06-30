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
**Task:** Phase G — MUSIC/DJ centered stage. Pressing MUSIC swaps the center house stencil for a transparent DJ cutout (same exit-left/enter-right stage transition we already have); once it settles, a subtle shake + floating SVG music notes loop near the booth speakers. Asset is ready (Claude placed + made transparent): `homepage/public/images/dj-in-action-cutout.png` (RGBA, 1124×1399), reference via `withBase("/images/dj-in-action-cutout.png")`.

**Files:** `src/components/blocks/HeroVideo.astro` (markup + script), `src/styles/global.css`, `src/data/content.ts` (mark the MUSIC section). Do NOT touch the catalogue/preorder/data — only ADD the DJ stage. Do NOT change nav typography/spacing/layout/behavior except wiring MUSIC.

**Reuse our existing stage system.** The hero already has `activeStage` ('landing'|'catalog'|'preorder'), `transitionToStage(next, prepareIncoming)` (outgoing exits LEFT + fades via `is-exiting-left`, incoming enters from the RIGHT), `is-catalog`/`is-preorder` on `.hero-video`, the stencil exits-left when a stage is active, and `returnStencilFromRight()` on close. ADD `'music'` as a new stage that works the same way but its panel is CENTERED (in the stencil's zone), not right-anchored.

**1 — DJ markup (centered, transparent, over the video):** inside `.hero-video`, add
`<div class="hero__dj dj-content-wrapper" aria-hidden="true"><img class="dj-cutout-image" src={withBase("/images/dj-in-action-cutout.png")} alt="" /><span class="music-notes-layer">…inline SVG notes…</span></div>`.
- Centered like `.hero__stencil` (absolute, centered), the central object — slightly LARGER/amplified than the stencil (e.g. `height:min(88vh,82vw)`), `object-fit:contain` so the raised arm (upper-right) and booth bottom are NEVER cropped. z-index just above the video, BELOW the menu overlay.
- NO card/box/border/background/glow/frame behind it — transparent only. `pointer-events:none` on the wrapper so the left nav stays clickable.
- The `.music-notes-layer` overlays exactly the image box (inset:0 within the wrapper), `pointer-events:none`.

**2 — Wire MUSIC → the music stage.** Add `music?: boolean` to the `HeroMenuSection` type and set it on the MUSIC section. When the MUSIC header is clicked: keep its normal accordion open (playlists stay in the left menu) AND `transitionToStage('music', …)` so the stencil exits-left and the DJ enters from the right and settles centered. Opening another section/stage, or ×, leaves the music stage and returns to landing (`returnStencilFromRight`, which must also clear `is-music`). Neon-green active state on the MUSIC header while active. Default landing unchanged (stencil centered, DJ hidden).

**3 — SVG music notes (in code, crisp, editorial).** Create 3 inline-SVG variants as `.music-note`: (a) single eighth note, (b) double/beamed eighth note, (c) small beamed note. Thin, minimal, monochrome — use `currentColor` (near-black) so CSS controls color/opacity. No glow, no color, no cartoon.
- Place ~5–6 notes via PERCENT positions relative to the wrapper/image box, in TWO clusters near the speakers (float upward from there):
  - Left woofer: ~(22%,55%), (16%,61%), (29%,52%)
  - Right speaker/tweeter: ~(45%,57%), (50%,53%), (42%,61%)
- AVOID (do not overlap): face ~(48%,17%), raised fist ~(86%,8%), hands/decks ~(20–55%, 40–46%), and the nav/category text. Keep notes close to the booth, not scattered.

**4 — Animation (start ONLY after settle).** Use the stage-transition completion (the `transitionToStage` settle — the stageDuration timeout / `transitionend`) to add `is-settled` to `.hero-video` (or the DJ wrapper). Only then:
- DJ shake: subtle loop on `.dj-cutout-image` (or an inner wrapper) — translate 1–2px max, optional rotation <0.3deg. Alive, barely noticeable.
- Notes: gently float UP a small distance + slight horizontal drift, fade-in then fade-out, looped, STAGGERED delays (not all at once). Hidden until `is-settled`.
- Do NOT animate while the DJ is still sliding in. Stop/hide shake + notes when leaving the music stage (clear `is-settled`/`is-music`).

**5 — Reduced motion:** under `@media (prefers-reduced-motion:reduce)` disable the shake and the floating-note animation; either hide the notes or show them static + very subtle.

**6 — Responsive:** DJ scales down on small screens (`min(...vh,...vw)` + object-fit:contain), arm + booth bottom never cropped, image stays attached to the center zone; notes stay attached to the speakers (they're %-positioned within the image box, so they scale with it).

**Keep unchanged:** the stencil/catalogue/preorder/house animations, Phase A–F behavior, the empty-collection hiding, default landing. Reuse existing transition/state logic; add only the DJ classes (`dj-content-wrapper`, `dj-cutout-image`, `music-notes-layer`, `music-note`, `is-settled`).

**Done when:** build + `astro check` green; default house stencil still correct; pressing MUSIC swaps the center to the transparent DJ cutout (no box/halo) with the existing slide transition; nav stays clickable; arm + booth not cropped; notes are crisp SVGs only around the speaker clusters (not over face/hands/nav); shake ≤2px; shake+notes run only once settled and stop when switching away; `prefers-reduced-motion` disables them; all existing animations intact.

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
