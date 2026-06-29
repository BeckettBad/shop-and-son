# &son — agent / AI context

High-end, curated clothing store. The web presence is an **analog, editorial,
brutalist** custom front-end for the live Shopify store at **shopandson.com**.
Custom-coded front-end + Shopify checkout (every "buy" goes out to Shopify).

## ⭐ The project: `homepage/`
**`homepage/` is THE homepage — the live site**, served at
`beckettbad.github.io/shop-and-son/`. All active work happens here. The operator
(Beckett) refers to it simply as **"the homepage."**

> **Edits to `homepage/` go LIVE.** On push to `main`, the GitHub Pages workflow
> builds `homepage/` and deploys it. So changes are real: build on `dev`, the
> operator verifies, and **only the operator approves the merge `dev` → `main`**
> that ships it. The dev → verify → main gate is the safety net — respect it.

**Before writing code, read the active brief:** `homepage/CODEX-BRIEF.md` — what
the operator wants built right now. The operator drives every edit directly;
their written instructions are the spec.

## Repo layout
- **`homepage/`** — THE homepage. The live site. ACTIVE work happens here.
  Self-contained Astro project (its own `src/`, `public/`, `package.json`).
- **`public/preorders/`** (repo root) — the pre-order site's single source,
  bundled into the deploy at `/preorders/`. Shared; don't duplicate or break it.
- `.github/workflows/deploy.yml` — builds `homepage/` and publishes to GitHub
  Pages on push to `main` (also copies `public/preorders` into the output).
- **`archive/`** — out of scope, **gitignored, reference only**. Holds retired
  generations (the old root v1 project, the shelved `homepage-v3` build), the raw
  asset masters (`archive/assets-src/`), design references (`archive/reference/`),
  and scratch docs (`archive/docs/`). Kept on disk so we can draw on it later.
  **Do not edit it or wire the live build to it.** To reuse an asset, copy it
  into `homepage/` (or `public/`).

## Stack & conventions
- **Astro v6**, static output, vanilla CSS/JS (no heavy framework).
- Base path is `/shop-and-son` (set in `homepage/astro.config.mjs`). Base-path-
  aware URLs go through the `withBase()` helper in `homepage/src/lib/url.ts`.
- Design language: keep the existing homepage skin (its fonts, colors, the block
  layouts) consistent unless the operator's brief says otherwise.
- Live product data comes from the **Shopify Storefront API** (read-only); every
  "buy" sends the customer to Shopify for cart + checkout.

## Credentials — handle securely
- Keys live in `homepage/.env` (gitignored). Never print, commit, screenshot, or
  paste the values; refer to them only by variable name.
- `SHOPIFY_STOREFRONT_API_TOKEN` — public, read-only; front-end/product data.
- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` — Admin credentials: private,
  server/build-time only, never in a built page. Prefer the Storefront token.

## Build / run (this machine)
- Node is Homebrew's at **`/opt/homebrew/bin`** and is NOT on the default PATH.
  Fix once: `echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile`,
  then reopen the terminal. Verify with `node -v` (need ≥ 22.12).
- Run it: `cd homepage && npm install && npm run dev`.

## Git workflow
- Work on **`dev`**. Commit known-good states there; `git push origin dev` is
  safe — it does **not** deploy.
- **Merging `dev` → `main` deploys the live site.** Never do it on your own —
  wait for the operator's explicit go-ahead after they verify on `dev`.
- `git checkout dev` after any merge.

## Agent pairing & the build loop (Claude orchestrates · Codex codes)
We run two agents side by side in tmux (`./dev-agents.sh` → Claude on top, Codex
on the bottom), both opened in `homepage/`. `CLAUDE.md` and `AGENTS.md` are
identical copies so both agents share these rules. The panes cannot message each
other — the **operator relays** between them, and **`homepage/CODEX-BRIEF.md`**
is the shared hand-off file.

- **Roles.**
  - **Claude = orchestrator + style/structure reviewer.** Claude takes the
    operator's edit instruction, confirms the intent and that the style and
    structure of the change are correct, decides how to slice the work, and
    writes the brief into `homepage/CODEX-BRIEF.md`. Detailed for harder coding
    tasks; terse for one-liners. Claude does NOT normally write production code —
    it directs and reviews. After Codex implements, Claude reviews the diff
    against the operator's instruction.
  - **Codex = the coder / implementer.** Codex reads the active brief in
    `homepage/CODEX-BRIEF.md`, implements it precisely inside `homepage/` on
    `dev`, runs the verify steps until green, makes one focused commit per
    change, and appends a short status entry to the brief's log.

- **The loop, every edit:**
  1. Operator gives Claude the edit instruction.
  2. Claude confirms intent + style/structure, then writes/updates the brief in
     `homepage/CODEX-BRIEF.md`.
  3. Operator tells Codex to "implement the brief."
  4. Codex implements on `dev`, runs `npm run build` **and** `npx astro check`
     until both are green, commits (one change per commit), and logs status.
  5. Claude reviews Codex's diff for style/structure correctness and flags
     anything off.
  6. Operator verifies locally (`npm run dev`) and, when satisfied, approves the
     merge `dev` → `main`, which ships it live.

- **Scope every change.** Work only inside `homepage/`. Don't edit, break, or
  rely on `archive/` for the live build, and don't casually change
  `public/preorders/` (it ships as-is). State the scope boundary in the brief.
- **Don't break existing functionality.** Preserve the homepage's design
  language and existing behavior unless the brief says to change it. No
  instructional or internal text on the live page.
- **Verify before declaring done.** From `homepage/`, run `npm run build`
  **and** `npx astro check`, and fix until both are green. (There is no
  mockup-comparison step — the operator's instruction is the spec, and the
  operator does the visual verification on `dev`.)
- **Match effort to risk.** Detailed brief + careful review for risky/visual
  work; for true one-liners, a terse brief is fine.
- **Git is the safety net.** Commit a known-good state before each task; one
  change per commit; review the diff before keeping it. Work on `dev`; only the
  operator approves `dev` → `main`.
