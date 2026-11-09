# Outcome-Oriented Execution

During a planned rewrite or migration, converge directly on the target architecture and verify correctness at defined phase boundaries.

Temporary compatibility shims and dual-path adapters add complexity that often outlives the migration.
Accept planned, scoped intermediate breakage inside an active migration phase so you can build the target design cleanly.

Apply these rules during multi-step rewrites and migrations:

- Define explicit phase boundaries and state which modules or checks may break temporarily inside a phase.
- Migrate callers directly to the new interface and delete the old interface in the same change, following [Migrate Callers Then Delete Legacy APIs](./principle-migrate-callers-then-delete-legacy-apis.md).
- Run fast, targeted checks on the modules you are actively editing during the migration.
- Pass the full static and runtime verification suite at the end of each phase before starting the next one.
