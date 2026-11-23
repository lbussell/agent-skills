---
name: council
description: Trigger this if the user says 'council'.
---

# Council

Farm out work or code review to multiple models.
Use the following models unless the user specifies otherwise:

| Model | Effort |
| --- | --- |
| Claude Opus 5.5 | High |
| GPT-6.2 Sol | High |

Start one delegate per model in parallel with the `task` tool.
Set its `model` parameter to the council member and use a background agent.
If you cannot access the requested models, report it instead of substituting.

Give each delegate the request and relevant context.
For review or feedback, keep their work read-only.
Collect their responses and summarize the useful findings, disagreements, and recommended next steps.

For a code review, ask each delegate for a score out of 10.
Count each full review pass as one round.

```markdown
| Reviewer | Round 1 | Round 2 |
| --- | --- | --- |
| Model | 7/10 | 9/10 |
```

If a delegate gives no score, write `no score`.

If you agree with their recommendations, make the changes and request a fresh review after.
Continue this process until all delegates are satisfied with the outcome.

Do not let repeated reviews result in scope creep.
It is your job to fight to keep scope limited.
