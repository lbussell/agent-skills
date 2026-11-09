### Refactoring

Use this playbook to restructure focused or medium-sized code while preserving its existing behavior.
If the cleanup reveals a missing feature or defect, split that work into [Feature](./feature.md) or [Bug fix](./bug-fix.md) and ship the structural change first against the pinned contract.
For large migrations or cross-cutting structural work, use the [`figure-it-out`](../../figure-it-out/SKILL.md) skill.

1. Pin the existing behavior contract before changing any structure.
   Run the [`how`](../../how/SKILL.md) skill over the affected subsystem to understand its contract, then write or run a characterization test, snapshot, or equivalence script that captures runtime behavior.
2. Identify the domain structure the code needs per [Model the Domain](../references/principle-model-the-domain.md) so the reshape removes branches or invalid states.
   Keep existing code unchanged when its shape is already clear and local.
3. Define the target module layout, types, and call graph per [Foundational Thinking](../references/principle-foundational-thinking.md) and [Redesign from First Principles](../references/principle-redesign-from-first-principles.md).
   If the target shape crosses a function or module boundary, run the [`architect`](../../architect/SKILL.md) skill for parallel design exploration before moving code.
4. Remove dead code, single-caller wrappers, redundant validators, and orphan references before introducing the new shape per [Subtract Before You Add](../references/principle-subtract-before-you-add.md).
   Keep only the smallest change that reaches the target shape per [Laziness Protocol](../references/principle-laziness-protocol.md), and revert speculative cleanups.
5. Sequence the refactoring into small behavior-preserving slices per [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md), keeping the behavior pin green after each slice.
   When reshaping an internal API, migrate every caller and delete the old API in the same change per [Migrate Callers Then Delete Legacy APIs](../references/principle-migrate-callers-then-delete-legacy-apis.md).
   Delegate bounded edits to a `task` subagent (`agent_type: "general-purpose"`) per [Subagents](../SKILL.md#subagents) with explicit file paths, symbol names, and behavior constraints, then spot-check renames across strings, comments, and references.
6. Verify that runtime behavior is unchanged on the target surface (browser, CLI, or UI) per [Prove It Works](../references/principle-prove-it-works.md).
   For larger reshapes, run an equivalence check by comparing old and new outputs, replaying a recorded baseline, or executing a smoke run on the target surface.
7. Confirm that the change reduces complexity per [Minimize Reader Load](../references/principle-minimize-reader-load.md).
   If a diff does not lower reader load, revert it.
8. Run [Opening a PR](./opening-a-pr.md) to stop at a verified PR-ready state and wait for user approval before committing, pushing, or opening a pull request.

In your reply, state what structure changed, the behavior pin you held it against, the equivalence proof, the reader-load improvement, and any speculative changes you reverted.
