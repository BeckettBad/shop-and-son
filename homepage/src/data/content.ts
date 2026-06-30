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

export interface NavLink {
  label: string;
  href: string;
  /** External links go out to Shopify and open with rel=noopener. */
  external?: boolean;
}

/** A primary nav item, optionally with a hover dropdown of sub-links. */
export interface NavGroup extends NavLink {
  children?: NavLink[];
}

export interface SiteConfig {
  brand: string;
  address: string;
  email: string;
  /** Store hours in America/New_York, 24h. Drives the live open/closed status. */
  hours: { openHour: number; closeHour: number };
  /** Base URL of the live Shopify store — where every "buy" link points. */
  shopUrl: string;
  /** Header navigation: primary items on the left, account/cart on the right. */
  nav: { left: NavGroup[]; right: NavLink[] };
}

const shop = (path: string) => `https://shopandson.com${path}`;

export const site: SiteConfig = {
  brand: "&son",
  address: "138 Sullivan Street, New York, NY 10012",
  email: "info@shopandson.com",
  hours: { openHour: 12, closeHour: 19 },
  shopUrl: "https://shopandson.com",
  nav: {
    left: [
      {
        label: "wear",
        href: shop("/collections/clothing"),
        external: true,
        children: [
          { label: "shop all", href: shop("/collections/clothing"), external: true },
          { label: "jackets / outerwear", href: shop("/collections/jackets-outerwear"), external: true },
          { label: "shirts with buttons / snaps", href: shop("/collections/shirts-with-buttons-snaps"), external: true },
          { label: "knitwear", href: shop("/collections/knitwear"), external: true },
          { label: "tees", href: shop("/collections/tees"), external: true },
          { label: "trousers", href: shop("/collections/trousers"), external: true },
          { label: "shorts", href: shop("/collections/shorts"), external: true },
          { label: "shoes & accessories", href: shop("/collections/accessories"), external: true },
          { label: "sunglasses", href: shop("/collections/sunglasses"), external: true },
          { label: "apothecary", href: shop("/collections/apothecary"), external: true },
          { label: "jewelry", href: shop("/collections/jewelry"), external: true },
          { label: "sale", href: shop("/collections/clothing-sale"), external: true },
        ],
      },
      {
        label: "house",
        href: shop("/collections/house"),
        external: true,
        children: [
          { label: "shop all", href: shop("/collections/house"), external: true },
          { label: "living", href: shop("/collections/house"), external: true },
          { label: "kitchen", href: shop("/collections/kitchen"), external: true },
          { label: "library", href: shop("/collections/library"), external: true },
          { label: "seating", href: shop("/collections/seating"), external: true },
          { label: "tables", href: shop("/collections/tables"), external: true },
          { label: "lighting", href: shop("/collections/lighting"), external: true },
          { label: "sale", href: shop("/collections/house-sale"), external: true },
        ],
      },
      // on-site: scrolls to the designer index block
      { label: "designers", href: "#clothing" },
    ],
    right: [
      { label: "account", href: shop("/account"), external: true },
      { label: "cart", href: shop("/cart"), external: true },
    ],
  },
};

/** A label/value pair on a swing tag or placard. */
export interface DetailRow {
  label: string;
  value: string;
  /** Render the value as an editioned "stamp" (e.g. 1 of 1). */
  stamp?: boolean;
}

/** Block 01 — hero landing overlay menu. */
export interface HeroMenuNestedItem {
  label: string;
  href?: string;
  collection?: string;
  collectionLabel?: string;
}

export interface HeroMenuSubItem {
  label: string;
  href?: string;
  collection?: string;
  collectionLabel?: string;
  /** Appended after label (e.g. "CATEGORIES |"). */
  suffix?: string;
  children?: HeroMenuNestedItem[];
}

export interface HeroMenuSection {
  label: string;
  items: HeroMenuSubItem[];
}

export const heroMenu: HeroMenuSection[] = [
  {
    label: "CLOTHES",
    items: [
      { label: "SHOP ALL", collection: "clothing", collectionLabel: "CLOTHES — SHOP ALL" },
      {
        label: "CATEGORIES",
        suffix: " |",
        children: [
          { label: "JACKETS / OUTERWEAR", collection: "jackets-outerwear", collectionLabel: "JACKETS / OUTERWEAR" },
          { label: "SHIRTS · BUTTONS / SNAPS", collection: "shirts-with-buttons-snaps", collectionLabel: "SHIRTS · BUTTONS / SNAPS" },
          { label: "KNITWEAR", collection: "knitwear", collectionLabel: "KNITWEAR" },
          { label: "TEES", collection: "tees", collectionLabel: "TEES" },
          { label: "TROUSERS", collection: "trousers", collectionLabel: "TROUSERS" },
          { label: "SHORTS", collection: "shorts", collectionLabel: "SHORTS" },
          { label: "SHOES & ACCESSORIES", collection: "accessories", collectionLabel: "SHOES & ACCESSORIES" },
          { label: "SUNGLASSES", collection: "sunglasses", collectionLabel: "SUNGLASSES" },
          { label: "APOTHECARY", collection: "apothecary", collectionLabel: "APOTHECARY" },
          { label: "JEWELRY", collection: "jewelry", collectionLabel: "JEWELRY" },
        ],
      },
      {
        label: "DESIGNERS",
        children: [
          { label: "11.11", collection: "11-11", collectionLabel: "11.11" },
          { label: "AN IRRATIONAL ELEMENT", collection: "an-irrational-element", collectionLabel: "AN IRRATIONAL ELEMENT" },
          { label: "ARCHIE", collection: "archie", collectionLabel: "ARCHIE" },
          { label: "AURORA", collection: "aurora", collectionLabel: "AURORA" },
          { label: "BINU BINU", collection: "binu-binu", collectionLabel: "BINU BINU" },
          { label: "CARTER YOUNG", collection: "carter-young", collectionLabel: "CARTER YOUNG" },
          { label: "FAIRLY NORMAL", collection: "fairly-normal", collectionLabel: "FAIRLY NORMAL" },
          { label: "HENDER SCHEME", collection: "hender-scheme", collectionLabel: "HENDER SCHEME" },
          { label: "HEREU", collection: "hereu", collectionLabel: "HEREU" },
          { label: "KUON", collection: "kuon", collectionLabel: "KUON" },
          { label: "MATSUFUJI", collection: "matsufuji", collectionLabel: "MATSUFUJI" },
          { label: "MONOSTEREO", collection: "monostereo", collectionLabel: "MONOSTEREO" },
          { label: "NEVER CURSED", collection: "never-cursed", collectionLabel: "NEVER CURSED" },
          { label: "OSHIN", collection: "oshin", collectionLabel: "OSHIN" },
          { label: "PARATODO", collection: "paratodo", collectionLabel: "PARATODO" },
          { label: "REFOMED", collection: "refomed", collectionLabel: "REFOMED" },
          { label: "RICE NINE TEN", collection: "rice-nine-ten", collectionLabel: "RICE NINE TEN" },
          { label: "SAGE NATION", collection: "sage-nation", collectionLabel: "SAGE NATION" },
          { label: "SAMUEL FALZONE", collection: "samuel-falzone", collectionLabel: "SAMUEL FALZONE" },
          { label: "SATTA", collection: "satta", collectionLabel: "SATTA" },
          { label: "SEVEN X SEVEN", collection: "seven-by-seven", collectionLabel: "SEVEN X SEVEN" },
          { label: "SILPHIUM", collection: "silphium", collectionLabel: "SILPHIUM" },
          { label: "SMALL TALK", collection: "small-talk", collectionLabel: "SMALL TALK" },
          { label: "SONNY", collection: "sonny", collectionLabel: "SONNY" },
          { label: "URU", collection: "uru", collectionLabel: "URU" },
          { label: "WILLIAM FREDERICK", collection: "william-frederick", collectionLabel: "WILLIAM FREDERICK" },
          { label: "XENIA TELUNTS", collection: "xenia-telunts", collectionLabel: "XENIA TELUNTS" },
          { label: "YAHAE", collection: "yahae-1", collectionLabel: "YAHAE" },
          { label: "YUKETEN", collection: "yuketen", collectionLabel: "YUKETEN" },
        ],
      },
    ],
  },
  {
    label: "OBJECTS",
    items: [
      { label: "SHOP ALL", collection: "house", collectionLabel: "OBJECTS — SHOP ALL" },
      { label: "LIVING", collection: "house", collectionLabel: "LIVING" },
      { label: "KITCHEN", collection: "kitchen", collectionLabel: "KITCHEN" },
      { label: "LIBRARY", collection: "library", collectionLabel: "LIBRARY" },
      { label: "SEATING", collection: "seating", collectionLabel: "SEATING" },
      { label: "TABLES", collection: "tables", collectionLabel: "TABLES" },
      { label: "LIGHTING", collection: "lighting", collectionLabel: "LIGHTING" },
      { label: "FURNITURE", collection: "furniture", collectionLabel: "FURNITURE" },
    ],
  },
  {
    label: "MUSIC",
    items: [
      { label: "& SON OFFICIAL PLAYLIST" },
      { label: "WILLIAM FREDERICK PLAYLIST" },
      { label: "SMALL TALK STUDIO PLAYLIST" },
    ],
  },
  {
    label: "& FAM",
    items: [
      { label: "SMALL TALK STUDIO INTERVIEW" },
      { label: "WILLIAM FREDERICK INTERVIEW" },
      { label: "LIV RYAN INTERVIEW" },
      { label: "ETC..." },
    ],
  },
];

/** Block 01 — about. The right side renders as a letterpress business card. */
export const about = {
  kicker: "01 — about",
  title: "& son",
  tagline: "independent design · sourced worldwide",
  /** Card detail rows — label / value, value may contain HTML for line breaks. */
  card: [
    { label: "studio", value: "138 sullivan street<br>new york · ny 10012" },
    { label: "contact", value: '<a href="mailto:info@shopandson.com">info@shopandson.com</a>' },
    { label: "hours", value: '<span id="status">open now</span>' },
  ] as { label: string; value: string }[],
  /** Footer line on the card. */
  cardFoot:
    'mostly <a href="#clothing">clothes</a> · some <a href="#objects">objects</a> · a little <a href="#music">music</a>',
  /** Left-panel video (web-optimized 720p H.264 + AAC, ~7 MB). */
  video: { src: "/videos/about.mp4", poster: "/images/blocks/about.jpg" },
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
