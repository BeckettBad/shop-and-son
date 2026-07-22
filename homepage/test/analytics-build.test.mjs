import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { verifyAnalyticsBuild } from "../scripts/verify-analytics-build.mjs";

const COLLECTOR = "https://operations.shopandson.com/v1/events";

async function withDist(files, run) {
  const distDir = await mkdtemp(path.join(os.tmpdir(), "andson-analytics-build-"));
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(distDir, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content);
    }
    await run(distDir);
  } finally {
    await rm(distDir, { recursive: true, force: true });
  }
}

test("accepts an active build containing the configured collector", async () => {
  await withDist(
    {
      "index.html": `<meta http-equiv="Content-Security-Policy" content="connect-src 'self' https://operations.shopandson.com;">`,
      "_astro/analytics.js": `const env={PUBLIC_OPERATIONS_EVENTS_URL:"${COLLECTOR}"};fetch(url,{credentials:"omit",referrerPolicy:"no-referrer"});`,
    },
    async (distDir) => {
      await assert.doesNotReject(() =>
        verifyAnalyticsBuild({ distDir, configuredUrl: COLLECTOR }),
      );
    },
  );
});

test("rejects an endpoint that appears only as unrelated build text", async () => {
  await withDist(
    {
      "index.html": `<p>${COLLECTOR}</p>`,
    },
    async (distDir) => {
      await assert.rejects(
        () => verifyAnalyticsBuild({ distDir, configuredUrl: COLLECTOR }),
        /runtime configuration|Content-Security-Policy/,
      );
    },
  );
});

test("rejects active collector wiring when configuration is unset", async () => {
  await withDist(
    {
      "index.html": `<meta http-equiv="Content-Security-Policy" content="connect-src 'self' https://operations.shopandson.com;">`,
      "_astro/analytics.js": `const env={PUBLIC_OPERATIONS_EVENTS_URL:"${COLLECTOR}"};`,
    },
    async (distDir) => {
      await assert.rejects(
        () => verifyAnalyticsBuild({ distDir, configuredUrl: "" }),
        /inactive build/,
      );
    },
  );
});
