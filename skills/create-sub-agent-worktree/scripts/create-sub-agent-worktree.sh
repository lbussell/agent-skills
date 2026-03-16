#!/usr/bin/env bash
#
# create-sub-agent-worktree.sh
#
# Creates a new tmux window in the current (or specified) session,
# uses worktrunk to create a git worktree, and launches a Copilot CLI
# session inside it.
#
# Usage:
#   create-sub-agent-worktree.sh <branch> <prompt> [--session <name>] [--base <ref>]
#
# Examples:
#   create-sub-agent-worktree.sh fix-auth "Fix the session timeout bug"
#   create-sub-agent-worktree.sh add-tests "Write unit tests for auth" --session my-project
#   create-sub-agent-worktree.sh feat-part2 "Continue the work" --base @
#
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: create-sub-agent-worktree.sh <branch> <prompt> [--session <name>] [--base <ref>]

Arguments:
  branch    Branch name for the new worktree (passed to wt switch --create)
  prompt    Instruction prompt for Copilot CLI

Options:
  --session <name>  Target tmux session (default: current attached session)
  --base <ref>      Base branch/ref for the new worktree (passed to wt switch --base)
                    Use @ for current HEAD, or any branch/tag/commit
  -h, --help        Show this help message

The script will:
  1. Detect (or accept) a tmux session
  2. Create a new tmux window named after the branch
  3. Run `wt switch --create <branch>` inside that window
  4. Launch `copilot -i "<prompt>"` in the new worktree
EOF
    exit 0
}

die() { echo "error: $*" >&2; exit 1; }

# -- Parse arguments ----------------------------------------------------------
BRANCH=""
PROMPT=""
SESSION=""
BASE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)    usage ;;
        --session)    SESSION="${2:?--session requires a value}"; shift 2 ;;
        --base)       BASE="${2:?--base requires a value}"; shift 2 ;;
        -*)           die "unknown option: $1" ;;
        *)
            if [[ -z "$BRANCH" ]]; then
                BRANCH="$1"
            elif [[ -z "$PROMPT" ]]; then
                PROMPT="$1"
            else
                die "unexpected argument: $1"
            fi
            shift
            ;;
    esac
done

[[ -n "$BRANCH" ]] || die "branch name is required (see --help)"
[[ -n "$PROMPT" ]] || die "prompt is required (see --help)"

# -- Resolve tmux session -----------------------------------------------------
if [[ -n "$SESSION" ]]; then
    # Verify the named session exists
    tmux has-session -t "$SESSION" 2>/dev/null \
        || die "tmux session '$SESSION' does not exist"
elif [[ -n "${TMUX:-}" ]]; then
    # We're inside tmux — use the current session
    SESSION="$(tmux display-message -p '#S')"
else
    die "not inside a tmux session — pass one explicitly with --session <name>"
fi

# -- Sanitize branch for tmux window name -------------------------------------
WINDOW_NAME="${BRANCH//\//-}"

# -- Create tmux window and run worktrunk + copilot ---------------------------
echo "Creating worktree '$BRANCH' in tmux session '$SESSION'..."

# Create a new window. The first command switches into the worktree via wt,
# then launches copilot. We use a small shell wrapper so the window stays
# open if something fails.
WT_CMD="wt switch --create '$BRANCH'"
[[ -n "$BASE" ]] && WT_CMD+=" --base='$BASE'"

tmux new-window -t "$SESSION" -n "$WINDOW_NAME" \
    "$WT_CMD && copilot -i '$PROMPT'; exec \$SHELL"

echo "✓ Window '$WINDOW_NAME' created in session '$SESSION'"
echo "  Attach with: tmux attach -t $SESSION"
