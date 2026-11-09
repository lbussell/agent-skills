### Runtime forensics

Run this playbook to diagnose a live runtime issue by capturing a profile, snapshot, or trace from the running process and mapping the root cause to source code.

Match the runtime symptom to the signal and target below:

| Symptom | Signal to capture | Root cause to isolate |
| --- | --- | --- |
| High CPU or hang | CPU profile | Function on the hot path |
| Memory leak | Heap snapshot | Retainer chain from the leaked object to a garbage collection root |
| Visual glitch or frame drop | Performance or DevTools trace | Render or timer loop firing without input |

Follow these steps to isolate and prove the root cause:

1. Capture the live signal directly on the target surface while the issue occurs.
2. Isolate the root cause in the captured artifact.
   When the artifact is large, parse it in a `task` subagent and keep only the reduced finding in the main thread, following [Guard the Context Window](../references/principle-guard-the-context-window.md).
3. Confirm the mechanism on the running process by injecting runtime instrumentation or logging and observing the live effect.
4. Map the finding back to the source file, symbol, and line that allocates, schedules, or blocks the work.
5. Record the throughput checkpoint as `throughput checkpoint: n/a, read-only forensics`.

In your reply, report the captured signal, the artifact paths, the root cause, the runtime check that confirmed the mechanism, and the exact source location.
If the user asks to fix the issue after the cause is confirmed, switch to the [Bug fix](./bug-fix.md) or [Perf issue](./perf-issue.md) playbook.
