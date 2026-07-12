const SPOTIFY_PLAYER_URL = 'https://api.spotify.com/v1/me/player';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SHOPIFY_ADMIN_OAUTH_URL = 'https://shop-and-son.myshopify.com/admin/oauth/access_token';
const SHOPIFY_ADMIN_GRAPHQL_URL = 'https://shop-and-son.myshopify.com/admin/api/2025-01/graphql.json';
const NOW_CACHE_MS = 8000;
const TOKEN_EXPIRY_SKEW_MS = 60000;
const STATUS_STAMP_THROTTLE_MS = 60000;
const SUBSCRIBE_RATE_LIMIT = 5;
const SUBSCRIBE_RATE_WINDOW_SECONDS = 60 * 60;

const SUBSCRIBE_ORIGINS = new Set([
  'https://shopandson.com',
  'https://www.shopandson.com',
]);

const KV_KEYS = {
  toggle: 'toggle',
  auth: 'spotifyAuth',
  lastSpotifyOkAt: 'lastSpotifyOkAt',
  lastShowAt: 'lastShowAt',
};

let accessTokenCache = {
  token: '',
  expiresAt: 0,
};

let shopifyTokenCache = {
  token: '',
  expiresAt: 0,
};

let nowCache = {
  expiresAt: 0,
  data: null,
};

const lastStampWrites = new Map();
const lastStampValues = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/subscribe') {
      return handleSubscribe(request, env);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/now' && request.method === 'GET') {
      return json(await getNow(env, ctx), 200, corsHeaders());
    }

    if (url.pathname === '/toggle' && (request.method === 'GET' || request.method === 'POST')) {
      return handleToggle(request, url, env);
    }

    if (url.pathname === '/status' && request.method === 'GET') {
      return json(await getStatus(env), 200, corsHeaders());
    }

    return json({ error: 'not_found' }, 404, corsHeaders());
  },
};

// Public newsletter endpoint. It keeps Shopify Admin credentials server-side,
// rate-limits callers, and never reveals whether a customer already existed.
async function handleSubscribe(request, env) {
  const headers = subscribeCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return json({ error: 'request_failed' }, 405, headers);
  }

  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    return json({ error: 'service_unavailable' }, 503, headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request' }, 400, headers);
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isBasicEmail(email)) {
    return json({ error: 'invalid_request' }, 400, headers);
  }

  if (!(await subscribeRateLimitAllows(request, env))) {
    return json({ error: 'rate_limited' }, 429, headers);
  }

  try {
    const customerId = await findCustomerId(email, env);
    if (customerId) {
      await subscribeExistingCustomer(customerId, env);
    } else {
      await createSubscribedCustomer(email, env);
    }
  } catch (error) {
    console.error('Shopify newsletter upsert failed', error);
    return json({ error: 'request_failed' }, 502, headers);
  }

  return json({ ok: true }, 200, headers);
}

function isBasicEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function subscribeRateLimitAllows(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = `subscribe-rate:${ip}`;
  const count = Number(await env.NOW_PLAYING_KV.get(key)) || 0;

  if (count >= SUBSCRIBE_RATE_LIMIT) {
    return false;
  }

  await env.NOW_PLAYING_KV.put(key, String(count + 1), {
    expirationTtl: SUBSCRIBE_RATE_WINDOW_SECONDS,
  });
  return true;
}

async function findCustomerId(email, env) {
  const data = await shopifyAdminGraphql(env, `
    query FindCustomer($query: String!) {
      customers(first: 1, query: $query) {
        nodes { id }
      }
    }
  `, { query: `email:"${email.replace(/["\\]/g, '\\$&')}"` });

  return data.customers?.nodes?.[0]?.id || null;
}

async function subscribeExistingCustomer(customerId, env) {
  const data = await shopifyAdminGraphql(env, `
    mutation SubscribeCustomer($input: CustomerEmailMarketingConsentUpdateInput!) {
      customerEmailMarketingConsentUpdate(input: $input) {
        userErrors { field message }
      }
    }
  `, {
    input: {
      customerId,
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
      },
    },
  });

  throwForUserErrors(data.customerEmailMarketingConsentUpdate?.userErrors);
}

async function createSubscribedCustomer(email, env) {
  const data = await shopifyAdminGraphql(env, `
    mutation CreateSubscribedCustomer($input: CustomerInput!) {
      customerCreate(input: $input) {
        userErrors { field message }
      }
    }
  `, {
    input: {
      email,
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
      },
    },
  });

  throwForUserErrors(data.customerCreate?.userErrors);
}

async function shopifyAdminGraphql(env, query, variables) {
  const body = JSON.stringify({ query, variables });
  let token = await getShopifyAdminToken(env);
  let response = await fetchShopifyAdminGraphql(token, body);

  if (response.status === 401) {
    token = await getShopifyAdminToken(env, true);
    response = await fetchShopifyAdminGraphql(token, body);
  }

  if (!response.ok) {
    throw new Error(`Shopify Admin API returned ${response.status}`);
  }

  const result = await response.json();
  if (result.errors?.length || !result.data) {
    throw new Error('Shopify Admin GraphQL request failed');
  }

  return result.data;
}

function fetchShopifyAdminGraphql(token, body) {
  return fetch(SHOPIFY_ADMIN_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body,
  });
}

async function getShopifyAdminToken(env, forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && shopifyTokenCache.token && shopifyTokenCache.expiresAt > now + TOKEN_EXPIRY_SKEW_MS) {
    return shopifyTokenCache.token;
  }

  const clientId = env.SHOPIFY_CLIENT_ID;
  const clientSecret = env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AuthError('missing_shopify_credentials');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(SHOPIFY_ADMIN_OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new AuthError('shopify_token_refresh_failed');
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new AuthError('missing_shopify_access_token');
  }

  shopifyTokenCache = {
    token: data.access_token,
    expiresAt: now + Math.max(0, Number(data.expires_in || 0) * 1000),
  };

  return shopifyTokenCache.token;
}

function throwForUserErrors(userErrors) {
  if (Array.isArray(userErrors) && userErrors.length > 0) {
    throw new Error('Shopify Admin mutation returned user errors');
  }
}

function subscribeCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };

  if (SUBSCRIBE_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

async function getNow(env, ctx) {
  const now = Date.now();

  if (nowCache.data && nowCache.expiresAt > now) {
    return nowCache.data;
  }

  const toggle = await readToggle(env);
  if (toggle !== 'on') {
    return cacheNow({ show: false, reason: 'toggle_off' }, now);
  }

  const playback = await getPlaybackState(env, ctx);
  if (!playback.ok) {
    return cacheNow({ show: false, reason: playback.reason }, now);
  }

  const state = playback.data;
  if (!state) {
    return cacheNow({ show: false, reason: 'idle' }, now);
  }

  if (state.is_playing !== true) {
    return cacheNow({ show: false, reason: 'paused' }, now);
  }

  if (state.currently_playing_type !== 'track') {
    return cacheNow({ show: false, reason: 'not_track' }, now);
  }

  if (!state.item) {
    return cacheNow({ show: false, reason: 'missing_item' }, now);
  }

  if (state.item.is_local === true) {
    return cacheNow({ show: false, reason: 'local_file' }, now);
  }

  if (!deviceAllowed(state.device?.name, env.ALLOWED_DEVICES)) {
    return cacheNow({ show: false, reason: 'device_gated' }, now);
  }

  const track = shapeTrack(state.item);
  if (!track.name || !track.url) {
    return cacheNow({ show: false, reason: 'missing_track_data' }, now);
  }

  const response = {
    show: true,
    track,
    progressMs: numberOrZero(state.progress_ms),
    durationMs: numberOrZero(state.item.duration_ms),
    fetchedAt: new Date(now).toISOString(),
  };

  ctx.waitUntil(stampTimestamp(env, KV_KEYS.lastShowAt, response.fetchedAt));
  return cacheNow(response, now);
}

function cacheNow(data, now) {
  nowCache = {
    data,
    expiresAt: now + NOW_CACHE_MS,
  };

  return data;
}

async function handleToggle(request, url, env) {
  if (!secretMatches(request, url, env.TOGGLE_SECRET)) {
    return json({ error: 'forbidden' }, 403, corsHeaders());
  }

  const requestedState = url.searchParams.get('state');
  if (requestedState === null || requestedState === '') {
    return json({ toggle: await readToggle(env) }, 200, corsHeaders());
  }

  const state = requestedState.trim().toLowerCase();
  if (state !== 'on' && state !== 'off') {
    return json({ error: 'invalid_state' }, 400, corsHeaders());
  }

  await env.NOW_PLAYING_KV.put(KV_KEYS.toggle, state);
  nowCache = { expiresAt: 0, data: null };

  return json({ toggle: state }, 200, corsHeaders());
}

async function getStatus(env) {
  const [auth, toggle, lastSpotifyOkAt, lastShowAt] = await Promise.all([
    safeKvGet(env, KV_KEYS.auth),
    readToggle(env),
    safeKvGet(env, KV_KEYS.lastSpotifyOkAt),
    safeKvGet(env, KV_KEYS.lastShowAt),
  ]);

  return {
    auth: auth === 'ok' ? 'ok' : 'error',
    toggle,
    allowedDevices: parseAllowedDevices(env.ALLOWED_DEVICES),
    lastSpotifyOkAt: lastSpotifyOkAt || null,
    lastShowAt: lastShowAt || null,
  };
}

async function getPlaybackState(env, ctx) {
  try {
    let token = await getAccessToken(env);
    let response = await fetchPlayback(token);

    if (response.status === 401) {
      accessTokenCache = { token: '', expiresAt: 0 };
      token = await getAccessToken(env, true);
      response = await fetchPlayback(token);
    }

    if (response.status === 204) {
      stampSpotifyOk(env, ctx);
      return { ok: true, data: null };
    }

    if (response.status === 401 || response.status === 403) {
      stampSpotifyAuth(env, ctx, 'error');
      return { ok: false, reason: 'auth_error' };
    }

    if (!response.ok) {
      return { ok: false, reason: 'spotify_error' };
    }

    const data = await response.json();
    stampSpotifyOk(env, ctx);

    return { ok: true, data };
  } catch (error) {
    if (error instanceof AuthError) {
      stampSpotifyAuth(env, ctx, 'error');
      return { ok: false, reason: 'auth_error' };
    }

    return { ok: false, reason: 'spotify_error' };
  }
}

async function getAccessToken(env, forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && accessTokenCache.token && accessTokenCache.expiresAt > now + TOKEN_EXPIRY_SKEW_MS) {
    return accessTokenCache.token;
  }

  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new AuthError('missing_spotify_credentials');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new AuthError('token_refresh_failed');
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new AuthError('missing_access_token');
  }

  accessTokenCache = {
    token: data.access_token,
    expiresAt: now + Math.max(0, Number(data.expires_in || 0) * 1000),
  };

  return accessTokenCache.token;
}

function fetchPlayback(token) {
  return fetch(SPOTIFY_PLAYER_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function shapeTrack(item) {
  const albumImages = Array.isArray(item.album?.images) ? item.album.images : [];

  return {
    name: stringOrEmpty(item.name),
    artists: Array.isArray(item.artists)
      ? item.artists.map((artist) => stringOrEmpty(artist.name)).filter(Boolean)
      : [],
    album: stringOrEmpty(item.album?.name),
    art: albumImages[0]?.url || null,
    url: item.external_urls?.spotify || '',
  };
}

function deviceAllowed(deviceName, allowedDevices) {
  const normalizedDevice = normalizeDevice(deviceName);
  if (!normalizedDevice) {
    return false;
  }

  return parseAllowedDevices(allowedDevices).some((allowedDevice) => normalizeDevice(allowedDevice) === normalizedDevice);
}

function parseAllowedDevices(value) {
  return String(value || '')
    .split(',')
    .map((device) => device.trim())
    .filter(Boolean);
}

function normalizeDevice(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    // Fold curly/typographic apostrophes to a straight one so a device named
    // "Beckett's" matches regardless of which glyph Spotify (or the config)
    // uses. Without this, a straight-vs-curly mismatch silently gates the
    // feature off (audit 2026-07-08, M4).
    .replace(/[‘’ʼ′]/g, "'");
}

async function readToggle(env) {
  const value = await safeKvGet(env, KV_KEYS.toggle);
  return value === 'on' ? 'on' : 'off';
}

async function safeKvGet(env, key) {
  try {
    return (await env.NOW_PLAYING_KV.get(key)) || '';
  } catch {
    return '';
  }
}

function stampSpotifyOk(env, ctx) {
  const timestamp = new Date().toISOString();
  ctx.waitUntil(Promise.all([
    stampTimestamp(env, KV_KEYS.lastSpotifyOkAt, timestamp),
    stampAuth(env, 'ok'),
  ]));
}

function stampSpotifyAuth(env, ctx, state) {
  ctx.waitUntil(stampAuth(env, state));
}

async function stampAuth(env, state) {
  await stampKv(env, KV_KEYS.auth, state, { writeWhenChanged: true });
}

async function stampTimestamp(env, key, timestamp) {
  await stampKv(env, key, timestamp);
}

async function stampKv(env, key, value, options = {}) {
  const now = Date.now();
  const lastWrite = lastStampWrites.get(key) || 0;
  const lastValue = lastStampValues.get(key);
  const valueChanged = options.writeWhenChanged === true && lastValue !== value;

  if (!valueChanged && now - lastWrite < STATUS_STAMP_THROTTLE_MS) {
    return;
  }

  lastStampWrites.set(key, now);
  lastStampValues.set(key, value);

  try {
    await env.NOW_PLAYING_KV.put(key, value);
  } catch {
    lastStampWrites.delete(key);
    lastStampValues.delete(key);
  }
}

function secretMatches(request, url, expectedSecret) {
  if (!expectedSecret) {
    return false;
  }

  const providedSecret = getProvidedSecret(request, url);
  return providedSecret !== '' && constantTimeEquals(providedSecret, expectedSecret);
}

// Constant-time string compare so the toggle secret can't be recovered via a
// timing side channel (paired with a Cloudflare rate-limit rule on /toggle).
function constantTimeEquals(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare against a fixed-length digest so length itself isn't a timing leak.
  const target = bb.length === ab.length ? bb : ab;
  let mismatch = ab.length ^ bb.length;
  for (let i = 0; i < ab.length; i++) {
    mismatch |= ab[i] ^ target[i];
  }
  return mismatch === 0;
}

function getProvidedSecret(request, url) {
  const querySecret = url.searchParams.get('secret');
  if (querySecret) {
    return querySecret;
  }

  const xSecret = request.headers.get('x-toggle-secret');
  if (xSecret) {
    return xSecret;
  }

  const authorization = request.headers.get('authorization') || '';
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1].trim();
  }

  return authorization.trim();
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function stringOrEmpty(value) {
  return typeof value === 'string' ? value : '';
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Toggle-Secret',
  };
}

class AuthError extends Error {}
