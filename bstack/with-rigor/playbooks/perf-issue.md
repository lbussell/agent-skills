### Perf issue

Use this playbook to diagnose and fix a measured performance bottleneck.
Tie every optimization to a baseline and post-fix measurement on the target surface.
When you need sustained iterative improvement toward a metric target, use the [Hillclimb](./hillclimb.md) playbook.

1. Capture a baseline profile or trace directly on the target surface (browser, CLI, or UI).
   Validate the baseline and every subsequent measurement against [Explain the Number](../references/principle-explain-the-number.md).
2. Run the [`how`](../../how/SKILL.md) skill over the hot path to ground your hypotheses in the architecture.
   Evaluate the performance mantras in order from cheapest to most complex, and stop as soon as an earlier mantra meets the target:

   | Order | Mantra | Action |
   | --- | --- | --- |
   | 1 | Eliminate unused work | Delete work whose output has no consumer. |
   | 2 | Cache repeated work | Compute the result once and reuse it across calls. |
   | 3 | Reduce frequency | Batch, debounce, or narrow the scope of the operation. |
   | 4 | Defer work | Move non-critical work off the critical path. |
   | 5 | Precompute in idle time | Run the work ahead of time or in the background. |
   | 6 | Parallelize | Run independent work concurrently. |
   | 7 | Optimize the implementation | Use a faster algorithm, data structure, or lower-level representation. |

3. Plan and implement one optimization at a time from the trace per [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md).
   If the change crosses a function or module boundary, run the [`architect`](../../architect/SKILL.md) skill first.
   Delegate the implementation to a `task` subagent (`agent_type: "general-purpose"`) per [Subagents](../SKILL.md#subagents), review the diff, and capture a post-fix trace before trying another change.
4. Parse and compare the baseline and post-fix artifacts (for example, by loading JSON traces into SQLite or diffing profiles) per [Prove It Works](../references/principle-prove-it-works.md).
   If a measurement is inconclusive or taken on the wrong surface, report the limitation explicitly.
5. Run [Opening a PR](./opening-a-pr.md) to stop at a verified PR-ready state and wait for user approval before pushing or opening a pull request.

In your reply, report the baseline measurement, the post-fix measurement, the delta, and the trace artifact paths.
