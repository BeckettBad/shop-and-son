// @ts-check
import { defineConfig } from 'astro/config';

const process = /** @type {{ env: Record<string, string | undefined> }} */ (
  /** @type {any} */ (globalThis).process
);

// https://astro.build/config
// This is THE homepage — served at the Pages root for the repo:
// beckettbad.github.io/shop-and-son/  (earlier generations retired/archived).
// `base` applies to every built asset/link; use src/lib/url.ts `withBase()` for
// runtime hrefs. The pre-order site is bundled at public/preorders → /shop-and-son/preorders/.
export default defineConfig({
  site: process.env.PUBLIC_SITE_ORIGIN ?? 'https://beckettbad.github.io',
  base: process.env.PUBLIC_BASE_PATH ?? '/shop-and-son',
});
