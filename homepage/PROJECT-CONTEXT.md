# PROJECT-CONTEXT — &son homepage

Standing context both agents (Claude orchestrator, Codex implementer) read on
every task. This holds the **vision + locked decisions** that otherwise live only
in the operator↔Claude chat. Keep it current: when a decision is made, it lands
here. The per-task spec lives in `CODEX-BRIEF.md`; the standing rules live in
`AGENTS.md`/`CLAUDE.md`. This file is the "why" and the "what we've decided."

## What this project is
A custom, **analog / editorial / brutalist** front-end that is **replacing the
current storefront at shopandson.com**, built to the owner's (Beckett's) vision.
It is a custom front-end with **Shopify checkout**: we read product data from the
Shopify Storefront API to display, and every "buy" sends the customer to Shopify
for cart + checkout. `homepage/` is THE live site, served at
`beckettbad.github.io/shop-and-son/`. Stack: Astro v6, static output, vanilla
CSS/JS. Base path `/shop-and-son` via `withBase()` (`src/lib/url.ts`).

## How we work (the build loop)
- **Claude** = orchestrator + reviewer: turns the operator's instruction into a
  brief, dispatches Codex headless (`./dispatch-codex.sh`), reviews the result.
- **Codex** = implementer (gpt-5.5, headless): edits `homepage/`, verifies, and
  makes its own commit on `dev`.
- **Git access:** Codex runs **unsandboxed**
  (`--dangerously-bypass-approvals-and-sandbox`) so it can write `.git` and commit
  one focused change per task on `dev`. It does NOT push or merge to `main`. The
  sandbox fence is off — the scope rules here + in AGENTS.md and Claude's review
  are the only guardrails.
- **Deploy gate:** shipping = a PR **`dev → main`** that the operator reviews on
  GitHub and merges. Push to `main` triggers the GitHub Pages deploy. Only the
  operator merges the deploy PR. Build on `dev`; the operator verifies with
  `npm run dev` before shipping.
- Scope every change to `homepage/` only. Never edit `archive/` (shelved,
  gitignored, reference-only) or casually change root `public/preorders/`.
- No instructional or internal text on the live page.

## The hero / catalogue rework — locked decisions
- **Clean hero video:** swap the current stencil-baked `homepage-hero.mp4` for a
  clean, no-stencil looping video. The house/shop **stencil becomes a separate,
  centered overlay layer** above the video (so it can be animated independently).
- **Right-hand hero menu** (`CLOTHES / OBJECTS / MUSIC / & FAM`, in
  `src/data/content.ts` → `heroMenu`) currently links nowhere; we are wiring it.
- **Shoppable tabs:** **CLOTHES and OBJECTS** open a product catalogue. **MUSIC**
  and **& FAM** are not products — they link out, no grid.
- **Catalogue interaction:** clicking **SHOP ALL** under a shoppable tab → the
  stencil **slides off to the left** while a **row of 3 live products slides in
  from the right**, over the still-looping video. The catalogue scrolls in **rows
  of 3** (up/down) to browse the collection, under the collection header. The
  **right-hand menu stays visible** so the user can switch collections.
- **Product data:** **live in-browser fetch** to the Shopify Storefront API (the
  public read-only token is safe in the browser). Always current — new Shopify
  products appear with no rebuild/redeploy.
- **Header type:** hero menu headers + their dropdown sub-labels are **2/3** of
  their original size (Phase A — shipped to `dev`, commit `a2f93f8`).

## Phases & status
- **Phase A — 2/3 header shrink.** ✅ Done on `dev` (`a2f93f8`). Awaiting operator
  verify + eventual ship.
- **Phase B — clean video + stencil overlay layer.** ⛔ Blocked: the clean video
  (`SHOP AND SON HOMEPAGE.mp4`) and the 3 stencil PNGs are **not on disk** yet —
  not in `archive/assets-src/& son homepage assets/` or anywhere on the drive.
  Need the operator to deliver them; then identify the correct house stencil and
  copy chosen assets into `homepage/public/`.
- **Phase C — live catalogue + animation.** ⛔ Blocked: no `homepage/.env`
  (need `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_API_TOKEN`), and we need the
  **collection handles** for CLOTHES and OBJECTS (e.g. `clothing`, `house`).

## Open asks to the operator
1. Drop the clean video + 3 stencil PNGs into `archive/assets-src/& son homepage
   assets/` (or give the path).
2. Add `homepage/.env` with the Storefront domain + token (never paste values in
   chat), and the CLOTHES/OBJECTS collection handles.
