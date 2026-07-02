import {
  getProduct,
  isStorefrontConfigured,
  sanitizeShopifyHtml,
  type ProductDetail,
  type ProductOption,
  type ProductVariant,
} from "./storefront-client";

declare global {
  interface Window {
    __cartReady?: boolean;
  }
}

const homeUrl = import.meta.env.BASE_URL.replace(/\/$/, "") + "/";
const shopifyProductUrl = (handle: string) =>
  `https://shopandson.com/products/${encodeURIComponent(handle)}`;

const setText = (element: HTMLElement, value: string) => {
  element.textContent = value;
};

const renderHomeLink = () => {
  const link = document.createElement("a");
  link.className = "product-detail__home-link";
  link.href = homeUrl;
  link.textContent = "back home";
  return link;
};

const renderMessage = (container: HTMLElement, message: string) => {
  const line = document.createElement("p");
  line.className = "product-detail__message";
  line.textContent = message;
  container.className = "product-detail__state product-detail__state--message";
  container.replaceChildren(line, renderHomeLink());
};

const renderStorefrontFallback = (container: HTMLElement, handle: string) => {
  const link = document.createElement("a");
  link.className = "product-detail__fallback-link";
  link.href = shopifyProductUrl(handle);
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "buy on shopandson.com";
  container.className = "product-detail__state product-detail__state--message";
  container.replaceChildren(link);
};

const getVisibleOptions = (product: ProductDetail) =>
  product.options.filter((option) => option.values.length > 0);

const isSingleVariantProduct = (product: ProductDetail) => {
  const options = getVisibleOptions(product);
  return options.length === 0 || (options.length === 1 && options[0].values.length <= 1);
};

const optionKey = (name: string) => name.toLowerCase();

const valuesMatchVariant = (variant: ProductVariant, selectedValues: Map<string, string>) =>
  variant.selectedOptions.every((selectedOption) => {
    const selectedValue = selectedValues.get(optionKey(selectedOption.name));
    return selectedValue === selectedOption.value;
  });

const resolveVariant = (variants: ProductVariant[], selectedValues: Map<string, string>) =>
  variants.find((variant) => valuesMatchVariant(variant, selectedValues));

const copySelectedValues = (selectedValues: Map<string, string>) => new Map(selectedValues);

const setValuesFromVariant = (selectedValues: Map<string, string>, variant: ProductVariant | undefined) => {
  variant?.selectedOptions.forEach((selectedOption) => {
    selectedValues.set(optionKey(selectedOption.name), selectedOption.value);
  });
};

const makeButtonOrLink = (product: ProductDetail, variant: ProductVariant | undefined) => {
  const hasCart = window.__cartReady === true;
  if (!hasCart && product.availableForSale !== false) {
    const link = document.createElement("a");
    link.className = "product-detail__add";
    link.href = shopifyProductUrl(product.handle);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "buy on shopandson.com";
    return link;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "product-detail__add";

  if (product.availableForSale === false) {
    button.textContent = "sold out";
    button.disabled = true;
    return button;
  }

  button.textContent = "add to cart";
  button.disabled = !variant?.availableForSale;
  button.addEventListener("click", () => {
    if (!variant?.availableForSale) return;
    document.dispatchEvent(
      new CustomEvent("cart:add", {
        detail: {
          variantId: variant.id,
          quantity: 1,
        },
      }),
    );
  });
  return button;
};

const renderVariantSelector = (
  product: ProductDetail,
  selectedValues: Map<string, string>,
  onSelect: (option: ProductOption, value: string) => void,
) => {
  if (isSingleVariantProduct(product)) return undefined;

  const selector = document.createElement("div");
  selector.className = "product-detail__variants";

  getVisibleOptions(product).forEach((option) => {
    const row = document.createElement("div");
    row.className = "product-detail__variant-row";

    const label = document.createElement("p");
    label.className = "product-detail__variant-label";
    label.textContent = option.name;

    const list = document.createElement("div");
    list.className = "product-detail__variant-values";

    option.values.forEach((value) => {
      const button = document.createElement("button");
      const candidateValues = copySelectedValues(selectedValues);
      candidateValues.set(optionKey(option.name), value);
      const candidateVariant = resolveVariant(product.variants, candidateValues);
      const isUnavailable = !candidateVariant?.availableForSale;

      button.type = "button";
      button.className = "product-detail__variant";
      button.textContent = value;
      button.disabled = isUnavailable;
      button.classList.toggle("is-selected", selectedValues.get(optionKey(option.name)) === value);
      button.classList.toggle("is-unavailable", isUnavailable);
      button.addEventListener("click", () => onSelect(option, value));
      list.append(button);
    });

    row.append(label, list);
    selector.append(row);
  });

  return selector;
};

const renderProduct = (container: HTMLElement, product: ProductDetail) => {
  const selectedValues = new Map<string, string>();
  const initialVariant = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  setValuesFromVariant(selectedValues, initialVariant);

  const gallery = document.createElement("section");
  gallery.className = "product-detail__gallery";
  product.images.forEach((productImage, index) => {
    const image = document.createElement("img");
    image.className = "product-detail__image";
    image.src = productImage.url;
    image.alt = productImage.altText || product.title;
    image.decoding = "async";
    image.loading = index === 0 ? "eager" : "lazy";
    image.fetchPriority = index === 0 ? "high" : "auto";
    if (productImage.width) image.width = productImage.width;
    if (productImage.height) image.height = productImage.height;
    if (productImage.srcset) {
      image.srcset = productImage.srcset;
      image.sizes = "(max-width: 760px) 100vw, 55vw";
    }
    gallery.append(image);
  });

  const detail = document.createElement("section");
  detail.className = "product-detail__panel";

  const vendor = document.createElement("p");
  vendor.className = "product-detail__vendor";
  setText(vendor, product.vendor);

  const title = document.createElement("h1");
  title.className = "product-detail__title";
  setText(title, product.title);

  const price = document.createElement("p");
  price.className = "product-detail__price";

  const controlSlot = document.createElement("div");
  controlSlot.className = "product-detail__control";

  const desc = document.createElement("div");
  desc.className = "product-detail__desc";
  desc.innerHTML = sanitizeShopifyHtml(product.descriptionHtml);

  const renderControls = () => {
    const variant = isSingleVariantProduct(product)
      ? initialVariant
      : resolveVariant(product.variants, selectedValues);
    price.textContent = variant?.price ?? initialVariant?.price ?? "";
    const selector = renderVariantSelector(product, selectedValues, (option, value) => {
      selectedValues.set(optionKey(option.name), value);
      renderControls();
    });
    const addControl = makeButtonOrLink(product, variant);
    const controls: Node[] = selector ? [selector, addControl] : [addControl];
    controlSlot.replaceChildren(...controls);
  };

  renderControls();

  detail.append(vendor, title, price, controlSlot, desc);

  container.className = "product-detail__content";
  container.replaceChildren(gallery, detail);
};

export function mountProductView(container: HTMLElement, handle: string): void {
  const init = async () => {
    container.className = "product-detail__state";
    container.textContent = "loading";

    if (!handle) {
      renderMessage(container, "this piece is no longer listed");
      return;
    }

    if (!isStorefrontConfigured) {
      renderStorefrontFallback(container, handle);
      return;
    }

    const product = await getProduct(handle);
    if (!product) {
      renderMessage(container, "this piece is no longer listed");
      return;
    }

    renderProduct(container, product);
  };

  void init();
}
