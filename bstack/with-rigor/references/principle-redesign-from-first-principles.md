# Redesign from First Principles

When you integrate a new requirement into an existing system, redesign the affected component as if that requirement had existed from day one.

Follow these steps to integrate a new requirement cleanly:

1. Read all affected files to understand the current data model, invariants, and call sites.
2. Design the types, interfaces, and control flow you would build from scratch if the new requirement were part of the original specification.
3. Update every affected layer, including types, callers, tests, examples, and documentation, to match the new design.
4. Break the redesign into small, verifiable increments when the change spans multiple modules, following [Sequence Work into Verifiable Units](./principle-sequence-verifiable-units.md).
