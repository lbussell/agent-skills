# Model the Domain

Encode domain rules and invariants in a data structure that makes invalid states unrepresentable and eliminates repeated branching.
Choose the data structure before you write control flow.

Match each code smell or access pattern to a data structure that owns the rule:

| Code pattern or smell | Target structure |
| --- | --- |
| Multiple booleans, phase flags, or lifecycle checks that must stay in sync | State machine with explicit states and transitions |
| Loose parameter lists or repeated shape assumptions | Typed domain model |
| Conditional branches repeated across functions or files | Map, registry, lookup table, or discriminated union |
| Ad hoc state mutations across handlers | Reducer or command and event model |
| Modules split by execution step (`load`, `validate`, `transform`, `save`) that repeat domain rules | Module organized around one body of domain knowledge |
| Repeated behavior, ownership rules, or invariants across call sites | Small module boundary that encapsulates the invariant |
| Specialized read, traversal, or ordering requirements | Queue, cache, index, graph, tree, or normalized collection |

When no standard structure fits, list the states that the code must forbid and the queries that callers need, then define a data structure that enforces those constraints directly.

If the current code is already clear, local, and unlikely to grow, keep the existing structure.
Introduce a new abstraction only when it removes branches, duplicated rules, invalid states, or lifecycle bugs.
