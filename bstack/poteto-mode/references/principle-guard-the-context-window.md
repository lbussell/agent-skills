# Guard the Context Window

Delegate bulk reading and noisy command output to subagents, and keep only concise summaries and decision-relevant facts in the main thread.

Large tool outputs, repeated full-file reads, and unbounded exploration fill the context window and degrade reasoning quality.
Protect the main thread so it retains the task plan, architectural invariants, and verification results across the full session.

Apply these rules to keep context usage bounded:

- Narrow searches with `glob` and `grep` or read targeted line ranges with `view_range` before reading a large file in full.
- Filter verbose command, test, and log output to the relevant lines, or load structured data into `sql` and query only the rows you need.
- Cap the number of files and turns per phase when planning multi-step work.
- Pass file paths and focused questions to subagents so they read raw files in their own context window and return a compact summary.

Route work between the main thread and subagents using this table:

| Work type | Where to run it | What stays in the main thread |
| --- | --- | --- |
| Broad codebase exploration across many files | `explore` subagent | Relevant file paths, symbol names, and a short architectural summary. |
| Verbose builds, test suites, or log inspection | `task` or `general-purpose` subagent | Pass or fail status, failing test names, and root error messages. |
| Independent implementation slice or prototype | `general-purpose` subagent | Resulting diff summary, changed files, and verification output. |
| Small, targeted reads and edits (2 to 5 tool calls) | Main thread | Direct `grep`, `view`, and `edit` results for the active change. |
| Playbook tracking, architecture decisions, and final review | Main thread | The `sql` todo list, decision log, and final diff review. |
