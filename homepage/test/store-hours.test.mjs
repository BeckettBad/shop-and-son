import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { site } from "../src/data/content.ts";

const EXPECTED_HOURS = { openHour: 11, closeHour: 19 };

test("store hours remain 11 AM through 7 PM across every homepage consumer", async () => {
  assert.deepEqual(site.hours, EXPECTED_HOURS);

  const [baseScript, nowPlayingScript] = await Promise.all([
    readFile(new URL("../public/scripts/base.js", import.meta.url), "utf8"),
    readFile(new URL("../public/scripts/now-playing.js", import.meta.url), "utf8"),
  ]);

  assert.match(baseScript, /dataset\.openHour \?\? "11"/);
  assert.match(baseScript, /dataset\.closeHour \?\? "19"/);
  assert.match(nowPlayingScript, /dataset\.openHour \?\? "11"/);
  assert.match(nowPlayingScript, /dataset\.closeHour \?\? "19"/);
});
