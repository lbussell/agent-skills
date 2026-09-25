---
name: over-engineering-review-loop
description: Only use when explicitly asked.
---

We will now go through a process designed to simplify your implementation.

### Workflow

Invoke an "overengineering-advisor" subagent using `opus-5.5`.
Provide it with the user's prompt and tell it what code to review.
For the code to review, select exactly one of:

- All unstaged changes
- Commit `<sha>`
- A list of specific files or changes

Use the following prompt:

```md
The operator's prompt was: `$USER_PROMPT`
The code up for review is `$CODE_TO_REVIEW`
```

Do not provide additional context unless the advisor explicitly requests it.
Answer the advisor's questions directly and make adjustments in response to the advisor's feedback.

### Important

Repeat this process until the advisor has no more feedback.
