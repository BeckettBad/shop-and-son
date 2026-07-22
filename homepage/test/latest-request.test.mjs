import assert from "node:assert/strict";
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
