### Pause safely

Run this playbook only when the user explicitly asks to pause or stop in-flight work so a later [Session pickup](./session-pickup.md) can resume cleanly.
When the user says to keep going or grants an unattended run, use the [Autonomous run](./autonomous-run.md) playbook.

Follow these steps to save state and pause cleanly:

1. Stop at an atomic boundary by finishing the current step or reverting partial edits that leave the working tree inconsistent.
   Cancel any running subagents and start no new tasks.
2. Keep all changes local during the pause.
   Do not push commits or open a pull request to save state.
3. If the user wants a durable local checkpoint, commit tracked edits as a single `wip:` commit on the current branch.
   If tests or builds are failing at the pause point, note the failing check in one line in the commit body.
4. Write a concise resume note to a local file such as `.audit/<slug>-resume.md` in the working directory.
   Record the task goal, completed and verified steps, current working tree state, next steps, key file paths, and known pitfalls.
   If a [`show-me-your-work`](../../show-me-your-work/SKILL.md) decision log exists, link to that file for the history of completed steps.

In your reply, report the current step, the resume note path, any local commits created, whether the working tree is clean, and the first action to take on resume.
