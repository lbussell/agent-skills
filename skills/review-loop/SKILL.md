---
name: review-loop
description: Review and simplify code through repeated review cycles.
---

Run the `review` dynamic workflow.

Pass in:
- The user's original request.
- What code to review. Choose one of:
  - All unstaged changes
  - Commit `<sha>`
  - A list of specific files or changes

Address the workflow's actionable comments directly, then run it again.
Stop when it returns no comments or after 5 review cycles.
