# Exhaust the Design Space

When you face a novel interaction or an architectural decision with no precedent in the codebase, build two or three competing options and compare them side by side before committing to one design.

Apply this principle to both code architecture and product interactions where the right choice depends on visual feel, timing, or ergonomics.

Follow these steps to compare options:

1. Identify the core tradeoff or open question that makes the design non-obvious.
2. Build two or three distinct candidates that take genuinely different approaches to the problem.
3. Evaluate the candidates side by side against the same inputs, user flows, or constraints.
4. Select the strongest base design, fold in any better details from the other candidates, and delete the unused prototypes.

Choose the workflow that matches the decision:

| Decision type | Workflow |
| --- | --- |
| Quick behavioral or UI feel experiment | Follow the [Prototype](../playbooks/prototype.md) playbook to build throwaway sketches in an isolated scratch directory. |
| Module boundary, type shape, or architecture | Run the [`architect`](../../architect/SKILL.md) skill to explore competing designs in parallel before writing implementation code. |
| Implementation bakeoff across multiple valid shapes | Run the [`arena`](../../arena/SKILL.md) skill to spawn parallel candidates, pick a base, and graft the strongest parts. |
