# PROJECT-CONTEXT — &son homepage

Standing context both agents (Claude orchestrator, Codex implementer) read on
every task. This holds the **vision + locked decisions** that otherwise live only
in the operator↔Claude chat. Keep it current: when a decision is made, it lands
here. The per-task spec lives in `CODEX-BRIEF.md`; the standing rules live in
`AGENTS.md`/`CLAUDE.md`. This file is the "why" and the "what we've decided."

## What this project is
A custom, **analog / editorial / brutalist** front-end that replaced the templated
storefront at shopandson.com, built to the owner's vision.
It is a custom front-end with **Shopify checkout**: we read product data from the
Shopify Storefront API to display, and every "buy" sends the customer to Shopify
for cart + checkout. `homepage/` is THE live site, served publicly at
`shopandson.com`; the GitHub Pages URL is the deployment origin and preview. Stack: Astro v6,
static output, vanilla CSS/JS. Production origin and base path are environment-driven through
`PUBLIC_SITE_ORIGIN` and `PUBLIC_BASE_PATH`; runtime links use `withBase()` (`src/lib/url.ts`).

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

## Production state

- The custom storefront is live at `shopandson.com`.
- CLOTHES and OBJECTS open live Shopify-backed catalogues inside the hero.
- Product detail, cart, policy, preorder, MUSIC, film, and & FAM experiences are implemented.
- Checkout remains on Shopify through the branded checkout domain.
- Shopify navigation and product data hydrate through the Storefront API; the build also carries a
  first-paint catalog snapshot.
- Newsletter signup posts to the Cloudflare Worker, which uses the Shopify Admin API server-side.
- The now-playing Worker is live and healthy.

## Current operational priorities

1. Fix scheduled-build reliability when Shopify returns HTTP 429 during catalog and sitemap generation.
2. Install and test the corrected health-monitor LaunchAgent, then move to external monitoring when ready.
3. Confirm the old public Storefront token no longer has `unauthenticated_write_customers` permission.
4. Replace the oversized shipped-history `CODEX-BRIEF.md` with a compact current brief after preserving
   its history.
5. Add useful funnel, Shopify sales, and care-plan reporting so this becomes a measurable case study.
