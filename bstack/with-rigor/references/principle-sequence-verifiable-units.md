# Sequence Work into Verifiable Units

Break multi-step changes into small units, verify that each unit passes checks before starting the next, and order commits so each step is independently verifiable.

Follow these rules while executing a multi-step change or migration:

- Start from a clean, passing baseline on the target branch before making edits.
- Apply one logical unit of change at a time and run the verification check ([Prove It Works](./principle-prove-it-works.md)) before starting the next unit.
- When a script or codemod performs repetitive edits ([Build the Lever](./principle-build-the-lever.md)), run the verification check after each batch to localize any regression immediately.

Order commits or stacked pull requests so a reviewer can verify each step in sequence:

| Change type | Verification sequence |
| --- | --- |
| Bug fix | Add the failing reproduction test first, then apply the fix. |
| Refactoring | Remove dead code first ([Subtract Before You Add](./principle-subtract-before-you-add.md)), then reshape the remaining code. |
| Performance optimization | Record the baseline benchmark first, then apply the optimization. |
| New feature | Land core types and module boundaries first, then implement the feature behavior. |
