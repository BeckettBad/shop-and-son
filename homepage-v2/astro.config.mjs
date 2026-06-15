// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// homepage-v2 — separate test build. Served at a sub-path off the Pages site:
// beckettbad.github.io/shop-and-son/homepage-v2/  (kept isolated from v1).
// `base` applies to every built asset/link; use src/lib/url.ts `withBase()` for
// runtime hrefs. Deploying this sub-path to Pages is a later promotion step.
export default defineConfig({
  site: 'https://beckettbad.github.io',
  base: '/shop-and-son/homepage-v2',
});
