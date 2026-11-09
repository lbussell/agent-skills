# Experience First

When implementation convenience conflicts with the user experience, prioritize the user experience.

Apply these rules when you shape a feature, interface, or workflow:

- Justify every feature, control, and configuration option by the user problem it solves.
- Ship a small set of complete, well-tested capabilities before adding secondary options.
- Prototype interactions in a throwaway sketch before writing production code, following [Exhaust the Design Space](./principle-exhaust-the-design-space.md).
- Verify visual and interaction details on the real artifact, including alignment, spacing, transitions, feedback, and error states.
- Keep the primary workflow fast and direct, and remove steps or controls that interrupt it.

Treat everyone who consumes your work as a user and explain impact from their perspective:

| Consumer | What to optimize |
| --- | --- |
| End user of a UI or CLI | Clear defaults, immediate feedback, actionable error messages, and a fast core workflow. |
| Developer calling a library or API | Small, predictable interfaces, strong types, and behavior that requires no hidden setup. |
| Maintainer reading the code next | Direct control flow, minimal state, and clear boundaries, following [Minimize Reader Load](./principle-minimize-reader-load.md). |

Use this principle to define the target experience, and use [Foundational Thinking](./principle-foundational-thinking.md) to sequence the implementation.
