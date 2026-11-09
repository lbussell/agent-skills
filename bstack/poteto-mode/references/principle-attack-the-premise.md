# Attack the Premise

When two or more fixes that share one assumption fail the same check, stop and test the shared assumption directly before writing another fix.

Each failed fix is evidence that the shared assumption may be false.
Do not start a third fix until you write the assumption down and verify it with an observation.

Follow these steps when repeated fixes fail:

1. Write a single sentence that states the assumption every failed fix relied on.
2. Design a rerunnable check that produces different output when that assumption is false, following [Build the Lever](./principle-build-the-lever.md).
3. Inspect both the distribution of failures and their magnitude.
4. Act on the evidence from the check:

| Observation | Action |
| --- | --- |
| Evidence contradicts the assumption | Discard the assumption and inspect what the failing cases share that the assumption did not predict. |
| Evidence confirms the assumption | Trace one step deeper with [Fix Root Causes](./principle-fix-root-causes.md) to find the upstream cause that your earlier fixes left in place. |
| One component repeatedly enters a bad state | Change the upstream code that produces the bad state, following [Laziness Protocol](./principle-laziness-protocol.md). |

Use this principle to test a factual assumption in the current design.
When you need to adapt a design to a new requirement, use [Redesign from First Principles](./principle-redesign-from-first-principles.md).
