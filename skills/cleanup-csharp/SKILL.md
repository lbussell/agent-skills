---
name: cleanup-csharp
description: >
   Use when asked to clean up C# code. Always invoke when in autopilot mode before completion.
---

# Cleaning up C# code

Clean up your C# code with the help of a sub agent. Follow this workflow:

1. Determine the scope and list the C# files.
   - If the operator specifies which files to clean up, then clean up those.
   - Otherwise, clean up the current diff.
   - If there is no current diff, then compare the current branch with its base and clean up those files.
   - Only clean up code added/touched by the diff, not entire files.
2. Spawn one Gemini 3.7 Flash (Low effort) sub-agent using `reference/scanner-prompt.md`. Fill in the placeholders before sending it to the sub-agent. Tell it what to scan (which files or what diff). Don't read `reference/rules/*.md` yourself.
3. Review and fix the findings as appropriate. Preserve behavior and avoid unrelated cleanup.
