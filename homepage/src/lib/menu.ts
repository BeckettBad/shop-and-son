import { getMenu, type StorefrontMenuItem } from "./storefront-client";
import {
  toCollectionMenuEntries,
  toDesignerMenuEntries,
  type LiveHeroCollectionEntry,
  type LiveHeroMenuEntry,
} from "./menu-entries";

export type { LiveHeroMenuEntry } from "./menu-entries";

export interface LiveHeroMenu {
  categories: LiveHeroCollectionEntry[];
  designers: LiveHeroMenuEntry[];
  objects: LiveHeroCollectionEntry[];
  clothesShopAll?: string;
  objectsShopAll?: string;
}

const MAIN_MENU_HANDLE = "main-menu";
const CLOTHING_SHOP_ALL_HANDLE = "clothing-1";

const normalizeLabel = (label: string) => label.trim().replace(/\s+/g, " ").toLowerCase();
const clothingShopAllEntry = (collectionHandle: string): LiveHeroCollectionEntry => ({
  kind: "collection",
  label: "SHOP ALL",
  collection: collectionHandle,
  collectionLabel: "CLOTHES — SHOP ALL",
});

const findMenuItem = (items: StorefrontMenuItem[], label: string, collectionHandle?: string) =>
  items.find((item) => {
    if (collectionHandle && item.collectionHandle === collectionHandle) return true;
    return normalizeLabel(item.label) === label;
  });

export async function getLiveHeroMenu(): Promise<LiveHeroMenu | null> {
  const items = await getMenu(MAIN_MENU_HANDLE);
  if (items.length === 0) return null;

  const clothing = findMenuItem(items, "clothing", CLOTHING_SHOP_ALL_HANDLE);
  const objects = findMenuItem(items, "objects", "house-1");
  const designers = findMenuItem(items, "designers");
  if (!clothing || !objects || !designers) return null;

  // Shopify admin mapping: main-menu clothing children minus shop all hydrate
  // CLOTHES/CATEGORIES, main-menu designers children hydrate CLOTHES/DESIGNERS,
  // and main-menu objects children hydrate OBJECTS leaves; the parent collection
  // handles remain the SHOP ALL entries (clothing-1 and house-1). Designer children
  // without collections remain visible as inert placeholders at the bottom of that
  // subgroup; Categories and Objects remain collection-only.
  const categoryEntries = toCollectionMenuEntries(clothing.items).filter((entry) => {
    const label = normalizeLabel(entry.label);
    return entry.collection !== CLOTHING_SHOP_ALL_HANDLE && label !== "shop all";
  });
  const categories = clothing.collectionHandle
    ? [clothingShopAllEntry(clothing.collectionHandle), ...categoryEntries]
    : categoryEntries;

  return {
    categories,
    designers: toDesignerMenuEntries(designers.items),
    objects: toCollectionMenuEntries(objects.items),
    clothesShopAll: clothing.collectionHandle,
    objectsShopAll: objects.collectionHandle,
  };
}
