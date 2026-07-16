// @ts-check
import { defineConfig } from 'astro/config';

const process = /** @type {{ env: Record<string, string | undefined> }} */ (
  /** @type {any} */ (globalThis).process
);

// https://astro.build/config
// Production is served at shopandson.com. GitHub Pages remains the deployment origin and preview.
// `base` applies to every built asset/link; use src/lib/url.ts `withBase()` for runtime hrefs.
// The deploy environment supplies PUBLIC_SITE_ORIGIN and PUBLIC_BASE_PATH for the custom domain.
export default defineConfig({
  site: process.env.PUBLIC_SITE_ORIGIN ?? 'https://beckettbad.github.io',
  base: process.env.PUBLIC_BASE_PATH ?? '/shop-and-son',
});
