import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const moduleUrl = new URL("../src/lib/sale-pricing.ts", import.meta.url);
const { findLowestOnSaleVariant, isOnSale } = await import(moduleUrl);

test("a product is on sale only when compare-at price is greater than current price", () => {
  assert.equal(isOnSale("80", "100"), true);
  assert.equal(isOnSale("80.00", "80"), false);
  assert.equal(isOnSale("80", "40"), false);
  assert.equal(isOnSale("80", null), false);
  assert.equal(isOnSale("", "100"), false);
  assert.equal(isOnSale("not-a-price", "100"), false);
});

test("listing prices use one coherent discounted variant", () => {
  const variants = [
    {
      id: "regular-lowest",
      price: { amount: "50", currencyCode: "USD" },
      compareAtPrice: null,
    },
    {
      id: "sale-higher",
      price: { amount: "80", currencyCode: "USD" },
      compareAtPrice: { amount: "100", currencyCode: "USD" },
    },
    {
      id: "sale-lowest",
      price: { amount: "75", currencyCode: "USD" },
      compareAtPrice: { amount: "120", currencyCode: "USD" },
    },
    {
      id: "currency-mismatch",
      price: { amount: "60", currencyCode: "USD" },
      compareAtPrice: { amount: "100", currencyCode: "CAD" },
    },
  ];

  assert.equal(findLowestOnSaleVariant(variants)?.id, "sale-lowest");
  assert.equal(findLowestOnSaleVariant([variants[0]]), undefined);

  const snapshotVariants = [
    { id: "regular-first", price: "50", compareAtPrice: null },
    { id: "sale-later", price: "70", compareAtPrice: "100" },
  ];
  assert.equal(findLowestOnSaleVariant(snapshotVariants)?.id, "sale-later");
});

test("all Storefront API product surfaces request compare-at pricing", async () => {
  const source = await readFile(
    new URL("../src/lib/storefront-client.ts", import.meta.url),
    "utf8",
  );

  assert.equal(source.match(/compareAtPriceRange\s*\{/g)?.length ?? 0, 0);
  assert.equal(source.match(/variants\(first: 100\)/g)?.length, 4);
  assert.match(source, /variants\(first: 100\)[\s\S]*?compareAtPrice\s*\{/);
});

test("the build-time catalog snapshot keeps only valid Shopify compare-at prices", async () => {
  const source = await readFile(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");

  assert.match(source, /compare_at_price\?: string/);
  assert.match(
    source,
    /findLowestOnSaleVariant\(\s*\(product\.variants \?\? \[\]\)\.map/,
  );
  assert.match(source, /const variant = saleVariant\?\.variant \?\? product\.variants\?\.\[0\]/);
});

test("sale presentation is shared by product cards and variant-aware product details", async () => {
  const [hero, productView, storefrontClient, styles] = await Promise.all([
    readFile(new URL("../src/components/blocks/HeroVideo.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/product-view.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/storefront-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/global.css", import.meta.url), "utf8"),
  ]);

  assert.match(hero, /sale\.className = "product-card__sale"/);
  assert.match(hero, /compareAt\.className = "product-card__compare-at-price"/);
  assert.match(hero, /compareAtPrice: product\.compareAtPrice/);
  assert.match(productView, /compareAt\.className = "product-detail__compare-at-price"/);
  assert.match(productView, /sale\.className = "product-detail__sale"/);
  assert.match(productView, /saleAnchor\.append\(sale\)/);
  assert.match(productView, /renderProductPrice\(price, variant \?\? initialVariant\)/);
  assert.match(storefrontClient, /findLowestOnSaleVariant\(\[variant\]\)/);
  assert.match(
    styles,
    /\.product-card__sale,\s*\.product-detail__sale\s*\{[^}]*top:8px; right:8px;[^}]*border:1px solid #000;[^}]*color:#000;[^}]*font-size:11px;/s,
  );
  assert.match(
    styles,
    /body\.is-product-lightbox-open \.product-detail__sale\s*\{[^}]*visibility:hidden;/s,
  );
  assert.match(
    styles,
    /\.product-detail__sale\[hidden\]\s*\{[^}]*display:none;/s,
    "regular PDP variants must keep their SALE badge out of layout",
  );
  assert.match(styles, /\.product-card__compare-at-price[^}]*text-decoration:line-through/s);
  assert.match(styles, /\.product-detail__compare-at-price[^}]*text-decoration:line-through/s);
});
