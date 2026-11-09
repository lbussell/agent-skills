### Worktree and simulator cleanup

Run this playbook to reclaim disk space from merged git worktrees, unused simulator runtimes, and build caches without losing active work.

Classify each discovered worktree using these rules:

| Classification | Condition | Action |
| --- | --- | --- |
| `safe` | The branch pull request is merged, the working tree is clean, and no current or recent session uses the path. | Remove the worktree. |
| `verify-session` | Session usage is unknown or session history is incomplete. | Verify session usage or ask the user before removing. |
| `wip:N` | The worktree has `N` tracked uncommitted changes. | Show the diff to the user and wait for approval before removing. |
| `scratch:N` | The branch pull request is merged and the worktree has only `N` untracked files. | List the untracked files and remove the worktree if no session uses it. |

Follow these steps to audit and prune worktrees and caches:

1. Record baseline free disk space with `df -h /`.
2. Discover all worktrees from `git worktree list --porcelain` so tool-managed paths outside the default parent directory are included, following [Encode Lessons in Structure](../references/principle-encode-lessons-in-structure.md).
   Query `session_store_sql` scoped to the current repository or working directory to find worktree paths referenced by active or recent sessions.
   For each worktree, record its size, age, pull request merge state (`gh pr list --head <branch> --state all` compared against the base ref), `git status --porcelain` output, and session usage.
3. Classify each worktree using the table above and cross-check every candidate against live session state, following [Prove It Works](../references/principle-prove-it-works.md).
   If a worktree is pinned or used by an active session, keep it regardless of its git status.
   If session history is unavailable or incomplete, classify candidates as `verify-session`.
4. For every `verify-session` worktree, spawn a background `task` subagent to inspect session transcripts via `session_store_sql` and confirm whether any recent session uses the path, following [Guard the Context Window](../references/principle-guard-the-context-window.md).
   If session history does not resolve whether a worktree is in use, ask the user before deleting it.
5. Pause for explicit user approval before removing any `wip:N` worktree, because uncommitted tracked edits cannot be recovered from the branch ref.
6. Remove each confirmed worktree with `git worktree remove --force <path>`.
   If ignored build artifacts leave the directory on disk, remove the remaining directory and run `git worktree prune`.
   Verify the reclaimed space with `df -h /` and `git worktree list`.
7. When additional disk space is needed, reclaim simulator and build caches that the user has not asked to keep:
   - Delete test simulator clones with `xcrun simctl --set testing delete all`.
   - Delete unavailable simulators with `xcrun simctl delete unavailable`.
   - List simulator runtimes with `xcrun simctl runtime list` and remove unused runtimes with `xcrun simctl runtime delete <id>`.
   - Clear Xcode `DerivedData`, `iOS DeviceSupport`, and package manager caches (`pnpm`, `uv`, `brew`, and `yarn`).

In your reply, report `df -h /` output before and after cleanup, total space reclaimed, the worktrees removed, and a one-line reason for each worktree kept.
