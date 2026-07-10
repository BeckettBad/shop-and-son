# &son promotion plan, organic only (2026-07-10, day of launch)

No paid ad spend, per Ben's stance (validated in MARKETING-PLAN-2026-07-09.md, which owns
the channel strategy: email win-back first, list building, one collab, IG as the funnel).
This doc adds what LAUNCH DAY changes: the technical visibility layer and the free
distribution moves specific to the new site. Style: no em dashes.

## Part 1: the keyword answer (audited today)

Question asked: "do we have the right keywords?" Honest verdict: **we do not have wrong
keywords, we have almost no keyword surface at all.** Measured on the live site today:

- One title tag ("&son, independent design"), NO meta description, NO og/social tags,
  no server-rendered h1 or product text (content renders client-side).
- sitemap.xml is not real (it serves the homepage HTML via the SPA fallback).
- robots.txt is Cloudflare's managed default plus allow-all, points at no sitemap.
- Catalog, designer, and product views live at query-param URLs (/?collection=x,
  /?product=y). Google treats this as roughly ONE page.
- The old theme's /products/* and /collections/* pages carried whatever rankings the shop
  had (brand + designer names). Our 301s preserve that equity and hand it to pages Google
  cannot yet read deeply.

### The right keywords for this shop (curated boutique structure)

1. **Brand navigational:** shop and son, &son, and son nyc, shop and son soho. Must-win,
   at mild risk during any domain migration. The 301 map protects it; Search Console
   monitoring confirms it.
2. **Designer + stockist intent (the money tier):** "hender scheme nyc", "ancellm
   stockist", "kuon us", "[designer] new york". People searching a designer they already
   love plus a place to buy it. The shop stocks ~30 designers; each is a keyword cluster
   the old /collections/<designer> pages competed for. This is where curated boutiques
   actually win search.
3. **Product exact-name long tails:** driven by IG discovery ("norway socks sonny",
   "[product name]").
4. **Local:** menswear boutique soho, independent designer clothing nyc, japanese
   menswear nyc. Won mostly on the MAP PACK (Google Business Profile), not blue links.

## Part 2: technical fixes that unlock promotion (Phase AW, pipeline, ~1 phase)

Priority order, all free, all invisible to the design:

1. **Social/share tags (og:title, og:description, og:image, twitter card).** Today a
   shared link shows a bare URL with no image. Every promotion channel (IG DM, iMessage,
   email, Reddit) renders through these tags, this is as much marketing as SEO. One good
   og image (the stencil or storefront) changes every share.
2. **Meta description** (one strong sentence: independent designers, SoHo, the vibe).
3. **Canonical tag** and **real sitemap.xml** generated at build (home, policies,
   preorders, plus the collection/product URLs), robots.txt pointing at it.
4. Favicon: DONE 2026-07-10 (AV1, original "&" logo restored).

Then two operator registrations (free, ~20 min):
5. **Google Search Console:** verify domain, submit sitemap, watch the migration
   (old-URL 301 equity, coverage, brand queries). This is our only window into what
   Google thinks happened at cutover.
6. **Google Business Profile:** claim/refresh the 138 Sullivan St listing, point it at
   shopandson.com, current hours, fresh photos. Single highest-leverage local move;
   "menswear boutique soho" is decided here.
7. Bing Webmaster Tools (10 minutes, imports from GSC, small free traffic).

## Part 3: the promotion sequence (no ad spend)

Week 1 (launch week):
1. **Win-back email to old-site buyers** announcing the new home (the #1 move in
   MARKETING-PLAN, now with a reason to send). Requires og tags live first so the link
   unfurls beautifully. Blocked only on export/list hygiene, plan section already covers
   the safe way.
2. **IG launch moment:** post + story series walking the new site (the film, the
   catalog, now-playing). Update link-in-bio to shopandson.com. The site itself is
   content: an analog, custom-built storefront is a story other accounts re-share.
3. **Designer cross-promotion engine:** every stocked designer is a partner with an
   audience. DM/tag each designer whose collection page is live ("your page at &son",
   direct link via the new shareable URLs). Most re-share to their own followers. ~30
   designers = ~30 free distribution events, spread over weeks, zero dollars.

Week 2-4:
4. **Press/community pitch:** the story is "SoHo independent shop replaces Shopify
   template with a hand-built analog storefront." Pitch 3-5 menswear newsletters/blogs
   (the plan's earned-media section names the peer set). One hit outranks months of
   posting.
5. **Google Business Profile posts** (restocks, the in-store now-playing feature, events
   per the collab plan).
6. Reddit only where the marketing plan validated it (organic, non-promotional
   participation; the custom-site build itself fits r/shopify and web dev communities as
   a case study, which links back).

Ongoing (from MARKETING-PLAN, unchanged):
7. List building on-site (subscribe box live; AM worker will fix legacy-customer
   resubscribes), SMS insider list, one maker collab + recurring in-store night, zine and
   journal as the durable content engine.

## Part 4: the later SEO phase (bigger, post-stabilization)

Real crawlable routes: prerendered /collections/<designer> and /products/<handle> pages
with server-rendered text (designer name, product names, descriptions), canonicals from
the query-param views, sitemap from live catalog data at build. This is the step that
lets the designer-stockist keyword tier actually rank, and it slots into the existing
architecture without design changes (the pages exist for crawlers; humans keep the
current experience). Scope it as its own phase when ready.

## Sequencing summary

AV1 favicon (done) -> AW1 meta/og/sitemap (pipeline, awaiting go) -> operator: Search
Console + Business Profile + win-back email -> designer cross-promo drumbeat -> press
pitch -> later: prerendered SEO routes.
