export interface CatalogProduct {
  title: string;
  vendor: string;
  price: string;
  url: string;
  image?: string;
  imageSrcset?: string;
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
}

interface ShopifyImage {
  src?: string;
}

const PRODUCT_FEED_BASE_URL = "https://shopandson.com/collections";
const PRODUCT_PAGE_BASE_URL = "https://shopandson.com/products";
// Cap collection output for now; clothing can return 250 and house 27, and we can raise or paginate later.
const PRODUCT_CAP = 60;
const SHOPIFY_IMAGE_WIDTHS = [700, 1100, 1600] as const;

const formatPrice = (price: string | undefined): string => {
  return `$${(price ?? "0").replace(/\.00$/, "")}`;
};

const getSizedShopifyImageUrl = (src: string | undefined, width: number): string | undefined => {
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

const getShopifyImageSrcset = (src: string | undefined): string | undefined => {
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

  return {
    title: product.title ?? "",
    vendor: product.vendor ?? "",
    price: formatPrice(product.variants?.[0]?.price),
    image: getSizedShopifyImageUrl(imageSrc, 1100),
    imageSrcset: getShopifyImageSrcset(imageSrc),
    url: `${PRODUCT_PAGE_BASE_URL}/${handle}`,
  };
};

export async function getCatalogProducts(collection: string): Promise<CatalogProduct[]> {
  try {
    const response = await fetch(`${PRODUCT_FEED_BASE_URL}/${collection}/products.json?limit=250`);
    if (!response.ok) {
      console.warn(
        `[catalog] Failed to fetch ${collection} products: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const feed = (await response.json()) as ShopifyProductFeed;
    return (feed.products ?? []).slice(0, PRODUCT_CAP).map(mapProduct);
  } catch (err) {
    console.warn(`[catalog] Failed to fetch ${collection} products:`, err);
    return [];
  }
}
