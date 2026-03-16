---
name: create-sub-agent-worktree
description: >-
  Spawn a Copilot CLI agent in its own git worktree and tmux window. Creates a new branch
  via worktrunk (`wt`), opens a tmux window in the target session, and launches `copilot -i` with a
  prompt. Use when the user asks to run a task in parallel, hand off work to another agent, or start
  a background coding task in a separate worktree.
---

## Script

`scripts/create-sub-agent-worktree.sh <branch> <prompt> [--session <name>] [--base <ref>]`

## Examples

```shell
./scripts/create-sub-agent-worktree.sh fix-auth "<prompt>" # single agent
./scripts/create-sub-agent-worktree.sh feat-a "<prompt>" && ./scripts/create-sub-agent-worktree.sh feat-b "<prompt>" # parallel agents
./scripts/create-sub-agent-worktree.sh feat-part-2 "<prompt>" --base @ # branch from current HEAD
./scripts/create-sub-agent-worktree.sh hotfix-v2 "<prompt>" --base upstream/main # branch from a specific ref
./scripts/create-sub-agent-worktree.sh cleanup-deps "<prompt>" --session infra # target a specific tmux session
```

### Full workflow: from zero to parallel agents

```shell
tmux new-session -d -s my-project
./scripts/create-sub-agent-worktree.sh feat-a "<prompt>" --session my-project
./scripts/create-sub-agent-worktree.sh feat-b "<prompt>" --session my-project
./scripts/create-sub-agent-worktree.sh feat-c "<prompt>" --session my-project
```

## After spawning

Tell the user how to attach to the tmux session and switch to the sub-agent's window.
The window is named after the branch (with `/` replaced by `-`).
