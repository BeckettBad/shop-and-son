import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createLatestRequestGuard } from "../src/lib/latest-request.ts";

test("a newer request invalidates an older pending request", () => {
  const guard = createLatestRequestGuard();
  const first = guard.begin();
  const second = guard.begin();

  assert.equal(guard.isCurrent(first), false);
  assert.equal(guard.isCurrent(second), true);
});

test("cancelling invalidates the current pending request", () => {
  const guard = createLatestRequestGuard();
  const request = guard.begin();

  guard.cancel();

  assert.equal(guard.isCurrent(request), false);
});

test("product telemetry is gated after the awaited response and product exits cancel pending work", async () => {
  const productSource = await readFile(new URL("../src/lib/product-view.ts", import.meta.url), "utf8");
  const heroSource = await readFile(new URL("../src/components/blocks/HeroVideo.astro", import.meta.url), "utf8");
  const response = productSource.indexOf("const product = await getProduct(handle)");
  const currencyCheck = productSource.indexOf("if (!requestGuard.isCurrent(request)) return", response);
  const render = productSource.indexOf("renderProduct(container, product, options)", currencyCheck);
  const track = productSource.indexOf('trackEvent({ eventType: "product_view"', render);

  assert.ok(response >= 0 && response < currencyCheck);
  assert.ok(currencyCheck < render && render < track);
  assert.ok((heroSource.match(/cancelProductView\(productView\)/g) ?? []).length >= 4);
});
