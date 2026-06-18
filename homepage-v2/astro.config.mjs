// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// This is now THE site — served at the Pages root for the repo:
// beckettbad.github.io/shop-and-son/  (v1 retired; v2 promoted to root).
// `base` applies to every built asset/link; use src/lib/url.ts `withBase()` for
// runtime hrefs. The pre-order site is bundled at public/preorders → /shop-and-son/preorders/.
export default defineConfig({
  site: 'https://beckettbad.github.io',
  base: '/shop-and-son',
});
