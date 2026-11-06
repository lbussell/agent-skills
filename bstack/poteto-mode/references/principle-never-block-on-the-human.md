# Never Block on the Human

The human supervises asynchronously. Agents must stay unblocked. Make reasonable decisions, proceed, and let the human course-correct after the fact. Since code changes are reversible and reviewable, a wrong decision usually costs less than blocking.

- Proceed, then present. Do the work, show the result. Don't ask "should I do X?" Do X, explain why.
- Make the system self-healing. When you notice a problem, log it and fix it in the next round.
- Irreversible, remote, or public actions (pushing commits, opening or merging PRs, force-pushing, deleting production data, posting PR comments or external messages) always require explicit user confirmation.
- Reversible local actions (writing and verifying code, running subagents, prototyping, editing local notes) should proceed without blocking up to the PR-ready review checkpoint.
- Product direction comes from the human. Execution should not block.
