/**
 * &son — editorial content.
 *
 * This is the single source of truth for the homepage's *words and curation*:
 * copy, designer roster, ledger entries, tracklist, the index. It used to be
 * hardcoded into the markup; pulling it here is what makes the page editable
 * without touching components.
 *
 * Commerce data (live products, prices, photos, inventory) comes from Shopify
 * via `src/lib/shopify.ts`. When that's wired, the owner's normal "add a product
 * in Shopify admin" workflow flows onto the page automatically, and the poetic
 * per-product fields (swing-tag copy, "expected to age") ride along as Shopify
 * metafields. The types below are intentionally shaped to receive that data.
 */

export interface SiteConfig {
  brand: string;
  address: string;
  email: string;
  /** Store hours in America/New_York, 24h. Drives the live open/closed status. */
  hours: { openHour: number; closeHour: number };
  /** Base URL of the live Shopify store — where every "buy" link points. */
  shopUrl: string;
  /** Top-bar navigation. `external` links go out to Shopify; others are on-site. */
  nav: { label: string; href: string; external?: boolean }[];
}

export const site: SiteConfig = {
  brand: "&son",
  address: "138 Sullivan Street, New York, NY 10012",
  email: "info@shopandson.com",
  hours: { openHour: 12, closeHour: 19 },
  shopUrl: "https://shopandson.com",
  nav: [
    { label: "wear", href: "https://shopandson.com/collections/wear", external: true },
    { label: "house", href: "https://shopandson.com/collections/house", external: true },
    { label: "designers", href: "#clothing" },
    { label: "preorders", href: "/preorders/" },
  ],
};

/** A label/value pair on a swing tag or placard. */
export interface DetailRow {
  label: string;
  value: string;
  /** Render the value as an editioned "stamp" (e.g. 1 of 1). */
  stamp?: boolean;
}

/** Block 01 — about. */
export const about = {
  kicker: "01 — about",
  title: "& son",
  /** HTML allowed for the inline links. */
  ledeHtml:
    'independent design, sourced worldwide.<br>mostly <a href="#clothing">clothes</a>, some <a href="#objects">objects</a>, and a little <a href="#music">music</a>.',
  hotspots: [
    { href: "#clothing", label: "→ the clothing", left: "38%", top: "46%", width: "20%", height: "26%" },
    { href: "#vault", label: "→ step inside", left: "60%", top: "50%", width: "16%", height: "34%" },
  ],
};

/** Block 02 — clothing. The designer roster maps to Shopify vendors/collections. */
export const clothing = {
  kicker: "02 — clothing",
  title: "designers",
  rackHint: "hover a garment — pull its tag",
  /** Featured garment shown on the swing tag (later: a Shopify product + metafields). */
  featured: {
    name: "sunday best",
    cloth: "moleskine · 380 gsm",
    details: [
      { label: "shell", value: "cotton moleskine, sourced from japan" },
      { label: "silhouette", value: "boxy blouson · dropped shoulder" },
      { label: "care", value: "cold wash · hang dry · expected to age" },
    ] as DetailRow[],
  },
  /** Designer names — each will link to its Shopify collection. */
  designers: [
    "Ancellm", "An Irrational Element", "Archie", "Blanc YM", "Carter Young",
    "Confect", "De Dam Foundation", "Document", "Factors", "Fairly Normal",
    "Graziano & Gutiérrez", "Hender Scheme", "Matsufuji", "Mittan", "Never Cursed",
    "Oshin", "Paratodo", "Polyploid", "Refomed", "Rice Nine Ten",
    "Sage Nation", "Sonny", "Soshi Otsuki", "Uru", "William Ellery",
    "William Frederick", "Yahae", "Yleve",
  ],
};

/** Block 03 — objects. */
export const objects = {
  kicker: "03 — objects",
  title: "objects",
  rackHint: "hover a piece — read its placard",
  meta: "a museum vitrine: each piece singular, stamped when gone.",
  featured: {
    name: "stoneware cup",
    cloth: "shino takeda · nyc",
    details: [
      { label: "material", value: "hand-glazed stoneware" },
      { label: "edition", value: "1 of 1", stamp: true },
    ] as DetailRow[],
  },
  /** Ledger of makers. `edition` is the right-hand note. */
  ledger: [
    { maker: "Shino Takeda", edition: "3 pieces" },
    { maker: "Danny's Mud Shop", edition: "restock" },
    { maker: "Mark Patrick Harrington", edition: "1 of 1" },
    { maker: "Binu Binu", edition: "soap" },
    { maker: "Miscellaneous", edition: "—" },
  ],
};

/** Block 04 — music. */
export const music = {
  kicker: "04 — music",
  title: "& son radio",
  rackHint: "the woofer moves to what's playing in-store",
  nowPlaying: {
    label: "NOW PLAYING · IN STORE",
    time: "0:00 / 3:48",
    song: "Moanin'",
    artist: "Art Blakey & The Jazz Messengers",
  },
  tracks: [
    "official playlist",
    "guest: small talk studio",
    "guest: oshin",
    "guest: william ellery",
  ],
  dispatch:
    "dispatch — “sunday afternoon, w. frederick on the booth: a lot of brazilian 45s and one very loud bossa misfire.”",
};

/** Block 05 — vintage / the vault. */
export const vault = {
  kicker: "05 — vintage · present / past",
  title: "the vault",
  neon: "Vintage Vault",
  rackHint: "move your cursor — the flashlight finds the racks",
  key: "& son · lower level",
  ledeHtml: "clothes · books · records<br>sourced by Case Study",
  badge: "in store only",
  meta: "the site's archive — browsable, unbuyable. you have to come downstairs.",
};

/** The "+ index" overlay: one running catalog, sections interleaved with entries. */
export interface CatalogEntry {
  section?: string; // a section header row
  num?: string;
  text?: string;
}

export const catalog = {
  title: "the index",
  sub: "one running catalog — sections, products & dispatches interleaved · + sort   + filter",
  entries: [
    { section: "01 — about" },
    { num: "01", text: "& son — independent design" },
    { section: "02 — clothing" },
    { num: "02", text: "sunday best · moleskine 380gsm" },
    { num: "03", text: "atelier shirt · brown mini kelsch" },
    { num: "04", text: "gardening trousers · herringbone v2.0" },
    { num: "05", text: "dispatch — sourcing trip, kyoto" },
    { section: "03 — objects" },
    { num: "06", text: "shino takeda · stoneware cup · 1/1" },
    { num: "07", text: "danny's mud shop · vase" },
    { section: "04 — music" },
    { num: "08", text: "& son radio · official playlist" },
    { num: "09", text: "guest mix — oshin" },
    { num: "10", text: "dispatch — saturday booth notes" },
    { section: "05 — vintage" },
    { num: "11", text: "vault · case study · in-store only" },
  ] as CatalogEntry[],
};
