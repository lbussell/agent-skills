# Minimize Reader Load

Reduce the number of layers a reader must trace and the amount of mutable state a reader must hold in memory to understand code.

A new reader should be able to answer where a value comes from and what can change it in under 30 seconds.
If answering either question takes longer, inline unnecessary layers or narrow the scope of state.
This principle applies the same working-memory discipline to human readers that [Guard the Context Window](./principle-guard-the-context-window.md) applies to agents.

Check both sources of reader load when you write or review code:

| Source of load | Smell | Fix |
| --- | --- | --- |
| Single-caller wrapper | A helper, wrapper, or adapter has only one caller or implementation. | Inline the wrapper into its caller. |
| Pass-through layer | Adjacent layers expose the same method names and arguments without changing the level of abstraction. | Collapse the pass-through layer so each boundary changes the abstraction. |
| Shallow interface | A module exposes a wide public interface that hides very little implementation detail. | Narrow the interface so the boundary hides internal decisions. |
| Broad mutable state | State lives in globals, module variables, or class fields when a narrower scope works. | Use pure functions and local variables first, and scope necessary state to the smallest owner. |
| Synchronized state | Two variables store the same fact and must stay in sync manually. | Store one source of truth and compute derived values on read. |
| Repeated invariant checks | Every consumer re-checks or documents the same precondition. | Enforce and name the invariant once at the boundary, following [Boundary Discipline](./principle-boundary-discipline.md). |

Before you add a new layer or state variable, verify that it removes at least as much complexity from callers as it adds.
