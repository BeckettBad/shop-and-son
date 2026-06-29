#!/usr/bin/env bash
#
# dev-agents.sh — launch the two-agent tmux workspace for Shop & Son.
#
#   ┌────────────────────────────────────────────┐
#   │  CLAUDE  — orchestrator + review   (top)    │
#   ├────────────────────────────────────────────┤
#   │  CODEX   — coder / implementer    (bottom)  │
#   └────────────────────────────────────────────┘
#
# Both panes open in homepage/ (THE homepage — the live site). Editing it is
# real: build on dev, the operator verifies, and merging dev → main DEPLOYS it.
# The shared hand-off file is homepage/CODEX-BRIEF.md.
#
# Usage:
#   ./dev-agents.sh          # create (or re-attach to) the session
#   ./dev-agents.sh stop     # kill the session
#
set -euo pipefail

SESSION="shopandson"

# Repo root = the directory this script lives in (handles the space in the path).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="$REPO_ROOT/homepage"

# Homebrew Node lives at /opt/homebrew/bin and is NOT on the default PATH on this
# machine (see AGENTS.md). Load it inside each pane so `npm`/`node` work for the
# agents' build & astro-check commands.
BREW_ENV='eval "$(/opt/homebrew/bin/brew shellenv)"'

# ── stop subcommand ──────────────────────────────────────────────────────────
if [[ "${1:-}" == "stop" ]]; then
  tmux kill-session -t "$SESSION" 2>/dev/null && echo "Killed session '$SESSION'." \
    || echo "No session '$SESSION' running."
  exit 0
fi

# ── preflight ────────────────────────────────────────────────────────────────
command -v tmux  >/dev/null 2>&1 || { echo "❌ tmux not found.  brew install tmux"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "❌ claude CLI not found on PATH."; exit 1; }
command -v codex  >/dev/null 2>&1 || { echo "❌ codex CLI not found on PATH."; exit 1; }
[[ -d "$WORKDIR" ]] || { echo "❌ $WORKDIR not found."; exit 1; }

# Already running? Just attach.
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Re-attaching to existing '$SESSION' session…"
  exec tmux attach -t "$SESSION"
fi

# Friendly reminder about the working branch (does not switch it for you).
BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
[[ "$BRANCH" != "dev" ]] && echo "⚠️  On branch '$BRANCH' — feature work belongs on 'dev'. (git checkout dev)"

# ── build the session ────────────────────────────────────────────────────────
# Top pane (pane 0) = Claude, the orchestrator.
tmux new-session -d -s "$SESSION" -n agents -c "$WORKDIR"
tmux send-keys  -t "$SESSION:agents.0" "$BREW_ENV; clear; claude" C-m

# Bottom pane (pane 1) = Codex, the coder. 40% height; Claude keeps the larger top.
tmux split-window -v -l 40% -t "$SESSION:agents" -c "$WORKDIR"
tmux send-keys    -t "$SESSION:agents.1" "$BREW_ENV; clear; codex" C-m

# Quality-of-life: mouse to click between panes, labeled pane borders.
tmux set-option -t "$SESSION" -g mouse on
tmux set-option -t "$SESSION" -g pane-border-status top
tmux select-pane -t "$SESSION:agents.0" -T " CLAUDE — orchestrate "
tmux select-pane -t "$SESSION:agents.1" -T " CODEX — code "

# Land in the Claude pane and attach.
tmux select-pane -t "$SESSION:agents.0"
exec tmux attach -t "$SESSION"
