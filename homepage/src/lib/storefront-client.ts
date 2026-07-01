import {
  getShopifyImageSrcset,
  getSizedShopifyImageUrl,
  type CatalogProduct,
} from "./catalog";

const STOREFRONT_API_VERSION = "2025-01";
const STOREFRONT_TIMEOUT_MS = 10_000;
const SHOPIFY_DOMAIN = normalizeDomain(
  import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN as string | undefined,
);
const SHOPIFY_TOKEN = (import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN as string | undefined)?.trim();

export const isStorefrontConfigured = Boolean(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message?: string }[];
}

interface Money {
  amount: string;
  currencyCode: string;
}

interface StorefrontImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

interface StorefrontPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface StorefrontCollectionProduct {
  handle: string;
  title: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: StorefrontImage | null;
  priceRange: {
    minVariantPrice: Money;
  };
}

interface StorefrontMenuItemRaw {
  title: string;
  url: string | null;
  items?: StorefrontMenuItemRaw[];
}

export interface StorefrontMenuItem {
  label: string;
  collectionHandle?: string;
  href?: string;
  items?: StorefrontMenuItem[];
}

export interface ProductImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  srcset?: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: string;
  selectedOptions: {
    name: string;
    value: string;
  }[];
}

export interface ProductDetail {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  descriptionHtml: string;
  availableForSale: boolean;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
}

export interface CollectionDetail {
  title: string;
  description: string;
  products: CatalogProduct[];
}

function normalizeDomain(domain: string | undefined): string | undefined {
  const trimmed = domain?.trim();
  if (!trimmed) return undefined;

  return trimmed.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function getProductUrl(handle: string): string {
  return SHOPIFY_DOMAIN ? `https://${SHOPIFY_DOMAIN}/products/${handle}` : `/products/${handle}`;
}

function formatMoney(money: Money | null | undefined): string {
  if (!money) return "";

  const amount = money.amount.replace(/\.00$/, "");
  if (money.currencyCode === "USD") return `$${amount}`;

  return `${amount} ${money.currencyCode}`;
}

function mapCatalogProduct(product: StorefrontCollectionProduct): CatalogProduct {
  return {
    title: product.title,
    vendor: product.vendor,
    price: formatMoney(product.priceRange.minVariantPrice),
    url: getProductUrl(product.handle),
    image: getSizedShopifyImageUrl(product.featuredImage?.url, 1100),
    imageSrcset: getShopifyImageSrcset(product.featuredImage?.url),
  };
}

function mapProductImage(image: StorefrontImage): ProductImage {
  return {
    url: getSizedShopifyImageUrl(image.url, 1100) ?? image.url,
    altText: image.altText,
    width: image.width,
    height: image.height,
    srcset: getShopifyImageSrcset(image.url),
  };
}

function getCollectionHandleFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url, "https://shopandson.com");
    const match = parsedUrl.pathname.match(/\/collections\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  } catch {
    const match = url.match(/\/collections\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  }
}

function mapMenuItem(item: StorefrontMenuItemRaw): StorefrontMenuItem {
  const collectionHandle = getCollectionHandleFromUrl(item.url);
  const mapped: StorefrontMenuItem = {
    label: item.title,
  };

  if (collectionHandle) {
    mapped.collectionHandle = collectionHandle;
  } else if (item.url) {
    mapped.href = item.url;
  }

  const children = (item.items ?? []).map(mapMenuItem);
  if (children.length > 0) {
    mapped.items = children;
  }

  return mapped;
}

export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  if (!isStorefrontConfigured || !SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) return null;

  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;

  try {
    const controller = new AbortController();
    timeout = globalThis.setTimeout(() => controller.abort(), STOREFRONT_TIMEOUT_MS);
    const response = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": SHOPIFY_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      },
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as GraphQLResponse<T>;
    if (payload.errors?.length) return null;

    return payload.data ?? null;
  } catch {
    return null;
  } finally {
    if (timeout) {
      globalThis.clearTimeout(timeout);
    }
  }
}

const COLLECTION_QUERY = /* GraphQL */ `
  query Collection($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      title
      description
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          handle
          title
          vendor
          availableForSale
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

interface CollectionQueryData {
  collection: {
    title: string;
    description: string;
    products: {
      pageInfo: StorefrontPageInfo;
      nodes: StorefrontCollectionProduct[];
    };
  } | null;
}

export async function getCollection(handle: string, first = 250): Promise<CollectionDetail | null> {
  if (!isStorefrontConfigured || !handle) return null;

  try {
    const requestedFirst = Number.isFinite(first) ? first : 250;
    const pageSize = Math.max(1, Math.min(requestedFirst, 250));
    let after: string | null = null;
    let title = "";
    let description = "";
    const products: CatalogProduct[] = [];

    do {
      const data: CollectionQueryData | null = await storefrontFetch<CollectionQueryData>(COLLECTION_QUERY, {
        handle,
        first: pageSize,
        after,
      });
      const collection: CollectionQueryData["collection"] | undefined = data?.collection;
      if (!collection) return null;

      title = collection.title;
      description = collection.description;
      products.push(...collection.products.nodes.map(mapCatalogProduct));
      after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
    } while (after);

    return { title, description, products };
  } catch {
    return null;
  }
}

const MENU_QUERY = /* GraphQL */ `
  query Menu($handle: String!) {
    menu(handle: $handle) {
      items {
        title
        url
        items {
          title
          url
        }
      }
    }
  }
`;

interface MenuQueryData {
  menu: {
    items: StorefrontMenuItemRaw[];
  } | null;
}

export async function getMenu(handle: string): Promise<StorefrontMenuItem[]> {
  if (!isStorefrontConfigured || !handle) return [];

  try {
    const data = await storefrontFetch<MenuQueryData>(MENU_QUERY, { handle });
    return data?.menu?.items.map(mapMenuItem) ?? [];
  } catch {
    return [];
  }
}

const PRODUCT_QUERY = /* GraphQL */ `
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      descriptionHtml
      availableForSale
      images(first: 24) {
        nodes {
          url
          altText
          width
          height
        }
      }
      options {
        name
        values
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

interface ProductQueryData {
  product: {
    id: string;
    handle: string;
    title: string;
    vendor: string;
    descriptionHtml: string;
    availableForSale: boolean;
    images: {
      nodes: StorefrontImage[];
    };
    options: ProductOption[];
    variants: {
      nodes: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: Money;
        selectedOptions: {
          name: string;
          value: string;
        }[];
      }[];
    };
  } | null;
}

export async function getProduct(handle: string): Promise<ProductDetail | null> {
  if (!isStorefrontConfigured || !handle) return null;

  try {
    const data = await storefrontFetch<ProductQueryData>(PRODUCT_QUERY, { handle });
    const product = data?.product;
    if (!product) return null;

    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      vendor: product.vendor,
      descriptionHtml: product.descriptionHtml,
      availableForSale: product.availableForSale,
      images: product.images.nodes.map(mapProductImage),
      options: product.options,
      variants: product.variants.nodes.map((variant) => ({
        id: variant.id,
        title: variant.title,
        availableForSale: variant.availableForSale,
        price: formatMoney(variant.price),
        selectedOptions: variant.selectedOptions,
      })),
    };
  } catch {
    return null;
  }
}
