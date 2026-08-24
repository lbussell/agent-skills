---
name: cleanup-csharp
description: Use only when explicitly invoked.
---

Clean up your C# code with the help of a sub agent. Follow this workflow:

1. Determine the scope and list the C# files.
  - If the operator specifies which files to clean up, then clean up those.
  - Otherwise, clean up the current diff.
  - If there is no current diff, then compare the current branch with its base and clean up those files.
  - Only clean up code added/touched by the diff, not entire files.
2. Spawn up to three Gemini 3.7 Flash (Low effort) sub-agents using `reference/scanner-prompt.md`. Split based on rules or files depending on the size of the diff. Fill in the placeholders before sending it to the sub-agent. Tell it exactly what files to operate on by giving it a precise git diff command to run or list of files to read. Don't read `reference/rules/*.md` yourself.
3. Review and fix the findings as appropriate. Preserve behavior and avoid unrelated cleanup.
