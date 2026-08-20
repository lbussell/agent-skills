# Type System Discipline

The type checker is a proof assistant. Use it to eliminate impossible states, mismatched primitives, and unhandled variants at compile time. A case the types let you ignore becomes a runtime failure the compiler could have stopped. Prefer defining errors and special cases out of existence over proliferating handlers; unrepresentable states, total functions, and interface redesign (the patterns below) are the tools.

Applies to any typed language.

**The patterns:**

- **Make illegal states unrepresentable.** Don't model state as a bag of optional fields where contradictory combinations compile. A subtle anti-pattern worth naming: `{ bool Completed, DateTime? CompletedAt }` admits `Completed: true, CompletedAt: undefined`, which is meaningless. Derive the boolean from a single source like `CompletedAt is not null`. You can also push that to an extension member (.NET 10+). If a bug forces the question "wait, can this combination actually happen?", the type is too loose.
- **Types are constructions, not restrictions.** Build the type up from the values you want instead of carving them out of a looser type with checks. The invariant that seems to need a refinement type is usually a construction away. A non-empty list is a head plus a rest, not a list with a length check. A valid time range is a start plus a duration, not two timestamps you must keep ordered. No representation is privileged. A list of pairs is an even-length list if you interpret it that way, so choose the shape that cannot build the illegal value and expose the interface callers need on top.
- **External data is untyped until parsed.** RPC payloads, JSON, IPC messages, CLI args, config files, environment variables, database rows. Have a parse function at every boundary that turns unstructured input into the typed model. See [Boundary Discipline](./boundary-discipline.md) for where to put validation.
- **Don't lie to the type system.** Casts, unsafe coercions, and assertion functions that bypass the compiler are runtime crashes waiting to happen. If the compiler can't prove a fact, prove it (validate, narrow, refine the model). The cast you bury today is the postmortem you write next week.
- **Strengthen a type only where partiality appears.** A runtime assertion, null check, or "this should never happen" throw marks the place a type is too weak. Push that check up into the type. Then stop. The type system's job is to track the cases each use site must handle, not to describe the data as precisely as possible. Prefer total functions. `sum` of an empty list is 0, so it takes the plain list. `head` of an empty list has no answer, so it demands the non-empty one. Extra precision costs reuse and ceremony and buys no safety.

**The tests:**

- "Can I write a comment explaining when this combination of fields is valid?" If yes, the type is too loose. Split it into a type.
- "Do two of my function arguments share a primitive type but mean different things?" Brand them.
- "Why is this nullable? What scenario causes this to be null?" Trace it to the boundary and validate there instead.
- "Is this type duplicating a shape another file owns?"
