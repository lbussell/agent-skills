# Member ordering

In a class, struct, interface, or record, order members by kind:

1. Constants
2. Fields
3. Properties
4. Constructors
5. Methods
6. Nested types

Within each member kind, order members by access:

1. `public`
2. `internal`
3. `protected internal`
4. `protected`
5. `private protected`
6. `private`

Keep the relative order of members that have the same kind and access. Do not
reorder field declarations when the change can affect initializer evaluation.
