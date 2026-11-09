# Subtract Before You Add

When you change a system, delete unused code and unnecessary abstractions before you add new behavior.

Leave the module with fewer moving parts and a smaller public interface than you found.

Apply these rules before adding new code or instructions:

- Delete dead code, unused flags, and obsolete adapters before building new features.
- Reduce a feature or interface to its minimum required parts before polishing details.
- Design for observed usage and explicit requirements in the specification.
- Validate and parse inputs only at system boundaries, following [Boundary Discipline](./principle-boundary-discipline.md).
- Remove duplicate instructions and boilerplate templates from prompts and skills.
- Delete empty reference files and single-caller pass-through modules completely.
