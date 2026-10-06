# Review workflow

Run the workflow with:

```json
{
  "userRequest": "The user's original request",
  "codeToReview": "All unstaged changes"
}
```

It runs one over-engineering reviewer.
The reviewer receives the request and review scope, then returns structured comments.

The workflow loads `review.md` on every run, so prompt edits do not require an extension reload.
Put a reference such as `@traits/be-obsessive.md` on its own line to include another Markdown file in place.
Include paths are relative to the file containing the reference.
Includes can be nested; missing files and circular includes fail the run.
Inline references are left unchanged.
