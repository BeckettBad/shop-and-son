/**
 * &son — live homepage content.
 *
 * Live menu seed: `heroMenu`, hydrated at runtime from Shopify Navigation
 * `main-menu`; new designer collections are added via Shopify admin Navigation,
 * not here.
 */

export const site = {
  brand: "&son",
  address: "138 Sullivan Street, New York, NY 10012",
  email: "info@shopandson.com",
  hours: { openHour: 11, closeHour: 19 },
};

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
  nowPlaying?: boolean;
  /** Appended after label (e.g. "CATEGORIES |"). */
  suffix?: string;
  children?: HeroMenuNestedItem[];
}

export interface HeroMenuSection {
  label: string;
  preorder?: boolean;
  fam?: boolean;
  music?: boolean;
  items: HeroMenuSubItem[];
}

export const heroMenu: HeroMenuSection[] = [
  {
    label: "CLOTHES",
    items: [
      {
        label: "CATEGORIES",
        children: [
          { label: "SHOP ALL", collection: "clothing-1", collectionLabel: "CLOTHES — SHOP ALL" },
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
          { label: "ANCELLM", collection: "ancellm", collectionLabel: "ANCELLM" },
          { label: "AN IRRATIONAL ELEMENT", collection: "an-irrational-element", collectionLabel: "AN IRRATIONAL ELEMENT" },
          { label: "ARCHIE", collection: "archie", collectionLabel: "ARCHIE" },
          { label: "BLANC YM", collection: "blanc-ym", collectionLabel: "BLANC YM" },
          { label: "CARTER YOUNG", collection: "carter-young", collectionLabel: "CARTER YOUNG" },
          { label: "CONFECT", collection: "confect", collectionLabel: "CONFECT" },
          { label: "DE DAM FOUNDATION", collection: "de-dam-foundation", collectionLabel: "DE DAM FOUNDATION" },
          { label: "DOCUMENT", collection: "document", collectionLabel: "DOCUMENT" },
          { label: "FACTORS", collection: "factors", collectionLabel: "FACTORS" },
          { label: "FAIRLY NORMAL", collection: "fairly-normal", collectionLabel: "FAIRLY NORMAL" },
          { label: "GRAZIANO & GUTIÉRREZ", collection: "graziano-gutierrez", collectionLabel: "GRAZIANO & GUTIÉRREZ" },
          { label: "HENDER SCHEME", collection: "hender-scheme-1", collectionLabel: "HENDER SCHEME" },
          { label: "MATSUFUJI", collection: "matsufuji", collectionLabel: "MATSUFUJI" },
          { label: "MITTAN", collection: "mittan", collectionLabel: "MITTAN" },
          { label: "MONOSTEREO", collection: "monostereo", collectionLabel: "MONOSTEREO" },
          { label: "NEVER CURSED", collection: "never-cursed", collectionLabel: "NEVER CURSED" },
          { label: "OSHIN", collection: "oshin", collectionLabel: "OSHIN" },
          { label: "PARATODO", collection: "paratodo", collectionLabel: "PARATODO" },
          { label: "POLYPLOID", collection: "polyploid", collectionLabel: "POLYPLOID" },
          { label: "REFOMED", collection: "refomed", collectionLabel: "REFOMED" },
          { label: "RICE NINE TEN", collection: "rice-nine-ten", collectionLabel: "RICE NINE TEN" },
          { label: "SAGE NATION", collection: "sage-nation", collectionLabel: "SAGE NATION" },
          { label: "SMALL TALK", collection: "small-talk", collectionLabel: "SMALL TALK" },
          { label: "SILPHIUM", collection: "silphium-1", collectionLabel: "SILPHIUM" },
          { label: "SONNY", collection: "sonny", collectionLabel: "SONNY" },
          { label: "SOSHIOTSUKI", collection: "soshi-otsuki", collectionLabel: "SOSHIOTSUKI" },
          { label: "SUB SUN", collection: "sub-sun", collectionLabel: "SUB SUN" },
          { label: "URU", collection: "uru", collectionLabel: "URU" },
          { label: "WILLIAM ELLERY", collection: "william-ellery", collectionLabel: "WILLIAM ELLERY" },
          { label: "WILLIAM FREDERICK", collection: "william-frederick", collectionLabel: "WILLIAM FREDERICK" },
          { label: "Y — YLEVE", collection: "y-by-yleve", collectionLabel: "Y — YLEVE" },
          { label: "YAHAE", collection: "yahae-1", collectionLabel: "YAHAE" },
        ],
      },
    ],
  },
  {
    label: "OBJECTS",
    items: [
      { label: "SHOP ALL", collection: "house-1", collectionLabel: "OBJECTS — SHOP ALL" },
      { label: "LIVING", collection: "house", collectionLabel: "LIVING" },
      { label: "KITCHEN", collection: "kitchen", collectionLabel: "KITCHEN" },
      { label: "LIBRARY", collection: "library", collectionLabel: "LIBRARY" },
      { label: "SEATING", collection: "seating", collectionLabel: "SEATING" },
      // hidden — no current listings (re-enable when restocked): { label: "TABLES", collection: "tables", collectionLabel: "TABLES" },
      // hidden — no current listings (re-enable when restocked): { label: "LIGHTING", collection: "lighting", collectionLabel: "LIGHTING" },
      // hidden — no current listings (re-enable when restocked): { label: "FURNITURE", collection: "furniture", collectionLabel: "FURNITURE" },
    ],
  },
  {
    label: "MUSIC",
    music: true,
    items: [
      { label: "& SON OFFICIAL PLAYLIST", href: "https://open.spotify.com/playlist/6MD3a8wIY0582I3iWIngqE" },
      { label: "NOW PLAYING · IN STORE", nowPlaying: true },
    ],
  },
  {
    label: "& FAM",
    fam: true,
    items: [],
  },
];

export const music = {
  nowPlaying: {
    label: "NOW PLAYING · IN STORE",
    time: "0:00 / 3:48",
    song: "Moanin'",
    artist: "Art Blakey & The Jazz Messengers",
  },
};
