CREATE TABLE funnel_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view',
    'product_view',
    'cart_add',
    'cart_update',
    'cart_remove',
    'checkout_begin',
    'newsletter_signup'
  )),
  page_kind TEXT,
  product_handle TEXT,
  quantity INTEGER,
  total_quantity INTEGER,
  distinct_line_count INTEGER,
  cart_value_cents INTEGER,
  currency TEXT,
  campaign TEXT
);

CREATE INDEX funnel_events_occurred_at ON funnel_events (occurred_at);
CREATE INDEX funnel_events_type_occurred_at ON funnel_events (event_type, occurred_at);
CREATE INDEX funnel_events_session_received_at ON funnel_events (session_id, received_at);

CREATE TABLE event_rate_limits (
  rate_key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  event_count INTEGER NOT NULL CHECK (event_count >= 1),
  PRIMARY KEY (rate_key, window_start)
);

CREATE TABLE daily_funnel_metrics (
  date TEXT PRIMARY KEY,
  page_views INTEGER NOT NULL DEFAULT 0,
  product_views INTEGER NOT NULL DEFAULT 0,
  cart_adds INTEGER NOT NULL DEFAULT 0,
  cart_updates INTEGER NOT NULL DEFAULT 0,
  cart_removes INTEGER NOT NULL DEFAULT 0,
  checkout_begins INTEGER NOT NULL DEFAULT 0,
  newsletter_signups INTEGER NOT NULL DEFAULT 0,
  distinct_sessions INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE daily_cloudflare_metrics (
  date TEXT PRIMARY KEY,
  requests INTEGER NOT NULL,
  page_views INTEGER NOT NULL,
  unique_ips INTEGER NOT NULL,
  bytes INTEGER NOT NULL,
  threats INTEGER NOT NULL,
  status_1xx INTEGER NOT NULL,
  status_2xx INTEGER NOT NULL,
  status_3xx INTEGER NOT NULL,
  status_4xx INTEGER NOT NULL,
  status_5xx INTEGER NOT NULL,
  status_other INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE daily_shopify_metrics (
  date TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  timezone TEXT NOT NULL,
  orders INTEGER NOT NULL,
  units_sold INTEGER NOT NULL,
  gross_sales_minor INTEGER NOT NULL,
  discounts_minor INTEGER NOT NULL,
  sales_reversals_minor INTEGER NOT NULL,
  net_sales_minor INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE integration_state (
  integration TEXT PRIMARY KEY,
  last_success_at TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL
);