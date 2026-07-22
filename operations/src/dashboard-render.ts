export interface FunnelRow {
  date: string;
  page_views: number;
  product_views: number;
  cart_adds: number;
  checkout_begins: number;
  newsletter_signups: number;
  distinct_sessions: number;
}

export interface FunnelSessions {
  cart_sessions: number;
  checkout_sessions: number;
  product_sessions: number;
}

export interface FunnelTrendRow {
  date: string;
  cart_sessions: number;
  checkout_sessions: number;
  product_sessions: number;
}

export interface CloudflareRow {
  date: string;
  requests: number;
  page_views: number;
  unique_ips: number;
  threats: number;
  status_4xx: number;
  status_5xx: number;
}

export interface ShopifyRow {
  cogs_minor: number | null;
  cost_coverage_complete: number;
  date: string;
  currency: string;
  gross_profit_minor: number | null;
  orders: number;
  units_sold: number;
  gross_sales_minor: number;
  discounts_minor: number;
  net_sales_minor: number;
  sales_reversals_minor: number;
}

export interface StateRow {
  target: string;
  status: string;
  consecutive_failures: number;
  latest_detail: string;
  updated_at: string;
}

export interface IncidentRow {
  target: string;
  opened_at: string;
  recovered_at: string | null;
  latest_detail: string;
}

export interface ProbeRow {
  checked_at: string;
  detail: string;
  healthy: number;
  latency_ms: number;
  status_code: number | null;
  target: string;
}

export interface IntegrationRow {
  integration: string;
  last_success_at: string | null;
  last_error: string | null;
}

interface DashboardData {
  cloudflareRows: CloudflareRow[];
  days: number;
  funnelEndDate: string;
  funnelPeriodStart: string;
  funnelRows: FunnelRow[];
  funnelSessions: FunnelSessions | null;
  funnelTrendRows: FunnelTrendRow[];
  incidents: IncidentRow[];
  integrations: IntegrationRow[];
  now: Date;
  onlineShopifyRows: ShopifyRow[];
  periodStart: string;
  probes: ProbeRow[];
  shopifyRows: ShopifyRow[];
  states: StateRow[];
}

type VisualState = "degraded" | "healthy" | "stale" | "unhealthy";
type DatedRow = { date: string };

const DAY_MS = 86_400_000;
const TARGETS = [
  { key: "site", label: "Storefront", description: "The public shopandson.com store" },
  { key: "worker", label: "Now-playing service", description: "The service that supplies the homepage now-playing feature" },
  { key: "spotify_auth", label: "Spotify connection", description: "Whether the now-playing service can connect to Spotify" },
  { key: "feature_toggle", label: "Homepage now-playing feature", description: "Whether the feature is turned on in production" },
] as const;
const INTEGRATIONS = [
  { key: "cloudflare_analytics", label: "Cloudflare traffic", description: "Daily website traffic and estimated visitor totals" },
  { key: "shopify_analytics", label: "Shopify sales", description: "Daily order and sales totals from Shopify" },
  { key: "shopify_online_analytics", label: "Shopify website sales", description: "& Son Website net sales, product cost, and gross profit" },
] as const;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sum<T>(rows: T[], field: keyof T): number {
  return rows.reduce((total, row) => total + Number(row[field] ?? 0), 0);
}

function money(minor: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(minor / 100);
}

function number(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  return `${Math.min(100, (numerator / denominator) * 100).toFixed(1)}%`;
}

function shiftDate(date: string, days: number): string {
  const parsed = Date.parse(`${date}T00:00:00.000Z`);
  return new Date(parsed + days * DAY_MS).toISOString().slice(0, 10);
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Not yet";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDuration(start: string, end: string): string {
  const duration = Math.max(0, Date.parse(end) - Date.parse(start));
  const minutes = Math.floor(duration / 60_000);
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const remainder = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${remainder}m`;
  return `${remainder}m`;
}

function table(
  caption: string,
  headers: string[],
  rows: unknown[][],
  emptyText = "No data has been recorded for this table yet.",
): string {
  const head = headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("");
  const body = rows.length > 0
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td class="empty-cell" colspan="${headers.length}">${escapeHtml(emptyText)}</td></tr>`;
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(caption)}; scroll horizontally when needed"><table><caption>${escapeHtml(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function stateLabel(state: VisualState): string {
  return {
    degraded: "Possible issue",
    healthy: "Working",
    stale: "Update delayed",
    unhealthy: "Needs attention",
  }[state];
}

function healthState(row: StateRow | undefined, now: Date): VisualState {
  if (!row) return "stale";
  const age = now.getTime() - Date.parse(row.updated_at);
  if (!Number.isFinite(age) || age > 15 * 60_000) return "stale";
  if (row.status === "open") return "unhealthy";
  if (row.status === "pending") return "degraded";
  return "healthy";
}

function integrationState(row: IntegrationRow | undefined, now: Date): VisualState {
  if (!row?.last_success_at) return row?.last_error ? "degraded" : "stale";
  const age = now.getTime() - Date.parse(row.last_success_at);
  if (!Number.isFinite(age) || age > 36 * 60 * 60_000) return "stale";
  return row.last_error ? "degraded" : "healthy";
}

function latestProbe(probes: ProbeRow[], target: string): ProbeRow | undefined {
  return probes.find((probe) => probe.target === target);
}

function probeDots(probes: ProbeRow[], target: string): string {
  const targetProbes = probes.filter((probe) => probe.target === target).slice(0, 12).reverse();
  if (targetProbes.length === 0) return `<span class="probe-empty">No checks have run yet</span>`;
  return `<span class="probe-dots" role="img" aria-label="Recent health checks: ${targetProbes.map((probe) => probe.healthy === 1 ? "working" : "problem").join(", ")}">${targetProbes.map((probe) => `<span class="probe-dot ${probe.healthy === 1 ? "dot-good" : "dot-bad"}" aria-hidden="true"></span>`).join("")}</span>`;
}

function matchedRows<T extends { date: string }>(rows: T[], periodStart: string, days: number): { current: T[]; previous: T[] } | null {
  const current = rows.filter((row) => row.date >= periodStart).sort((a, b) => a.date.localeCompare(b.date));
  if (current.length === 0) return null;
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const previous = current.map((row) => byDate.get(shiftDate(row.date, -days))).filter((row): row is T => row !== undefined);
  return previous.length === current.length ? { current, previous } : null;
}

function comparison(current: number, previous: number, matchedDays: number): string {
  if (previous === 0) {
    return current === 0
      ? `<span class="comparison neutral">No change · Compared with the same ${matchedDays} available dates in the previous period</span>`
      : `<span class="comparison positive">First activity · Compared with the same ${matchedDays} available dates in the previous period</span>`;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const direction = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  const sign = change > 0 ? "+" : "";
  return `<span class="comparison ${direction}">${arrow} ${sign}${change.toFixed(1)}% · Compared with the same ${matchedDays} available dates in the previous period</span>`;
}

function sparkline(values: number[]): string {
  if (values.length === 0) return `<div class="spark-empty">No daily totals yet</div>`;
  const width = 160;
  const height = 42;
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = Math.max(1, maximum - minimum);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = 3 + ((maximum - value) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><polyline points="${points}" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
}

interface MetricCardOptions {
  available?: boolean;
  comparisonUnavailableText?: string;
  current?: number;
  display: string;
  key: string;
  label: string;
  note: string;
  previous?: number;
  sparkValues: number[];
  unavailableText?: string;
}

function metricCard(options: MetricCardOptions): string {
  if (options.available === false) {
    return `<article class="metric-card" data-metric="${escapeHtml(options.key)}" data-availability="unavailable">
    <div class="metric-label">${escapeHtml(options.label)}</div>
    <div class="metric-value unavailable-value">Not available yet</div>
    <span class="comparison unavailable">${escapeHtml(options.unavailableText ?? "No daily totals have been recorded for this period yet.")}</span>
    ${sparkline([])}
    <p>${escapeHtml(options.note)}</p>
  </article>`;
  }
  const currentAttribute = options.current === undefined ? "" : ` data-current="${options.current}"`;
  const previousAttribute = options.previous === undefined ? "" : ` data-previous="${options.previous}"`;
  const comparisonMarkup = options.current === undefined || options.previous === undefined
    ? `<span class="comparison unavailable">${escapeHtml(options.comparisonUnavailableText ?? "No comparison yet because the previous period is missing one or more matching days.")}</span>`
    : comparison(options.current, options.previous, options.sparkValues.length);
  return `<article class="metric-card" data-metric="${escapeHtml(options.key)}"${currentAttribute}${previousAttribute}>
    <div class="metric-label">${escapeHtml(options.label)}</div>
    <div class="metric-value">${escapeHtml(options.display)}</div>
    ${comparisonMarkup}
    ${sparkline(options.sparkValues)}
    <p>${escapeHtml(options.note)}</p>
  </article>`;
}

interface ChartSeries {
  color: string;
  field: string;
  label: string;
}

function chartDataTable<T extends DatedRow>(rows: T[], series: ChartSeries[], caption: string): string {
  const head = ["Date", ...series.map((item) => item.label)].map((label) => `<th scope="col">${escapeHtml(label)}</th>`).join("");
  const body = rows.map((row) => `<tr><td>${escapeHtml(row.date)}</td>${series.map((item) => `<td>${escapeHtml(numericField(row, item.field))}</td>`).join("")}</tr>`).join("");
  return `<table class="chart-data"><caption>${escapeHtml(caption)}: stored daily values</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function numericField(row: object, field: string): number {
  const value = (row as Record<string, unknown>)[field];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function contiguousSegments<T extends DatedRow>(rows: T[]): T[][] {
  const segments: T[][] = [];
  for (const row of rows) {
    const last = segments.at(-1)?.at(-1);
    if (!last || shiftDate(last.date, 1) !== row.date) segments.push([row]);
    else segments.at(-1)?.push(row);
  }
  return segments;
}

function lineChart<T extends DatedRow>(rows: T[], series: ChartSeries[], ariaLabel: string): string {
  if (rows.length === 0) return `<div class="chart-empty">No daily totals are available yet. This chart will appear after its next successful data update.</div>`;
  const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const width = 720;
  const height = 250;
  const left = 42;
  const right = 14;
  const top = 18;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = ordered.flatMap((row) => series.map((item) => numericField(row, item.field)));
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = Math.max(1, maximum - minimum);
  const xFor = (date: string): number => {
    const index = ordered.findIndex((row) => row.date === date);
    return left + (ordered.length === 1 ? plotWidth / 2 : (index / (ordered.length - 1)) * plotWidth);
  };
  const yFor = (value: number): number => top + ((maximum - value) / range) * plotHeight;
  const gridValues = [...new Set([minimum, 0, maximum])].sort((a, b) => a - b);
  const grid = gridValues.map((value) => {
    const y = yFor(value);
    return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="grid-line${value === 0 ? " zero-line" : ""}"/><text x="${left - 8}" y="${y + 4}" text-anchor="end">${number(Math.round(value))}</text>`;
  }).join("");
  const lines = series.map((item, seriesIndex) => contiguousSegments(ordered).map((segment) => {
    const points = segment.map((row) => `${xFor(row.date).toFixed(1)},${yFor(numericField(row, item.field)).toFixed(1)}`).join(" ");
    if (segment.length === 1) {
      const [x, y] = points.split(",");
      if (seriesIndex === 1) return `<rect class="point-series-1" x="${(Number(x) - 4).toFixed(1)}" y="${(Number(y) - 4).toFixed(1)}" width="8" height="8" fill="${item.color}"/>`;
      if (seriesIndex === 2) return `<polygon class="point-series-2" points="${x},${(Number(y) - 5).toFixed(1)} ${(Number(x) + 5).toFixed(1)},${y} ${x},${(Number(y) + 5).toFixed(1)} ${(Number(x) - 5).toFixed(1)},${y}" fill="${item.color}"/>`;
      return `<circle class="point-series-0" cx="${x}" cy="${y}" r="4" fill="${item.color}"/>`;
    }
    const dash = seriesIndex === 1 ? "8 5" : seriesIndex === 2 ? "2 4" : "none";
    return `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="2.5" stroke-dasharray="${dash}" vector-effect="non-scaling-stroke"/>`;
  }).join("")).join("");
  const labels = `<text x="${left}" y="${height - 8}">${escapeHtml(ordered[0]?.date ?? "")}</text><text x="${width - right}" y="${height - 8}" text-anchor="end">${escapeHtml(ordered.at(-1)?.date ?? "")}</text>`;
  return `<div class="chart-shell"><div class="chart-scroll" tabindex="0" role="region" aria-label="Scrollable chart: ${escapeHtml(ariaLabel)}"><svg class="chart" data-scale-min="${minimum}" data-scale-max="${maximum}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(ariaLabel)}">${grid}${lines}${labels}</svg></div><div class="legend">${series.map((item, index) => `<span><i class="series-${index}" style="--legend:${item.color}"></i>${escapeHtml(item.label)}</span>`).join("")}</div>${chartDataTable(ordered, series, ariaLabel)}</div>`;
}

function barChart<T extends DatedRow>(rows: T[], field: string, ariaLabel: string, color: string): string {
  if (rows.length === 0) return `<div class="chart-empty">No daily totals are available yet. This chart will appear after its next successful data update.</div>`;
  const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const width = 720;
  const height = 190;
  const left = 42;
  const right = 14;
  const top = 16;
  const bottom = 30;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = Math.max(1, ...ordered.map((row) => numericField(row, field)));
  const slot = plotWidth / ordered.length;
  const bars = ordered.map((row, index) => {
    const value = numericField(row, field);
    const barHeight = (value / max) * plotHeight;
    const x = left + index * slot + Math.max(1, slot * 0.12);
    const barWidth = Math.max(1, slot * 0.76);
    return `<rect x="${x.toFixed(1)}" y="${(top + plotHeight - barHeight).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="2"><title>${escapeHtml(row.date)}: ${number(value)}</title></rect>`;
  }).join("");
  const series = [{ color, field, label: "Value" }];
  return `<div class="chart-shell"><div class="chart-scroll" tabindex="0" role="region" aria-label="Scrollable chart: ${escapeHtml(ariaLabel)}"><svg class="chart bar-chart" style="--bar:${color}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(ariaLabel)}"><line x1="${left}" y1="${top + plotHeight}" x2="${width - right}" y2="${top + plotHeight}" class="grid-line"/><text x="${left - 8}" y="${top + 4}" text-anchor="end">${number(max)}</text><text x="${left - 8}" y="${top + plotHeight + 4}" text-anchor="end">0</text>${bars}<text x="${left}" y="${height - 6}">${escapeHtml(ordered[0]?.date ?? "")}</text><text x="${width - right}" y="${height - 6}" text-anchor="end">${escapeHtml(ordered.at(-1)?.date ?? "")}</text></svg></div>${chartDataTable(ordered, series, ariaLabel)}</div>`;
}

function healthOverview(states: StateRow[], probes: ProbeRow[], now: Date): { markup: string; overall: VisualState } {
  const rowsByTarget = new Map(states.map((row) => [row.target, row]));
  const resolved = TARGETS.map((target) => ({ ...target, row: rowsByTarget.get(target.key), state: healthState(rowsByTarget.get(target.key), now) }));
  const overall: VisualState = resolved.some((target) => target.state === "unhealthy")
    ? "unhealthy"
    : resolved.some((target) => target.state === "degraded")
      ? "degraded"
      : resolved.some((target) => target.state === "stale")
        ? "stale"
        : "healthy";
  const headline = overall === "healthy"
    ? "All store services are working"
    : overall === "unhealthy"
      ? "A store service needs attention"
      : overall === "degraded"
        ? "A store service may need attention"
        : "Health check data is delayed";
  const cards = resolved.map((target) => {
    const probe = latestProbe(probes, target.key);
    const detail = target.row?.latest_detail || "Waiting for the first check. This will update after the five-minute scheduled check runs.";
    return `<article class="health-card" data-state="${target.state}">
      <div class="card-top"><span class="status-chip ${target.state}"><i></i>${stateLabel(target.state)}</span><span class="latency">${probe ? `${number(probe.latency_ms)} ms` : "Response time —"}</span></div>
      <h3>${escapeHtml(target.label)}</h3><p class="card-description">${escapeHtml(target.description)}</p>
      <p class="detail">${escapeHtml(detail)}</p>
      <div class="health-meta"><span>Checked ${escapeHtml(formatTimestamp(target.row?.updated_at ?? null))}</span>${probeDots(probes, target.key)}</div>
    </article>`;
  }).join("");
  return {
    overall,
    markup: `<section class="section" aria-labelledby="health-title"><div class="section-heading"><div><span class="eyebrow">Service checks</span><h2 id="health-title">Store health</h2><p>Four separate checks show whether the storefront, now-playing service, Spotify connection, and homepage feature are working.</p></div><span class="status-chip ${overall}"><i></i>${escapeHtml(headline)}</span></div><div class="health-grid">${cards}</div></section>`,
  };
}

function incidentTimeline(incidents: IncidentRow[], now: Date): string {
  const items = incidents.length > 0 ? incidents.map((incident) => {
    const active = incident.recovered_at === null;
    const end = incident.recovered_at ?? now.toISOString();
    const duration = formatDuration(incident.opened_at, end);
    return `<article class="timeline-item ${active ? "active" : "recovered"}">
      <div class="timeline-marker" aria-hidden="true"></div><div class="timeline-content">
        <div class="timeline-head"><div><span class="status-chip ${active ? "unhealthy" : "healthy"}"><i></i>${active ? "Active issue" : "Back to normal"}</span><h3>${escapeHtml(TARGETS.find((target) => target.key === incident.target)?.label ?? incident.target)}</h3></div><strong>${escapeHtml(active ? `${duration} active` : duration)}</strong></div>
        <dl><div><dt>Started</dt><dd>${escapeHtml(formatTimestamp(incident.opened_at))}</dd></div><div><dt>Resolved</dt><dd>${escapeHtml(formatTimestamp(incident.recovered_at))}</dd></div></dl>
        <p>${escapeHtml(incident.latest_detail)}</p>
      </div>
    </article>`;
  }).join("") : `<div class="quiet-empty"><span class="status-chip healthy"><i></i>All clear</span><h3>No recent service issues</h3><p>No health check has opened a service issue during the saved history.</p></div>`;
  return `<section class="section" aria-labelledby="incidents-title"><div class="section-heading"><div><span class="eyebrow">Service history</span><h2 id="incidents-title">Recent service issues</h2><p>Open issues and resolved issues show when a problem started, when it ended, and how long it lasted.</p></div></div><div class="timeline">${items}</div></section>`;
}

function integrationFreshness(
  integrations: IntegrationRow[],
  now: Date,
  definitions: readonly { key: string; label: string; description: string }[] = INTEGRATIONS,
): string {
  const byName = new Map(integrations.map((row) => [row.integration, row]));
  const cards = definitions.map((integration) => {
    const row = byName.get(integration.key);
    const state = integrationState(row, now);
    const waiting = row?.last_success_at
      ? ""
      : `<p>No successful update has finished yet. These totals will appear after the next scheduled update succeeds.</p>`;
    return `<article class="integration-card" data-state="${state}"><div class="card-top"><span class="status-chip ${state}"><i></i>${stateLabel(state)}</span><span class="source-mark">${integration.key === "cloudflare_analytics" ? "CF" : "S"}</span></div><h3>${escapeHtml(integration.label)}</h3><p>${escapeHtml(integration.description)}</p>${waiting}<dl><div><dt>Last successful update</dt><dd>${escapeHtml(formatTimestamp(row?.last_success_at ?? null))}</dd></div><div><dt>Most recent problem</dt><dd class="error-detail">${escapeHtml(row?.last_error ?? "No current error")}</dd></div></dl></article>`;
  }).join("");
  return `<section class="section" aria-labelledby="integrations-title"><div class="section-heading"><div><span class="eyebrow">Data updates</span><h2 id="integrations-title">When store data last updated</h2><p>Cloudflare and Shopify totals update on a schedule. Check the last successful update and any current problem before relying on the numbers.</p></div></div><div class="integration-grid">${cards}</div></section>`;
}

function emptyFunnel(): string {
  return `<div class="empty-state"><svg viewBox="0 0 180 120" aria-hidden="true"><path d="M24 22h132l-45 44v28l-42 13V66z"/><circle cx="46" cy="42" r="5"/><circle cx="68" cy="42" r="5"/><circle cx="90" cy="42" r="5"/></svg><div><span class="status-chip stale"><i></i>Not collecting yet</span><h3>Shopper journey data is not available yet</h3><p>No anonymous storefront events have been collected. Product views, cart additions, checkout starts, newsletter signups, and journey percentages will appear only after collection is approved and enabled and the updated storefront is published. Shopify remains the source for confirmed orders and sales.</p></div></div>`;
}

function funnelSection(rows: FunnelRow[], sessions: FunnelSessions | null, trends: FunnelTrendRow[], throughDate: string): string {
  if (rows.length === 0) return `<section class="section" aria-labelledby="funnel-title"><div class="section-heading"><div><span class="eyebrow">Shopping activity</span><h2 id="funnel-title">Shopper journey</h2><p>Anonymous browsing activity before checkout. These estimates are separate from confirmed Shopify orders.</p></div></div>${emptyFunnel()}</section>`;
  const productSessions = sessions?.product_sessions ?? 0;
  const cartSessions = sessions?.cart_sessions ?? 0;
  const checkoutSessions = sessions?.checkout_sessions ?? 0;
  const productViews = sum(rows, "product_views");
  const cartAdds = sum(rows, "cart_adds");
  const checkoutBegins = sum(rows, "checkout_begins");
  const newsletter = sum(rows, "newsletter_signups");
  const maximum = Math.max(1, productViews, cartAdds, checkoutBegins, newsletter);
  const stages = [
    ["Product views", productViews],
    ["Added to cart", cartAdds],
    ["Started checkout", checkoutBegins],
    ["Newsletter signups", newsletter],
  ] as const;
  const trendRows = trends.map((row) => ({
    ...row,
    cart_conversion: row.product_sessions > 0 ? Math.min(100, row.cart_sessions / row.product_sessions * 100) : 0,
    checkout_conversion: row.cart_sessions > 0 ? Math.min(100, row.checkout_sessions / row.cart_sessions * 100) : 0,
  }));
  return `<section class="section" aria-labelledby="funnel-title"><div class="section-heading"><div><span class="eyebrow">Shopping activity</span><h2 id="funnel-title">Shopper journey</h2><p>These event counts are estimates of browsing activity, not confirmed purchases. Percentages count anonymous browser sessions that completed each step in order and cannot exceed 100%. Data through ${escapeHtml(formatDate(throughDate))} uses complete New York reporting days.</p></div></div><div class="funnel-layout"><div class="funnel-bars">${stages.map(([label, value]) => `<div class="funnel-row"><div><span>${label}</span><strong>${number(value)}</strong></div><span class="funnel-track"><i style="width:${(value / maximum * 100).toFixed(1)}%"></i></span></div>`).join("")}</div><div class="conversion-cards"><article><span>Product view to cart</span><strong>${percent(cartSessions, productSessions)}</strong><p>${number(cartSessions)} of ${number(productSessions)} anonymous product-view sessions continued to cart</p></article><article><span>Cart to checkout</span><strong>${percent(checkoutSessions, cartSessions)}</strong><p>${number(checkoutSessions)} of ${number(cartSessions)} anonymous cart sessions continued to checkout in order</p></article></div></div><figure class="chart-card compact" aria-labelledby="conversion-chart-title conversion-chart-caption"><div class="chart-heading"><div><h3 id="conversion-chart-title">Shopping step trend</h3><p>Daily groups based on each session's first product view</p></div></div>${lineChart(trendRows, [{ field: "cart_conversion", label: "Product view to cart", color: "#26634a" }, { field: "checkout_conversion", label: "Cart to checkout", color: "#c66a3d" }], "Anonymous sessions that moved from product view to cart and from cart to checkout, grouped by first product-view day")}<figcaption id="conversion-chart-caption">The percentage scale starts at zero. A session counts only when its steps happened in order during the selected period.</figcaption></figure></section>`;
}

const CSS = `
:root{color-scheme:light;--canvas:#f2efe8;--paper:#fbfaf7;--ink:#18201d;--muted:#56615b;--line:#dcd8ce;--green:#1f5a43;--green-soft:#e4efe8;--orange:#bd6339;--orange-soft:#f7e8df;--red:#a7433f;--red-soft:#f7e5e2;--gold:#765817;--gold-soft:#f4edda;--shadow:0 14px 40px rgba(35,43,38,.07),0 2px 8px rgba(35,43,38,.04)}
*{box-sizing:border-box}html{scroll-behavior:auto}body{margin:0;background:var(--canvas);color:var(--ink);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}body:before{content:"";display:block;height:4px;background:linear-gradient(90deg,var(--green) 0 72%,var(--orange) 72%)}a{color:inherit}main{max-width:1440px;margin:auto;padding:32px clamp(18px,3vw,48px) 64px}.masthead{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:28px}.brand{display:flex;align-items:center;gap:14px}.monogram{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:var(--ink);color:var(--paper);font:700 18px/1 Georgia,serif}.brand-copy span,.eyebrow,.metric-label{display:block;color:var(--muted);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.brand-copy strong{display:block;font:600 20px/1.2 Georgia,serif;letter-spacing:-.01em}.report-meta{text-align:right;color:var(--muted);font-size:12px}.report-meta strong{display:block;color:var(--ink);font-size:13px}.period-nav{display:flex;gap:5px;padding:5px;background:#e7e3db;border:1px solid #d7d2c8;border-radius:12px;width:max-content;margin-bottom:36px}.period-nav a{min-width:78px;padding:8px 14px;border-radius:8px;text-align:center;text-decoration:none;color:var(--muted);font-weight:650}.period-nav a[aria-current="page"]{background:var(--paper);color:var(--ink);box-shadow:0 1px 4px rgba(27,34,30,.1)}.period-nav a:focus-visible{outline:3px solid rgba(31,90,67,.3);outline-offset:2px}.hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:24px;background:var(--ink);color:#f8f5ee;border-radius:22px;padding:clamp(24px,4vw,48px);margin-bottom:40px;box-shadow:var(--shadow)}.hero:after{content:"";position:absolute;width:360px;height:360px;border:1px solid rgba(255,255,255,.09);border-radius:50%;right:-150px;top:-175px;box-shadow:0 0 0 55px rgba(255,255,255,.025),0 0 0 110px rgba(255,255,255,.018)}.hero-copy,.hero-status{position:relative;z-index:1}.hero .eyebrow{color:#9fc6b3}.hero h1{max-width:750px;margin:10px 0 14px;font:600 clamp(34px,5vw,58px)/1.02 Georgia,serif;letter-spacing:-.035em}.hero p{max-width:670px;margin:0;color:#cbd2ce;font-size:15px}.hero-status{align-self:end;display:flex;flex-direction:column;align-items:flex-end;gap:8px;text-align:right}.hero-status strong{font:600 24px/1.15 Georgia,serif}.hero-status span:last-child{color:#aeb8b2;font-size:12px}.status-orb{width:58px;height:58px;border-radius:50%;background:var(--green);box-shadow:0 0 0 10px rgba(80,159,119,.13);margin-bottom:8px}.status-orb.unhealthy{background:var(--red);box-shadow:0 0 0 10px rgba(190,78,72,.14)}.status-orb.degraded,.status-orb.stale{background:var(--gold);box-shadow:0 0 0 10px rgba(173,137,57,.14)}.section{margin:0 0 48px}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:18px}.section-heading h2{margin:5px 0 5px;font:600 clamp(25px,3vw,34px)/1.1 Georgia,serif;letter-spacing:-.025em}.section-heading p{max-width:720px;margin:0;color:var(--muted)}.metrics-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.metric-card,.health-card,.integration-card,.chart-card,.timeline-content,.quiet-empty{background:var(--paper);border:1px solid var(--line);border-radius:16px;box-shadow:0 5px 20px rgba(35,43,38,.035)}.metric-card{min-width:0;padding:20px}.metric-value{margin:8px 0 4px;font:600 clamp(24px,2.6vw,36px)/1.1 Georgia,serif;letter-spacing:-.03em}.metric-card p{margin:10px 0 0;color:var(--muted);font-size:11px}.comparison{display:block;min-height:19px;font-size:11px;font-weight:650}.comparison.positive{color:var(--green)}.comparison.negative{color:var(--red)}.comparison.neutral,.comparison.unavailable{color:var(--muted)}.sparkline{width:100%;height:48px;margin-top:10px;overflow:visible}.sparkline polyline{stroke:var(--green);stroke-width:2}.spark-empty{height:48px;display:grid;place-items:center;color:#9a9f9b;font-size:11px}.chart-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:14px}.chart-stack{display:grid;gap:14px}.chart-card{padding:20px;min-width:0}.chart-card.compact{margin-top:14px}.chart-heading{display:flex;justify-content:space-between;gap:16px;margin-bottom:12px}.chart-heading h3{margin:0;font-size:15px}.chart-heading p{margin:3px 0 0;color:var(--muted);font-size:12px}.chart{display:block;width:100%;height:auto;overflow:visible}.chart text{fill:#7b837e;font:10px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.grid-line{stroke:#dedbd3;stroke-width:1}.bar-chart rect{fill:var(--bar)}.legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;color:var(--muted);font-size:11px}.legend span{display:flex;align-items:center;gap:6px}.legend i{width:18px;height:3px;border-radius:2px;background:var(--legend)}figure{margin:0}figcaption{margin-top:10px;color:var(--muted);font-size:11px}.chart-empty{display:grid;place-items:center;min-height:180px;border:1px dashed var(--line);border-radius:10px;color:var(--muted)}.health-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.health-card,.integration-card{padding:18px;min-width:0}.health-card{border-top:3px solid var(--state-color,var(--line))}.health-card[data-state="healthy"]{--state-color:var(--green)}.health-card[data-state="degraded"]{--state-color:var(--gold)}.health-card[data-state="unhealthy"]{--state-color:var(--red)}.health-card[data-state="stale"]{--state-color:#7a827e}.card-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.status-chip{display:inline-flex;align-items:center;gap:7px;width:max-content;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:750;letter-spacing:.05em;text-transform:uppercase}.status-chip i{width:7px;height:7px;border-radius:50%;background:currentColor}.status-chip.healthy{color:var(--green);background:var(--green-soft)}.status-chip.degraded{color:var(--gold);background:var(--gold-soft)}.status-chip.unhealthy{color:var(--red);background:var(--red-soft)}.status-chip.stale{color:#5e6762;background:#ebece9}.health-card h3,.integration-card h3,.timeline-content h3,.quiet-empty h3,.empty-state h3{margin:15px 0 3px;font-size:16px}.card-description,.integration-card>p{margin:0;color:var(--muted);font-size:12px}.detail{min-height:42px;margin:15px 0;color:#444d48;font-size:12px}.latency{color:var(--muted);font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace}.health-meta{display:flex;flex-direction:column;gap:9px;padding-top:12px;border-top:1px solid #e5e2db;color:var(--muted);font-size:10px}.probe-dots{display:flex;gap:4px}.probe-dot{width:7px;height:7px;border-radius:50%}.dot-good{background:#4d9b74}.dot-bad{background:#c25d58}.probe-empty{font-size:10px}.integration-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.integration-card{padding:22px}.source-mark{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--line);border-radius:9px;font-weight:800}.integration-card dl{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0 0}.integration-card dl div,.timeline-content dl div{background:#f2f0ea;border-radius:9px;padding:10px}.integration-card dt,.timeline-content dt{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em}.integration-card dd,.timeline-content dd{margin:3px 0 0;font-size:12px}.error-detail{overflow-wrap:anywhere}.timeline{position:relative;display:grid;gap:12px}.timeline:before{content:"";position:absolute;left:11px;top:15px;bottom:15px;width:1px;background:#cfcac0}.timeline-item{position:relative;display:grid;grid-template-columns:24px 1fr;gap:14px}.timeline-marker{position:relative;z-index:1;width:13px;height:13px;margin:20px 0 0 5px;border:3px solid var(--canvas);border-radius:50%;background:var(--green);box-shadow:0 0 0 1px var(--green)}.timeline-item.active .timeline-marker{background:var(--red);box-shadow:0 0 0 1px var(--red)}.timeline-content{padding:18px}.timeline-head{display:flex;justify-content:space-between;gap:18px}.timeline-head h3{margin-top:8px}.timeline-head strong{color:var(--muted);font-size:12px}.timeline-content dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0}.timeline-content>p{margin:0;color:#49514d}.quiet-empty{padding:28px;margin-left:38px}.quiet-empty p{margin:4px 0 0;color:var(--muted)}.funnel-layout{display:grid;grid-template-columns:1.25fr .75fr;gap:14px}.funnel-bars,.conversion-cards{display:grid;gap:10px}.funnel-bars,.conversion-cards article{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:20px}.funnel-row>div{display:flex;justify-content:space-between;gap:12px}.funnel-row strong{font-family:Georgia,serif;font-size:18px}.funnel-track{display:block;height:9px;margin-top:7px;background:#ebe8e1;border-radius:999px;overflow:hidden}.funnel-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--green),#4f8c70)}.conversion-cards article{padding:16px}.conversion-cards span{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em}.conversion-cards strong{display:block;margin:5px 0;font:600 28px Georgia,serif}.conversion-cards p{margin:0;color:var(--muted);font-size:11px}.empty-state{display:grid;grid-template-columns:180px 1fr;align-items:center;gap:28px;background:var(--paper);border:1px dashed #c8c3b8;border-radius:18px;padding:28px}.empty-state svg{width:100%;max-width:180px}.empty-state svg path{fill:#e4e0d7;stroke:#777f7a;stroke-width:2}.empty-state svg circle{fill:var(--green)}.empty-state h3{font:600 23px Georgia,serif}.empty-state p{max-width:720px;margin:6px 0 0;color:var(--muted)}.details-section{margin-top:54px;padding-top:38px;border-top:1px solid #d5d0c6}.details-section>.section-heading{margin-bottom:24px}.detail-group{margin-bottom:34px}.detail-group h3{margin:0 0 10px;font-size:15px}.table-wrap{overflow:auto;background:var(--paper);border:1px solid var(--line);border-radius:13px}table{width:100%;border-collapse:collapse;white-space:nowrap}caption{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}th,td{text-align:left;padding:11px 13px;border-bottom:1px solid #e6e3dc;font-size:12px}th{position:sticky;top:0;background:#f2f0ea;color:#626b66;font-size:10px;font-weight:750;letter-spacing:.05em;text-transform:uppercase}tr:last-child td{border-bottom:0}.empty-cell{color:var(--muted);text-align:center;padding:24px}.methodology{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:44px}.methodology article{padding:17px;border-top:1px solid #c8c3ba}.methodology strong{display:block;margin-bottom:5px;font-size:12px}.methodology p{margin:0;color:var(--muted);font-size:11px}footer{display:flex;justify-content:space-between;gap:20px;margin-top:42px;padding-top:20px;border-top:1px solid #d2cec5;color:var(--muted);font-size:11px}
.chart-grid{display:grid;grid-template-columns:1fr;gap:14px}.chart-stack{grid-template-columns:repeat(2,minmax(0,1fr))}.spark-empty{color:var(--muted)}.chart text{fill:#545e58}.period-nav a:focus-visible{outline:3px solid #1f5a43;outline-offset:3px}.chart-scroll{overflow-x:auto;overscroll-behavior-inline:contain}.chart-scroll .chart{min-width:600px}.chart-scroll:focus-visible,.table-wrap:focus-visible{outline:3px solid #1f5a43;outline-offset:3px}.chart-data{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.legend i.series-1{height:0;background:none;border-top:2px dashed var(--legend)}.legend i.series-2{height:5px;background:radial-gradient(circle,var(--legend) 0 2px,transparent 2.5px) 0 50%/7px 5px repeat-x}
@media (max-width:1100px){.metrics-grid{grid-template-columns:repeat(3,1fr)}.health-grid{grid-template-columns:repeat(2,1fr)}.methodology{grid-template-columns:1fr 1fr}}
@media (max-width:760px){main{padding:22px 14px 44px}.masthead{align-items:center}.report-meta{display:none}.hero{grid-template-columns:1fr;border-radius:17px}.hero-status{align-items:flex-start;text-align:left}.metrics-grid{grid-template-columns:repeat(2,1fr)}.health-grid,.integration-grid,.funnel-layout{grid-template-columns:1fr}.chart-stack{grid-template-columns:1fr}.section-heading{align-items:flex-start;flex-direction:column}.empty-state{grid-template-columns:1fr}.empty-state svg{max-width:125px}.methodology{grid-template-columns:1fr}.timeline-content dl{grid-template-columns:1fr}footer{flex-direction:column}}
@media (max-width:460px){.brand-copy strong{font-size:17px}.period-nav{width:100%}.period-nav a{flex:1;min-width:0}.metrics-grid{grid-template-columns:1fr}.hero{padding:25px 20px}.integration-card dl{grid-template-columns:1fr}.timeline-head{flex-direction:column}.timeline-head strong{order:-1}}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
`;

export function renderOperationsDashboard(data: DashboardData): string {
  const currentCloudflare = data.cloudflareRows.filter((row) => row.date >= data.periodStart).sort((a, b) => a.date.localeCompare(b.date));
  const currentShopify = data.shopifyRows.filter((row) => row.date >= data.periodStart).sort((a, b) => a.date.localeCompare(b.date));
  const currentFunnel = data.funnelRows.filter((row) => row.date >= data.funnelPeriodStart).sort((a, b) => a.date.localeCompare(b.date));
  const cloudflareComparison = matchedRows(data.cloudflareRows, data.periodStart, data.days);
  const shopifyComparison = matchedRows(data.shopifyRows, data.periodStart, data.days);
  const requests = sum(currentCloudflare, "requests");
  const uniqueIps = sum(currentCloudflare, "unique_ips");
  const orders = sum(currentShopify, "orders");
  const netSales = sum(currentShopify, "net_sales_minor");
  const grossSales = sum(currentShopify, "gross_sales_minor");
  const discounts = sum(currentShopify, "discounts_minor");
  const reversals = sum(currentShopify, "sales_reversals_minor");
  const units = sum(currentShopify, "units_sold");
  const averageOrderValue = orders > 0 ? Math.round(netSales / orders) : null;
  const currency = currentShopify.at(-1)?.currency ?? "USD";
  const hasCloudflareData = currentCloudflare.length > 0;
  const hasShopifyData = currentShopify.length > 0;
  const previousRequests = cloudflareComparison ? sum(cloudflareComparison.previous, "requests") : undefined;
  const previousUniqueIps = cloudflareComparison ? sum(cloudflareComparison.previous, "unique_ips") : undefined;
  const previousOrders = shopifyComparison ? sum(shopifyComparison.previous, "orders") : undefined;
  const previousNet = shopifyComparison ? sum(shopifyComparison.previous, "net_sales_minor") : undefined;
  const previousAov = shopifyComparison && averageOrderValue !== null
    ? (() => {
      const previousOrderCount = sum(shopifyComparison.previous, "orders");
      return previousOrderCount > 0 ? Math.round(sum(shopifyComparison.previous, "net_sales_minor") / previousOrderCount) : undefined;
    })()
    : undefined;
  const health = healthOverview(data.states, data.probes, data.now);
  const overallText = health.overall === "healthy"
    ? "Store services are reporting normally."
    : health.overall === "unhealthy"
      ? "A store service needs attention."
      : "Some store data is delayed or a service may need attention.";
  const metricCards = [
    metricCard({ available: hasCloudflareData, key: "requests", label: "Website requests", current: requests, previous: previousRequests, display: number(requests), sparkValues: currentCloudflare.map((row) => row.requests), note: "Every page, image, and file request handled by Cloudflare; not the same as visits", unavailableText: "Cloudflare traffic data has not been synced for this period. It will appear after the next successful daily Cloudflare update." }),
    metricCard({ available: hasCloudflareData, key: "unique-ips", label: "Estimated visitors", current: uniqueIps, previous: previousUniqueIps, display: number(uniqueIps), sparkValues: currentCloudflare.map((row) => row.unique_ips), note: "Daily Cloudflare estimates, not exact people. The same visitor can be counted again on another day", unavailableText: "Cloudflare traffic data has not been synced for this period. It will appear after the next successful daily Cloudflare update." }),
    metricCard({ available: hasShopifyData, key: "orders", label: "Orders", current: orders, previous: previousOrders, display: number(orders), sparkValues: currentShopify.map((row) => row.orders), note: "Completed orders reported by Shopify", unavailableText: "Shopify sales data has not been synced for this period. It will appear after the next successful daily Shopify update." }),
    metricCard({ available: hasShopifyData, key: "net-sales", label: "Sales after discounts and refunds", current: netSales, previous: previousNet, display: money(netSales, currency), sparkValues: currentShopify.map((row) => row.net_sales_minor), note: "Shopify sales after discounts and recorded refunds or other sales reversals", unavailableText: "Shopify sales data has not been synced for this period. It will appear after the next successful daily Shopify update." }),
    metricCard({ available: hasShopifyData, key: "aov", label: "Average spent per order", current: averageOrderValue ?? undefined, previous: previousAov, comparisonUnavailableText: averageOrderValue === null ? "No comparison yet because this period has no orders." : undefined, display: averageOrderValue === null ? "—" : money(averageOrderValue, currency), sparkValues: currentShopify.map((row) => row.orders > 0 ? Math.round(row.net_sales_minor / row.orders) : 0), note: "Sales after discounts and refunds divided by the number of orders", unavailableText: "Shopify sales data has not been synced for this period. It will appear after the next successful daily Shopify update." }),
  ].join("");
  const salesChartRows = currentShopify.map((row) => ({ ...row, gross_sales: row.gross_sales_minor / 100, net_sales: row.net_sales_minor / 100, aov: row.orders > 0 ? row.net_sales_minor / row.orders / 100 : 0 }));
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shop &amp; Sons Operations</title><style>${CSS}</style></head><body><main>
<header class="masthead"><div class="brand"><span class="monogram" aria-hidden="true">&amp;S</span><div class="brand-copy"><span>Private dashboard</span><strong>Shop &amp; Sons Operations</strong></div></div><div class="report-meta"><strong>Last ${data.days} days</strong><span>Generated ${escapeHtml(formatTimestamp(data.now.toISOString()))}</span></div></header>
<nav class="period-nav" aria-label="Reporting period">${[7, 30, 90].map((period) => `<a href="/dashboard/operations?days=${period}"${period === data.days ? ' aria-current="page"' : ""}>${period} days</a>`).join("")}</nav>
<section class="hero" aria-labelledby="dashboard-title"><div class="hero-copy"><span class="eyebrow">Store overview · Last ${data.days} days</span><h1 id="dashboard-title">See how the store is selling, how shoppers move toward checkout, and whether key services are working.</h1><p>Uses stored daily totals and anonymous storefront events. No customer profiles or third-party dashboard tools.</p></div><div class="hero-status"><span class="status-orb ${health.overall}" aria-hidden="true"></span><strong>${escapeHtml(overallText)}</strong><span>Health checks are considered current for 15 minutes</span></div></section>
<section class="section" aria-labelledby="summary-title"><div class="section-heading"><div><span class="eyebrow">Store totals</span><h2 id="summary-title">Key store numbers</h2><p>Totals for the selected period. A comparison appears only when each available day has a matching date in the previous period.</p></div></div><div class="metrics-grid">${metricCards}</div></section>
<section class="section" aria-labelledby="growth-title"><div class="section-heading"><div><span class="eyebrow">Daily store totals</span><h2 id="growth-title">Daily store trends</h2><p>Each chart uses completed days already saved. Missing dates stay blank, and charts show zero so rises and drops are not visually exaggerated.</p></div></div><div class="chart-grid"><figure class="chart-card" aria-labelledby="traffic-chart-title traffic-chart-caption"><div class="chart-heading"><div><h3 id="traffic-chart-title">Website traffic</h3><p>Website requests, page views, and estimated visitors by day</p></div></div>${lineChart(currentCloudflare, [{ field: "requests", label: "Website requests", color: "#1f5a43" }, { field: "page_views", label: "Page views", color: "#bd6339" }, { field: "unique_ips", label: "Estimated visitors", color: "#7a6b9b" }], "Website requests, page views, and estimated visitors by day")}<figcaption id="traffic-chart-caption">Estimated visitors are daily Cloudflare estimates, not exact people or a count of distinct visitors across the full period. The same visitor can be counted again on another day.</figcaption></figure><div class="chart-stack"><figure class="chart-card" aria-labelledby="orders-chart-title orders-chart-caption"><div class="chart-heading"><div><h3 id="orders-chart-title">Orders</h3><p>Completed Shopify orders by day</p></div></div>${barChart(currentShopify, "orders", "Completed Shopify orders by day", "#1f5a43")}<figcaption id="orders-chart-caption">Shopify is the sales record for confirmed order counts.</figcaption></figure><figure class="chart-card" aria-labelledby="aov-chart-title aov-chart-caption"><div class="chart-heading"><div><h3 id="aov-chart-title">Average spent per order</h3><p>Sales after discounts and refunds divided by orders each day</p></div></div>${lineChart(salesChartRows, [{ field: "aov", label: "Average spent per order", color: "#7a6b9b" }], "Average spent per order by day")}<figcaption id="aov-chart-caption">A day with no orders is shown at zero. The selected period has no average until at least one order is recorded.</figcaption></figure></div></div><figure class="chart-card compact" aria-labelledby="sales-chart-title sales-chart-caption"><div class="chart-heading"><div><h3 id="sales-chart-title">Sales before and after adjustments</h3><p>Daily Shopify sales in ${escapeHtml(currency)}</p></div></div>${lineChart(salesChartRows, [{ field: "gross_sales", label: "Before discounts and refunds", color: "#bd6339" }, { field: "net_sales", label: "After discounts and refunds", color: "#1f5a43" }], "Sales before and after discounts, refunds, and other recorded reversals by day")}<figcaption id="sales-chart-caption">Amounts come from Shopify's stored daily totals. The chart includes zero and shows negative days below zero when refunds or other reversals exceed sales.</figcaption></figure></section>
${health.markup}
${incidentTimeline(data.incidents, data.now)}
${integrationFreshness(data.integrations, data.now)}
${funnelSection(currentFunnel, data.funnelSessions, data.funnelTrendRows, data.funnelEndDate)}
<section class="details-section" aria-labelledby="details-title"><div class="section-heading"><div><span class="eyebrow">Daily records</span><h2 id="details-title">Daily store totals</h2><p>The saved Cloudflare, Shopify, service-check, shopper-journey, and data-update records behind the summaries are listed below.</p></div></div>
<div class="detail-group"><h3>Sales totals</h3>${table("Sales totals for the selected period", ["Orders", "Net items sold", "Sales before discounts and refunds", "Discounts", "Refunds and other reversals", "Sales after discounts and refunds", "Average spent per order"], hasShopifyData ? [[orders, units, money(grossSales, currency), money(discounts, currency), money(reversals, currency), money(netSales, currency), averageOrderValue === null ? "—" : money(averageOrderValue, currency)]] : [], "No Shopify sales data has been recorded. It will appear after the next successful daily Shopify update.")}</div>
<div class="detail-group"><h3>Current service checks</h3>${table("Current store service checks", ["Service", "Status", "Failed checks", "Latest message", "Last updated"], data.states.map((row) => [TARGETS.find((target) => target.key === row.target)?.label ?? row.target, stateLabel(healthState(row, data.now)), row.consecutive_failures, row.latest_detail, row.updated_at]), "No health checks have run. These records will appear after the five-minute scheduled check runs.")}</div>
<div class="detail-group"><h3>Service issue history</h3>${table("Recent store service issues", ["Service", "Status", "Started", "Resolved", "Duration", "Latest message"], data.incidents.map((row) => [TARGETS.find((target) => target.key === row.target)?.label ?? row.target, row.recovered_at ? "Back to normal" : "Active issue", row.opened_at, row.recovered_at ?? "—", formatDuration(row.opened_at, row.recovered_at ?? data.now.toISOString()), row.latest_detail]), "No service issues have been recorded. A row appears after two consecutive failed checks open a service issue.")}</div>
<div class="detail-group"><h3>Health check history</h3>${table("Recent health check results", ["Service", "Checked", "Working", "Web status code", "Response time (ms)", "Message"], data.probes.map((row) => [TARGETS.find((target) => target.key === row.target)?.label ?? row.target, row.checked_at, row.healthy === 1 ? "Yes" : "No", row.status_code ?? "—", row.latency_ms, row.detail]), "No health checks have run. These records will appear after the five-minute scheduled check runs.")}</div>
<div class="detail-group"><h3>Shopper journey by day</h3>${table("Anonymous shopping activity by day", ["Date", "Anonymous sessions", "Page views", "Product views", "Added to cart", "Started checkout", "Newsletter signups"], currentFunnel.slice().reverse().map((row) => [row.date, row.distinct_sessions, row.page_views, row.product_views, row.cart_adds, row.checkout_begins, row.newsletter_signups]), "No shopper journey data has been recorded. It will appear after collection is approved and enabled and the updated storefront is published.")}</div>
<div class="detail-group"><h3>Website traffic by day</h3>${table("Daily Cloudflare website traffic", ["Date", "Website requests", "Page views", "Estimated visitors", "4xx responses", "5xx responses", "Threats"], currentCloudflare.slice().reverse().map((row) => [row.date, row.requests, row.page_views, row.unique_ips, row.status_4xx, row.status_5xx, row.threats]), "No Cloudflare traffic data has been recorded. It will appear after the next successful daily Cloudflare update.")}</div>
<div class="detail-group"><h3>Shopify sales by day</h3>${table("Daily Shopify sales totals", ["Date", "Orders", "Net items sold", "Sales before discounts and refunds", "Discounts", "Refunds and other reversals", "Sales after discounts and refunds", "Average spent per order"], currentShopify.slice().reverse().map((row) => [row.date, row.orders, row.units_sold, money(row.gross_sales_minor, row.currency), money(row.discounts_minor, row.currency), money(row.sales_reversals_minor, row.currency), money(row.net_sales_minor, row.currency), row.orders > 0 ? money(Math.round(row.net_sales_minor / row.orders), row.currency) : "—"]), "No Shopify sales data has been recorded. It will appear after the next successful daily Shopify update.")}</div>
<div class="detail-group"><h3>Data update history</h3>${table("Cloudflare and Shopify data updates", ["Data source", "Status", "Last successful update", "Most recent problem"], INTEGRATIONS.map((integration) => { const row = data.integrations.find((item) => item.integration === integration.key); return [integration.label, stateLabel(integrationState(row, data.now)), row?.last_success_at ?? "Not yet", row?.last_error ?? "—"]; }))}</div></section>
<section class="methodology" aria-label="How these numbers work"><article><strong>Visitor numbers are estimates</strong><p>Cloudflare estimates visitors from daily unique IP addresses. This is not an exact count of people, and the same visitor can be counted again on another day.</p></article><article><strong>Reporting boundaries are explicit</strong><p>Shopper-journey and Shopify days end at midnight in New York. Cloudflare's technical traffic day remains UTC and is shown only in this operations view.</p></article><article><strong>Shopify is the sales record</strong><p>Use Shopify totals for confirmed orders and sales. Net items sold subtracts returned items. Returned items reduce this number. Anonymous storefront events show browsing steps before checkout and are estimates, not confirmed purchases.</p></article></section>
<footer><span>Private · built on the server · no third-party dashboard tools</span><span>Generated ${escapeHtml(data.now.toISOString())}</span></footer>
</main></body></html>`;
  return html;
}

export function renderGrowthDashboard(data: DashboardData): string {
  const currentShopify = data.onlineShopifyRows.filter((row) => row.date >= data.periodStart).sort((a, b) => a.date.localeCompare(b.date));
  const currentFunnel = data.funnelRows.filter((row) => row.date >= data.funnelPeriodStart).sort((a, b) => a.date.localeCompare(b.date));
  const shopifyComparison = matchedRows(data.onlineShopifyRows, data.periodStart, data.days);
  const funnelComparison = matchedRows(data.funnelRows, data.funnelPeriodStart, data.days);
  const hasShopifyData = currentShopify.length === data.days;
  const hasFunnelData = currentFunnel.length === data.days;
  const sessions = sum(currentFunnel, "distinct_sessions");
  const orders = sum(currentShopify, "orders");
  const netSales = sum(currentShopify, "net_sales_minor");
  const grossProfit = currentShopify.reduce((total, row) => total + Number(row.gross_profit_minor ?? 0), 0);
  const profitDataComplete = hasShopifyData && currentShopify.every((row) => row.cost_coverage_complete === 1 && row.cogs_minor !== null && row.gross_profit_minor !== null);
  const conversion = hasFunnelData && hasShopifyData && sessions > 0 ? orders / sessions * 100 : null;
  const grossMargin = profitDataComplete && netSales > 0 ? grossProfit / netSales * 100 : null;
  const averageOrderValue = hasShopifyData && orders > 0 ? Math.round(netSales / orders) : null;
  const currency = currentShopify.at(-1)?.currency ?? "USD";
  const previousSessions = funnelComparison ? sum(funnelComparison.previous, "distinct_sessions") : undefined;
  const previousOrders = shopifyComparison ? sum(shopifyComparison.previous, "orders") : undefined;
  const previousNetSales = shopifyComparison ? sum(shopifyComparison.previous, "net_sales_minor") : undefined;
  const previousGrossProfit = shopifyComparison && shopifyComparison.previous.every((row) => row.cost_coverage_complete === 1 && row.gross_profit_minor !== null)
    ? shopifyComparison.previous.reduce((total, row) => total + Number(row.gross_profit_minor), 0)
    : undefined;
  const previousConversion = previousSessions !== undefined && previousSessions > 0 && previousOrders !== undefined
    ? previousOrders / previousSessions * 100
    : undefined;
  const previousMargin = previousGrossProfit !== undefined && previousNetSales !== undefined && previousNetSales > 0
    ? previousGrossProfit / previousNetSales * 100
    : undefined;
  const previousAov = previousOrders !== undefined && previousOrders > 0 && previousNetSales !== undefined
    ? Math.round(previousNetSales / previousOrders)
    : undefined;
  const metricCards = [
    metricCard({ available: hasFunnelData, key: "sessions", label: "Estimated website sessions", current: sessions, previous: previousSessions, display: number(sessions), sparkValues: currentFunnel.map((row) => row.distinct_sessions), note: "Anonymous browser sessions. This is an estimate, not a count of people", unavailableText: "Anonymous website analytics has no complete-day data for this period yet." }),
    metricCard({ available: hasShopifyData, key: "online-orders", label: "Website orders", current: orders, previous: previousOrders, display: number(orders), sparkValues: currentShopify.map((row) => row.orders), note: "Completed & Son Website orders reported by Shopify", unavailableText: "Website order data has not been synced for this period." }),
    metricCard({ available: hasFunnelData && hasShopifyData && conversion !== null, key: "estimated-conversion", label: "Estimated website conversion", current: conversion ?? undefined, previous: previousConversion, display: conversion === null ? "—" : `${conversion.toFixed(1)}%`, sparkValues: currentFunnel.map((row) => row.distinct_sessions), note: "Website orders divided by anonymous website sessions; directional because the sources are aggregated independently", unavailableText: "Conversion appears after both anonymous sessions and website orders have complete-day coverage." }),
    metricCard({ available: hasShopifyData, key: "online-net-sales", label: "Website net sales", current: netSales, previous: previousNetSales, display: money(netSales, currency), sparkValues: currentShopify.map((row) => row.net_sales_minor), note: "& Son Website sales after discounts, returns, and recorded reversals", unavailableText: "Website sales data has not been synced for this period." }),

    metricCard({ available: profitDataComplete, key: "gross-profit", label: "Website gross profit", current: profitDataComplete ? grossProfit : undefined, previous: previousGrossProfit, display: profitDataComplete ? money(grossProfit, currency) : "—", sparkValues: profitDataComplete ? currentShopify.map((row) => Number(row.gross_profit_minor)) : [], note: "Website net sales minus Shopify product cost. This is not final business profit", unavailableText: "Gross profit is hidden because one or more selected days lacks complete Shopify product-cost coverage." }),
    metricCard({ available: grossMargin !== null, key: "gross-margin", label: "Gross margin", current: grossMargin ?? undefined, previous: previousMargin, display: grossMargin === null ? "—" : `${grossMargin.toFixed(1)}%`, sparkValues: grossMargin === null ? [] : currentShopify.map((row) => row.net_sales_minor > 0 && row.gross_profit_minor !== null ? row.gross_profit_minor / row.net_sales_minor * 100 : 0), note: "Website gross profit divided by website net sales", unavailableText: "Gross margin requires complete product-cost coverage and positive net sales." }),
    metricCard({ available: hasShopifyData, key: "aov", label: "Average order value", current: averageOrderValue ?? undefined, previous: previousAov, display: averageOrderValue === null ? "—" : money(averageOrderValue, currency), sparkValues: currentShopify.map((row) => row.orders > 0 ? Math.round(row.net_sales_minor / row.orders) : 0), note: "Website net sales divided by website orders", unavailableText: "Average order value appears after website sales data is synced." }),
  ].join("");
  const performanceRows = (hasShopifyData ? currentShopify : []).map((row) => ({
    ...row,
    gross_profit: Number(row.gross_profit_minor ?? 0) / 100,
    net_sales: row.net_sales_minor / 100,
  }));
  const integrationMarkup = integrationFreshness(
    data.integrations,
    data.now,
    INTEGRATIONS.filter((integration) => integration.key === "shopify_online_analytics"),
  );
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shop &amp; Sons Growth</title><style>${CSS}</style></head><body><main>
<header class="masthead"><div class="brand"><span class="monogram" aria-hidden="true">&amp;S</span><div class="brand-copy"><span>Private dashboard</span><strong>Shop &amp; Sons Growth</strong></div></div><div class="report-meta"><strong>Last ${data.days} complete days</strong><span>Generated ${escapeHtml(formatTimestamp(data.now.toISOString()))}</span></div></header>
<nav class="period-nav" aria-label="Reporting period">${[7, 30, 90].map((period) => `<a href="/dashboard?days=${period}"${period === data.days ? ' aria-current="page"' : ""}>${period} days</a>`).join("")}</nav>
<section class="hero" aria-labelledby="dashboard-title"><div class="hero-copy"><span class="eyebrow">Online growth · Last ${data.days} complete days</span><h1 id="dashboard-title">The numbers that explain whether shopandson.com is attracting shoppers and producing profitable website sales.</h1><p>Shopify's &amp; Son Website channel is authoritative for orders, sales, product cost, and gross profit. Anonymous storefront events provide directional funnel estimates.</p></div><div class="hero-status"><strong>${profitDataComplete ? "Financial data is ready" : "Check data coverage"}</strong><span>${profitDataComplete ? "Selected Shopify days have complete recorded cost coverage" : "Profit stays hidden until Shopify confirms complete product-cost coverage"}</span></div></section>
<section class="section" aria-labelledby="summary-title"><div class="section-heading"><div><span class="eyebrow">Decision metrics</span><h2 id="summary-title">Website performance</h2><p>Only complete stored days are included. Comparisons appear only when every current day has a matching prior-period day.</p></div></div><div class="metrics-grid">${metricCards}</div></section>
<section class="section" aria-labelledby="performance-title"><div class="section-heading"><div><span class="eyebrow">Financial trend</span><h2 id="performance-title">Net sales and gross profit by day</h2><p>&amp; Son Website channel only. Gross profit is shown only when Shopify reports complete product-cost coverage.</p></div></div><figure class="chart-card" aria-labelledby="financial-chart-title financial-chart-caption"><div class="chart-heading"><div><h3 id="financial-chart-title">Daily financial performance</h3><p>USD, after discounts and recorded returns</p></div></div>${lineChart(performanceRows, profitDataComplete ? [{ field: "net_sales", label: "Net sales", color: "#1f5a43" }, { field: "gross_profit", label: "Gross profit", color: "#bd6339" }] : [{ field: "net_sales", label: "Net sales", color: "#1f5a43" }], "Website net sales and gross profit by day")}<figcaption id="financial-chart-caption">Gross profit equals website net sales minus Shopify product cost; it excludes payment fees, shipping subsidy, advertising, payroll, rent, and other operating expenses.</figcaption></figure></section>
${funnelSection(hasFunnelData ? currentFunnel : [], hasFunnelData ? data.funnelSessions : null, data.funnelTrendRows, data.funnelEndDate)}
${integrationMarkup}
<section class="methodology" aria-label="How these numbers work"><article><strong>Shopify settles commerce</strong><p>Orders, net sales, product cost, and gross profit include only Shopify's &amp; Son Website sales channel for shopandson.com.</p></article><article><strong>Sessions are anonymous estimates</strong><p>A session-scoped random identifier measures funnel steps without names, email addresses, customer profiles, or fingerprinting.</p></article><article><strong>Coverage gates calculations</strong><p>Profit and matched comparisons are hidden rather than guessed when costs or complete-day source coverage are missing.</p></article></section>
<footer><span>Private · aggregate-only analytics · <a href="/dashboard/operations?days=${data.days}">Technical operations</a></span><span>Generated ${escapeHtml(data.now.toISOString())}</span></footer>
</main></body></html>`;
}
