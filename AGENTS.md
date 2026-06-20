# &son — agent / AI context

High-end, curated clothing store. The web presence is an **analog, editorial,
brutalist** custom front-end for the live Shopify store at **shopandson.com**.
Custom-coded front-end + Shopify checkout (every "buy" goes out to Shopify).

## ⭐ What we are building RIGHT NOW
A brand-new homepage, **`homepage-v3/`**, that will replace the current site.

**Before writing any code, read:**
1. `homepage-v3/CONCEPT.md` — the full, authoritative spec for v3 (the source of truth).
2. `homepage-v3/design/` — the visual mockups. `01-landing-opening.png` is the landing.

The landing must **perfectly resemble** `design/01-landing-opening.png` — spacing,
text, order, everything. In short: it's a **full-screen looping background video**
(the existing `new-about-homepage.mp4`) + **two text overlays** (top-left nav list,
bottom-left store info). The top-left `+` items are **dropdowns** that expand in place
to reveal sub-section links. Font: **Helvetica Neue Light**. See CONCEPT.md for exact
positions, colors, the dropdown model, and the per-category sub-section lists.

## Repo layout (one repo, multiple site generations)
- **`homepage-v3/`** — the NEW homepage we're building. ACTIVE work happens here.
- **`homepage-v2/`** — the CURRENT live site (deployed at beckettbad.github.io/shop-and-son/).
  Still live until v3 launches. **Do not break or edit it while building v3.**
- root **`src/`**, root `astro.config.mjs`/`package.json` — **retired v1**. Ignore.
- **`public/preorders/`** (repo root) — the pre-order site's single source, bundled
  into the deploy at `/preorders/`. Shared; don't duplicate.
- `.github/workflows/deploy.yml` — builds `homepage-v2/` and publishes to GitHub Pages
  on push to `main`. **Leave it pointing at v2 until v3 is ready to launch.**

## Stack & conventions
- **Astro v6**, static output, vanilla CSS/JS (no heavy framework).
- Base-path-aware URLs go through a `withBase()` helper (see how v2 does it in
  `homepage-v2/src/lib/url.ts`) — only relevant once v3 gets a deploy base.
- v3 is a **fresh design**: Helvetica Neue Light, warm cream `#EFEBE2`, near-black
  text. It does NOT inherit v2's mono/serif skin.

## Build / run (this machine)
- Node is Homebrew's at **`/opt/homebrew/bin`** and is NOT on the default PATH.
  Fix once: `echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile` then
  reopen the terminal. Verify with `node -v` (need ≥ 22.12).
- Run a project: `cd homepage-v3 && npm install && npm run dev`.

## Git workflow
- Work on **`dev`**; merge to **`main`** to deploy. `git checkout dev` after merges.
- Committing `homepage-v3/` to dev/main is **safe** — it does NOT change the live site,
  because the deploy only builds `homepage-v2/` until we repoint it at launch.

## Launch (later, when v3 is ready)
Set `base: '/shop-and-son'` in `homepage-v3/astro.config.mjs`, repoint
`.github/workflows/deploy.yml` from `homepage-v2` → `homepage-v3`, merge to `main`.
v2 stays in the repo + under the `homepage-v2-live` tag for reference.
