# &son

The editorial front-end for [shopandson.com](https://shopandson.com) — an analog,
print-inspired homepage plus the preorders experience, in one repo.

**Model:** custom-coded front-end, Shopify checkout. We render an expressive,
hand-built site and read product data from Shopify for display; the cart and
checkout happen on the live Shopify store. Every "buy" link points to Shopify.

## Stack

- **[Astro](https://astro.build)** (v6) — component-based, content-first, static output.
- Vanilla CSS + JS for the interactions (dusk/dawn, hover swing-tags, the woofer,
  the vault flashlight). No framework lock-in.
- **Shopify Storefront API** (read-only) for live product data — see `src/lib/shopify.ts`.

## Structure

```
src/
├── components/
│   ├── TopBar.astro          nav + live clock + dusk/index toggles
│   ├── IndexOverlay.astro    the "+ index" running catalog
│   └── blocks/               the five homepage blocks
│       ├── About.astro
│       ├── Clothing.astro    designer roster (→ Shopify collections)
│       ├── Objects.astro
│       ├── Music.astro       & son radio + in-view woofer
│       └── Vault.astro       cursor-tracking flashlight
├── data/content.ts           editorial copy + curation (the editable layer)
├── lib/shopify.ts            read-only Storefront API client (env-gated)
├── layouts/Base.astro        page shell, fonts, global UI scripts
└── pages/index.astro         composes the blocks
public/
├── images/blocks/            homepage photography
└── preorders/                self-contained preorders site (Drop 01)
reference/                     original mockup + phase-2 PDF (design reference)
```

**Editing content:** words and curation live in `src/data/content.ts`. Live
products/photos/prices come from Shopify once configured — the owner's normal
"add a product in Shopify admin" flow surfaces them here, no code changes.

## Develop

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # → ./dist
npm run preview      # serve the build
npm run astro check  # type-check
```

## Branch workflow

Two long-lived branches, mirroring the preorders repo:

- **`dev`** — where features are built and tested **locally** (`npm run dev`,
  `npm run build`, `npm run astro check`). Pushing `dev` does **not** deploy.
- **`main`** — production. The GitHub Actions workflow builds and deploys to
  GitHub Pages **only on push to `main`**.

```sh
git checkout dev                 # work here
# ...edit, then verify locally...
npm run astro check && npm run build
git add -A && git commit -m "..."
git push origin dev              # safe — no deploy

# when it's verified and ready to ship:
git checkout main
git merge dev
git push origin main             # → builds & deploys to Pages
```

## Shopify

Copy `.env.example` to `.env` and fill in your Storefront API token. Until then
the site builds and renders from `src/data/content.ts`. See `src/lib/shopify.ts`
for the data shape and how curatorial fields map to Shopify metafields
(`editorial` namespace).

## Notes

- `public/preorders/` is the migrated [BeckettBad/shop-sons](https://github.com/BeckettBad/shop-sons)
  site, served as-is at `/preorders/` and linked from the top nav. It includes a
  ~43 MB video (`videos/piece.mp4`); consider Git LFS if the repo grows.
