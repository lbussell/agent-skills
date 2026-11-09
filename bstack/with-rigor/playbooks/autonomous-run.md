### Autonomous run

Run this playbook when the user authorizes an unattended loop to drive a task until a specific exit condition passes.

Follow these steps to execute the loop:

1. Define the exit condition as a checkable predicate before starting the first iteration, such as passing a test suite, fixing a reproduction, or reaching zero visual diff.
2. When an iteration depends on an external event such as a build, test run, or ref update, monitor the event with a background `task` subagent or a timed check.
3. Execute the work in small, verified steps, following [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md).
   In each iteration, make the smallest change supported by evidence and test it against the exit predicate locally.
   Keep changes that move the predicate forward and revert changes that do not improve the result.
   Do not push commits or open pull requests during the loop unless the user explicitly pre-authorized remote actions.
4. Resolve local issues that block the exit predicate as part of the run, following [Never Block on the Human](../references/principle-never-block-on-the-human.md).
   Record unrelated defects or broken skills in your final report for the user.
   Pause for user input only when you reach an irreversible action, a remote or pull request gate, an unresolvable dead end, or a product decision that no experiment can settle.
5. Log each iteration with the [`show-me-your-work`](../../show-me-your-work/SKILL.md) skill, recording what changed, the verification evidence, and the updated predicate state.
6. Continue iterating until the exit predicate passes.
   If progress stalls on the current approach, form a new hypothesis and try a different approach.
   If you exhaust all viable approaches, report the blocker and keep the original exit predicate unchanged.

In your reply, report the exit predicate, the number of iterations run, the changes kept, the approaches discarded, and the final verification output.
