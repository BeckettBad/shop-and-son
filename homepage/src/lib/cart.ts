import { formatMoney, getSizedShopifyImageUrl } from "./catalog";
import { isStorefrontConfigured, storefrontFetch } from "./storefront-client";

declare global {
  interface Window {
    __cartReady?: boolean;
  }
}

interface Money {
  amount?: string;
  currencyCode?: string;
}

interface CartLineRaw {
  id?: string;
  quantity?: number;
  merchandise?: {
    id?: string;
    title?: string;
    image?: {
      url?: string;
      width?: number | null;
      height?: number | null;
    } | null;
    price?: Money;
    product?: {
      title?: string;
      handle?: string;
      vendor?: string;
    } | null;
  } | null;
  cost?: {
    totalAmount?: Money;
  } | null;
}

interface CartRaw {
  id?: string;
  checkoutUrl?: string | null;
  totalQuantity?: number;
  cost?: {
    subtotalAmount?: Money;
  } | null;
  lines?: {
    nodes?: CartLineRaw[];
  } | null;
}

interface UserError {
  field?: string[];
  message?: string;
}

interface CartMutationPayload {
  cart?: CartRaw | null;
  userErrors?: UserError[];
}

interface CartCreateResponse {
  cartCreate?: CartMutationPayload | null;
}

interface CartLinesAddResponse {
  cartLinesAdd?: CartMutationPayload | null;
}

interface CartLinesUpdateResponse {
  cartLinesUpdate?: CartMutationPayload | null;
}

interface CartLinesRemoveResponse {
  cartLinesRemove?: CartMutationPayload | null;
}

interface CartQueryResponse {
  cart?: CartRaw | null;
}

export interface CartLine {
  id: string;
  quantity: number;
  title: string;
  variantTitle: string;
  handle: string;
  vendor: string;
  image?: string;
  price: string;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: string;
  lines: CartLine[];
}

const CART_ID_KEY = "andson:cart-id";
const EMPTY_CART: Cart = {
  id: "",
  checkoutUrl: "",
  totalQuantity: 0,
  subtotal: "",
  lines: [],
};

if (isStorefrontConfigured && typeof window !== "undefined") {
  window.__cartReady = true;
}

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            product {
              title
              handle
              vendor
            }
            image {
              url
              width
              height
            }
            price {
              amount
              currencyCode
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const CART_QUERY = /* GraphQL */ `
  ${CART_FRAGMENT}
  query Cart($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;

const CART_CREATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartCreate {
    cartCreate {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

let currentCart: Cart = EMPTY_CART;
let hydrated = false;
let hydratePromise: Promise<Cart> | undefined;

const hasDocument = () => typeof document !== "undefined";
const hasStorage = () => typeof window !== "undefined" && "localStorage" in window;

function readStoredCartId(): string {
  if (!hasStorage()) return "";

  try {
    return window.localStorage.getItem(CART_ID_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeCartId(cartId: string): void {
  if (!hasStorage()) return;

  try {
    if (cartId) {
      window.localStorage.setItem(CART_ID_KEY, cartId);
      return;
    }

    window.localStorage.removeItem(CART_ID_KEY);
  } catch {
    // localStorage can be unavailable in private or embedded contexts.
  }
}

function dispatchCartUpdated(cart: Cart): void {
  if (!hasDocument()) return;

  document.dispatchEvent(new CustomEvent<Cart>("cart:updated", { detail: cart }));
}

function dispatchCartMessage(message: string): void {
  if (!message || !hasDocument()) return;

  console.warn(`[cart] ${message}`);
  document.dispatchEvent(new CustomEvent<string>("cart:message", { detail: message }));
}

function getUserErrorMessage(userErrors: UserError[] | undefined): string {
  return userErrors?.map((error) => error.message).filter(Boolean).join(" ") ?? "";
}

function setCurrentCart(rawCart: CartRaw | null | undefined): Cart {
  currentCart = mapCart(rawCart);
  if (currentCart.id) {
    storeCartId(currentCart.id);
  }
  return currentCart;
}

function resetCart(): Cart {
  currentCart = EMPTY_CART;
  storeCartId("");
  return currentCart;
}

function isUsableCart(rawCart: CartRaw | null | undefined): rawCart is CartRaw {
  return Boolean(rawCart?.id && rawCart.checkoutUrl);
}

function handleMutationPayload(payload: CartMutationPayload | null | undefined): Cart | null {
  const message = getUserErrorMessage(payload?.userErrors);
  if (message) {
    dispatchCartMessage(message);
    dispatchCartUpdated(currentCart);
    return null;
  }

  if (!isUsableCart(payload?.cart)) {
    resetCart();
    dispatchCartUpdated(currentCart);
    return null;
  }

  const cart = setCurrentCart(payload.cart);
  dispatchCartUpdated(cart);
  return cart;
}

export function mapCart(rawCart: CartRaw | null | undefined): Cart {
  if (!isUsableCart(rawCart)) return EMPTY_CART;

  const subtotalAmount = rawCart.cost?.subtotalAmount;
  const currencyCode = subtotalAmount?.currencyCode ?? "USD";

  return {
    id: rawCart.id ?? "",
    checkoutUrl: rawCart.checkoutUrl ?? "",
    totalQuantity: rawCart.totalQuantity ?? 0,
    subtotal: formatMoney(subtotalAmount?.amount, currencyCode),
    lines: (rawCart.lines?.nodes ?? []).map((line) => {
      const merchandise = line.merchandise;
      const product = merchandise?.product;
      const variantTitle = merchandise?.title ?? "";
      const lineAmount = line.cost?.totalAmount;

      return {
        id: line.id ?? "",
        quantity: line.quantity ?? 0,
        title: product?.title ?? "",
        variantTitle: variantTitle === "Default Title" ? "" : variantTitle,
        handle: product?.handle ?? "",
        vendor: product?.vendor ?? "",
        image: getSizedShopifyImageUrl(merchandise?.image?.url, 200),
        price: formatMoney(lineAmount?.amount, lineAmount?.currencyCode ?? currencyCode),
      };
    }).filter((line) => Boolean(line.id)),
  };
}

async function hydrateCart(): Promise<Cart> {
  if (hydrated) return currentCart;

  if (!isStorefrontConfigured) {
    hydrated = true;
    resetCart();
    dispatchCartUpdated(currentCart);
    return currentCart;
  }

  const storedId = readStoredCartId();
  if (!storedId) {
    hydrated = true;
    dispatchCartUpdated(currentCart);
    return currentCart;
  }

  const data = await storefrontFetch<CartQueryResponse>(CART_QUERY, { id: storedId });
  hydrated = true;

  if (!isUsableCart(data?.cart)) {
    resetCart();
    dispatchCartUpdated(currentCart);
    return currentCart;
  }

  const cart = setCurrentCart(data.cart);
  dispatchCartUpdated(cart);
  return cart;
}

function getHydratePromise(): Promise<Cart> {
  hydratePromise ??= hydrateCart().catch(() => {
    hydrated = true;
    resetCart();
    dispatchCartUpdated(currentCart);
    return currentCart;
  });

  return hydratePromise;
}

export async function getCart(): Promise<Cart> {
  if (!isStorefrontConfigured) return EMPTY_CART;

  return getHydratePromise();
}

export async function ensureCart(): Promise<string> {
  if (!isStorefrontConfigured) return "";

  await getHydratePromise();
  if (currentCart.id) return currentCart.id;

  const data = await storefrontFetch<CartCreateResponse>(CART_CREATE_MUTATION);
  const cart = handleMutationPayload(data?.cartCreate);
  return cart?.id ?? "";
}

export async function addLine(variantId: string, qty = 1): Promise<Cart> {
  if (!isStorefrontConfigured) return EMPTY_CART;

  const quantity = Math.max(1, Math.floor(qty));
  if (!variantId) return currentCart;

  const cartId = await ensureCart();
  if (!cartId) return currentCart;

  const data = await storefrontFetch<CartLinesAddResponse>(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity }],
  });
  return handleMutationPayload(data?.cartLinesAdd) ?? currentCart;
}

export async function updateLine(lineId: string, qty: number): Promise<Cart> {
  if (!isStorefrontConfigured) return EMPTY_CART;
  if (!lineId) return currentCart;
  if (qty <= 0) return removeLine(lineId);

  const cartId = await ensureCart();
  if (!cartId) return currentCart;

  const data = await storefrontFetch<CartLinesUpdateResponse>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity: Math.floor(qty) }],
  });
  return handleMutationPayload(data?.cartLinesUpdate) ?? currentCart;
}

export async function removeLine(lineId: string): Promise<Cart> {
  if (!isStorefrontConfigured) return EMPTY_CART;
  if (!lineId) return currentCart;

  const cartId = await ensureCart();
  if (!cartId) return currentCart;

  const data = await storefrontFetch<CartLinesRemoveResponse>(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });
  return handleMutationPayload(data?.cartLinesRemove) ?? currentCart;
}

if (hasDocument()) {
  document.addEventListener("cart:add", (event) => {
    const detail = (event as CustomEvent<{ variantId?: string; quantity?: number }>).detail;
    void addLine(detail?.variantId ?? "", detail?.quantity ?? 1).then(() => {
      document.dispatchEvent(new CustomEvent("cart:open"));
    });
  });

  queueMicrotask(() => {
    void getHydratePromise();
  });
}
