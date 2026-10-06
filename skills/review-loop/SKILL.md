---
name: review-loop
description: Runs repeated implementation reviews with the review workflow. Use only when explicitly asked to simplify an implementation through a review loop.
---

Review your implementation for unnecessary complexity.

## Workflow

Run the `review` dynamic workflow yourself.
Do not delegate the review loop or fixes to another agent.

Pass:

- `userRequest`: The user's original request.
- `codeToReview`: Exactly one of:
  - All unstaged changes
  - Commit `<sha>`
  - A list of specific files or changes

Address the workflow's actionable comments directly, then run it again.
Stop when it returns no comments or after three review cycles.
