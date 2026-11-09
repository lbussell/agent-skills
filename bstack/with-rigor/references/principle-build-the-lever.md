# Build the Lever

When a task involves repetitive edits, structured data analysis, or multi-step verification, write a deterministic script, codemod, or generator to perform and verify the work.

A deterministic script runs the same way every time and gives reviewers a single artifact they can inspect and rerun.
Write a script even for a one-off task when the script is what makes the result reproducible and checkable.
Perform edits by hand only when the change is limited to a few obvious lines that a reviewer can verify at a glance.

Follow these steps to build and use a lever:

1. Complete the first unit by hand to learn the exact transformation or check required.
2. Write the smallest script that performs that transformation or check, following [Laziness Protocol](./principle-laziness-protocol.md).
3. Make the script idempotent so repeated runs produce the same state, following [Make Operations Idempotent](./principle-make-operations-idempotent.md).
4. Run the script on the first unit and diff the output against your manual edit to verify the script.
5. Run the script across all remaining units directly whenever a single pass can finish the job.
6. Keep or commit the script when the work or verification continues beyond the current session.

Choose the tool that matches the work:

| Work type | Tool to build |
| --- | --- |
| Mechanical code or text edits across files | A codemod or transformation script that updates all targets in one pass. |
| Repetitive boilerplate or derived files | A generator script driven by a single source of truth. |
| Large log, trace, or dataset analysis | A script or `sql` query that loads the data into SQLite and queries it directly. |
| Complex behavioral verification | A rerunnable verification script, following [Prove It Works](./principle-prove-it-works.md). |
| Parallel subagent fan-out requiring judgment | A shared brief or skill file outside the subagents' write scope that defines the steps, verification commands, and file boundaries. |

Every citation of this principle must point to a script, generator, query, or brief file created or used during the task.
When you need to turn a repeated human correction into a permanent repository check, use [Encode Lessons in Structure](./principle-encode-lessons-in-structure.md).
