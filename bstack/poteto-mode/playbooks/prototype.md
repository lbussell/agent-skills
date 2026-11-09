### Prototype

Use this playbook to settle a design, interaction, or behavioral question quickly with a throwaway experiment.
Optimize for speed and breadth of exploration so you can compare real options before writing production code.

1. Define the specific question the prototype must answer, such as choosing a layout, interaction model, density, timing behavior, or implementation approach.
   If the design is already decided, use the [Feature](./feature.md) playbook.
2. When the design space is open, gather prior art and summarize candidate themes, palettes, or layouts so the user can choose directions to explore.
   Skip this step when the candidate directions are already defined.
3. Build the prototype in an isolated scratch directory inside the workspace, separate from production source files:

   | Decision type | Prototype setup | Verification evidence |
   | --- | --- | --- |
   | Visual or interaction | Use plain HTML, CSS, and JavaScript or the lightest stack with hot reload. | Capture screenshots of each variant and exercise the interaction directly in the browser or UI. |
   | Behavioral or timing | Write the smallest standalone script that exercises the question. | Run the script and record the observed output, logs, or timing numbers. |

4. When comparing multiple options, put all variants behind a single switcher (such as buttons or keyboard shortcuts) with clear labels per [Exhaust the Design Space](../references/principle-exhaust-the-design-space.md).
5. Verify each variant directly on the target surface (browser, CLI, or UI) and collect the visual or runtime evidence from the table above.
6. Present the explored variants, their tradeoffs, and your recommendation, and state clearly that the prototype code is disposable.
   Once a direction is chosen, use the [`architect`](../../architect/SKILL.md) skill and the [Feature](./feature.md) playbook to design and build the production change.

In your reply, include the variants explored, the screenshots or observed runtime output, a tradeoff comparison table, your recommendation, and the scratch directory path, and note that the prototype is throwaway.
