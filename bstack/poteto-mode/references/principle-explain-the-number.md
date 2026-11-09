# Explain the Number

Before you report or act on a performance metric, benchmark delta, or evaluation score, identify the resource that bounds the measurement and rule out confounding causes with runtime evidence.

Follow these steps for every benchmark, latency, or throughput number:

- Capture a profile or system counters during the run to identify the active bottleneck (such as CPU, lock contention, disk I/O, network bandwidth, or the load generator) and map it to source code.
- Rule out confounding factors with evidence, including silent errors, skipped or cached work, dead code paths, unconfigured defaults on one side of a comparison, run-to-run noise, and microbenchmarks of code that represents a negligible fraction of end-to-end runtime.
- Verify that any reported time savings do not exceed the baseline time spent in the modified code path.
- Report the trial count, the variance or spread across runs, and the measured bottleneck alongside the headline number.

When evaluating agent or model benchmarks, apply the same checks across trials:

- Confirm by inspecting transcripts or outputs that every trial completed the intended task without harness errors.
- Verify that the score difference holds across repeated trials and model families.
- Confirm that the benchmark scenario reflects a realistic user task.

Combine this principle with [Prove It Works](./principle-prove-it-works.md) so you verify both that the output is genuine and what bounds its performance.
