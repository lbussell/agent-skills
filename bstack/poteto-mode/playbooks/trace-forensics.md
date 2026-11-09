### Trace forensics

Run this playbook to diagnose a performance or stability issue from an existing profile, trace, spindump, or heap snapshot.
When you need to capture a new signal from a live process, use the [Runtime forensics](./runtime-forensics.md) playbook.

Match the captured artifact format to the tooling and target below:

| Artifact format | Tooling | Target to isolate |
| --- | --- | --- |
| `.cpuprofile` or `.json.gz` trace | Trace parser or SQLite | Frames with the highest self or total time and the call tree along the hot path |
| `.heapsnapshot` | Heap parser or SQLite | Retainer chain from the leaked object to a garbage collection root |
| Spindump or stack sample | Text parser | Thread stuck on CPU or blocked, along with its wait reason |

Follow these steps to analyze the captured artifact:

1. Identify the artifact format and parse large captures in a `task` subagent so only the reduced finding enters the main thread, following [Guard the Context Window](../references/principle-guard-the-context-window.md).
2. Load the raw trace or heap snapshot into a queryable store such as SQLite with one row per sample, frame, or node.
3. Query the store to isolate the root cause for the artifact type.
4. Map the hot frame or retaining reference to its source file, symbol, and line using the artifact's symbol table.
   If the artifact omits source symbols, resolve them against local build symbols or state that the capture lacks symbol data.
5. When a baseline and regression capture are both available, compare the two artifacts to confirm the delta.
   When only one capture exists, report the finding as the strongest hypothesis supported by the artifact.
6. Record the throughput checkpoint as `throughput checkpoint: n/a, read-only forensics`.

In your reply, report the artifact path and format, the isolated root cause, the source location, and whether a paired capture confirmed the diagnosis.
If the user asks to fix the issue after the cause is identified, switch to the [Bug fix](./bug-fix.md) or [Perf issue](./perf-issue.md) playbook.
