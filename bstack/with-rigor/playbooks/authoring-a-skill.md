### Authoring or modifying a skill

Use this playbook when creating or editing a `SKILL.md` file, its reference documents, or agent instruction files.
Keep every skill concise, actionable, and free of rules that the model already knows.

1. Draft or update the skill using the [`technical-writing`](../../technical-writing/SKILL.md) and [`unslop`](../../unslop/SKILL.md) skills.
   Write YAML frontmatter with `name` and a two-sentence `description` that states what the skill does and when to invoke it.
   Keep `SKILL.md` focused on workflow steps and move detailed rubrics, lookup tables, or scripts into `references/` or `scripts/`.
2. Keep only instructions that change agent decisions.
   Start each instruction with a plain imperative verb, state one instruction per sentence, and explain the reason only when a rule would be ambiguous without it.
   Link to existing skills by relative path to avoid duplicating rules across files, and encode repeatable checks in scripts, types, or linters per [Encode Lessons in Structure](../references/principle-encode-lessons-in-structure.md).
   When you notice a recurring workflow that has no skill, propose a new skill to the user.
3. Review and tighten the skill with the [`review-skill`](../../review-skill/SKILL.md) skill.
   Confirm that the frontmatter is valid, every sentence is on its own line, and all relative file and skill links resolve.
4. When the skill defines structural or behavioral rules that can be tested, verify it with the [Eval](./eval.md) playbook or run its scripts on a real example.
5. Run [Opening a PR](./opening-a-pr.md) to stop at a verified PR-ready state and wait for user approval before pushing or opening a pull request.

In your reply, summarize what the skill does, the key design decisions, and how you validated its links and behavior.
