import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => ({
  plugins: [cloudflareTest({
    wrangler: { configPath: "./wrangler.jsonc" },
    miniflare: {
      bindings: {
        CLOUDFLARE_ANALYTICS_TOKEN: "test-cloudflare-token",
        CLOUDFLARE_ZONE_ID: "test-zone-id",
        DASHBOARD_PASSWORD: "test-dashboard-password",
        DASHBOARD_USERNAME: "test-operator",
        NOTIFICATION_API_TOKEN: "test-notification-secret",
        SHOPIFY_CLIENT_ID: "test-shopify-client-id",
        SHOPIFY_CLIENT_SECRET: "test-shopify-client-secret",
        SHOPIFY_SHOP_DOMAIN: "test-shop.myshopify.com",
        TEST_MIGRATIONS: await readD1Migrations(path.join(import.meta.dirname, "migrations")),
      },
    },
  })],
  test: {
    setupFiles: ["./test/apply-migrations.ts"],
  },
}));
