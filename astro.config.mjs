// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Deployed to GitHub Pages as a project site: beckettbad.github.io/shop-and-son/
// `base` is applied to every built asset/link; use src/lib/url.ts `withBase()`
// for runtime hrefs. When this moves to a custom domain at the root, drop `base`.
export default defineConfig({
  site: 'https://beckettbad.github.io',
  base: '/shop-and-son',
});
