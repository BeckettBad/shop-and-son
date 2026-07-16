#!/usr/bin/env bash
#
# now-playing-healthcheck.sh — watches the &son "now playing" worker (and the
# live site) and texts the operator when something breaks.
#
# Runs from launchd on the always-on Mac (see launchagent/ in this folder).
# It is debounced: it texts on the TRANSITION into a problem, sends one daily
# reminder while still broken, and texts once on recovery. It does NOT text
# every run.
#
# The text is sent through a user-created macOS Shortcut so your phone number
# lives in the Shortcut, not in this repo, and macOS messaging permissions are
# handled in the Shortcuts app. Create a Shortcut named exactly as ALERT_SHORTCUT
# below: one "Send Message" action, Recipient = your number, Message = "Shortcut
# Input". See MONITORING.md.
#
# Manual use:
#   ./now-playing-healthcheck.sh            # one check, texts only on change
#   ./now-playing-healthcheck.sh --test     # send a test text right now, then exit
#   ./now-playing-healthcheck.sh --status    # print current health, no texting

set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

WORKER_URL="${WORKER_URL:-https://shop-and-son-now-playing.shop-and-son.workers.dev}"
SITE_URL="${SITE_URL:-https://shopandson.com/}"
ALERT_SHORTCUT="${ALERT_SHORTCUT:-SS Alert}"
REMIND_EVERY_SECS="${REMIND_EVERY_SECS:-86400}"   # re-nag once/day while broken

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$SCRIPT_DIR/.state"
STATE_FILE="$STATE_DIR/health.state"       # last status token
LAST_ALERT_FILE="$STATE_DIR/last_alert.epoch"
LOG_FILE="$STATE_DIR/monitor.log"
mkdir -p "$STATE_DIR"

log() { printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >>"$LOG_FILE"; }

send_text() {
  # $1 = message body. Routed through the user's Shortcut.
  local msg="$1" tmp
  tmp="$(mktemp)"; printf '%s' "$msg" >"$tmp"
  if shortcuts run "$ALERT_SHORTCUT" --input-path "$tmp" >/dev/null 2>&1; then
    log "TEXT sent via '$ALERT_SHORTCUT': $msg"
  else
    log "TEXT FAILED via '$ALERT_SHORTCUT' (shortcut missing or not permitted): $msg"
  fi
  rm -f "$tmp"
}

# --- probe ---------------------------------------------------------------
# Force a fresh Spotify poll (only refreshes auth when the toggle is on), then
# read /status. This makes 'auth' reflect a live check during open hours.
curl -fsS --max-time 12 "$WORKER_URL/now" >/dev/null 2>&1

STATUS_JSON="$(curl -fsS --max-time 12 "$WORKER_URL/status" 2>/dev/null)"
STATUS_RC=$?
SITE_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$SITE_URL" 2>/dev/null)"

STATUS="ok"; DETAIL=""
if [[ $STATUS_RC -ne 0 || -z "$STATUS_JSON" ]]; then
  STATUS="worker_unreachable"
  DETAIL="The now-playing worker did not respond ($WORKER_URL/status)."
else
  AUTH="$(printf '%s' "$STATUS_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("auth",""))' 2>/dev/null)"
  TOGGLE="$(printf '%s' "$STATUS_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("toggle",""))' 2>/dev/null)"
  if [[ "$AUTH" == "error" ]]; then
    STATUS="auth_error"
    DETAIL="Spotify auth is BROKEN (auth=error). Re-authorize: worker/README.md -> Re-authorization. Toggle=$TOGGLE."
  elif [[ "$SITE_CODE" != "200" ]]; then
    STATUS="site_down"
    DETAIL="Worker OK but the live site returned HTTP $SITE_CODE ($SITE_URL)."
  else
    DETAIL="worker ok, auth=$AUTH, toggle=$TOGGLE, site=200"
  fi
fi

log "CHECK status=$STATUS site=$SITE_CODE detail=$DETAIL"

# --- modes ---------------------------------------------------------------
if [[ "${1:-}" == "--test" ]]; then
  send_text "&son monitor test $(date '+%H:%M'). If you got this, alerts work. Current: $DETAIL"
  echo "Test text attempted via Shortcut '$ALERT_SHORTCUT'. Check the log: $LOG_FILE"
  exit 0
fi
if [[ "${1:-}" == "--status" ]]; then
  echo "status=$STATUS  site=$SITE_CODE"
  echo "$DETAIL"
  exit 0
fi

# --- debounced alerting --------------------------------------------------
PREV="$(cat "$STATE_FILE" 2>/dev/null || echo "ok")"
NOW_EPOCH="$(date +%s)"

if [[ "$STATUS" != "ok" ]]; then
  if [[ "$PREV" == "ok" ]]; then
    send_text "ALERT &son now-playing: $DETAIL"
    echo "$NOW_EPOCH" >"$LAST_ALERT_FILE"
  else
    LAST_ALERT="$(cat "$LAST_ALERT_FILE" 2>/dev/null || echo 0)"
    if (( NOW_EPOCH - LAST_ALERT >= REMIND_EVERY_SECS )); then
      send_text "STILL BROKEN &son now-playing: $DETAIL"
      echo "$NOW_EPOCH" >"$LAST_ALERT_FILE"
    fi
  fi
else
  if [[ "$PREV" != "ok" ]]; then
    send_text "RECOVERED &son now-playing is healthy again ($DETAIL)."
  fi
fi

echo "$STATUS" >"$STATE_FILE"
exit 0
