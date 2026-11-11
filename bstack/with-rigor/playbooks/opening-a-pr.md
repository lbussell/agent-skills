### Opening a PR

Run this playbook at the end of any code-changing playbook.

- Complete implementation, self-review, and real-surface verification locally before touching the remote repository.
- Present the verified local change to the user and wait for explicit approval before pushing or submitting a pull request.
- Submit a pull request only when the change is verified and ready for review.
- Keep work on the current checkout and branch unless the user asks for a worktree or a new branch.
- Never run `git reset --hard` on a branch with user state.
- When running parallel `task` subagents that edit the same files, isolate each subagent in its own worktree or scratch directory.
- Keep changes in the working tree while iterating with the user, and wait until the change is verified before creating a commit.
- Shape changes into a single clean commit by default, or into a small ordered sequence when separate commits help review.
- Ask for explicit user approval before every `git push`, including follow-up pushes during pull request validation or code review.
- When approved to open a pull request, use the [`formatting-pull-request`](../../../skills/formatting-pull-request/SKILL.md) and [`unslop`](../../unslop/SKILL.md) skills to draft the title and description, review them in `outbox`, and create the pull request.
