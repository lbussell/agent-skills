---
name: design-csharp
description: Design a new C# feature before implementation.
---

# Design a C# feature

Quickly sketch out a design for new code before implementing in order to align with the operator. The goal is to reach shared understanding with the operator so that coding can be done all at once.

## Workflow

### Ground the design

Build a mental model of every system the new code will touch.
Reach shared understanding of the problem by asking clarifying questions before coming up with a design.

### Sketch out ideas

Call several sub-agents with `references/runner-prompt.md` and get each one to come up with its own design. Use the following sub-agents: `gpt-5.6-sol`, `opus-5`, `grok-4.6`, `gemini-3.7-flash`.

Screen every candidate against [`references/design-red-flags.md`](./reference/design-red-flags.md). Reject or revise shallow modules, information leakage, temporal decomposition, and pass-through methods.

Compare viable candidates on interface depth. Prefer the design that hides more complexity behind a smaller, simpler public surface. A rich interface can keep call chains short by concentrating capability instead of scattering it across layers.

Synthesize a design by comparing the designs against the request, the existing system, and `reference/principles/*.md`. Use the strongest design as the base and take the best ideas from all designs.

## Output

Keep the reply as short as possible without leaving out details. Target around one screen of words.

### Current system

Give a high-level overview of the current system as bullet points. Cite relevant `path:line` locations.

### Proposed system

Summarize the proposed workflow or changes, in the same format.

### Types

Show new or changed data types in a single markdown code block. Show signatures and data shapes (no implementations).

### UML diagram

Use one Mermaid `classDiagram`. Include only new or changed types and their relationships.

### Alternatives considered

Name each serious alternative and give the specific reason it was not selected.
