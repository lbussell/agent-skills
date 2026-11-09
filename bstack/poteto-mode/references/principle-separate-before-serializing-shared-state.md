# Separate Before Serializing Shared State

When concurrent actors write state, give each actor an isolated write target before introducing locks or serialization.
Enforce concurrency rules through file separation, exclusive ownership, or atomic operations so actors cannot overwrite each other's work.

Follow this sequence when designing state for concurrent workers, processes, or subagents:

1. Identify every mutable resource that more than one actor reads and writes, including files, database rows, git branches, worktrees, and in-memory objects.
2. Split shared write targets whenever actors publish independent facts by giving each actor its own file, key prefix, branch, or directory (such as separate `indexer-state.json` and `metrics-state.json` files per worker).
3. If multiple workers write different fields to the same file, split that file so concurrent writes cannot collide.
4. Combine the separate outputs at the read or reporting step after the concurrent writes finish.
5. When a single shared target is a required domain invariant, serialize writes with a single-writer queue, sequential execution phases, atomic compare-and-swap, or a lockfile.
