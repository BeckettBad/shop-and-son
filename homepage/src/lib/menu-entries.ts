export interface MenuEntrySource {
  label: string;
  collectionHandle?: string;
  href?: string;
}

export interface LiveHeroCollectionEntry {
  kind: "collection";
  label: string;
  collection: string;
  collectionLabel: string;
}

export interface LiveHeroPlaceholderEntry {
  kind: "placeholder";
  label: string;
}

export type LiveHeroMenuEntry = LiveHeroCollectionEntry | LiveHeroPlaceholderEntry;

const displayLabel = (label: string) =>
  label.trim().replace(/\s+/g, " ").toLocaleUpperCase("en-US");

const toCollectionMenuEntry = (
  item: MenuEntrySource,
): LiveHeroCollectionEntry | null => {
  if (!item.collectionHandle) return null;

  const label = displayLabel(item.label);
  return {
    kind: "collection",
    label,
    collection: item.collectionHandle,
    collectionLabel: label,
  };
};

export const toCollectionMenuEntries = (
  items: MenuEntrySource[] | undefined,
): LiveHeroCollectionEntry[] =>
  (items ?? []).flatMap((item) => {
    const entry = toCollectionMenuEntry(item);
    return entry ? [entry] : [];
  });

export const toDesignerMenuEntries = (
  items: MenuEntrySource[] | undefined,
): LiveHeroMenuEntry[] => {
  const collections: LiveHeroCollectionEntry[] = [];
  const placeholders: LiveHeroPlaceholderEntry[] = [];

  (items ?? []).forEach((item) => {
    const collectionEntry = toCollectionMenuEntry(item);
    if (collectionEntry) {
      collections.push(collectionEntry);
      return;
    }

    const label = displayLabel(item.label);
    if (label) placeholders.push({ kind: "placeholder", label });
  });

  return [...collections, ...placeholders];
};
