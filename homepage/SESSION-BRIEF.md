# Session brief — &son homepage

Paste this into the Claude (top) and Codex (bottom) panes at the start of a
session so both agents share the same picture. Full standing rules live in
`CLAUDE.md` / `AGENTS.md`; this is the "what we're doing right now."

## Where we're building
`homepage/` is the live site at `shopandson.com`. The GitHub Pages URL is the deployment origin and
preview. Work only inside `homepage/`. Build on
`dev`; `git push origin dev` does not deploy. **Merging `dev` → `main` deploys
live** — only after the operator verifies and approves.

## How we work (Claude orchestrates · Codex codes)
The operator drives every edit directly — their instructions are the spec.
Claude turns each instruction into a brief in `homepage/CODEX-BRIEF.md` and
reviews the result; Codex implements it on `dev`, verifies, and commits. Full
loop and roles live in `CLAUDE.md` / `AGENTS.md`. There is **no
compare-to-mockup step**.

## Scope & guardrails
- Edit only `homepage/`. Don't touch `archive/` (retired/reference, gitignored)
  or root `public/preorders/` (ships as-is).
- Preserve the homepage's existing design language and behavior unless the brief
  says to change it. No instructional/internal text on the live page.

## The arc (where this is heading)
1. **Custom front-end, Shopify checkout.** Read live product data from
   shopandson.com via the Shopify **Storefront API**; every "buy" goes to
   Shopify for cart + checkout.
2. **Product / category pages** backed by Storefront API data.
3. **Backend / checkout config** — confirm the buy → Shopify handoff end to end.

## Credentials — handle securely
- Keys live in `homepage/.env` (gitignored). Never print, commit, screenshot, or
  paste the values; refer to them only by variable name.
- `SHOPIFY_STOREFRONT_API_TOKEN` — public, read-only (front-end/product data).
- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` — Admin: private, build-time only.

## Definition of done (every change)
From `homepage/`: `npm run build` **and** `npx astro check` green. Claude reviews
Codex's diff against the operator's instruction; the operator verifies on `dev`
before approving a merge to `main`.
