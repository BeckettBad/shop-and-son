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

**Status:** approved & committed @ a2f93f8 (Claude reviewed + committed; Codex sandbox couldn't write repo-root .git) — ready for operator verify on `dev`
**Task:** Shrink the hero menu headers + their dropdown sub-labels to 2/3 of their current size (Phase A of the hero/catalogue rework — CSS only).

**Files / area:** `homepage/src/styles/global.css` only. No markup or JS changes.

**What to change:** Four `font-size` declarations, each scaled to 2/3 of its current value (each clamp arg ×2/3, rounded). Change nothing else.

1. `.hero__menu-header` (desktop, ~line 291):
   `font-size:clamp(24px,2.4vw,32px)` → `font-size:clamp(16px,1.6vw,21px)`
2. `.hero__menu-link` (desktop, ~line 299):
   `font-size:clamp(14px,1.35vw,18px)` → `font-size:clamp(9px,0.9vw,12px)`
3. `.hero__menu-header` inside `@media(max-width:760px)` (~line 330):
   `font-size:21px` → `font-size:14px`
4. `.hero__menu-link` inside `@media(max-width:760px)` (~line 339):
   `font-size:16px` → `font-size:11px`

`.hero__menu-link` covers both dash sub-items and the bullet/nested children, so all sub-labels shrink with one rule per breakpoint.

**Style / structure constraints:** Touch only the four `font-size` values above. Do NOT change line-height, padding, letter-spacing, white-space, or any other property — only the numeric font sizes. Leave all editorial blocks (`.kicker`, `.title`, etc.) untouched. Keep both the desktop and mobile breakpoints in sync as listed.

**Done when:** `npm run build` and `npx astro check` both green; the four font-size values match exactly what's listed above and nothing else in `global.css` changed.

---

### QUEUED (do not start — blocked on the operator delivering assets/credentials)

- **Phase B — clean video + stencil overlay.** Swap `homepage-hero.mp4` for the clean no-stencil video and add the house stencil as a separate centered overlay layer above the video (independently positionable so it can be animated). Blocked: clean video `SHOP AND SON HOMEPAGE.mp4` + the 3 stencil PNGs are not on disk yet.
- **Phase C — live catalogue + animation.** On clicking SHOP ALL under CLOTHES/OBJECTS: stencil slides off-left, a row of 3 live Shopify products slides in from the right over the looping video; infinite scroll in rows of 3 under the collection header; right-hand menu stays visible to switch collections. Live in-browser fetch to the Storefront API. Blocked: no `homepage/.env` (need `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_API_TOKEN`) and the CLOTHES/OBJECTS collection handles.

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

- 2026-06-29 — Codex commit access enabled — `--add-dir` could not lift the seatbelt `.git` block, so per operator's informed choice the dispatch now runs Codex unsandboxed (`--dangerously-bypass-approvals-and-sandbox`); Codex committed this scaffolding itself on `dev`. Commits stay on dev (no push/merge); Claude reviews after.
- 2026-06-29 — shrink hero menu typography (Phase A) — a2f93f8 — build:green check:green — Codex implemented per brief; reviewed clean by Claude (exactly the 4 font-size values, nothing else); Codex sandbox couldn't write repo-root .git, so Claude committed
- 2026-06-29 — shrink hero menu typography — no commit (sandbox blocked `.git/index.lock`) — build:green check:green — CSS implemented; commit step blocked by read-only Git metadata
- (empty)
