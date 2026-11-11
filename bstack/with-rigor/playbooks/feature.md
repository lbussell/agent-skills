### Feature

Use this playbook when building new or changed behavior.
Own the design, planning, review, and verification in the main session, and delegate implementation to subagents.

1. Run the [`how`](../../how/SKILL.md) skill over the affected subsystem to ground the architecture.
2. When the change crosses a function or module boundary, run the [`architect`](../../architect/SKILL.md) skill for parallel design exploration.
3. Record the throughput checkpoint as four todo items using `sql` (`todos` and `todo_deps`).
   If a dimension does not apply (for example, a single-file change with no fan-out), keep the item and mark it `n/a: <reason>`:

   | Dimension | Rule |
   | --- | --- |
   | Blocking first steps | Run prerequisite gates before fanning out parallel work. |
   | Independent workstreams | Run disjoint files, services, or layers in parallel, and serialize shared writes. |
   | Shared mutable state | Split the target first per [Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md), and serialize only for real invariants. |
   | Smallest safe decomposition | Choose the smallest number of workers that keeps boundaries clean, and state why if a single worker is best. |

4. Define the named data shape and its organizing structure (such as a state machine, lookup table, or typed model) per [Model the Domain](../references/principle-model-the-domain.md) before any code is written.
   Delegate implementation to a `task` subagent (`agent_type: "general-purpose"`) per [Subagents](../SKILL.md#subagents) with explicit file paths, the chosen data shape, and success criteria.
   When the implementation admits multiple valid shapes, run the [`arena`](../../arena/SKILL.md) skill to compare candidates and select a base.
   Follow the [Comments](../SKILL.md#comments) rules and port shared improvements across all callers.
5. Sequence the implementation into small units per [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md), and build and verify each unit locally before starting the next.
6. Verify the feature directly on the target surface (browser, CLI, or UI) per [Prove It Works](../references/principle-prove-it-works.md).
   If verification is inconclusive or cannot reach the target surface, report the gap explicitly.
7. If the design is contested or carries high-stakes tradeoffs, run the [`council`](../../../skills/council/SKILL.md) skill before shipping.
8. Run [Opening a PR](./opening-a-pr.md) to stop at a verified PR-ready state and wait for user approval before pushing or opening a pull request.

For tightly coupled work such as a single feature or migration, assign one owner with the throughput checkpoint inline so that owner can fan out after the blocking phase.
Use parent-level fan-out only when slices produce independent artifacts such as audits, cross-subsystem investigations, or competing experiments.
Update the throughput checkpoint at phase boundaries and spawn a fresh subagent for each new phase.

In your reply, state what you built, what design you chose and why, the throughput checkpoint, and any open decisions, using tables to compare design alternatives.
