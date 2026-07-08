# &son Now Playing Worker

Cloudflare Worker messenger for the MUSIC stage. It reads the store Spotify
account through Spotify's refresh-token flow, exposes only the current allowed
in-store track, and never controls playback.

## Endpoints

- `GET /now`
  - Public, CORS `*`, always `200`.
  - Shows only when the KV toggle is on, Spotify is actively playing a
    non-local track, and Spotify reports the playing device as one of
    `ALLOWED_DEVICES`.
  - Show shape:
    `{"show":true,"track":{"name":"...","artists":["..."],"album":"...","art":"https://...","url":"https://open.spotify.com/track/..."},"progressMs":1234,"durationMs":180000,"fetchedAt":"2026-07-07T16:00:00.000Z"}`
  - Hide shape: `{"show":false}`. A private `reason` field may be present for
    debugging and must not be treated as public UI copy.
- `GET|POST /toggle?state=on|off&secret=...`
  - Secret-protected. Also accepts `Authorization: Bearer ...` or
    `X-Toggle-Secret: ...`.
  - Returns `{"toggle":"on"}` or `{"toggle":"off"}`.
  - Omit `state` to read the current toggle value.
- `GET /status`
  - Public, CORS `*`, no secrets.
  - Returns `{"auth":"ok"|"error","toggle":"on"|"off","allowedDevices":["Benjamin's iPad"],"lastSpotifyOkAt":null|"ISO date","lastShowAt":null|"ISO date"}`.

The toggle fails closed. A fresh KV namespace starts as `off`; turn it on only
after the worker is deployed, authorized, and tested.

## Deploy

Run these commands from this `worker/` directory.

1. Install or invoke Wrangler:

   ```sh
   npx wrangler login
   ```

2. Create one KV namespace:

   ```sh
   npx wrangler kv namespace create NOW_PLAYING_KV
   ```

3. Copy the returned namespace `id` into `wrangler.toml`, replacing the
   placeholder `00000000000000000000000000000000`.

4. Set Worker secrets. Never put these values in a file:

   ```sh
   npx wrangler secret put SPOTIFY_CLIENT_SECRET
   npx wrangler secret put SPOTIFY_REFRESH_TOKEN
   npx wrangler secret put TOGGLE_SECRET
   ```

5. Deploy:

   ```sh
   npx wrangler deploy
   ```

## Spotify authorization

The app redirect URI must be registered as:

```text
http://127.0.0.1:8888/callback
```

While logged into the store Spotify account in the browser, run:

```sh
SPOTIFY_CLIENT_ID=8890a3933d484ade825a44278a8f5792 node scripts/authorize.mjs
```

The script prompts for `SPOTIFY_CLIENT_SECRET` if it is not already set in the
environment, starts a local callback server, prints the authorization URL, then
prints the refresh token after Spotify redirects back. Store that token with:

```sh
npx wrangler secret put SPOTIFY_REFRESH_TOKEN
```

Required Spotify scope: `user-read-playback-state`.

## Toggle shortcut

Create an iOS Shortcut on Benjamin's iPad, and optionally on a phone used by the
operator:

- Turn on: `GET https://<worker-origin>/toggle?state=on&secret=<TOGGLE_SECRET>`
- Turn off: `GET https://<worker-origin>/toggle?state=off&secret=<TOGGLE_SECRET>`

The same calls work as `POST`. Header auth is also supported if a shortcut or
automation prefers not to put the secret in the URL:

```text
Authorization: Bearer <TOGGLE_SECRET>
```

## Allowed devices

`ALLOWED_DEVICES` lives in `wrangler.toml` as a comma-separated Worker var. The
initial value is:

```toml
ALLOWED_DEVICES = "Benjamin's iPad"
```

Matching is trimmed and case-insensitive. If the iPad is renamed or replaced,
update the value and redeploy. Multiple devices can be listed with commas, but
keep this narrow; phone playback should not appear on the site.

## Re-authorization

Use `/status` for a quick health check. If `auth` is `error` after `/now` has
recently been hit, the Spotify authorization may have been revoked or the secret
may be wrong.

To recover:

1. Run `node scripts/authorize.mjs` again while logged into the store Spotify
   account.
2. Replace the Worker secret with the new refresh token:

   ```sh
   npx wrangler secret put SPOTIFY_REFRESH_TOKEN
   ```

3. Redeploy if only vars changed; secrets do not require committing anything.
4. Hit `/now`, then check `/status`.

## Test-day checklist

- Confirm `/status` returns the expected allowed device and `toggle`.
- Toggle on, play music on Benjamin's iPad, then confirm `/now` returns
  `show:true`.
- Skip to the next track and confirm `/now` changes after the short cache window.
- Pause playback and confirm `/now` returns `show:false`.
- Play directly from a phone and confirm `/now` returns `show:false`.
- Remote-control the iPad from a phone and confirm `/now` still returns
  `show:true` because the playing device remains Benjamin's iPad.
- Toggle off and confirm `/now` returns `show:false`; toggle back on and confirm
  the track can show again.
- At closing time, check the site through each state the operator cares about:
  playing, paused, toggled off, and no active Spotify device.
