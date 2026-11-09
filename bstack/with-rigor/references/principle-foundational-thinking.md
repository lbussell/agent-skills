# Foundational Thinking

Define core types and data structures, isolate shared state, and build shared setup before you write feature logic.

Sequence foundational work in this order:

1. Remove unused code and obsolete paths first, following [Subtract Before You Add](./principle-subtract-before-you-add.md).
2. Define the core types and data structures, trace their access patterns, and match the data shape to the primary read and write paths.
3. Check whether multiple actors can read or write the same state concurrently, and give each actor isolated state when concurrent access can occur.
4. Land shared setup that helps every later step, including shared types, test helpers, linters, and CI checks, before building features.
5. Deliver each capability inside a single coherent module or type so callers do not coordinate special cases.

Apply different rules to structural decisions and local code:

| Level | Goal | Action |
| --- | --- | --- |
| Data models and types | Converge on one representation | Unify duplicate types and schemas across modules. |
| Local statements | Keep control flow explicit | Keep two or three similar statements inline until a shared data model is clear. |
| Commits and increments | Preserve reviewability | Keep each commit small, single-purpose, and verified before starting the next step. |
