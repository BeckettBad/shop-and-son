CREATE TABLE daily_online_shopify_metrics (
  date TEXT PRIMARY KEY,
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  timezone TEXT NOT NULL,
  orders INTEGER NOT NULL CHECK (orders >= 0),
  net_sales_minor INTEGER NOT NULL,
  cogs_minor INTEGER,
  gross_profit_minor INTEGER,
  net_sales_with_cost_recorded_minor INTEGER NOT NULL,
  net_sales_without_cost_recorded_minor INTEGER NOT NULL,
  cost_coverage_complete INTEGER NOT NULL CHECK (cost_coverage_complete IN (0, 1)),
  updated_at TEXT NOT NULL,
  CHECK (
    (cost_coverage_complete = 1 AND cogs_minor IS NOT NULL AND gross_profit_minor IS NOT NULL)
    OR
    (cost_coverage_complete = 0 AND cogs_minor IS NULL AND gross_profit_minor IS NULL)
  )
);