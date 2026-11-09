# Make Operations Idempotent

Design state-mutating operations so repeated runs and retries after a crash converge to the same target state.

Follow these rules when writing commands, migrations, lifecycle hooks, and processing loops:

- Read the current state, compare it to the target state, and apply only the remaining changes.
- Write updates atomically, such as writing to a staging file and renaming it into place, so a crash never leaves a corrupt target.
- Include staleness metadata (such as a process ID, lease timestamp, or content hash) on locks, claimed jobs, and in-progress markers so the next run can detect and clean up interrupted work.
- Compare artifacts by content hash or version identifier so retries can skip completed work reliably.

Verify idempotency by checking three conditions before finishing:

1. Run the operation twice in a row and confirm that the second run makes no unintended changes.
2. Simulate a failure at each intermediate write or external call and confirm that the next run recovers without manual cleanup.
3. Confirm that re-running the operation from any partial state produces the same final state.
