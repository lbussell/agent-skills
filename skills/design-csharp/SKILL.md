---
name: design-csharp
description: Design a new C# feature before implementation. Use only when explicitly invoked.
---

Quickly sketch out a design for new code before implementing in order to align with the operator.
The goal is to reach shared understanding with the operator so that coding can be done all at once.

Respond with:
- High level overview of the current system
- Your proposed changes to the system
- New or changed data types in a markdown code block. Signtaures and data shapes only (no implementations).
- Mermaid UML diagram of new or changed types and their relationships

Designs are evaluated on interface depth. Prefer deep modules rather than shallow ones. Channel your inner John Ousterhout.
