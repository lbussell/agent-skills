---
name: review-skill
description: >-
  Review and tighten agent skills and instruction files for clarity, brevity, and structure.
  Use when reviewing or editing a SKILL.md file, skill reference files, or AGENTS.md instructions.
---

# Review a skill

Apply [technical-writing](../technical-writing/SKILL.md) and [unslop](../unslop/SKILL.md) first, then run the checks below.

## Cut what the model already knows

- Delete explanations of general reasoning, hypothesis testing, parallel tool calls, schema discovery, pagination, basic statistics, and standard prompt-injection rules.
- Keep only project-specific facts, repository conventions, and non-obvious tool or API pitfalls.
- Delete disclaimers that list files, schemas, or scripts that do not exist in the repository.

## Remove contrast framing

- Rewrite "X, not Y", "X rather than Y", and "Do not X; instead Y" sentences into direct positive instructions.
- Replace negative aphorisms ("X is a symptom, not a root cause") with the action to take ("Read the child log to find the root error").
- Keep "Do not..." rules only for hard guardrails where the agent might take a harmful action.

## Deduplicate across files

- Keep `SKILL.md` focused on the workflow steps.
- Put lookup tables, rubrics, and tool pitfalls in `references/` and link to them once.
- Do not summarize `references/` files inline in `SKILL.md` or repeat rules across sections.

## Use simplified technical english

- Put one instruction or one main idea in each sentence.
- Start instructions with a plain imperative verb (`Check`, `Use`, `Ask`, `Compare`, `Fetch`, `Report`).
- Put conditions (`If ...`, `When ...`) before the action they control.
- Replace abstract terms, `-ing` tails (`...verifying that`), and slash-packed compounds (`organization/project`, `head/merge`) with plain words and `and` or `or`.

## Check links and review output

- Confirm that every linked file, heading anchor, command, and referenced skill exists.
- Base pull request comments only on the current diff, never on deleted files from earlier commits on the branch.
- Post section-level review comments with ready-to-apply `suggestion` blocks.
