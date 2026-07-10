import type { APIRoute } from "astro";
import { heroMenu } from "../data/content.ts";
import { getCatalogProducts } from "../lib/catalog";

export const prerender = true;

const FALLBACK_SITE = new URL("https://beckettbad.github.io");

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getBasePath = (): string => {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const withBasePath = (path: string): string => {
  const basePath = getBasePath();
  if (path === "/") return `${basePath}/`;
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
};

const absoluteUrl = (site: URL | undefined, path: string): string =>
  new URL(withBasePath(path), site ?? FALLBACK_SITE).toString();

const getCatalogCollections = (): string[] =>
  Array.from(
    new Set(
      heroMenu.flatMap((section) =>
        section.items.flatMap((item) => [
          ...(item.collection ? [item.collection] : []),
          ...(item.children?.flatMap((child) => (child.collection ? [child.collection] : [])) ?? []),
        ]),
      ),
    ),
  );

const urlEntry = (loc: string): string => `  <url><loc>${escapeXml(loc)}</loc></url>`;

export const GET: APIRoute = async ({ site }) => {
  const collections = getCatalogCollections();
  const productHandles = new Set<string>();

  await Promise.all(
    collections.map(async (collection) => {
      const products = await getCatalogProducts(collection);
      products.forEach((product) => {
        if (product.handle) productHandles.add(product.handle);
      });
    }),
  );

  const urls = [
    absoluteUrl(site, "/"),
    absoluteUrl(site, "/policies/"),
    absoluteUrl(site, "/preorders/"),
    ...collections.map((collection) => absoluteUrl(site, `/?collection=${encodeURIComponent(collection)}`)),
    ...Array.from(productHandles)
      .sort((a, b) => a.localeCompare(b))
      .map((handle) => absoluteUrl(site, `/?product=${encodeURIComponent(handle)}`)),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(urlEntry),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
