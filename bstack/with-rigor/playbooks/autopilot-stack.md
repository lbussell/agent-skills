### Autopilot-stack

Run this playbook to build an ordered queue of dependent changes as a single linear stack of base-chained pull requests for the user to review and land.
Follow [Autopilot-full](./autopilot-full.md) for owner management, approval gates, and independent verification, and apply the rules below for branch topology and stack delivery.

1. Have each owner implement its slice, verify it locally, open its pull request per [Opening a PR](./opening-a-pr.md) (after user approval unless pre-authorized for the queue), and report `STACK-READY` when verification passes.
   When a slice depends on an earlier item in the stack, have its owner branch from that parent item's branch.
   Reserve all rebases, base retargets, merges, auto-merge settings, and pull request closures for the coordinator and the user.
2. Act as the sole writer for chain rebases and base retargets ([Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md)).
   Have each owner push only to its own branch and report its branch tip and intended parent branch.
   Append each verified pull request to the stack in dependency order by setting its base branch with `gh pr edit <pr> --base <parent-branch>`.
   When you rebase and push a stack link, have its owner adopt the updated branch tip as its new base and resolve conflicts only within its own slice.
3. Before landing begins, evaluate trunk changes against the bottom of the stack using step 5 of [Autopilot-full](./autopilot-full.md) and rebase the chain from the bottom up when required.
   After restacking, check whether each link's verification verdict remains valid using the patch-id rule in [Shipping](./shipping.md).
4. Record the verification verdict on each pull request and hand the completed stack to the user for review and landing.
   Once landing starts through [Shipping](./shipping.md), make no further branch edits except the post-merge base retarget required by that playbook.
   If an issue arises during landing, report it to the user and wait for explicit approval before pushing a fix.

#### Choosing between autopilot playbooks

| Playbook | When to use |
| --- | --- |
| [Autopilot-full](./autopilot-full.md) | Pull requests are independent, branch directly from trunk, and the user has granted merge authority. |
| [Autopilot-stack](./autopilot-stack.md) | Changes depend on each other in sequence, or the user wants to review the full stack before landing. |

**Reply:** Post a concise status summary with clickable links to the stack root and tip pull requests, a one-line verification verdict for each link in order, and any deferred or excluded items with their reasons.
