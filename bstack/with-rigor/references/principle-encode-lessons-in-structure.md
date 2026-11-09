# Encode Lessons in Structure

When you repeat an instruction or receive the same correction a second time, encode the rule in architecture, types, lint checks, or tests so the mistake fails automatically.

Choose the highest enforcement level that can catch the mistake:

| Priority | Enforcement level | How to apply it |
| --- | --- | --- |
| 1 | Architecture and module boundaries | Give each state one owner, hide internal modules, and delete obsolete patterns that callers might copy. |
| 2 | Types and compiler checks | Narrow types so invalid states do not compile, following [Type System Discipline](./principle-type-system-discipline.md). |
| 3 | Lint rules, scripts, or CI checks | Write a check whose failure message names the exact file, type, or function to use. |
| 4 | Behavioral tests | Add a test that fails whenever the required user-facing behavior breaks, following [Test Behavior, Not Implementation](./principle-test-behavior-not-implementation.md). |
| 5 | Written instructions and skills | Update the instruction or skill only when the rule requires judgment that no automated check can evaluate. |

Apply these follow-up rules after encoding a lesson:

- Verify that the new type, lint rule, or test fails on the original mistake before committing the fix.
- When a structural check enforces the rule, delete the redundant prose instruction so the check remains the single source of truth.
- When a rule requires judgment and must remain in prose, place it prominently and include a concrete example of the failure mode.
- Run the [`correct`](../../correct/SKILL.md) skill to eliminate recurring repository mistakes, or the [`reflect`](../../reflect/SKILL.md) skill to route conversation learnings into skills.
