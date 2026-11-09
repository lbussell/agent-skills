### Shipping

Run this playbook to verify and merge a linear stack of pull requests from the bottom of the stack upward.
Ensure every pull request has an independent verification verdict before landing, and merge only the contiguous verified prefix rooted at trunk.

1. Use `gh pr` for all pull request operations.
   Spawn one independent `task` verifier subagent per pull request (an agent that did not write the code) to exercise the change on the target surface, compare the parent branch against the pull request head, and record `PASS`, `PASS+NOTES`, or `FAIL` ([Prove It Works](../references/principle-prove-it-works.md)).
   Require an independent verifier verdict in addition to green CI and automated review checks.
2. Walk up the stack from the lowest unmerged pull request and stop at the first pull request without a `PASS` or `PASS+NOTES` verdict.
   Treat the contiguous verified pull requests below that stop point as the mergeable run and its top pull request as the ceiling.
   Hold any verified pull request that sits above an unverified parent in the stack.
   If an upper pull request does not depend on the unverified parent's code, rebase it onto trunk and run a fresh verification pass against trunk before merging it.
3. Before trusting an earlier verdict after a stack rebase, compare `git patch-id` at the verified SHA against the current head SHA:

   | Comparison between verified SHA and current head | Verdict validity |
   | --- | --- |
   | `git patch-id` matches | Keep the existing verdict. |
   | Only tests, documentation, or linter configs changed, and build artifacts match (apart from documented build noise such as embedded SHAs) | Keep the live lane verdict, list the ignored noise files, and run fresh checks and review on the modified files. |
   | Production code changed, or the lane has no comparable build output (such as a live dev server) | Rerun verification on the new head SHA. |

4. Confirm user approval before merging and pushing stack updates unless the user pre-authorized landing the stack.
   Merge the lowest unmerged pull request in the verified run into trunk with `gh pr merge <pr> --squash`.
   Enable `--auto` only when the verification verdict already covers the pull request's current head SHA.
   Verify that the merge completed by running `gh pr view <pr> --json state,mergedAt,baseRefName` and confirming that `state` is `MERGED` and `baseRefName` is the trunk branch.
   After each merge completes, retarget the next pull request in the stack to trunk with `gh pr edit <pr> --base <trunk>`, rebase its commits onto updated trunk, and push with `git push --force-with-lease`.
   Apply step 3's patch-id table to the retargeted pull request and wait for CI to pass before merging it.
5. While a pull request is landing, limit branch and base mutations strictly to the post-merge retarget and rebase in step 4.
   Monitor CI and merge state with `gh pr checks <pr> --watch` and `gh pr view <pr> --json state,mergeStateStatus` until the ceiling pull request reaches `MERGED`.
   If a merge stalls or a check fails, diagnose the cause and report it before modifying any branch in the stack.
6. Stop once the ceiling pull request merges into trunk.
   To land additional pull requests above the ceiling, start a new pass at step 1 to verify them.

**Reply:** Report the verified run and its ceiling pull request, each pull request's verdict and verifier, the pull requests that merged (confirmed via `gh pr view`), and what is needed to unblock the next pull request in the stack.
