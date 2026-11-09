# Prove It Works

Verify every change by running and observing the real artifact directly.
Treat compilation, file timestamps, cached outputs, and subagent self-reports as insufficient until you observe the runtime behavior yourself.

Follow these rules when verifying work:

- Run the modified command, service, UI flow, or test target and inspect its live output.
- Query the live process, database, or rendered state directly to confirm that the change took effect.
- Bypass caches and derived summaries so you read the authoritative value from its source.
- When a verification check fails unexpectedly, confirm that your test harness or inspection command targets the active build and process before changing product code.

## Automate repeatable checks

When a check requires multiple steps or comparisons, write a deterministic verification script and run it, following [Build the Lever](./principle-build-the-lever.md).
Save the script output so the reviewer can inspect the result and rerun the check.
For large migrations or multi-phase work that requires an auditable record, log the verification output with the [`show-me-your-work`](../../show-me-your-work/SKILL.md) skill.
