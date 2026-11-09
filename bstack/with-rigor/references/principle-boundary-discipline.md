# Boundary Discipline

Validate and parse external inputs at system boundaries, pass typed domain values into internal code, and keep business logic in pure functions.
Keep the outer adapter layer thin so you can test core logic without running the framework or transport.

Separate responsibilities between the system edge and internal code:

| Layer | Responsibility |
| --- | --- |
| System boundary (CLI arguments, configuration files, environment variables, network payloads, database rows) | Validate raw input, parse it into domain types, and return structured errors for invalid data. |
| Boundary interface | Expose domain types and keep wire, storage, transport, and framework types private to the adapter. |
| Internal business logic | Accept validated domain types, trust their invariants without redundant checks, and compute results in pure functions. |

Follow these rules when organizing validation and logic:

- Parse configuration and external inputs into domain types at the entry point before calling business logic.
- Remove duplicate null, format, or bounds checks inside internal call chains once the boundary guarantees the type.
- Write parsing, prompt construction, scoring, and state transitions as pure functions from typed inputs to typed outputs.
- When a handler mixes I/O and decision logic, extract the decision logic into a pure function and call it from the handler.
