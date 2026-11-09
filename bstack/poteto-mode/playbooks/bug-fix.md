### Bug fix

Use this playbook when diagnosing and fixing a reported defect.
Trace every shipped line to runtime evidence per [Fix Root Causes](../references/principle-fix-root-causes.md), revert any experiment that evidence refutes, and ship only the smallest change that resolves the root cause per [Laziness Protocol](../references/principle-laziness-protocol.md).

1. Reproduce the defect directly on the target surface (browser, CLI, or UI).
   If the defect does not reproduce immediately, synthesize the trigger, tighten the input conditions, or add temporary instrumentation until the failure fires.
   Ask the user to reproduce the issue only after exhausting local reproduction and stating the specific reason the target surface is unreachable.
2. Isolate the root cause by binary-searching the problem space.
   Run the [`how`](../../how/SKILL.md) skill over the affected subsystem and the [`why`](../../why/SKILL.md) skill for regression history to form candidate hypotheses.
   Test each hypothesis with runtime evidence or logging until one root mechanism remains.
3. Capture the failing reproduction before applying the fix per [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md).
   When the defect has a fast local test path, use the [`tdd`](../../tdd/SKILL.md) skill to write a failing test first.
4. Plan and implement the fix.
   If the fix crosses a function or module boundary, run the [`architect`](../../architect/SKILL.md) skill first, and use the [`council`](../../../skills/council/SKILL.md) skill when tradeoffs are contested.
   Delegate the implementation to a `task` subagent (`agent_type: "general-purpose"`) per [Subagents](../SKILL.md#subagents) with a narrow scope and clear verification criteria.
5. Verify the fix on the same target surface where you reproduced the defect per [Prove It Works](../references/principle-prove-it-works.md).
   Confirm that the original reproduction now passes and remove any temporary instrumentation or reproduction scripts unless the user asked to keep them.
   If verification is inconclusive or cannot run on the target surface, report that explicitly.
6. Run [Opening a PR](./opening-a-pr.md) to stop at a verified PR-ready state and wait for user approval before committing, pushing, or opening a pull request.

In your reply, state what was broken, the root cause, the fix, and how you verified it, and include the failing-then-passing reproduction output verbatim.
