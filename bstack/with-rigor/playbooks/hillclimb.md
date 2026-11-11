### Hillclimb

Use this playbook for sustained, iterative improvement of one measurable metric toward a target.
For a single defect or bottleneck, use [Bug fix](./bug-fix.md) or [Perf issue](./perf-issue.md).
Test one change per iteration, measure the result on the real artifact per [Prove It Works](../references/principle-prove-it-works.md), and keep only changes that move the metric past noise.

1. Ground the workload and architecture before choosing the metric.
   Run the [`how`](../../how/SKILL.md) skill over the target subsystem, list the workload dimensions that affect the result (such as data size, history, state, and concurrency), and select a workload that reproduces the issue.
   If no workload reproduces the symptom, fix the reproduction before starting the loop.
   Define one metric, the target direction, and a checkable stop predicate that pairs a target value with a minimum iteration floor (for example, at least 50% faster than baseline and at least 10 iterations).
2. Build and freeze the measurement script per [Build the Lever](../references/principle-build-the-lever.md).
   Run contrasting workloads to confirm that the script separates easy and slow cases as expected.
   Validate the measurement script against [Explain the Number](../references/principle-explain-the-number.md) and make it print both the error count and the amount of work completed.
   Freeze a single repeatable command that reports the median across multiple runs, and record both the baseline metric and a passing run of the regression test suite.
3. Create a gitignored `decision.tsv` log using the [`show-me-your-work`](../../show-me-your-work/SKILL.md) skill with columns for `id`, `hypothesis`, `change`, `before`, `after`, `delta`, `tests`, `verdict`, and `note`.
   Read `decision.tsv` before starting each iteration.
4. Ground each hypothesis in the architecture from step 1 and state the specific mechanism it targets (for example, "defer X off the startup path because it blocks first paint").
   When optimizing performance, order hypotheses using the mantra table in step 2 of [Perf issue](./perf-issue.md) and continue iterating until the hillclimb stop predicate is met.
5. Run one hypothesis per iteration per [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md):
   - Delegate the change to a `task` subagent (`agent_type: "general-purpose"`) per [Subagents](../SKILL.md#subagents) and review the diff in the main session per [Guard the Context Window](../references/principle-guard-the-context-window.md).
   - When testing independent hypotheses in parallel, isolate each subagent in its own worktree per [Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md).
   - Run the frozen measurement command and the regression test suite.
   - Keep the change only when the metric improves beyond noise and all regression tests pass.
     If the metric stays within noise or any test fails, revert the change completely.
   - Stage kept files explicitly with `git add <files>` and record every kept or reverted attempt in `decision.tsv`.
   - When running unattended, use the continuation loop from [Autonomous run](./autonomous-run.md) while keeping the hillclimb stop predicate.
6. Push past plateaus when consecutive attempts fail.
   Switch hypothesis categories, combine near-misses, or re-read the source to find a deeper bottleneck.
   Revert any metric improvement that breaks behavior, and keep any simplification that preserves the metric per [Laziness Protocol](../references/principle-laziness-protocol.md).
7. Stop when the stop predicate passes or when all remaining hypotheses have marginal expected impact.
   If progress stalls while promising hypotheses remain blocked, report the blocker to the user.
8. Run [Opening a PR](./opening-a-pr.md) to stop at a verified PR-ready state and wait for user approval before pushing or opening a pull request.

In your reply, report the metric and target, the baseline and final numbers with percent delta, the count of kept and reverted iterations, a one-line summary of each kept fix, the `decision.tsv` path, and the next hypothesis you would try.
