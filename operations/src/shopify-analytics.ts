export interface DailyShopifyMetric {
  cogsMinor: number | null;
  costCoverageComplete: boolean;
  currency: string;
  date: string;
  discountsMinor: number;
  grossProfitMinor: number | null;
  grossSalesMinor: number;
  netSalesMinor: number;
  netSalesWithCostRecordedMinor: number;
  netSalesWithoutCostRecordedMinor: number;
  orders: number;
  salesReversalsMinor: number;
  timezone: string;
  unitsSold: number;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Shopify Analytics returned a malformed response");
  }
  return value as Record<string, unknown>;
}

function wholeNumber(value: unknown, allowNegative = false): number {
  const pattern = allowNegative ? /^-?\d+$/ : /^\d+$/;
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new Error("Shopify Analytics returned an invalid count");
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error("Shopify Analytics count exceeded safe storage");
  return result;
}

function percentageNumber(value: unknown, netSalesMinor: number): number | null {
  if (value === null && netSalesMinor === 0) return null;
  if (typeof value !== "string" || !/^-?\d+(?:\.\d+)?%?$/.test(value)) {
    throw new Error("Shopify Analytics returned an invalid percentage value");
  }
  const result = Number(value.endsWith("%") ? value.slice(0, -1) : value);
  if (!Number.isFinite(result)) throw new Error("Shopify Analytics percentage exceeded safe storage");
  return result;
}

export function decimalToMinor(value: unknown): number {
  if (typeof value !== "string" || !/^-?\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new Error("Shopify Analytics returned an invalid money value");
  }
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = unsigned.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  const signed = negative ? -minor : minor;
  const result = Number(signed);
  if (!Number.isSafeInteger(result)) throw new Error("Shopify Analytics money exceeded safe storage");
  return result;
}

export function normalizeShopifyResponse(
  value: unknown,
  currency: string,
  timezone: string,
): DailyShopifyMetric[] {
  const root = record(value);
  if (Array.isArray(root.errors) && root.errors.length > 0) {
    throw new Error("Shopify Analytics returned GraphQL errors");
  }
  const query = record(record(root.data).shopifyqlQuery);
  if (!Array.isArray(query.parseErrors)) throw new Error("Shopify Analytics omitted parse status");
  if (query.parseErrors.length > 0) {
    const first = query.parseErrors[0];
    const message = typeof first === "string"
      ? first
      : first && typeof first === "object" && !Array.isArray(first)
        ? (first as Record<string, unknown>).message
        : "";
    const detail = typeof message === "string" ? message.replace(/\s+/g, " ").trim().slice(0, 300) : "";
    throw new Error(`Shopify Analytics returned ShopifyQL parse errors${detail ? `: ${detail}` : ""}`);
  }
  const table = record(query.tableData);
  if (!Array.isArray(table.rows)) throw new Error("Shopify Analytics omitted rows");

  return table.rows.map((rawRow) => {
    const row = record(rawRow);
    if (typeof row.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.day)) {
      throw new Error("Shopify Analytics returned an invalid date");
    }
    const cogsMinor = decimalToMinor(row.cost_of_goods_sold);
    const grossProfitMinor = decimalToMinor(row.gross_profit);
    const netSalesMinor = decimalToMinor(row.net_sales);
    const netSalesWithCostRecordedMinor = decimalToMinor(row.net_sales_with_cost_recorded);
    const netSalesWithoutCostRecordedMinor = decimalToMinor(row.net_sales_without_cost_recorded);
    percentageNumber(row.gross_margin, netSalesMinor);
    if (grossProfitMinor !== netSalesMinor - cogsMinor) {
      throw new Error("Shopify Analytics returned inconsistent gross profit");
    }
    const costCoverageComplete = netSalesWithoutCostRecordedMinor === 0
      && netSalesWithCostRecordedMinor === netSalesMinor;
    return {
      cogsMinor: costCoverageComplete ? cogsMinor : null,
      costCoverageComplete,
      currency,
      date: row.day,
      discountsMinor: decimalToMinor(row.discounts),
      grossProfitMinor: costCoverageComplete ? grossProfitMinor : null,
      grossSalesMinor: decimalToMinor(row.gross_sales),
      netSalesMinor,
      netSalesWithCostRecordedMinor,
      netSalesWithoutCostRecordedMinor,
      orders: wholeNumber(row.orders),
      salesReversalsMinor: decimalToMinor(row.sales_reversals),
      timezone,
      unitsSold: wholeNumber(row.net_items_sold, true),
    };
  });
}

const GRAPHQL_QUERY = `query DailySales($query: String!) {
  shopifyqlQuery(query: $query) {
    tableData {
      columns { name dataType displayName }
      rows
    }
    parseErrors
  }
}`;

interface ShopifySyncOptions {
  clientId: string;
  clientSecret: string;
  currency: string;
  end: string;
  fetcher?: typeof fetch;
  now?: () => Date;
  shopDomain: string;
  start: string;
  timezone: string;
}

export async function syncShopifyAnalytics(
  db: D1Database,
  options: ShopifySyncOptions,
): Promise<void> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => new Date());
  const updatedAt = now().toISOString();
  const shopifyql = `FROM sales
SHOW orders, net_items_sold, gross_sales, discounts, sales_reversals, net_sales, cost_of_goods_sold, gross_profit, gross_margin, net_sales_with_cost_recorded, net_sales_without_cost_recorded
WHERE sales_channel = '& Son Website'
TIMESERIES day
SINCE ${options.start} UNTIL ${options.end}
ORDER BY day ASC
LIMIT 1000
WITH CURRENCY '${options.currency}', TIMEZONE '${options.timezone}'`;

  try {
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(options.shopDomain)) {
      throw new Error("Invalid Shopify shop domain");
    }
    if (!/^[A-Z]{3}$/.test(options.currency)) throw new Error("Invalid Shopify reporting currency");
    if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(options.timezone)) throw new Error("Invalid Shopify reporting timezone");

    const tokenResponse = await fetcher(
      `https://${options.shopDomain}/admin/oauth/access_token`,
      {
        body: new URLSearchParams({
          client_id: options.clientId,
          client_secret: options.clientSecret,
          grant_type: "client_credentials",
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!tokenResponse.ok) throw new Error(`Shopify token HTTP ${tokenResponse.status}`);
    const tokenPayload = record(await tokenResponse.json());
    if (typeof tokenPayload.access_token !== "string" || !tokenPayload.access_token) {
      throw new Error("Shopify token response was malformed");
    }
    if (
      typeof tokenPayload.scope !== "string"
      || !tokenPayload.scope.split(",").map((scope) => scope.trim()).includes("read_reports")
    ) {
      throw new Error("Shopify token lacks read_reports scope");
    }

    const response = await fetcher(
      `https://${options.shopDomain}/admin/api/2026-07/graphql.json`,
      {
        body: JSON.stringify({ query: GRAPHQL_QUERY, variables: { query: shopifyql } }),
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": tokenPayload.access_token,
        },
        method: "POST",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) throw new Error(`Shopify Analytics HTTP ${response.status}`);

    const metrics = normalizeShopifyResponse(await response.json(), options.currency, options.timezone);
    const statements = metrics.map((metric) => db.prepare(`
      INSERT INTO daily_online_shopify_metrics (
        date, currency, timezone, orders, net_sales_minor, cogs_minor,
        gross_profit_minor, net_sales_with_cost_recorded_minor,
        net_sales_without_cost_recorded_minor, cost_coverage_complete, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        currency = excluded.currency,
        timezone = excluded.timezone,
        orders = excluded.orders,
        net_sales_minor = excluded.net_sales_minor,
        cogs_minor = excluded.cogs_minor,
        gross_profit_minor = excluded.gross_profit_minor,
        net_sales_with_cost_recorded_minor = excluded.net_sales_with_cost_recorded_minor,
        net_sales_without_cost_recorded_minor = excluded.net_sales_without_cost_recorded_minor,
        cost_coverage_complete = excluded.cost_coverage_complete,
        updated_at = excluded.updated_at
    `).bind(
      metric.date,
      metric.currency,
      metric.timezone,
      metric.orders,
      metric.netSalesMinor,
      metric.cogsMinor,
      metric.grossProfitMinor,
      metric.netSalesWithCostRecordedMinor,
      metric.netSalesWithoutCostRecordedMinor,
      metric.costCoverageComplete ? 1 : 0,
      updatedAt,
    ));
    statements.push(db.prepare(`
      INSERT INTO integration_state (integration, last_success_at, last_error, updated_at)
      VALUES ('shopify_online_analytics', ?, NULL, ?)
      ON CONFLICT(integration) DO UPDATE SET
        last_success_at = excluded.last_success_at,
        last_error = NULL,
        updated_at = excluded.updated_at
    `).bind(updatedAt, updatedAt));
    await db.batch(statements);
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 500) : "Unknown Shopify Analytics error";
    await db.prepare(`
      INSERT INTO integration_state (integration, last_error, updated_at)
      VALUES ('shopify_online_analytics', ?, ?)
      ON CONFLICT(integration) DO UPDATE SET
        last_error = excluded.last_error,
        updated_at = excluded.updated_at
    `).bind(detail, updatedAt).run();
    throw error;
  }
}
