import assert from "node:assert/strict";
import test from "node:test";

const moduleUrl = new URL("../src/lib/menu-entries.ts", import.meta.url);
const { toCollectionMenuEntries, toDesignerMenuEntries } = await import(moduleUrl);

test("all designers are alphabetized together regardless of collection status", () => {
  assert.deepEqual(
    toDesignerMenuEntries([
      { label: " first preview ", href: "/search" },
      { label: " ancellm ", collectionHandle: "ancellm" },
      { label: "second   preview" },
      { label: " yahae ", collectionHandle: "yahae-1" },
    ]),
    [
      {
        kind: "collection",
        label: "ANCELLM",
        collection: "ancellm",
        collectionLabel: "ANCELLM",
      },
      {
        kind: "placeholder",
        label: "FIRST PREVIEW",
      },
      { kind: "placeholder", label: "SECOND PREVIEW" },
      {
        kind: "collection",
        label: "YAHAE",
        collection: "yahae-1",
        collectionLabel: "YAHAE",
      },
    ],
  );
});

test("collection-only menus continue to ignore non-collection items", () => {
  assert.deepEqual(
    toCollectionMenuEntries([
      { label: "jackets", collectionHandle: "jackets" },
      { label: "not a collection", href: "/search" },
    ]),
    [
      {
        kind: "collection",
        label: "JACKETS",
        collection: "jackets",
        collectionLabel: "JACKETS",
      },
    ],
  );
});
