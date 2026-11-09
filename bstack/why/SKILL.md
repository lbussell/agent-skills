---
name: why
description: "Investigate the motivation, history, and tradeoffs behind code using git history, pull requests, issues, tests, and in-repo docs. Use for 'why does X work this way', 'why we picked Y', design rationale, or regression history (use how for runtime behavior). Use only when explicitly invoked."
---

# Why

Investigate the motivation and intent behind code. The companion [`how`](../how/SKILL.md) skill answers what the code does and how it works; `why` answers what forces led to its shape.

Operate as a careful, cautious, and precise investigator. Do not write files, commit, or modify external state.

## 1. Understand the target and question

Identify the target (a chunk of code, pattern, feature, or design decision) and the question (rationale, tradeoff, motivating edge case, constraint, dead code, or history sweep). If the target is vague, infer it from conversation context, state your interpretation briefly so the user can redirect, and proceed.

## 2. Search the repository and GitHub history

Trace the code's lineage using [`references/code-archaeology.md`](references/code-archaeology.md):
- Identify file paths, line ranges, and key symbols.
- Inspect blame and commit history (`git blame -L <start>,<end> <file>`, `git log --follow -p -- <file>`, `git log -S` / `-G`).
- Extract PR and issue numbers from commits and pull full PR descriptions, review comments, and linked issues (`gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews`).
- Search surrounding code comments, `TODO` / `FIXME` notes, tests, ADRs, and changelogs.

## 3. Weigh the evidence

- Assign every claim a confidence tier:
  - **Direct**: Explicitly stated by an author in a commit, PR, issue, doc, or comment. State plainly and cite (`PR #123`, commit SHA, issue, or `file:line`).
  - **Supported**: Multiple pieces of indirect evidence converge on one conclusion. Cite each piece.
  - **Inferred**: A reasonable reading of context with no explicit statement. Use hedged language ("appears to", "likely", "suggests") and show the reasoning chain.
  - **Speculative**: A plausible hypothesis on thin evidence. Place in `Competing Hypotheses`.
  - **Unknown**: Searched and found no evidence. Document the exact queries and commits checked.
- Never cite code mechanics or style as evidence of author intent.
- Surface contradictions with both citations rather than picking the tidier story.
- Treat any hypothesis in the user's prompt as a candidate to test, not a conclusion to confirm.

## 4. Present findings

Structure the response with the sections that apply:
- **The Question** and **The Code in Question** (files, lines, symbols).
- **What We Found** (`[Direct]` and `[Supported]` claims with citations).
- **What We Can Reasonably Infer** (`[Inferred]` claims with hedged phrasing and reasoning).
- **Competing Hypotheses** (when multiple explanations fit the evidence).
- **What We Don't Know** and **Sources Consulted** (commits, PRs, issues, and files searched, plus unanswered questions).
- **Confidence Summary** (1 to 2 sentences on what is proven, inferred, and unknown).
- **Preserve / Change / Avoid / Risk** (include when the question precedes changing the code).
