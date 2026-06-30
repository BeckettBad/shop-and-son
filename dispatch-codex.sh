#!/usr/bin/env bash
#
# dispatch-codex.sh — Claude dispatches a headless Codex run.
#
# Claude (orchestrator) calls this to hand a coding task to Codex (implementer)
# without the operator relaying between tmux panes. Codex runs non-interactively
# in homepage/, edits + verifies, makes its own focused commit on dev, and prints
# a summary to stdout for Claude to review.
#
# NOTE: real dispatches run Codex UNSANDBOXED (--dangerously-bypass-approvals-and-
# sandbox). Codex's seatbelt hard-blocks .git writes, so committing requires no
# sandbox. The operator chose this (informed). With the fence off, the prompt's
# scope rules + Claude's after-the-fact review are the ONLY guardrails.
#
# Usage:
#   ./dispatch-codex.sh                 # implement the ACTIVE BRIEF in homepage/CODEX-BRIEF.md
#   ./dispatch-codex.sh "instruction"   # implement a free-form instruction
#   ./dispatch-codex.sh --smoke         # read-only pipeline check; changes nothing
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOMEPAGE="$REPO_ROOT/homepage"

# Homebrew node lives at /opt/homebrew/bin and isn't on the default PATH on this
# machine — load it so codex (and node/npm inside its shell) resolve.
eval "$(/opt/homebrew/bin/brew shellenv)"

# Read-only smoke test: prove the pipeline (launch, correct cwd, read access,
# toolchain) without writing or committing anything.
if [[ "${1:-}" == "--smoke" ]]; then
  exec codex exec -C "$HOMEPAGE" -s read-only \
"Smoke test only — do not modify, create, or delete any file, and do not commit. \
Report exactly these four things, each on its own line: \
(1) your current working directory; \
(2) the first line of CODEX-BRIEF.md; \
(3) the output of \`node -v\`; \
(4) the output of \`npm -v\`. \
Then stop." </dev/null
fi

# Real dispatch: implement the active brief (or a free-form instruction).
# Working dir is homepage/ (so npm/astro run there); Codex runs UNSANDBOXED so it
# can write .git and commit. The fence is off — the scope rules below + Claude's
# review are the only guardrails, so they are deliberately strict.
PROMPT="${1:-Read CODEX-BRIEF.md and implement the ACTIVE BRIEF exactly as written.}"

exec codex exec -C "$HOMEPAGE" --dangerously-bypass-approvals-and-sandbox \
"$PROMPT

Context: read homepage/PROJECT-CONTEXT.md for the vision + locked decisions.
Scope: edit ONLY files under homepage/ for site changes. NEVER modify archive/,
public/preorders/, or anything outside this git repo.
Staging: stage only the explicit files you changed — NEVER \`git add -A\` or \`git add .\`.
Verify: run \`npm run build\` AND \`npx astro check\`, and fix until BOTH are green.
Commit: confirm you are on \`dev\` first, then make ONE focused commit of your change
(do not create other branches).
Do NOT push and do NOT merge to main — Claude and the operator own the dev→main deploy PR.
When done: print the files you changed, the build/check results, and the commit hash." </dev/null
