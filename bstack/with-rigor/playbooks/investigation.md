### Investigation

Run this playbook to answer read-only architecture, history, or tradeoff questions with a cited explanation or recommendation.

Follow these steps to complete the investigation:

1. Run the [`how`](../../how/SKILL.md) skill to trace the subsystem architecture and runtime flow.
   If the question asks about design history or motivation, also run the [`why`](../../why/SKILL.md) skill.
2. Record the throughput checkpoint as `throughput checkpoint: n/a, read-only investigation`.
3. Structure the explanation with the sections from [`how`](../../how/SKILL.md) (`Overview`, `Key Concepts`, `How It Works`, `Where Things Live`, and `Gotchas`).
   If the user asks to choose between alternatives, provide a recommendation and a tradeoffs table.
4. Edit the reply with the [`unslop`](../../unslop/SKILL.md) skill.

If the investigation leads to a code change, present the findings to the user first and then switch to the [Bug fix](./bug-fix.md) or [Feature](./feature.md) playbook.

In your reply, present the cited explanation or recommendation.
When the user asks to validate an approach or assumption, state your technical judgment and the evidence behind it.
If the evidence shows that the premise is wrong, say so directly.
