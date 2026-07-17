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
  date: string;
  currency: string;
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
  periodStart: string;
  probes: ProbeRow[];
  shopifyRows: ShopifyRow[];
  states: StateRow[];
}

type VisualState = "degraded" | "healthy" | "stale" | "unhealthy";
type DatedRow = { date: string };

const DAY_MS = 86_400_000;
const TARGETS = [
  { key: "site", label: "Storefront", description: "Public shopandson.com experience" },
  { key: "worker", label: "Shared Worker", description: "Now-playing service contract" },
  { key: "spotify_auth", label: "Spotify authorization", description: "Spotify credential status" },
  { key: "feature_toggle", label: "Now-playing feature", description: "Production feature toggle" },
] as const;
const INTEGRATIONS = [
  { key: "cloudflare_analytics", label: "Cloudflare Analytics", description: "Traffic and edge request aggregates" },
  { key: "shopify_analytics", label: "Shopify Analytics", description: "Authoritative aggregate commerce reporting" },
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
  if (!value) return "Never";
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

function table(caption: string, headers: string[], rows: unknown[][]): string {
  const head = headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("");
  const body = rows.length > 0
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td class="empty-cell" colspan="${headers.length}">No stored data for this view</td></tr>`;
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(caption)}; scroll horizontally when needed"><table><caption>${escapeHtml(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function stateLabel(state: VisualState): string {
  return state[0].toUpperCase() + state.slice(1);
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
  if (targetProbes.length === 0) return `<span class="probe-empty">No recent probe history</span>`;
  return `<span class="probe-dots" role="img" aria-label="Recent checks: ${targetProbes.map((probe) => probe.healthy === 1 ? "healthy" : "unhealthy").join(", ")}">${targetProbes.map((probe) => `<span class="probe-dot ${probe.healthy === 1 ? "dot-good" : "dot-bad"}" aria-hidden="true"></span>`).join("")}</span>`;
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
      ? `<span class="comparison neutral">No change · Matched ${matchedDays}-day comparison</span>`
      : `<span class="comparison positive">New activity · Matched ${matchedDays}-day comparison</span>`;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const direction = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  const sign = change > 0 ? "+" : "";
  return `<span class="comparison ${direction}">${arrow} ${sign}${change.toFixed(1)}% · Matched ${matchedDays}-day comparison</span>`;
}

function sparkline(values: number[]): string {
  if (values.length === 0) return `<div class="spark-empty">No daily data</div>`;
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
}

function metricCard(options: MetricCardOptions): string {
  if (options.available === false) {
    return `<article class="metric-card" data-metric="${escapeHtml(options.key)}" data-availability="unavailable">
    <div class="metric-label">${escapeHtml(options.label)}</div>
    <div class="metric-value unavailable-value">Unavailable</div>
    <span class="comparison unavailable">No stored aggregate data for this period</span>
    ${sparkline([])}
    <p>${escapeHtml(options.note)}</p>
  </article>`;
  }
  const currentAttribute = options.current === undefined ? "" : ` data-current="${options.current}"`;
  const previousAttribute = options.previous === undefined ? "" : ` data-previous="${options.previous}"`;
  const comparisonMarkup = options.current === undefined || options.previous === undefined
    ? `<span class="comparison unavailable">${escapeHtml(options.comparisonUnavailableText ?? "No matched prior-period data")}</span>`
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
  return `<table class="chart-data"><caption>${escapeHtml(caption)}: exact stored values</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
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
  if (rows.length === 0) return `<div class="chart-empty">No stored daily data for this chart.</div>`;
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
  if (rows.length === 0) return `<div class="chart-empty">No stored daily data for this chart.</div>`;
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
    ? "All monitored systems healthy"
    : overall === "unhealthy"
      ? "System attention required"
      : overall === "degraded"
        ? "A system is degraded"
        : "Monitoring data needs a fresh check";
  const cards = resolved.map((target) => {
    const probe = latestProbe(probes, target.key);
    const detail = target.row?.latest_detail || "Awaiting first health check";
    return `<article class="health-card" data-state="${target.state}">
      <div class="card-top"><span class="status-chip ${target.state}"><i></i>${stateLabel(target.state)}</span><span class="latency">${probe ? `${number(probe.latency_ms)} ms` : "Latency —"}</span></div>
      <h3>${escapeHtml(target.label)}</h3><p class="card-description">${escapeHtml(target.description)}</p>
      <p class="detail">${escapeHtml(detail)}</p>
      <div class="health-meta"><span>Last checked ${escapeHtml(formatTimestamp(target.row?.updated_at ?? null))}</span>${probeDots(probes, target.key)}</div>
    </article>`;
  }).join("");
  return {
    overall,
    markup: `<section class="section" aria-labelledby="health-title"><div class="section-heading"><div><span class="eyebrow">Live operations</span><h2 id="health-title">Health overview</h2><p>Four independent checks distinguish a healthy storefront from shared-service, authorization, and feature-toggle issues.</p></div><span class="status-chip ${overall}"><i></i>${escapeHtml(headline)}</span></div><div class="health-grid">${cards}</div></section>`,
  };
}

function incidentTimeline(incidents: IncidentRow[], now: Date): string {
  const items = incidents.length > 0 ? incidents.map((incident) => {
    const active = incident.recovered_at === null;
    const end = incident.recovered_at ?? now.toISOString();
    const duration = formatDuration(incident.opened_at, end);
    return `<article class="timeline-item ${active ? "active" : "recovered"}">
      <div class="timeline-marker" aria-hidden="true"></div><div class="timeline-content">
        <div class="timeline-head"><div><span class="status-chip ${active ? "unhealthy" : "healthy"}"><i></i>${active ? "Active incident" : "Recovered"}</span><h3>${escapeHtml(TARGETS.find((target) => target.key === incident.target)?.label ?? incident.target)}</h3></div><strong>${escapeHtml(active ? `${duration} active` : duration)}</strong></div>
        <dl><div><dt>Opened</dt><dd>${escapeHtml(formatTimestamp(incident.opened_at))}</dd></div><div><dt>Recovery</dt><dd>${escapeHtml(formatTimestamp(incident.recovered_at))}</dd></div></dl>
        <p>${escapeHtml(incident.latest_detail)}</p>
      </div>
    </article>`;
  }).join("") : `<div class="quiet-empty"><span class="status-chip healthy"><i></i>Quiet</span><h3>No recent incidents</h3><p>Nothing has crossed the incident threshold in stored history.</p></div>`;
  return `<section class="section" aria-labelledby="incidents-title"><div class="section-heading"><div><span class="eyebrow">Operational history</span><h2 id="incidents-title">Incident timeline</h2><p>Active failures stay visually distinct from recovered events, with exact opening, recovery, and duration context.</p></div></div><div class="timeline">${items}</div></section>`;
}

function integrationFreshness(integrations: IntegrationRow[], now: Date): string {
  const byName = new Map(integrations.map((row) => [row.integration, row]));
  const cards = INTEGRATIONS.map((integration) => {
    const row = byName.get(integration.key);
    const state = integrationState(row, now);
    return `<article class="integration-card" data-state="${state}"><div class="card-top"><span class="status-chip ${state}"><i></i>${stateLabel(state)}</span><span class="source-mark">${integration.key === "cloudflare_analytics" ? "CF" : "S"}</span></div><h3>${escapeHtml(integration.label)}</h3><p>${escapeHtml(integration.description)}</p><dl><div><dt>Last successful sync</dt><dd>${escapeHtml(formatTimestamp(row?.last_success_at ?? null))}</dd></div><div><dt>Latest error</dt><dd class="error-detail">${escapeHtml(row?.last_error ?? "None")}</dd></div></dl></article>`;
  }).join("");
  return `<section class="section" aria-labelledby="integrations-title"><div class="section-heading"><div><span class="eyebrow">Data confidence</span><h2 id="integrations-title">Integration freshness</h2><p>Daily aggregate sources are useful only when their last successful sync is current and errors are visible.</p></div></div><div class="integration-grid">${cards}</div></section>`;
}

function emptyFunnel(): string {
  return `<div class="empty-state"><svg viewBox="0 0 180 120" aria-hidden="true"><path d="M24 22h132l-45 44v28l-42 13V66z"/><circle cx="46" cy="42" r="5"/><circle cx="68" cy="42" r="5"/><circle cx="90" cy="42" r="5"/></svg><div><span class="status-chip stale"><i></i>Unavailable</span><h3>Storefront telemetry is unavailable</h3><p>No storefront events have been recorded. Collection remains intentionally unpublished, so Product views, cart additions, checkout starts, newsletter responses, and conversion trends will appear here only after the approved storefront telemetry launch.</p></div></div>`;
}

function funnelSection(rows: FunnelRow[], sessions: FunnelSessions | null, trends: FunnelTrendRow[], throughDate: string): string {
  if (rows.length === 0) return `<section class="section" aria-labelledby="funnel-title"><div class="section-heading"><div><span class="eyebrow">Customer journey</span><h2 id="funnel-title">Storefront funnel</h2><p>Directional pre-checkout behavior, separate from authoritative Shopify order totals.</p></div></div>${emptyFunnel()}</section>`;
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
    ["Cart additions", cartAdds],
    ["Checkout starts", checkoutBegins],
    ["Newsletter responses", newsletter],
  ] as const;
  const trendRows = trends.map((row) => ({
    ...row,
    cart_conversion: row.product_sessions > 0 ? Math.min(100, row.cart_sessions / row.product_sessions * 100) : 0,
    checkout_conversion: row.cart_sessions > 0 ? Math.min(100, row.checkout_sessions / row.cart_sessions * 100) : 0,
  }));
  return `<section class="section" aria-labelledby="funnel-title"><div class="section-heading"><div><span class="eyebrow">Customer journey</span><h2 id="funnel-title">Storefront funnel</h2><p>Event counts are directional. Conversion uses ordered anonymous session cohorts and cannot exceed 100%. Funnel data through ${escapeHtml(formatDate(throughDate))} uses complete UTC days.</p></div></div><div class="funnel-layout"><div class="funnel-bars">${stages.map(([label, value]) => `<div class="funnel-row"><div><span>${label}</span><strong>${number(value)}</strong></div><span class="funnel-track"><i style="width:${(value / maximum * 100).toFixed(1)}%"></i></span></div>`).join("")}</div><div class="conversion-cards"><article><span>Cart session conversion</span><strong>${percent(cartSessions, productSessions)}</strong><p>${number(cartSessions)} of ${number(productSessions)} product-view sessions</p></article><article><span>Checkout session conversion</span><strong>${percent(checkoutSessions, cartSessions)}</strong><p>${number(checkoutSessions)} of ${number(cartSessions)} ordered cart sessions</p></article></div></div><figure class="chart-card compact" aria-labelledby="conversion-chart-title conversion-chart-caption"><div class="chart-heading"><div><h3 id="conversion-chart-title">Conversion trend</h3><p>Daily cohorts grouped by first product view</p></div></div>${lineChart(trendRows, [{ field: "cart_conversion", label: "Product → cart", color: "#26634a" }, { field: "checkout_conversion", label: "Cart → checkout", color: "#c66a3d" }], "Ordered cart and checkout session conversion percentages by product-view cohort day")}<figcaption id="conversion-chart-caption">Percent scale starts at zero; cohort stages must occur in order inside the selected reporting window.</figcaption></figure></section>`;
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

export function renderDashboard(data: DashboardData): string {
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
    ? "All monitored systems are reporting normally."
    : health.overall === "unhealthy"
      ? "One or more monitored systems require attention."
      : "At least one monitored system is degraded or stale.";
  const metricCards = [
    metricCard({ available: hasCloudflareData, key: "requests", label: "Requests", current: requests, previous: previousRequests, display: number(requests), sparkValues: currentCloudflare.map((row) => row.requests), note: "Cloudflare edge requests" }),
    metricCard({ available: hasCloudflareData, key: "unique-ips", label: "Estimated unique IPs", current: uniqueIps, previous: previousUniqueIps, display: number(uniqueIps), sparkValues: currentCloudflare.map((row) => row.unique_ips), note: "Sum of daily estimates, not people" }),
    metricCard({ available: hasShopifyData, key: "orders", label: "Orders", current: orders, previous: previousOrders, display: number(orders), sparkValues: currentShopify.map((row) => row.orders), note: "Authoritative Shopify aggregate" }),
    metricCard({ available: hasShopifyData, key: "net-sales", label: "Net sales", current: netSales, previous: previousNet, display: money(netSales, currency), sparkValues: currentShopify.map((row) => row.net_sales_minor), note: "After discounts and reversals" }),
    metricCard({ available: hasShopifyData, key: "aov", label: "Average order value", current: averageOrderValue ?? undefined, previous: previousAov, comparisonUnavailableText: averageOrderValue === null ? "AOV comparison unavailable without orders" : undefined, display: averageOrderValue === null ? "—" : money(averageOrderValue, currency), sparkValues: currentShopify.map((row) => row.orders > 0 ? Math.round(row.net_sales_minor / row.orders) : 0), note: "Net sales divided by orders" }),
  ].join("");
  const salesChartRows = currentShopify.map((row) => ({ ...row, gross_sales: row.gross_sales_minor / 100, net_sales: row.net_sales_minor / 100, aov: row.orders > 0 ? row.net_sales_minor / row.orders / 100 : 0 }));
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shop &amp; Sons Operations</title><style>${CSS}</style></head><body><main>
<header class="masthead"><div class="brand"><span class="monogram" aria-hidden="true">&amp;S</span><div class="brand-copy"><span>Private dashboard</span><strong>Shop &amp; Sons Operations</strong></div></div><div class="report-meta"><strong>Last ${data.days} days</strong><span>Generated ${escapeHtml(formatTimestamp(data.now.toISOString()))}</span></div></header>
<nav class="period-nav" aria-label="Reporting period">${[7, 30, 90].map((period) => `<a href="/dashboard?days=${period}"${period === data.days ? ' aria-current="page"' : ""}>${period} days</a>`).join("")}</nav>
<section class="hero" aria-labelledby="dashboard-title"><div class="hero-copy"><span class="eyebrow">Executive operating view · Last ${data.days} days</span><h1 id="dashboard-title">A clear view of the shop, from storefront health to daily sales.</h1><p>Real stored operational and aggregate business data, presented without customer records or third-party dashboard assets.</p></div><div class="hero-status"><span class="status-orb ${health.overall}" aria-hidden="true"></span><strong>${escapeHtml(overallText)}</strong><span>Health freshness threshold: 15 minutes</span></div></section>
<section class="section" aria-labelledby="summary-title"><div class="section-heading"><div><span class="eyebrow">At a glance</span><h2 id="summary-title">Executive summary</h2><p>Current selected-period totals with comparisons only where every displayed day has a real matching day in the prior period.</p></div></div><div class="metrics-grid">${metricCards}</div></section>
<section class="section" aria-labelledby="growth-title"><div class="section-heading"><div><span class="eyebrow">Daily movement</span><h2 id="growth-title">Growth and trends</h2><p>Charts use stored daily aggregates only. Missing dates remain gaps; every quantitative chart keeps a visible zero baseline.</p></div></div><div class="chart-grid"><figure class="chart-card" aria-labelledby="traffic-chart-title traffic-chart-caption"><div class="chart-heading"><div><h3 id="traffic-chart-title">Traffic</h3><p>Requests, HTML page views, and daily unique-IP estimates</p></div></div>${lineChart(currentCloudflare, [{ field: "requests", label: "Requests", color: "#1f5a43" }, { field: "page_views", label: "HTML page views", color: "#bd6339" }, { field: "unique_ips", label: "Estimated unique IPs", color: "#7a6b9b" }], "Requests, HTML page views, and estimated unique IPs by stored day")}<figcaption id="traffic-chart-caption">Daily unique IPs are Cloudflare estimates, not verified people or distinct-period visitors.</figcaption></figure><div class="chart-stack"><figure class="chart-card" aria-labelledby="orders-chart-title orders-chart-caption"><div class="chart-heading"><div><h3 id="orders-chart-title">Orders</h3><p>Daily Shopify order count</p></div></div>${barChart(currentShopify, "orders", "Shopify orders by stored day", "#1f5a43")}<figcaption id="orders-chart-caption">Authoritative aggregate order counts from Shopify reporting.</figcaption></figure><figure class="chart-card" aria-labelledby="aov-chart-title aov-chart-caption"><div class="chart-heading"><div><h3 id="aov-chart-title">Average order value</h3><p>Daily net sales per order</p></div></div>${lineChart(salesChartRows, [{ field: "aov", label: "AOV", color: "#7a6b9b" }], "Average order value by stored day")}<figcaption id="aov-chart-caption">Days with no orders render at zero and do not produce a period AOV.</figcaption></figure></div></div><figure class="chart-card compact" aria-labelledby="sales-chart-title sales-chart-caption"><div class="chart-heading"><div><h3 id="sales-chart-title">Gross and net sales</h3><p>Daily reported sales in ${escapeHtml(currency)}</p></div></div>${lineChart(salesChartRows, [{ field: "gross_sales", label: "Gross sales", color: "#bd6339" }, { field: "net_sales", label: "Net sales", color: "#1f5a43" }], "Gross and net sales by stored day")}<figcaption id="sales-chart-caption">Values are plotted from exact minor-unit aggregates with a zero baseline; negative reversal days remain visible below zero.</figcaption></figure></section>
${health.markup}
${incidentTimeline(data.incidents, data.now)}
${integrationFreshness(data.integrations, data.now)}
${funnelSection(currentFunnel, data.funnelSessions, data.funnelTrendRows, data.funnelEndDate)}
<section class="details-section" aria-labelledby="details-title"><div class="section-heading"><div><span class="eyebrow">Source records</span><h2 id="details-title">Detailed operational data</h2><p>Original bounded Cloudflare, Shopify, incident, probe, funnel, and health details remain available below the summaries.</p></div></div>
<div class="detail-group"><h3>Commerce totals</h3>${table("Selected-period commerce totals", ["Orders", "Units sold", "Gross sales", "Discounts", "Sales reversals", "Net sales", "AOV"], hasShopifyData ? [[orders, units, money(grossSales, currency), money(discounts, currency), money(reversals, currency), money(netSales, currency), averageOrderValue === null ? "—" : money(averageOrderValue, currency)]] : [])}</div>
<div class="detail-group"><h3>Health details</h3>${table("Current health target state", ["Target", "State", "Failures", "Latest detail", "Updated"], data.states.map((row) => [TARGETS.find((target) => target.key === row.target)?.label ?? row.target, stateLabel(healthState(row, data.now)), row.consecutive_failures, row.latest_detail, row.updated_at]))}</div>
<div class="detail-group"><h3>Incident details</h3>${table("Recent incidents", ["Target", "State", "Opened", "Recovered", "Duration", "Latest detail"], data.incidents.map((row) => [TARGETS.find((target) => target.key === row.target)?.label ?? row.target, row.recovered_at ? "Recovered" : "Active", row.opened_at, row.recovered_at ?? "—", formatDuration(row.opened_at, row.recovered_at ?? data.now.toISOString()), row.latest_detail]))}</div>
<div class="detail-group"><h3>Probe history</h3>${table("Recent bounded health probe history", ["Target", "Checked", "Healthy", "HTTP", "Latency ms", "Detail"], data.probes.map((row) => [TARGETS.find((target) => target.key === row.target)?.label ?? row.target, row.checked_at, row.healthy === 1 ? "Yes" : "No", row.status_code ?? "—", row.latency_ms, row.detail]))}</div>
<div class="detail-group"><h3>Funnel details</h3>${table("Daily storefront funnel aggregates", ["Date", "Sessions", "Page views", "Product views", "Cart additions", "Checkout starts", "Newsletter responses"], currentFunnel.slice().reverse().map((row) => [row.date, row.distinct_sessions, row.page_views, row.product_views, row.cart_adds, row.checkout_begins, row.newsletter_signups]))}</div>
<div class="detail-group"><h3>Cloudflare traffic details</h3>${table("Daily Cloudflare aggregate traffic", ["Date", "Requests", "HTML page views", "Estimated unique IPs", "4xx", "5xx", "Threats"], currentCloudflare.slice().reverse().map((row) => [row.date, row.requests, row.page_views, row.unique_ips, row.status_4xx, row.status_5xx, row.threats]))}</div>
<div class="detail-group"><h3>Shopify sales details</h3>${table("Daily Shopify aggregate sales", ["Date", "Orders", "Units sold", "Gross sales", "Discounts", "Sales reversals", "Net sales", "AOV"], currentShopify.slice().reverse().map((row) => [row.date, row.orders, row.units_sold, money(row.gross_sales_minor, row.currency), money(row.discounts_minor, row.currency), money(row.sales_reversals_minor, row.currency), money(row.net_sales_minor, row.currency), row.orders > 0 ? money(Math.round(row.net_sales_minor / row.orders), row.currency) : "—"]))}</div>
<div class="detail-group"><h3>Integration details</h3>${table("Aggregate integration freshness", ["Integration", "State", "Last successful sync", "Latest error"], INTEGRATIONS.map((integration) => { const row = data.integrations.find((item) => item.integration === integration.key); return [integration.label, stateLabel(integrationState(row, data.now)), row?.last_success_at ?? "Never", row?.last_error ?? "—"]; }))}</div></section>
<section class="methodology" aria-label="Metric notes"><article><strong>Estimated, not identified</strong><p>Unique IP values are daily Cloudflare estimates. They are not exact people and are not additive into a distinct-period visitor count.</p></article><article><strong>Two reporting clocks</strong><p>Cloudflare and funnel dates use UTC. Shopify reports in America/New_York, so daily source boundaries are not identical.</p></article><article><strong>Orders are the purchase truth</strong><p>Shopify aggregates are authoritative for orders and sales. Storefront funnel events remain directional and pre-checkout.</p></article></section>
<footer><span>Private · server rendered · no third-party assets</span><span>Generated ${escapeHtml(data.now.toISOString())}</span></footer>
</main></body></html>`;
  return html;
}
