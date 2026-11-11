# Dream rubric and reference

## Session store queries

`session_store_sql` uses DuckDB on `cloud` and SQLite on `local`, so DuckDB `INTERVAL` syntax omits local-only sessions.
Run both queries below for the target window, then merge rows by `id`.

Cloud sessions (adjust `1 day` to match the window):

```sql
SELECT id, cwd, repository, branch, summary, agent_name, created_at, updated_at
FROM sessions
WHERE updated_at >= now() - INTERVAL '1 day'
ORDER BY updated_at DESC
LIMIT 100
```

Local sessions (adjust `-1 day` to match the window):

```sql
SELECT id, cwd, repository, branch, summary, created_at, updated_at
FROM sessions
WHERE substr(updated_at, 1, 10) >= date('now', '-1 day')
ORDER BY updated_at DESC
LIMIT 100
```

Fetch turns for candidate sessions in batches (adjust `1 day` to cover candidate `created_at` values, and omit the `timestamp` filter on `source: "local"`):

```sql
SELECT session_id, turn_index, user_message, assistant_response, timestamp
FROM turns
WHERE session_id IN ('<id-1>', '<id-2>')
  AND timestamp >= now() - INTERVAL '1 day'
ORDER BY session_id, turn_index
```

Apply these collection rules:

- Bound `turns.timestamp >= now() - INTERVAL '...'` on every `cloud` query or join touching `turns` to prevent 60-second timeouts.
- Once the paired `source: "local"` query succeeds, ignore the SQLite fallback syntax warning from `cloud` `INTERVAL` queries.
- Cross-check `list_sessions_and_chats` for recent sessions that have not flushed to `session_store_sql` yet, and read their `user.message` and `assistant.message` events from `~/.copilot/session-state/<id>/events.jsonl` when present.

## Memory hierarchy and routing

| Layer | Target | Loaded when | Scope | Size budget |
| --- | --- | --- | --- | --- |
| Global injected | `~/.copilot/copilot-instructions.md` | Every turn in every repo | Cross-repo preferences, communication rules, machine guardrails | Under 100 lines |
| Repo injected | `<repo>/AGENTS.md` or `<repo>/.github/copilot-instructions.md` | Every turn in `<repo>` | Repo-wide invariants, build or test quirks, architecture boundaries | Under 150 lines |
| User skill | `<agent-skills>/skills/<name>/` (or `bstack/`, `csharp/`, `~/.agents/skills/<name>/`) | Triggered by `description` across repos | Reusable cross-repo workflows and domain procedures | `SKILL.md` under 50 lines |
| Repo skill | `<repo>/.github/skills/<name>/` or `<repo>/.agents/skills/<name>/` | Triggered by `description` in `<repo>` | Repo-specific multi-step procedures | `SKILL.md` under 50 lines |

Apply these routing rules:

- When a lesson appears in two or more repositories or reflects how the user works everywhere, route it to a user target.
- When a lesson depends on one repository's code, build, or conventions, route it to that repository.
- Promote a rule to `copilot-instructions.md` or `AGENTS.md` only when every session needs it before any skill triggers.
- Keep `copilot-instructions.md` and `AGENTS.md` limited to preventative rules; put rare cleanup or recovery recipes in a skill or drop them.
- Put multi-step procedures and situational guidance in a skill or its `references/` folder so unrelated sessions pay no token cost.
- When a repository already uses `AGENTS.md` or `.github/copilot-instructions.md`, update the existing file.
- Place new personal workflow skills under `<agent-skills>/skills/<name>/SKILL.md` and keep extra detail in `references/`.

## Consolidation actions

Evaluate existing files before adding text:

- **Correct drift.** When an agent followed an existing instruction or skill and hit a loop, error, or user correction, rewrite or delete that misleading text first.
- **Demote bloat.** When `copilot-instructions.md` or `AGENTS.md` exceeds its budget or holds task-specific steps, move those steps into a skill and leave at most a one-line link.
- **Prune stale rules.** Delete rules for retired tools, removed files, or mistakes that types, tests, or linters now block.
- **Tune trigger.** When an installed skill already covers the case yet failed to load, edit its frontmatter `description` so future sessions trigger it.
- **Add validated rule.** Add a concise rule, working command, preference, or trap warning backed by transcript evidence.

## Salience checklist

Accept a candidate only when it passes every check below:

- **Validated with evidence.** State a verified rule and cite the session ID, turn index, and outcome that proved it; drop untested theories about why something failed.
- **Recurring or explicit.** Promote a candidate only when it has evidence across at least two sessions (within the window or matched against `~/.copilot/dream-watchlist.md`) or a direct user rule for future turns; record other validated single-session candidates in `~/.copilot/dream-watchlist.md`.
- **Captures costly wins.** Include non-obvious commands, flags, or workflows that succeeded after trial and error, alongside mistakes.
- **Invisible in the workspace.** Drop facts that an agent can read from manifests, file trees, types, git state, or `--help`.
- **Fits prose.** When a compiler check, test, script, or linter can block the mistake mechanically (see [correct](../../../bstack/correct/SKILL.md)), move the candidate to the structural-check section of the chat digest.

## Watchlist (`~/.copilot/dream-watchlist.md`)

`~/.copilot/dream-watchlist.md` stores validated single-occurrence observations across runs without loading them into normal sessions.

Use one line per entry in this format:

```markdown
# Dream watchlist

- `2026-11-11` | `user` | `2232f915:0` | Use `$null` for discarded output in PowerShell because `>nul` and `2>nul` create reserved `NUL` files on Windows.
```

Maintain the watchlist on every run that has substantive sessions:

- Create `~/.copilot/dream-watchlist.md` when recording the first watched entry.
- Prune any entry dated more than 30 days before the end of the review window.
- When a new session matches a watched entry (even with different wording or in another repository), combine both citations, upgrade cross-repo matches to `user` scope, promote the candidate, and delete the watched line.
- When a candidate passes every salience check except recurrence, append one dated bullet (`YYYY-MM-DD | <user or owner/repo> | <session_id>:<turn> | <validated rule>`).
- Cap the file at 25 bullets by dropping the oldest entries first.

## Staging proposals

### Git-backed targets (child worktree sessions)

Spawn one child session per repository that has accepted proposals (including `agent-skills` for personal skills) with `create_session`:

- `project_id`: repository `id` from `list_repositories`.
- `name`: `"Dream updates for <repo>"` (at most 40 characters, sentence case).
- `workspace_type`: `"worktree"`.
- `coordinate_with_creator`: `true`.
- `notify_on_idle`: `"once"`.
- `kickoff`: `{ "mode": "autopilot", "prompt": "<standalone child prompt>" }`.

Include these instructions in each child's `kickoff.prompt`:

1. List each proposed action (`add`, `correct`, `demote`, `prune`, or `tune-trigger`), target path, evidence (session IDs and turns), and proposed edit.
2. If local `<default_branch>` is ahead of `origin/<default_branch>`, run `git merge --ff-only <default_branch>` so recent local commits are present without a merge commit.
3. Inspect the repository's current default-branch files in the worktree first; drop any candidate that is already covered or contradicted by current code.
4. Apply remaining edits in the worktree, keep `SKILL.md` files under 50 lines with one sentence per line, and verify all relative links.
5. Leave the changes uncommitted in the worktree for diff review; do not run `git commit`, `git push`, or open a pull request.
6. Report back a short summary of changed files and evidence (or report that zero files changed).

When child sessions finish:

- Inspect each child with `get_session` or its reply.
- If a child made zero file changes and has no persistent work, clean it up with `archive_session`.
- Keep every child session that has worktree edits so the user can review its diff, request tweaks, open a pull request, or archive it.
- Call `list_sessions_and_chats` and link each kept child session using its exact `app_url` when available (or plain text if no `app_url` is returned).

### Non-git user files (chat diff)

`~/.copilot/copilot-instructions.md` and standalone files in `~/.agents/skills/` have no git worktree.
Do not modify them during an unattended run.
Render a unified `diff` fenced block in the parent digest with session evidence, and apply only after the user approves in chat.
When demoting lines from `~/.copilot/copilot-instructions.md` into an `agent-skills` skill, stage the skill addition in the `agent-skills` child session and show the matching removal diff for `~/.copilot/copilot-instructions.md` beside that child session link.
