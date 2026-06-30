export interface CatalogProduct {
  title: string;
  vendor: string;
  price: string;
  url: string;
  image?: string;
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

const formatPrice = (price: string | undefined): string => {
  return `$${(price ?? "0").replace(/\.00$/, "")}`;
};

const mapProduct = (product: ShopifyProduct): CatalogProduct => {
  const handle = product.handle ?? "";

  return {
    title: product.title ?? "",
    vendor: product.vendor ?? "",
    price: formatPrice(product.variants?.[0]?.price),
    image: product.images?.[0]?.src,
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
