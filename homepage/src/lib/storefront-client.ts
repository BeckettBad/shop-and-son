import {
  formatMoney,
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

type StorefrontPredictiveSearchProduct = StorefrontCollectionProduct;

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

export interface ShopPolicy {
  title: string;
  body: string;
}

export type ShopPolicyLookup = Record<string, ShopPolicy>;

function normalizeDomain(domain: string | undefined): string | undefined {
  const trimmed = domain?.trim();
  if (!trimmed) return undefined;

  return trimmed.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function getProductUrl(handle: string): string {
  return SHOPIFY_DOMAIN ? `https://${SHOPIFY_DOMAIN}/products/${handle}` : `/products/${handle}`;
}

function mapCatalogProduct(product: StorefrontCollectionProduct): CatalogProduct {
  const imageWidth = product.featuredImage?.width;
  const imageHeight = product.featuredImage?.height;
  const money = product.priceRange.minVariantPrice;

  return {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    price: formatMoney(money.amount, money.currencyCode),
    url: getProductUrl(product.handle),
    available: product.availableForSale,
    image: getSizedShopifyImageUrl(product.featuredImage?.url, 1100),
    imageSrcset: getShopifyImageSrcset(product.featuredImage?.url),
    imageAspect: imageWidth && imageHeight ? imageWidth / imageHeight : 0.75,
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

export function sanitizeShopifyHtml(html: string): string {
  if (!html) return "";

  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script, iframe, object, embed, form").forEach((element) => element.remove());
  document.body.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
      if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return document.body.innerHTML;
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

const PRODUCT_SEARCH_QUERY = /* GraphQL */ `
  query ProductSearch($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
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
`;

interface ProductSearchQueryData {
  products: {
    nodes: StorefrontCollectionProduct[];
  };
}

export async function searchProducts(query: string, first = 24): Promise<CatalogProduct[]> {
  const searchQuery = query.trim();
  if (!isStorefrontConfigured || !searchQuery) return [];

  try {
    const requestedFirst = Number.isFinite(first) ? first : 24;
    const data = await storefrontFetch<ProductSearchQueryData>(PRODUCT_SEARCH_QUERY, {
      query: searchQuery,
      first: Math.max(1, Math.min(requestedFirst, 250)),
    });
    return data?.products.nodes.map(mapCatalogProduct) ?? [];
  } catch {
    return [];
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

const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query PredictiveSearch($query: String!) {
    predictiveSearch(query: $query, limit: 8, types: [PRODUCT]) {
      products {
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
`;

interface PredictiveSearchQueryData {
  predictiveSearch: {
    products: StorefrontPredictiveSearchProduct[];
  } | null;
}

export async function predictiveSearch(query: string): Promise<CatalogProduct[]> {
  const searchQuery = query.trim();
  if (!isStorefrontConfigured || !searchQuery) return [];

  try {
    const data = await storefrontFetch<PredictiveSearchQueryData>(PREDICTIVE_SEARCH_QUERY, {
      query: searchQuery,
    });
    return data?.predictiveSearch?.products.map(mapCatalogProduct) ?? [];
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

async function fetchProduct(handle: string): Promise<ProductDetail | null> {
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
        price: formatMoney(variant.price.amount, variant.price.currencyCode),
        selectedOptions: variant.selectedOptions,
      })),
    };
  } catch {
    return null;
  }
}

const productPromiseCache = new Map<string, Promise<ProductDetail | null>>();

export function getProduct(handle: string): Promise<ProductDetail | null> {
  const productHandle = handle.trim();
  if (!isStorefrontConfigured || !productHandle) return Promise.resolve(null);

  const cachedProduct = productPromiseCache.get(productHandle);
  if (cachedProduct) return cachedProduct;

  const productPromise = fetchProduct(productHandle).then(
    (product) => {
      if (!product) {
        productPromiseCache.delete(productHandle);
      }
      return product;
    },
    (error: unknown) => {
      productPromiseCache.delete(productHandle);
      throw error;
    },
  );
  productPromiseCache.set(productHandle, productPromise);
  return productPromise;
}

export const prefetchProduct = getProduct;

const POLICIES_QUERY = /* GraphQL */ `
  query Policies {
    shop {
      refundPolicy {
        title
        handle
        body
      }
      privacyPolicy {
        title
        handle
        body
      }
      termsOfService {
        title
        handle
        body
      }
    }
  }
`;

interface StorefrontPolicyRaw {
  title: string;
  handle: string;
  body: string;
}

interface PoliciesQueryData {
  shop: {
    refundPolicy: StorefrontPolicyRaw | null;
    privacyPolicy: StorefrontPolicyRaw | null;
    termsOfService: StorefrontPolicyRaw | null;
  } | null;
}

let policiesPromise: Promise<ShopPolicyLookup | null> | undefined;

async function fetchPolicies(): Promise<ShopPolicyLookup | null> {
  try {
    const data = await storefrontFetch<PoliciesQueryData>(POLICIES_QUERY);
    const shop = data?.shop;
    if (!shop) return null;

    const policies: ShopPolicyLookup = {};
    [shop.refundPolicy, shop.privacyPolicy, shop.termsOfService].forEach((policy) => {
      if (!policy?.handle) return;
      policies[policy.handle] = {
        title: policy.title,
        body: policy.body,
      };
    });

    return policies;
  } catch {
    return null;
  }
}

export async function getPolicies(): Promise<ShopPolicyLookup | null> {
  if (!isStorefrontConfigured) return null;

  policiesPromise ??= fetchPolicies();
  return policiesPromise;
}
