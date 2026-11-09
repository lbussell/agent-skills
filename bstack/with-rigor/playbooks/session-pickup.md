### Session pickup

Run this playbook to resume in-flight work from a prior session, branch, or handoff note.

Follow these steps to reconstruct state and continue the task:

1. Locate the prior work trail by querying `session_store_sql` scoped to the current repository or working directory, or by inspecting the target branch and any [`show-me-your-work`](../../show-me-your-work/SKILL.md) decision log.
   Do not query `session_store_sql` across other repositories or working directories.
   Read the session summary and latest turns first, then scan earlier turns for key decisions.
   When the session history is long, delegate parsing to a `task` subagent and return a concise timeline to the main thread, following [Guard the Context Window](../references/principle-guard-the-context-window.md).
2. Reconstruct the operational state from the active branch and worktree, `git log`, `git diff` against the base branch, and open items in `todos` and `todo_deps` via `sql`.
   Treat the recorded decisions and findings from the prior trail as authoritative input.
3. Compare the completed work against the plan to identify the exact resume point.
   Continue from the resume point without repeating completed steps or re-running resolved reproductions.
4. Select the next action for the remaining work: continue implementation, deliver a completed recommendation, update a prior conclusion with new evidence, or write a postmortem for a failed run.
   Switch to the matching playbook to execute the remaining work.
5. Before finishing the task, verify the combined result on the target surface against the original goal, following [Prove It Works](../references/principle-prove-it-works.md).

In your reply, state where the prior session stopped, which completed work you reused, where you resumed, and the final verification result.
