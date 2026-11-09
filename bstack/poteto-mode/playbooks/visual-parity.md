### Visual parity

Use this playbook when migrating components or styling systems while preserving pixel-exact visual appearance.
Treat the captured baseline screenshots as the specification and verify equivalence with automated image diffs per [Prove It Works](../references/principle-prove-it-works.md).

1. Build the visual baseline before migrating any code per [Build the Lever](../references/principle-build-the-lever.md).
   Capture screenshots of every target component across all interactive and layout states directly in the browser or UI.
2. Keep the baseline screenshots and comparison script read-only throughout the migration.
   Do not modify baseline images, relax diff thresholds, or alter component structure to bypass a failing check.
   If a baseline image appears broken, stop and ask the user before regenerating it.
3. Migrate shared foundational components first as a blocking phase per [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md).
   After shared components pass verification, migrate dependent components one at a time.
   When migrating independent components in parallel with `task` subagents (`agent_type: "general-purpose"`) per [Subagents](../SKILL.md#subagents), isolate each subagent in its own worktree per [Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md).
4. Verify each migrated component on the target surface by running the image diff against its baseline.
   Treat any nonzero pixel diff as a failure, inspect the diff image to locate the styling discrepancy, and iterate until the pixel delta reaches zero.
5. Run [Opening a PR](./opening-a-pr.md) for each verified component or batch, stopping at a PR-ready state to wait for user approval before committing, pushing, or opening a pull request.

In your reply, list the migrated components, the pixel diff result for each component, the path to the screenshot comparison script, and any remaining components.
