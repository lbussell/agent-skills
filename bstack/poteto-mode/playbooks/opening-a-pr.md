### Opening a PR

Invoked at the end of code-changing playbooks.

**Stop at PR-ready first.** Complete implementation, self-review (`/deslop` and `/no-comments`), and real-surface verification locally before touching the remote. Do not open a PR or push commits automatically at the end of a task. Present the verified change to the user and wait for explicit approval to commit, push, or submit a PR. Only submit PRs that are 100% ready-to-go.

**Worktree and branch hygiene.** Respect the current checkout and branch unless the user asks for a worktree or a new branch. Never run `git reset --hard` on a branch with user state. When running parallel `task` subagents that write to the same files, isolate them in separate worktrees or scratch directories rather than resetting the main checkout.

**Commits and pushes.** While iterating with the user, do not generate dozens of WIP commits or push after each edit. Keep changes in the working tree (or amend locally) until the change is verified and ready. When preparing a PR, shape changes into a single clean commit by default, or a small ordered sequence when separate commits materially help review. Every `git push` (both initial publication and any follow-up push during PR validation) requires explicit user approval so CI runs and reviewer time are never wasted.

**Format and submit.** When approved to open a PR, use the **formatting-pull-request** skill (with **unslop**) to draft the title and description, review them with the user in `outbox`, and create the PR. Default to a single PR on the current or requested branch unless the user asks for a stack.
