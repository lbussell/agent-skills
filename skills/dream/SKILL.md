---
name: dream
description: Audit recent cross-repo sessions to propose additions, corrections, demotions, and prunes across instructions and skills. Use for /dream, nightly session reviews, or consolidating lessons across recent chats.
---

# Dream

Consolidate lessons from recent sessions into reviewable updates across user and repository instructions and skills.

## 1. Collect sessions

1. Use the time window from the prompt, or default to the last 24 hours.
2. Query both `cloud` and `local` stores in `session_store_sql` with the queries in [references/rubric.md](references/rubric.md), then deduplicate by session ID.
3. Exclude the current session, previous `dream` runs, no-op automations, and single-turn lookups.
4. Check recent `dream` sessions and child sessions so you skip proposals the user already archived or declined.
5. If no substantive sessions remain, report that nothing needed review and stop.

## 2. Mine transcripts

1. Group sessions by repository or `cwd` and map configured repositories with `list_repositories`.
2. When more than three sessions qualify, spawn one read-only `explore` subagent per repository group to keep raw transcripts out of the main context.
3. Extract four signal types with session IDs and turn numbers:
   - User corrections and repeated agent mistakes.
   - Commands, flags, workflows, or preferences that succeeded after trial and error.
   - Existing instructions or skills that misled the agent, drifted from the code, or went ignored.
   - Visible skills that failed to trigger or manual steps that repeated across turns.

## 3. Audit targets and filter

1. Read each candidate target file before drafting a proposal:
   - User instructions: `~/.copilot/copilot-instructions.md`.
   - User skills: the local `agent-skills` checkout (from `list_repositories`) and `~/.agents/skills/`.
   - Repository instructions: `<repo>/AGENTS.md` and `<repo>/.github/copilot-instructions.md`.
   - Repository skills: `<repo>/.github/skills/` and `<repo>/.agents/skills/`.
2. Route and filter candidates with the hierarchy, budgets, and salience rules in [references/rubric.md](references/rubric.md).

## 4. Stage proposals

1. For git-backed targets (each affected repository and `agent-skills`), spawn one child worktree session per repository with `create_session` using [references/rubric.md](references/rubric.md).
2. End your turn while child sessions run; when idle notifications arrive, archive any child with zero changes and keep every child with a diff.
3. Do not edit `~/.copilot/copilot-instructions.md` or `~/.agents/skills/` before explicit user approval; render unified `diff` blocks for them in chat.
4. Call `list_sessions_and_chats` and post a digest linking each child session (`app_url` when present), any `~/.copilot` diff, and structural check candidates.

## 5. Apply non-git proposals

1. When the user approves a `~/.copilot/copilot-instructions.md` or `~/.agents/skills/` diff in chat, apply that edit in place.
