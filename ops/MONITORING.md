# &son now-playing monitor

A scheduled health check that runs on the always-on Mac and texts Beckett when
the in-store "now playing" feature (or the live site) breaks. It watches for the
one thing that actually rots over time, the Spotify authorization, plus worker
and site uptime.

## What it checks (every 30 min)
1. Forces a fresh Spotify poll (`GET /now`), then reads `GET /status`.
2. Flags a problem if:
   - the worker does not respond, or
   - `auth` is `error` (Spotify connection broken, needs re-auth), or
   - the live site does not return HTTP 200.
3. Texts you on the transition into a problem, one reminder per day while it
   stays broken, and once on recovery. It does not text on every run.

Note: `auth` only refreshes when the toggle is ON (the worker skips the Spotify
call while off), so auth rot is caught the next time the shop turns the display
on, which in practice is daily.

## One-time setup

1. **Create the alert Shortcut** (on the Mac, in the Shortcuts app):
   - New shortcut, add one action: **Send Message**.
   - Set **Recipients** to your own phone number.
   - Set the message content to the **Shortcut Input** variable.
   - Name it exactly **`SS Alert`** (or change `ALERT_SHORTCUT` in the script).
2. **Make the script executable** (once):
   ```sh
   chmod +x "/Users/robo/Desktop/BaderBureau/Shop & Sons/ops/now-playing-healthcheck.sh"
   ```
3. **Send yourself a test text** to prove the alert path works and to trigger any
   macOS permission prompt (approve it):
   ```sh
   "/Users/robo/Desktop/BaderBureau/Shop & Sons/ops/now-playing-healthcheck.sh" --test
   ```
   You should get a text within a few seconds. If not, check
   `ops/.state/monitor.log`.
4. **Install the schedule** (launchd):
   ```sh
   cp "/Users/robo/Desktop/BaderBureau/Shop & Sons/ops/launchagent/com.shopandson.nowplaying-monitor.plist" ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.shopandson.nowplaying-monitor.plist
   ```

## Operating it
- See current health without texting: `./ops/now-playing-healthcheck.sh --status`
- Logs: `ops/.state/monitor.log` (and `launchd.out.log` / `launchd.err.log`).
- Pause it: `launchctl unload ~/Library/LaunchAgents/com.shopandson.nowplaying-monitor.plist`
- Resume it: `launchctl load ~/Library/LaunchAgents/com.shopandson.nowplaying-monitor.plist`

## When you get an "auth error" text
The Spotify connection dropped (password change, revoked access, or the client
secret was rotated without updating the worker). Fix, ~15 min:
1. `cd worker && node scripts/authorize.mjs` while logged into the store Spotify
   account (see `worker/README.md` -> Re-authorization).
2. `npx wrangler secret put SPOTIFY_REFRESH_TOKEN` with the new token.
3. `npx wrangler deploy`, then check `.../status` shows `auth: ok`.

## Limits (be honest about them)
- Only watches while the Mac is awake and online. If the Mac sleeps, checks
  pause (a Cloudflare-cron version would be truly always-on; this was the chosen
  trade for simplicity).
- The `.state/` folder (logs, last-status, your test artifacts) is gitignored.
