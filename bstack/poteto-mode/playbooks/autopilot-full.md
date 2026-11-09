### Autopilot-full

Run this playbook to execute a queue of independent pull requests when the user has pre-authorized autonomous execution.
Assign one owner subagent to carry each pull request from implementation through merge, and merge only after independent verifier subagents prove the change ([Prove It Works](../references/principle-prove-it-works.md)).

A verification verdict covers one patch and green CI covers one commit SHA.
Run a full verification fan-out once at the code-ready head, and reuse lane results across rebases only when allowed by the patch-id rule in [Shipping](./shipping.md).

1. Limit autonomous execution strictly to the items in the user's authorized queue.
   Pause at a merge-ready state for any pull request outside the queue or reserved for user review.
   If the user asks only to see the plan, present the plan and wait for explicit approval before starting.
2. Use `gh pr` for all pull request operations.
   Spawn one background `task` subagent (`agent_type: "general-purpose"`) per pull request to implement the change, verify it locally on the real surface, open its pull request per [Opening a PR](./opening-a-pr.md), and merge it after steps 4 and 5 pass.
   Complete and verify the implementation locally before opening a pull request.
   Apply [`unslop`](../../unslop/SKILL.md), remove unnecessary code comments, and run the repository's lint, typecheck, and test checks for the touched paths locally before proposing a push.
   Ask for explicit user approval before pushing commits or opening a pull request unless the user's kickoff explicitly pre-authorized pushes and pull request creation for the queue.
   Keep fix rounds on the current base branch unless trunk conflicts with the branch or breaks CI.
3. Start each owner's branch directly off trunk so every pull request can verify and merge independently.
4. When an owner reports a code-ready head SHA, fan out independent `task` verifier subagents to verify the pull request.
   Have the verifier subagents rerun test and lint gates, exercise the changed behavior live on the target surface, and audit the diff and verification receipts.
   Run another full verifier fan-out only if a follow-up update introduces new behavior, a redesign, or a large diff.
   Use a single verifier subagent after a rebase, conflict resolution, or minor fix.
   Require every verifier lane to pass and audit the verification receipts yourself before issuing a clean verdict.
   If any verifier reports a defect, send all findings to the owner in one fix request and require a regression test covering every affected call site.
   If a defect already exists on trunk and the pull request does not touch or reach that path, record it separately against trunk.
   Keep a single writer per branch ([Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md)): have the owner push all fixes, or replace the owner if it stalls.
5. Require a clean verification verdict and green CI before merging any pull request.
   Once verification starts, have the owner rebase onto current trunk for merge preparation, report the new head SHA, and wait for CI to pass.
   Right before merging, fetch trunk and handle any new trunk commits using the rules below:

   | Trunk change since merge prep | Required action |
   | --- | --- |
   | Conflict, shared file modified, or CI workflow changed | Rebase onto trunk and wait for CI to pass on the new head SHA. |
   | Lockfile modified by both trunk and the pull request | Run a frozen install on the merge result to confirm that changed packages resolve identically to the pull request head. If the check fails, rebase to repair the lockfile. |
   | Caller or dependency of the pull request modified | Run the pull request's checks on the merge result and merge if they pass. |
   | Unrelated files modified | Merge without rebasing again. |
   | Trunk forces a third rebase after merge prep | Hold the merge and sequence the overlapping changes at the coordinator level. |

6. Require a verifier's proof and your explicit countersign before allowing an owner to relax any gate, such as raising a performance budget or adding an allowlist entry.
   Reject any change that disables or soft-fails a check, and never bypass repository branch protection rules.
   Run periodic audit passes until all delegated work completes, re-reading this playbook to catch unrecorded heads or stalled subagents.
   Judge each active subagent by its side effects, including commits, pushed branches, and decision log rows ([`show-me-your-work`](../../show-me-your-work/SKILL.md)).
   If a subagent errors or produces no side effects within its expected runtime, stop it and spawn a replacement immediately.
   When an audit pass records a state change (such as a new pull request, verdict, merge, replacement subagent, or user gate), post a concise status update to the user.
7. If the user holds or stops the run, instruct every active owner to stop writing immediately, report its current state, and preserve its branch until resumed.

**Reply:** Post a concise status summary covering each pull request's state, verification verdict, merge status, any countersigned gate exceptions, and open user gates, with clickable links to each pull request and decision log.
