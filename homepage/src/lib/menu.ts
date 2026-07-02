import { getMenu, type StorefrontMenuItem } from "./storefront-client";

export interface LiveHeroMenuEntry {
  label: string;
  collection: string;
  collectionLabel: string;
}

export interface LiveHeroMenu {
  categories: LiveHeroMenuEntry[];
  designers: LiveHeroMenuEntry[];
  objects: LiveHeroMenuEntry[];
  clothesShopAll?: string;
  objectsShopAll?: string;
}

const MAIN_MENU_HANDLE = "main-menu";
const CLOTHING_SHOP_ALL_HANDLE = "clothing-1";

const normalizeLabel = (label: string) => label.trim().replace(/\s+/g, " ").toLowerCase();
const displayLabel = (label: string) => label.trim().replace(/\s+/g, " ").toLocaleUpperCase("en-US");

const findMenuItem = (items: StorefrontMenuItem[], label: string, collectionHandle?: string) =>
  items.find((item) => {
    if (collectionHandle && item.collectionHandle === collectionHandle) return true;
    return normalizeLabel(item.label) === label;
  });

const toCollectionEntry = (item: StorefrontMenuItem): LiveHeroMenuEntry | null => {
  if (!item.collectionHandle) return null;

  const label = displayLabel(item.label);
  return {
    label,
    collection: item.collectionHandle,
    collectionLabel: label,
  };
};

const toCollectionEntries = (items: StorefrontMenuItem[] | undefined) =>
  (items ?? []).flatMap((item) => {
    const entry = toCollectionEntry(item);
    return entry ? [entry] : [];
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
  // handles remain the SHOP ALL entries (clothing-1 and house-1).
  const categories = toCollectionEntries(clothing.items).filter((entry) => {
    const label = normalizeLabel(entry.label);
    return entry.collection !== CLOTHING_SHOP_ALL_HANDLE && label !== "shop all";
  });

  return {
    categories,
    designers: toCollectionEntries(designers.items),
    objects: toCollectionEntries(objects.items),
    clothesShopAll: clothing.collectionHandle,
    objectsShopAll: objects.collectionHandle,
  };
}
