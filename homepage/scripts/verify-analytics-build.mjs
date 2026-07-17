import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PRODUCTION_COLLECTOR = "https://operations.shopandson.com/v1/events";

async function readBuildFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      contents.push(...(await readBuildFiles(entryPath)));
    } else if (entry.isFile() && /\.(?:html|js)$/.test(entry.name)) {
      contents.push({ path: entryPath, content: await readFile(entryPath, "utf8") });
    }
  }
  return contents;
}

export async function verifyAnalyticsBuild({ distDir, configuredUrl }) {
  const files = await readBuildFiles(distDir);
  const javascript = files.filter((file) => file.path.endsWith(".js"));
  const html = files.filter((file) => file.path.endsWith(".html"));

  if (!configuredUrl) {
    const escapedCollector = PRODUCTION_COLLECTOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hasActiveRuntime = javascript.some((file) =>
      new RegExp(`PUBLIC_OPERATIONS_EVENTS_URL\\s*:\\s*["']${escapedCollector}["']`).test(file.content),
    );
    const hasCollectorCsp = html.some((file) => {
      const connectSource = file.content.match(/Content-Security-Policy[^>]*connect-src\s+([^;]+)/i)?.[1];
      return connectSource?.includes(new URL(PRODUCTION_COLLECTOR).origin) ?? false;
    });
    if (hasActiveRuntime || hasCollectorCsp) {
      throw new Error("Analytics is active in an inactive build");
    }
    return;
  }

  const escapedUrl = configuredUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const collectorOrigin = new URL(configuredUrl).origin;

  const hasRuntimeConfiguration = javascript.some((file) =>
    new RegExp(`PUBLIC_OPERATIONS_EVENTS_URL\\s*:\\s*["']${escapedUrl}["']`).test(file.content),
  );
  if (!hasRuntimeConfiguration) {
    throw new Error("Configured Operations collector is absent from emitted runtime configuration");
  }

  const hasCollectorCsp = html.some((file) => {
    const connectSource = file.content.match(/Content-Security-Policy[^>]*connect-src\s+([^;]+)/i)?.[1];
    return connectSource?.includes(collectorOrigin) ?? false;
  });
  if (!hasCollectorCsp) {
    throw new Error("Configured Operations collector origin is absent from emitted Content-Security-Policy");
  }

  const hasPrivateTransport = javascript.some(
    (file) =>
      /credentials\s*:\s*["']omit["']/.test(file.content) &&
      /referrerPolicy\s*:\s*["']no-referrer["']/.test(file.content),
  );
  if (!hasPrivateTransport) {
    throw new Error("Emitted analytics transport does not omit credentials and referrers");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const distDir = path.resolve(process.argv[2] ?? "dist");
  const configuredUrl = process.env.PUBLIC_OPERATIONS_EVENTS_URL?.trim() ?? "";
  if (configuredUrl && configuredUrl !== PRODUCTION_COLLECTOR) {
    throw new Error(`PUBLIC_OPERATIONS_EVENTS_URL must equal ${PRODUCTION_COLLECTOR}`);
  }
  await verifyAnalyticsBuild({ distDir, configuredUrl });
  console.log(configuredUrl ? "analytics_build=active_verified" : "analytics_build=inactive_verified");
}
