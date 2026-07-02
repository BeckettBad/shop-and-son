export interface CatalogProduct {
  handle: string;
  title: string;
  vendor: string;
  price: string;
  url: string;
  available: boolean;
  image?: string;
  imageSrcset?: string;
  imageAspect: number;
}

interface ShopifyProductFeed {
  products?: ShopifyProduct[];
}

interface ShopifyProduct {
  title?: string;
  vendor?: string;
  handle?: string;
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
}

interface ShopifyVariant {
  price?: string;
  available?: boolean;
}

interface ShopifyImage {
  src?: string;
  width?: number;
  height?: number;
}

const PRODUCT_FEED_BASE_URL = "https://shopandson.com/collections";
const PRODUCT_PAGE_BASE_URL = "https://shopandson.com/products";
const PRODUCT_CAP = 250;
const SHOPIFY_IMAGE_WIDTHS = [700, 1100, 1600] as const;
const FETCH_SPACING_MS = 250;
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 15_000;
const FETCH_RETRY_BASE_DELAY_MS = 500;
const FETCH_RETRY_MAX_DELAY_MS = 8_000;
const productCache = new Map<string, Promise<CatalogProduct[]>>();
let catalogFetchQueue = Promise.resolve();

const formatPrice = (price: string | undefined): string => {
  return `$${(price ?? "0").replace(/\.00$/, "")}`;
};

export const getSizedShopifyImageUrl = (src: string | undefined, width: number): string | undefined => {
  if (!src) return undefined;

  try {
    const url = new URL(src);
    if (url.hostname !== "cdn.shopify.com") return src;

    url.searchParams.set("width", String(width));
    return url.toString();
  } catch {
    return src;
  }
};

export const getShopifyImageSrcset = (src: string | undefined): string | undefined => {
  if (!src) return undefined;

  return SHOPIFY_IMAGE_WIDTHS
    .map((width) => {
      const sizedUrl = getSizedShopifyImageUrl(src, width);
      return sizedUrl === src ? undefined : `${sizedUrl} ${width}w`;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join(", ") || undefined;
};

const mapProduct = (product: ShopifyProduct): CatalogProduct => {
  const handle = product.handle ?? "";
  const imageSrc = product.images?.[0]?.src;
  const imageWidth = product.images?.[0]?.width;
  const imageHeight = product.images?.[0]?.height;
  const imageAspect = imageWidth && imageHeight ? imageWidth / imageHeight : 0.75;

  return {
    handle,
    title: product.title ?? "",
    vendor: product.vendor ?? "",
    price: formatPrice(product.variants?.[0]?.price),
    available: product.variants?.some((variant) => variant.available) ?? false,
    image: getSizedShopifyImageUrl(imageSrc, 1100),
    imageSrcset: getShopifyImageSrcset(imageSrc),
    imageAspect,
    url: `${PRODUCT_PAGE_BASE_URL}/${handle}`,
  };
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const getRetryAfterMs = (retryAfter: string | null): number | undefined => {
  if (!retryAfter) return undefined;

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000;
  }

  const retryAfterDate = Date.parse(retryAfter);
  if (!Number.isNaN(retryAfterDate)) {
    return Math.max(retryAfterDate - Date.now(), 0);
  }

  return undefined;
};

const getRetryDelayMs = (attempt: number, retryAfter: string | null = null): number => {
  const retryAfterMs = getRetryAfterMs(retryAfter);
  if (retryAfterMs !== undefined) {
    return Math.min(retryAfterMs, FETCH_RETRY_MAX_DELAY_MS);
  }

  return Math.min(FETCH_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), FETCH_RETRY_MAX_DELAY_MS);
};

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const formatFailure = (failure: unknown): unknown => {
  if (failure instanceof Error) return `${failure.name}: ${failure.message}`;

  return failure;
};

const waitForRetry = async (attempt: number, retryAfter: string | null = null): Promise<void> => {
  return wait(getRetryDelayMs(attempt, retryAfter));
};

export async function getCatalogProducts(collection: string): Promise<CatalogProduct[]> {
  const cachedProducts = productCache.get(collection);
  if (cachedProducts) return cachedProducts;

  const queuedProducts = catalogFetchQueue.then(async () => {
    await wait(FETCH_SPACING_MS);
    return fetchCatalogProducts(collection);
  });

  productCache.set(collection, queuedProducts);
  catalogFetchQueue = queuedProducts.then(
    () => undefined,
    () => undefined,
  );

  return queuedProducts;
}

async function fetchCatalogProducts(collection: string): Promise<CatalogProduct[]> {
  const products: ShopifyProduct[] = [];
  let page = 1;

  while (true) {
    const pageProducts = await fetchCatalogProductPage(collection, page);
    if (!pageProducts) return [];

    products.push(...pageProducts);
    if (pageProducts.length < PRODUCT_CAP) break;

    page += 1;
  }

  return products.map(mapProduct);
}

async function fetchCatalogProductPage(collection: string, page: number): Promise<ShopifyProduct[] | null> {
  const url = `${PRODUCT_FEED_BASE_URL}/${collection}/products.json?limit=${PRODUCT_CAP}&page=${page}`;
  let lastFailure: unknown;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        lastFailure = `${response.status} ${response.statusText}`;

        if (attempt < FETCH_ATTEMPTS) {
          await waitForRetry(attempt, response.headers.get("retry-after"));
          continue;
        }

        break;
      }

      const feed = (await response.json()) as ShopifyProductFeed;
      return feed.products ?? [];
    } catch (err) {
      lastFailure = err;

      if (attempt < FETCH_ATTEMPTS) {
        await waitForRetry(attempt);
        continue;
      }
    }
  }

  console.warn(
    `[catalog] Failed to fetch ${collection} products page ${page} after ${FETCH_ATTEMPTS} attempts:`,
    formatFailure(lastFailure),
  );
  return null;
}
