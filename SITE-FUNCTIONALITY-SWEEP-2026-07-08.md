# Now-Playing Functionality / Regression Sweep — 2026-07-08

Behavioral-correctness and regression sweep of the "now playing" feature (worker
+ site integration). NOT security, NOT style. **Summary: 0 high, 4 medium, 7 low.**
No confirmed crash-level bug in the current code paths; the worker state machine
and the site render/validation logic are sound. The medium items are
engine/clock/config dependencies that can silently disable the feature or show
the wrong device at launch.

Files reviewed (read in full):
- `worker/src/index.js`, `worker/README.md`, `worker/wrangler.toml`
- `homepage/public/scripts/now-playing.js` (the actual `/now` poller)
- `homepage/src/components/blocks/HeroVideo.astro` (markup + `data-now-playing-url` wiring + mobile stage logic)
- `homepage/src/layouts/Base.astro` (CSP + `PUBLIC_NOW_PLAYING_URL` origin wiring)
- `homepage/public/styles/now-playing.css`, `homepage/src/data/content.ts`

Note on live status: the feature is currently **dormant** — it only renders when
`PUBLIC_NOW_PLAYING_URL` is set (memory says it is unset today). Everything below
matters at launch, not on the live page right now. `homepage/src/components/blocks/Music.astro`
is an unrelated off-air fallback block and is not part of this data path.

---

## MEDIUM

### M1 — Store-hours gate uses a fragile `new Date(Date#toLocaleString())` round-trip that can silently kill the feature on iOS Safari
File: `homepage/public/scripts/now-playing.js:103-115`

```js
const getEasternHour = () => {
  const easternTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  return easternTime.getHours();
};
```

`isStoreOpen()` is the master gate for the whole feature: `fetchNowPlaying()`
short-circuits to `renderEmptyState()` whenever `isStoreOpen()` is false
(line 274). `isStoreOpen()` returns `hour >= openHour && hour < closeHour`, so if
`getEasternHour()` returns `NaN`, every comparison is false and **the track never
displays during open hours** — a total, silent failure with no error.

The risk: `toLocaleString("en-US", …)` on ICU 72+ engines (modern Safari/iOS 16.4+,
recent Chrome) emits a **U+202F narrow no-break space** before "AM/PM", and
`new Date("… 2:39:46 PM")` returns `Invalid Date` on several engine versions
→ `getHours()` is `NaN`. I could NOT reproduce the failure in this repo's Node/V8
(it parsed to a valid Date), so this is a **latent, engine-dependent** hazard, not
a confirmed break — but the target hardware is exactly the at-risk set (the
in-store iPad is Safari; most visitors are on iOS Safari), and the failure mode is
severe (feature appears permanently "nothing playing").

Failure scenario: in-store iPad on an iOS/Safari build whose `Date` parser rejects
the narrow-no-break-space time string → `getEasternHour()` = `NaN` →
`isStoreOpen()` = false at 2pm → `/now` is never rendered even while music plays.

Fix: don't re-parse a localized string. Read the hour directly:
```js
const getEasternHour = () =>
  Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour: "numeric", hour12: false,
  }).formatToParts(new Date()).find((p) => p.type === "hour").value);
```
(Also guard the `find` result.) **Verify on the store's actual iPad/iOS version
before launch regardless of the fix.**

### M2 — Freshness/progress trust the *worker's* timestamp against the *visitor's* clock; a skewed client clock hides a live track
File: `homepage/public/scripts/now-playing.js:122-142, 216-228`

`isFresh(fetchedAtMs)` is `Date.now() - fetchedAtMs <= 45_000`, where `fetchedAtMs`
is the worker's `fetchedAt` (server time) and `Date.now()` is the visitor's clock.
`renderNowPlaying()` calls `renderEmptyState()` when `!isFresh(...)`.

Failure scenario: a visitor device whose clock is more than ~45s **ahead** of real
time makes `Date.now() - fetchedAtMs > 45000` for a genuinely fresh payload →
the live, playing track renders as "nothing playing right now". A device whose
clock is behind produces `elapsed < 0` in `getProgressRatio()` (guarded by
`Math.max(0, …)`, so only cosmetic — the bar sits at the start).

This is an edge (wrong-clock devices), but the whole feature already leans on the
client clock (M1), so it compounds. Fix: base freshness on local receipt time
(record `Date.now()` when the response arrives) rather than differencing against
the server's `fetchedAt`; keep `fetchedAt` only for the progress *offset*.

### M3 — Test device still whitelisted in `ALLOWED_DEVICES`; will surface non-store playback at go-live
File: `worker/wrangler.toml:8-10`

```toml
ALLOWED_DEVICES = "Benjamin's iPad,Beckett’s Mac mini"
```

The file's own comment flags "Beckett's Mac mini" as a temporary test device to
remove before go-live. While present, any track playing on that Mac passes
`deviceAllowed()` and shows on the live site — exactly the "phone/other device
should not appear" case the feature is designed to prevent. Not a code bug, but a
config-correctness item that changes what the public sees. Fix: remove the test
device from `ALLOWED_DEVICES` (and confirm via `/status.allowedDevices`) at launch.

### M4 — Apostrophe-glyph mismatch can make `deviceAllowed()` reject the real iPad
File: `worker/wrangler.toml:10`, `worker/src/index.js:265-283`

`normalizeDevice()` only trims + lowercases; it does not normalize quote glyphs.
`ALLOWED_DEVICES` mixes a straight apostrophe in `Benjamin's` with a curly one in
`Beckett’s`. Spotify reports `device.name` as the user-set device name verbatim.
If the iPad's actual name uses a curly apostrophe (`Benjamin’s iPad`) while the
config uses a straight one (or vice-versa), the strings differ and
`deviceAllowed()` returns false → `reason:'device_gated'` → the site never shows,
even though the correct iPad is playing.

Failure scenario: iPad named `Benjamin’s iPad` (curly, common on iOS) vs config
`Benjamin's iPad` (straight) → never matches → feature silently gated off.
Fix: match the config glyph to what `/status` / Spotify actually reports (verify on
test day), or normalize apostrophes/quotes in `normalizeDevice()`.

---

## LOW

### L1 — Toggle cache invalidation is per-isolate only; a warm isolate serves stale show state for up to `NOW_CACHE_MS` (8s)
File: `worker/src/index.js:110-117, 134-137`

`handleToggle` resets `nowCache` only in the isolate that handled `/toggle`.
Other warm isolates keep returning the cached `{show:…}` for up to 8s (their
`nowCache.expiresAt`), even after the KV `toggle` flips. So after the operator
toggles off (or on), some `/now` responses lag by ≤8s. Bounded and by-design for a
polling feature (client heartbeat is 25s anyway), but worth knowing. No fix
required; if tighter, drop `NOW_CACHE_MS` or key the cache on the KV toggle value.

### L2 — No in-flight coalescing on `/now` cache miss → duplicate Spotify + token fetches under concurrency
File: `worker/src/index.js:51-63, 157-166, 196-240`

Concurrent `/now` requests that all miss the 8s cache each call
`getPlaybackState` → `fetchPlayback`, and if the token is cold each calls
`getAccessToken` → a separate token POST. No request coalescing / single-flight.
Harmless at store-scale traffic (low volume), but a thundering-herd smell. Fix (if
ever needed): cache an in-flight promise, not just the resolved value.

### L3 — `getAccessToken` treats a missing `expires_in` as immediate expiry → refetch on every request
File: `worker/src/index.js:234-239`

`expiresAt = now + Math.max(0, Number(data.expires_in || 0) * 1000)`. If Spotify
omits `expires_in`, `expiresAt === now`, and the cache check
`expiresAt > now + TOKEN_EXPIRY_SKEW_MS` is always false → a token POST on every
request (no loop, no incorrect result — just wasteful). Spotify always returns
`expires_in`, so theoretical. Fix: fall back to a sane default (e.g. 3600s).

### L4 — `stampKv` rollback deletes the last-known value instead of restoring the previous one
File: `worker/src/index.js:318-337`

On a KV `put` failure the code `delete`s both `lastStampWrites` and
`lastStampValues` for the key, discarding the last *successfully written* value
rather than restoring it. Benign: for `writeWhenChanged` (auth) the next stamp sees
`lastValue === undefined`, so it re-writes (a redundant but correct write); for
throttled timestamps it just un-throttles the next write. No incorrect state.
Note only. (The maps are keyed by a fixed 3-key set — `spotifyAuth`,
`lastSpotifyOkAt`, `lastShowAt` — so **no unbounded growth**, contrary to the
initial hypothesis.)

### L5 — Album-art host allowlist (`*.scdn.co`) is broader than the page CSP (`i.scdn.co` only)
File: `homepage/public/scripts/now-playing.js:50-59`, `homepage/src/layouts/Base.astro:31`

`getAlbumArtSrc()` accepts any `*.scdn.co` host, but the CSP `img-src` only allows
`https://i.scdn.co`. Album cover art is served from `i.scdn.co` in practice, so
this never bites — but if Spotify ever returned art on another `scdn.co`
subdomain, the JS would set `art.src` and the CSP would block the load → broken
(empty) image rather than a clean hide. Cosmetic. Fix: tighten the JS check to
`i.scdn.co` to match the CSP.

### L6 — Worker considers a track with an empty artist list "showable"; site does not → wasted show
File: `worker/src/index.js:93-104, 251-263` vs `homepage/public/scripts/now-playing.js:216-228`

Worker `shapeTrack` requires `name` + `url` but not `artists`; it can return
`show:true` with `artists:[]`. The site requires a non-empty `artistText` and
falls back to the empty state. So a nameless-artist track yields `show:true` from
the worker but "nothing playing" on the site — a minor contract mismatch. No real
track hits this; note only.

### L7 — `renderEmptyState()` DOM refs are not null-guarded (unlike `link?` / `menuLink?`)
File: `homepage/public/scripts/now-playing.js:185-205`

`title`, `separator`, `artist`, `album`, `art`, `progress`, `progressBar`,
`pulse`, `spotify` are used without optional chaining. All exist in the current
`HeroVideo.astro` markup, so this cannot throw today; it's a latent coupling — a
future markup edit that drops one node would throw and break rendering. Note only.

---

## Checked and OK (no issue found)

- **Token 401 retry** (`index.js:157-194`): single forced refresh then re-fetch;
  a second 401 falls through to `auth_error`. No double-refresh, no infinite loop.
- **`getNow` state-machine ordering** (`index.js:51-108`): toggle → playback →
  idle → paused → type → item → local → device → track-data. Each hide path
  returns the right `show:false` + reason; success path stamps `lastShowAt` via
  `waitUntil` and caches. Correct.
- **Module-global maps are bounded** to the fixed KV key set (see L4) — no
  unbounded growth.
- **Timestamp throttle** (`index.js:318-337`): time-throttled to 60s/isolate for
  timestamps; `writeWhenChanged` bypasses the throttle on an auth ok↔error flip.
  Correct.
- **Site payload validation** (`now-playing.js:207-267`): defends against
  `show!==true`, stale, missing/invalid url/name/artist/duration/progress, and
  non-Spotify URLs; handles `art:null` and empty-artist cleanly. Good.
- **Poll lifecycle** (`now-playing.js:269-343`): `isFetching` guard prevents
  overlap; `AbortController` cancels in-flight on stop; `finally` always resets
  `isFetching` and re-schedules the heartbeat only while running; MutationObserver
  + visibilitychange drive start/stop. No stuck-fetch or runaway-timer path found.
- **Progress math** (`now-playing.js:136-142`): clamped to `[0,1]` and `[0,duration]`;
  cannot go negative or overflow (skew only shifts the offset — see M2).
- **Mobile visibility interplay** (`now-playing.css` + `HeroVideo.astro`): the JS
  `hidden` attribute and the CSS `is-now-playing-open` state are orthogonal; JS
  revealing the card (`hidden=false`) does not force it on-screen on mobile (it
  stays translated off / `visibility:hidden` until the user opens the panel). No
  mobile render regression.
- **Contract**: worker show-shape (`track{name,artists[],album,art,url},progressMs,
  durationMs,fetchedAt`) matches what the site consumes; hide-shape `{show:false}`
  is handled; the private `reason` field is never rendered.
</content>
</invoke>
