### Eval

Run this playbook to evaluate how a skill, instruction, or prompt change affects agent behavior using blinded parallel candidates and a blinded judge.

Apply these blinding rules across the entire evaluation:

| Surface | Blinding requirement |
| --- | --- |
| Paths and identifiers | Use realistic project names and omit `eval`, `test`, `judge`, `experiment`, `rubric`, `score`, `compare`, `benchmark`, `candidate`, and `arena` from every path, file, and prompt visible to candidates. |
| Candidate prompt | Write a natural user request that states the task goal and asks for general design notes. |
| Chain attribution | Measure skill and principle usage from session history and code structure without asking candidates which skills or files they read. |
| Candidate isolation | Give each candidate an isolated working directory with no reference to other candidates or variants. |
| Judge inputs | Pass the rubric and candidate outputs to the judge using neutral labels, with all model and variant names removed. |
| Variant comparison | When comparing two variants, have one judge score all outputs from both sets in a single pass on one shared scale. |

Follow these steps to run the evaluation:

1. Define the variant under test, the target behavior, and a rubric of three to six concrete criteria for the judge.
   Keep the rubric out of all candidate directories and prompts.
2. Create an isolated working directory for each candidate, following [Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md).
   Populate each directory with the variant under test and the project files and skills that a real task would include.
3. Write one realistic user prompt that describes the task without revealing what the evaluation measures.
4. Spawn the parallel candidate subagents via `task` with `agent_type: "general-purpose"`, following Phase B of the [`arena`](../../arena/SKILL.md) skill.
   Give every candidate the same prompt and its own working directory.
5. After all candidates finish, spawn one blinded judge subagent via `task` with `agent_type: "explore"`, following Phase C of the [`arena`](../../arena/SKILL.md) skill.
   Provide the judge with the rubric and the candidate outputs under neutral labels.
6. Query each candidate's session history with `session_store_sql` scoped to the current repository or working directory to verify which files and skills the candidate opened.
   Do not query `session_store_sql` across other repositories or working directories.
   Grade instruction-following from the files the candidate opened and the code it produced.
7. Read every candidate output end to end and compare your assessment with the judge's scores.
   If your assessment and the judge's verdict disagree, inspect the outputs for model bias or rubric ambiguity before deciding.

In your reply, report the variant under test, the rubric, per-candidate observations, the judge's scores, your synthesis, and whether to promote the variant.
