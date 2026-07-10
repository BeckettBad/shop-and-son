/**
 * Shopify Storefront API client — READ ONLY.
 *
 * Model: "custom front-end, Shopify checkout." We read product data (image,
 * title, price, handle, metafields) to *display* on this site; the actual cart
 * and checkout happen on the live Shopify store. Every product links out to
 * `${SHOPIFY_STORE_DOMAIN}/products/<handle>`.
 *
 * Configure via environment (e.g. a local `.env`, or your host's env settings):
 *   PUBLIC_SHOPIFY_STORE_DOMAIN    = shopandson.com           (or *.myshopify.com)
 *   SHOPIFY_STOREFRONT_API_TOKEN   = <public Storefront access token>
 *   SHOPIFY_STOREFRONT_API_VERSION = 2025-01                  (optional)
 *
 * The Storefront token is a *public* access token (Shopify admin →
 * Settings → Apps and sales channels → Develop apps → Storefront API).
 * It is safe to expose; it only grants the read scopes you enable.
 *
 * Until it's configured, every function below returns an empty/quiet result so
 * the site builds and renders from `src/data/content.ts`. Once configured, the
 * product-backed blocks can merge in live data without further wiring changes.
 */

const DOMAIN = (
  (import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN as string | undefined)?.trim() || "shopandson.com"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");
const TOKEN = import.meta.env.SHOPIFY_STOREFRONT_API_TOKEN as string | undefined;
const API_VERSION =
  (import.meta.env.SHOPIFY_STOREFRONT_API_VERSION as string | undefined) ?? "2025-01";

export const isShopifyConfigured = Boolean(DOMAIN && TOKEN);

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

/** A product, flattened to the shape the editorial blocks actually need. */
export interface Product {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  description: string;
  price: Money | null;
  image: ShopifyImage | null;
  /** Direct link to the product on the live Shopify store (where checkout happens). */
  url: string;
  /** Curatorial fields stored as Shopify metafields, namespace `editorial`. */
  editorial: {
    cloth?: string; // e.g. "moleskine · 380 gsm"
    care?: string;
    silhouette?: string;
    edition?: string;
  };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** Low-level GraphQL fetch against the Storefront API. */
export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  if (!isShopifyConfigured) {
    console.warn(
      "[shopify] Not configured — set PUBLIC_SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_API_TOKEN. Falling back to static content.",
    );
    return null;
  }

  const endpoint = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN as string,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) {
      console.error(`[shopify] HTTP ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors?.length) {
      console.error("[shopify] GraphQL errors:", json.errors.map((e) => e.message).join("; "));
      return null;
    }
    return json.data ?? null;
  } catch (err) {
    console.error("[shopify] fetch failed:", err);
    return null;
  }
}

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $query: String) {
    products(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        vendor
        description
        featuredImage { url altText width height }
        priceRange { minVariantPrice { amount currencyCode } }
        cloth: metafield(namespace: "editorial", key: "cloth") { value }
        care: metafield(namespace: "editorial", key: "care") { value }
        silhouette: metafield(namespace: "editorial", key: "silhouette") { value }
        edition: metafield(namespace: "editorial", key: "edition") { value }
      }
    }
  }
`;

interface RawProduct {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  description: string;
  featuredImage: ShopifyImage | null;
  priceRange: { minVariantPrice: Money } | null;
  cloth: { value: string } | null;
  care: { value: string } | null;
  silhouette: { value: string } | null;
  edition: { value: string } | null;
}

function toProduct(p: RawProduct): Product {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor,
    description: p.description,
    price: p.priceRange?.minVariantPrice ?? null,
    image: p.featuredImage,
    url: `https://${DOMAIN}/products/${p.handle}`,
    editorial: {
      cloth: p.cloth?.value,
      care: p.care?.value,
      silhouette: p.silhouette?.value,
      edition: p.edition?.value,
    },
  };
}

/**
 * Fetch products for display. `query` accepts Shopify's search syntax,
 * e.g. `tag:homepage` or `collection_type:clothing`. Returns [] when Shopify
 * isn't configured yet, so callers can fall back to static content.
 */
export async function getProducts(opts: { first?: number; query?: string } = {}): Promise<Product[]> {
  const data = await shopifyFetch<{ products: { nodes: RawProduct[] } }>(PRODUCTS_QUERY, {
    first: opts.first ?? 24,
    query: opts.query ?? null,
  });
  return data?.products.nodes.map(toProduct) ?? [];
}
