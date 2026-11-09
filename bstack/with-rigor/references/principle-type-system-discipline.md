# Type System Discipline

Define types so the compiler rejects invalid states, swapped identifiers, and unhandled variants at build time.
Shape domain types to eliminate special cases before writing runtime error handlers.

Apply these rules when designing types and signatures:

- Give distinct domain identifiers (such as `UserId` and `OrderId`) distinct branded types or newtypes so callers cannot swap arguments that share the same underlying string or number type.
- Use discriminated unions or sum types to represent mutually exclusive states and require exhaustive handling across variants.
- Parse untyped external data (JSON, RPC payloads, IPC messages, CLI arguments, configuration files, environment variables, and database rows) into typed domain models at the entry point, following [Boundary Discipline](./principle-boundary-discipline.md).
- When an authoritative schema (such as a protocol buffer, OpenAPI specification, GraphQL schema, database migration, or design-token file) defines a data shape, generate or derive types from that schema, following [Encode Lessons in Structure](./principle-encode-lessons-in-structure.md).
