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
const activeCarouselPreloads = new Set<HTMLImageElement>();

export interface ProductImageSeed {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface MountProductViewOptions {
  seedImage?: ProductImageSeed;
}

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

const getSeedImageUrl = (seedImage: ProductImageSeed | undefined) => {
  const url = seedImage?.url.trim();
  return url || undefined;
};

const upgradeSeededImage = (
  image: HTMLImageElement,
  productImage: ProductDetail["images"][number],
  onUpgrade?: () => void,
) => {
  const loader = new Image();
  loader.crossOrigin = "anonymous";
  loader.decoding = "async";
  if (productImage.srcset) {
    loader.srcset = productImage.srcset;
    loader.sizes = "(max-width: 760px) 54vw, 55vw";
  }
  loader.onload = () => {
    if (!image.isConnected) return;

    image.crossOrigin = "anonymous";
    image.src = productImage.url;
    if (productImage.srcset) {
      image.srcset = productImage.srcset;
      image.sizes = "(max-width: 760px) 54vw, 55vw";
    }
    onUpgrade?.();
  };
  loader.src = productImage.url;
};

const preloadCarouselImage = (image: HTMLImageElement | null | undefined) => {
  if (!image || image.dataset.carouselPreloaded === "true") return;

  image.dataset.carouselPreloaded = "true";
  image.loading = "eager";

  const loader = new Image();
  loader.crossOrigin = "anonymous";
  loader.decoding = "async";
  activeCarouselPreloads.add(loader);
  const releaseLoader = () => activeCarouselPreloads.delete(loader);
  loader.onload = releaseLoader;
  loader.onerror = releaseLoader;

  const srcset = image.getAttribute("srcset");
  const sizes = image.getAttribute("sizes");
  if (srcset) {
    loader.srcset = srcset;
    if (sizes) loader.sizes = sizes;
  }

  loader.src = image.currentSrc || image.src;
};

interface ProductLightbox {
  overlay: HTMLElement;
  frame: HTMLElement;
  image: HTMLImageElement;
  previous?: HTMLButtonElement;
  next?: HTMLButtonElement;
  counter?: HTMLElement;
}

const setProductLightboxOpen = (isOpen: boolean) => {
  document.documentElement.classList.toggle("is-product-lightbox-open", isOpen);
  document.body.classList.toggle("is-product-lightbox-open", isOpen);
};

const getHistoryStateWithProductLightbox = () => {
  const state = history.state;
  if (state && typeof state === "object") {
    return { ...state, productLightbox: true };
  }

  return { productLightbox: true };
};

const renderSeededProduct = (container: HTMLElement, seedImage: ProductImageSeed) => {
  const seedUrl = getSeedImageUrl(seedImage);
  if (!seedUrl) return;

  const gallery = document.createElement("section");
  gallery.className = "product-detail__gallery";
  gallery.setAttribute("aria-label", "product images");

  const carousel = document.createElement("div");
  carousel.className = "product-detail__carousel";

  const viewport = document.createElement("div");
  viewport.className = "product-detail__carousel-viewport";

  const track = document.createElement("div");
  track.className = "product-detail__carousel-track";

  const slide = document.createElement("div");
  slide.className = "product-detail__carousel-slide is-active";
  slide.setAttribute("aria-hidden", "false");

  const image = document.createElement("img");
  image.className = "product-detail__image";
  image.crossOrigin = "anonymous";
  image.src = seedUrl;
  image.alt = seedImage.alt ?? "";
  image.decoding = "async";
  image.loading = "eager";
  image.fetchPriority = "high";
  if (seedImage.width) image.width = seedImage.width;
  if (seedImage.height) image.height = seedImage.height;

  const detail = document.createElement("section");
  detail.className = "product-detail__panel";
  detail.textContent = "loading";

  slide.append(image);
  track.append(slide);
  viewport.append(track);
  carousel.append(viewport);
  gallery.append(carousel);

  container.className = "product-detail__content";
  container.replaceChildren(gallery, detail);
};

const renderProductGallery = (product: ProductDetail, seedImage?: ProductImageSeed) => {
  const gallery = document.createElement("section");
  gallery.className = "product-detail__gallery";
  gallery.setAttribute("aria-label", "product images");

  const carousel = document.createElement("div");
  carousel.className = "product-detail__carousel";

  const viewport = document.createElement("div");
  viewport.className = "product-detail__carousel-viewport";

  const track = document.createElement("div");
  track.className = "product-detail__carousel-track";

  const slides: HTMLElement[] = [];
  const imageCount = product.images.length;
  let activeIndex = 0;
  let carouselCounter: HTMLElement | undefined;
  let activeLightbox: ProductLightbox | undefined;
  let touchStartX: number | undefined;
  let touchStartY: number | undefined;
  let didSwipeCarousel = false;

  function updateLightboxImage() {
    if (!activeLightbox) return;

    const activeSlide = slides[activeIndex];
    const carouselImage = activeSlide?.querySelector<HTMLImageElement>(".product-detail__image");
    const productImage = product.images[activeIndex];
    const srcset = carouselImage?.getAttribute("srcset") || productImage?.srcset || "";
    const src = carouselImage?.currentSrc || carouselImage?.src || productImage?.url || "";

    activeLightbox.image.crossOrigin = "anonymous";
    activeLightbox.image.src = src;
    if (srcset) {
      activeLightbox.image.srcset = srcset;
      activeLightbox.image.sizes = "100vw";
    } else {
      activeLightbox.image.removeAttribute("srcset");
      activeLightbox.image.removeAttribute("sizes");
    }
    activeLightbox.image.alt = carouselImage?.alt ?? product.title;
    if (productImage?.width) activeLightbox.image.width = productImage.width;
    if (productImage?.height) activeLightbox.image.height = productImage.height;
    if (activeLightbox.counter) activeLightbox.counter.textContent = `${activeIndex + 1} / ${imageCount}`;
  }

  product.images.forEach((productImage, index) => {
    const seedUrl = index === 0 ? getSeedImageUrl(seedImage) : undefined;
    const slide = document.createElement("div");
    slide.className = "product-detail__carousel-slide";

    const image = document.createElement("img");
    image.className = "product-detail__image";
    image.crossOrigin = "anonymous";
    image.src = seedUrl ?? productImage.url;
    image.alt = productImage.altText || product.title;
    image.decoding = "async";
    image.loading = index === 0 ? "eager" : "lazy";
    image.fetchPriority = index === 0 ? "high" : "auto";
    if (productImage.width) image.width = productImage.width;
    if (productImage.height) image.height = productImage.height;
    if (productImage.srcset && !seedUrl) {
      image.srcset = productImage.srcset;
      image.sizes = "(max-width: 760px) 54vw, 55vw";
    }
    if (seedUrl) {
      window.requestAnimationFrame(() => upgradeSeededImage(image, productImage, updateLightboxImage));
    }

    slide.append(image);
    slides.push(slide);
    track.append(slide);
  });

  viewport.append(track);
  carousel.append(viewport);

  const preloadSlideImage = (index: number) => {
    const image = slides[index]?.querySelector<HTMLImageElement>(".product-detail__image");
    preloadCarouselImage(image);
  };

  const preloadAdjacentImages = () => {
    if (imageCount < 1) return;

    preloadSlideImage(activeIndex);
    if (imageCount > 1) {
      preloadSlideImage((activeIndex + 1) % imageCount);
      preloadSlideImage((activeIndex - 1 + imageCount) % imageCount);
    }
  };

  const setActiveImage = (index: number) => {
    if (imageCount < 1) return;

    activeIndex = (index + imageCount) % imageCount;
    if (carouselCounter) carouselCounter.textContent = `${activeIndex + 1} / ${imageCount}`;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    preloadAdjacentImages();
    updateLightboxImage();
  };

  const openLightbox = () => {
    if (imageCount < 1 || activeLightbox) return;

    const overlay = document.createElement("div");
    overlay.className = "product-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "product image");

    const frame = document.createElement("div");
    frame.className = "product-lightbox__frame";

    const image = document.createElement("img");
    image.className = "product-lightbox__image";
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.loading = "eager";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "product-lightbox__close";
    close.setAttribute("aria-label", "close image");
    close.textContent = "×";

    const cleanupFns: (() => void)[] = [];
    let lightboxTouchStartX: number | undefined;
    let lightboxTouchStartY: number | undefined;
    let didSwipeLightbox = false;
    let pushedHistoryEntry = false;
    let isClosed = false;

    const closeLightbox = (restoreHistory = true) => {
      if (isClosed) return;

      isClosed = true;
      activeLightbox = undefined;
      setProductLightboxOpen(false);
      overlay.classList.remove("is-open");
      cleanupFns.forEach((cleanup) => cleanup());
      window.setTimeout(() => overlay.remove(), 180);
      if (restoreHistory && pushedHistoryEntry) {
        history.back();
      }
    };

    const goToLightboxImage = (index: number) => {
      setActiveImage(index);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft" && imageCount > 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        goToLightboxImage(activeIndex - 1);
        return;
      }
      if (event.key === "ArrowRight" && imageCount > 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        goToLightboxImage(activeIndex + 1);
      }
    };

    const handlePopstate = () => {
      closeLightbox(false);
    };

    const handleBackdropClick = (event: MouseEvent) => {
      if (didSwipeLightbox) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target === overlay || !target.closest(".product-lightbox__frame")) {
        closeLightbox();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      lightboxTouchStartX = touch.clientX;
      lightboxTouchStartY = touch.clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch || lightboxTouchStartX === undefined || lightboxTouchStartY === undefined) return;

      const deltaX = touch.clientX - lightboxTouchStartX;
      const deltaY = touch.clientY - lightboxTouchStartY;
      lightboxTouchStartX = undefined;
      lightboxTouchStartY = undefined;

      if (Math.abs(deltaX) < 36 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

      didSwipeLightbox = true;
      window.setTimeout(() => {
        didSwipeLightbox = false;
      }, 240);
      if (imageCount > 1) {
        goToLightboxImage(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    };

    image.addEventListener("click", () => {
      if (didSwipeLightbox) return;
      closeLightbox();
    });
    close.addEventListener("click", () => closeLightbox());
    overlay.addEventListener("click", handleBackdropClick);
    overlay.addEventListener("touchstart", handleTouchStart, { passive: true });
    overlay.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("keydown", handleKeydown, true);
    window.addEventListener("popstate", handlePopstate);
    cleanupFns.push(
      () => overlay.removeEventListener("click", handleBackdropClick),
      () => document.removeEventListener("keydown", handleKeydown, true),
      () => window.removeEventListener("popstate", handlePopstate),
    );

    frame.append(image);
    overlay.append(frame, close);

    const lightbox: ProductLightbox = {
      overlay,
      frame,
      image,
    };

    if (imageCount > 1) {
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "product-lightbox__arrow product-lightbox__arrow--previous";
      previous.setAttribute("aria-label", "previous image");
      previous.textContent = "←";

      const next = document.createElement("button");
      next.type = "button";
      next.className = "product-lightbox__arrow product-lightbox__arrow--next";
      next.setAttribute("aria-label", "next image");
      next.textContent = "→";

      const counter = document.createElement("p");
      counter.className = "product-lightbox__counter";
      counter.setAttribute("aria-live", "polite");

      previous.addEventListener("click", () => goToLightboxImage(activeIndex - 1));
      next.addEventListener("click", () => goToLightboxImage(activeIndex + 1));
      frame.append(previous, next, counter);
      lightbox.previous = previous;
      lightbox.next = next;
      lightbox.counter = counter;
    }

    activeLightbox = lightbox;
    document.body.append(overlay);
    setProductLightboxOpen(true);
    updateLightboxImage();
    if (!history.state?.productLightbox) {
      history.pushState(getHistoryStateWithProductLightbox(), "", location.href);
      pushedHistoryEntry = true;
    }
    window.requestAnimationFrame(() => overlay.classList.add("is-open"));
  };

  if (imageCount > 1) {
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "product-detail__carousel-arrow product-detail__carousel-arrow--previous";
    previous.setAttribute("aria-label", "previous image");
    previous.textContent = "←";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "product-detail__carousel-arrow product-detail__carousel-arrow--next";
    next.setAttribute("aria-label", "next image");
    next.textContent = "→";

    const counter = document.createElement("p");
    counter.className = "product-detail__carousel-counter";
    counter.setAttribute("aria-live", "polite");
    carouselCounter = counter;

    previous.addEventListener("click", () => setActiveImage(activeIndex - 1));
    next.addEventListener("click", () => setActiveImage(activeIndex + 1));
    viewport.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true },
    );
    viewport.addEventListener(
      "touchend",
      (event) => {
        const touch = event.changedTouches[0];
        if (!touch || touchStartX === undefined || touchStartY === undefined) return;

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        touchStartX = undefined;
        touchStartY = undefined;

        if (Math.abs(deltaX) < 36 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
        didSwipeCarousel = true;
        window.setTimeout(() => {
          didSwipeCarousel = false;
        }, 240);
        setActiveImage(activeIndex + (deltaX < 0 ? 1 : -1));
      },
      { passive: true },
    );

    carousel.append(previous, next, counter);
    setActiveImage(0);
  } else {
    setActiveImage(0);
  }

  viewport.addEventListener("click", (event) => {
    if (didSwipeCarousel) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".product-detail__image")) return;

    openLightbox();
  });

  gallery.append(carousel);
  return gallery;
};

const bindPanelOverflowHint = (panel: HTMLElement) => {
  const updateMoreBelow = () => {
    panel.classList.toggle("is-more-below", panel.scrollTop + panel.clientHeight < panel.scrollHeight - 4);
  };

  panel.addEventListener("scroll", updateMoreBelow, { passive: true });
  window.addEventListener("resize", updateMoreBelow, { passive: true });

  const resizeObserver = new ResizeObserver(updateMoreBelow);
  resizeObserver.observe(panel);

  const cleanupObserver = new MutationObserver(() => {
    if (document.body.contains(panel)) return;
    window.removeEventListener("resize", updateMoreBelow);
    resizeObserver.disconnect();
    cleanupObserver.disconnect();
  });
  cleanupObserver.observe(document.body, { childList: true, subtree: true });

  updateMoreBelow();
  window.requestAnimationFrame(updateMoreBelow);
};

const renderProduct = (container: HTMLElement, product: ProductDetail, options: MountProductViewOptions = {}) => {
  const selectedValues = new Map<string, string>();
  const initialVariant = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  setValuesFromVariant(selectedValues, initialVariant);

  const gallery = renderProductGallery(product, options.seedImage);

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
  bindPanelOverflowHint(detail);
};

export function mountProductView(container: HTMLElement, handle: string, options: MountProductViewOptions = {}): void {
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

    if (options.seedImage) {
      renderSeededProduct(container, options.seedImage);
    }

    const product = await getProduct(handle);
    if (!product) {
      renderMessage(container, "this piece is no longer listed");
      return;
    }

    renderProduct(container, product, options);
  };

  void init();
}
