# &son — homepage v3 concept

Status: **in planning** (consultation phase). This file is the source of truth for
the new homepage vision. Reference mockups live in `homepage-v3/design/`.

## Feel
Simple, analog, brutalist. Extreme negative space, warm paper light, one quiet
moving element. The opposite of busy — confidence through restraint.

---

## Page 01 — Opening / landing  ·  ref: `design/01-landing-opening.png`

**The whole page is two layers. Build the overlay only; the scene is the video.**

### Layer 1 — full-screen background video (the entire visual)
- Asset: **the existing v2 hero loop** `new-about-homepage.mp4` (1920×1080, ~17.7s,
  currently at `homepage-v2/public/videos/new-about-homepage.mp4`).
- That video *is* the scene in the mockup: pale cream wall, white single-line
  drawing of the Sullivan St storefront (stoop, windows, fire escape), the centered
  **&son** wordmark, small line-art stools bottom-right, and a soft tree-branch
  shadow drifting across it. **Do not recreate these as separate assets — they are
  inside the video.**
- Plays: autoplay, muted, loop, `playsinline`, full viewport, `object-fit: cover`.
- The page background is `#EFEBE2` (same cream as the video) so video → page edges
  blend with no visible seam / letterboxing.

### Layer 2 — text overlay (the only thing built in HTML/CSS)
Two blocks, both left-aligned on a shared left gutter at **~6vw (measured 5.7%)**.

**Top-left list** — starts ~10.7% from top. Uppercase. **The trailing ` +` marks a
DROPDOWN, not a link.** Clicking a `+` item expands it *in place on the homepage* to
reveal its sub-section headers; clicking a sub-section header then navigates to that
subsection page. The line WITHOUT a `+` (`& SON CHRONICLE`) is not a dropdown.
```
CLOTHES +        ▸ jackets / outerwear · shirts with buttons / snaps · knitwear ·
                   tees · trousers · shorts · shoes        (each → its subsection page)
OBJECTS +        ▸ (sub-sections TBD — fill later)
MUSIC +          ▸ (sub-sections TBD — fill later)
VINTAGE +        ▸ (sub-sections TBD — fill later)
PREORDERS +      ▸ (sub-sections TBD — fill later)   ← NEW, sits directly under VINTAGE
& FAM +          ▸ (sub-sections TBD — fill later)
& SON CHRONICLE    (no +, no dropdown — TBD)
```
**Note:** `PREORDERS +` is an addition not present in `design/01-landing-opening.png`,
so the built list has **7 lines** (6 with `+`, plus `& SON CHRONICLE`). Order above is
the source of truth, overriding the mockup's line count.

Interaction notes: expand/collapse in place (sub-items appear under the parent in the
same text style, indented); only the sub-section headers are navigation. Likely the
`+` toggles to `–` (or similar) when open. Exact reveal animation TBD at build.

**Bottom-left info** — ends ~10.2% from bottom. Sentence/lowercase, three groups
separated by a blank line:
```
Mostly clothes,
some objects,
and a little music

138 sullivan st,
new york, ny 10012

contact:
info@shopandson.com
```

### Type & color
- Font: **Helvetica Neue, Light (300)** — _subject to change_. A neo-grotesque,
  deliberately NOT v2's Roboto Mono / EB Garamond.
  Stack: `'Helvetica Neue', Helvetica, Arial, sans-serif`, `font-weight: 300`.
- Text color: dark warm grey, near-black (~`#2E2A26`); to be color-matched to the mockup at build.
- Background: `#EFEBE2`.
- No header bar, no center logo, no buttons, no scroll hint — chrome-less by design.

### Faithfulness rule (per the brief)
> "Everything should perfectly resemble the image — spacing, text, order, everything."

So at build time, positions/sizes get verified against `design/01-landing-opening.png`
with a screenshot diff, not approximated.

---

## Resolved decisions
1. **Font** — Helvetica Neue Light (subject to change).
2. **Top-left `+` items are dropdowns** (expand in place on the homepage), revealing
   sub-section headers. Only the sub-section headers navigate — to that subsection's
   page, where items are "categorized and listed for online sale." `& SON CHRONICLE`
   (no `+`) is not a dropdown.
3. **The landing is the whole homepage** — a standalone splash, no scroll, no further
   sections on this page. **All remaining work is in the sub-section pages** reached
   through the dropdowns. So this page is small; the subsection pages are the project.

## Site architecture (two tiers)
```
/  landing — video + two text overlays; top-left list doubles as dropdown nav

  CLOTHES +    ▸ jackets / outerwear      → /clothes/jackets-outerwear
               ▸ shirts with buttons / snaps → /clothes/shirts
               ▸ knitwear                 → /clothes/knitwear
               ▸ tees                     → /clothes/tees
               ▸ trousers                 → /clothes/trousers
               ▸ shorts                   → /clothes/shorts
               ▸ shoes                    → /clothes/shoes
  OBJECTS +    ▸ (sub-sections TBD)        each → /objects/<subsection>
  MUSIC +      ▸ (sub-sections TBD)        each → /music/<subsection>
  VINTAGE +    ▸ (sub-sections TBD)        each → /vintage/<subsection>
  PREORDERS +  ▸ (sub-sections TBD)        each → /preorders/<subsection>   [NEW]
  & FAM +      ▸ (sub-sections TBD)        each → /fam/<subsection>
  & SON CHRONICLE   (no +, no dropdown — TBD)

subsection page  — products categorized & listed for online sale  (THE real work)
```
Route shape (`/clothes/jackets-outerwear` vs flat vs Shopify-collection links) TBD.
Slugs above are provisional. Note: `PREORDERS` likely ties to the existing pre-order
site at `public/preorders/` — to confirm later.

## Sub-section pages — to design next  (where the real work is)
Each subsection page lists products for online sale. Before building we need, per
category: its list of sub-sections, then per subsection: layout/mockup, how items are
grouped, and the buy mechanism.

### Open questions for the sub-pages
- **Sub-section lists** — the headers each `+` dropdown reveals.
  - CLOTHES + → ✅ provided (jackets/outerwear, shirts w/ buttons/snaps, knitwear,
    tees, trousers, shorts, shoes).
  - OBJECTS +, MUSIC +, VINTAGE +, PREORDERS +, & FAM + → still TBD (fill later).
- **"Online sale" mechanism** — keep the established model (custom front-end that
  reads products from **Shopify** and sends "buy" to Shopify checkout)? Or a different
  commerce setup? This decides the whole data/cart architecture.
- **`& FAM`** — what is this page? (the designer roster / the people & family behind
  the brand / a community page?)
- **`& SON CHRONICLE`** — what is it and is it clickable? (editorial journal /
  newsletter / press?) It has no `+`, so it behaves differently from the categories.
- **Mockups** — do you have design mockups for each sub-page (like the landing), or
  should we design them together?

_Sub-page specs get added here as mockups/descriptions arrive in `design/`._
