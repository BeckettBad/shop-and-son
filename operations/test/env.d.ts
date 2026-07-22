declare namespace Cloudflare {
  interface Env {
    CLOUDFLARE_ANALYTICS_TOKEN: string;
    CLOUDFLARE_ZONE_ID: string;
    DASHBOARD_PASSWORD: string;
    DASHBOARD_USERNAME: string;
    EVENT_COLLECTION_ENABLED: string;
    NOTIFICATION_API_TOKEN: string;
    SHOPIFY_CLIENT_ID: string;
    SHOPIFY_CLIENT_SECRET: string;
    SHOPIFY_SHOP_DOMAIN: string;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}