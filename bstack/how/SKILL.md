---
name: how
description: "Explain subsystem architecture, runtime flow, and onboarding mental models, or answer placement, ownership, and layering questions ('where should this live', 'which package owns this', 'is this the right layer'). Use for 'how does X work' or code walkthroughs before changing something (use why for motivation)."
---

# How

Explore the codebase to answer "how does X work?" questions at the level of a senior engineer onboarding onto a subsystem: enough to build a working mental model, not annotated source code.

## 1. Scope and explore

If the scope is ambiguous, state your interpretation briefly so the user can redirect, then proceed.

- **Simple** (a single module, small utility, or narrow question such as "how does function X work"): trace the target directly in one pass.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, or a full architectural overview): decompose the question into 2 to 4 distinct angles and trace each slice before writing.

For each slice, identify:
- **Components**: key types, services, classes, and abstractions with their file paths and roles.
- **Flow**: step-by-step execution and data movement across functions and files, plus decision points.
- **Boundaries**: inputs, outputs, and where the subsystem connects to other parts of the codebase.
- **Non-obvious details**: surprising mechanics, historical quirks, easy-to-miss traps, and any gaps you could not trace.

## 2. Explain

Reconcile overlapping slices and resolve any contradictions by checking the code. Use the sections below, dropping any that do not apply:

### Overview
Write 1 to 2 paragraphs covering what the subsystem is, what it does, and why it exists.

### Key Concepts
Define the important types, services, or abstractions needed to follow the rest of the explanation.

### How It Works
Walk through the runtime flow in prose: what triggers it, what happens step by step, where data goes, and what the decision points are. Reference specific files and functions (`UserService` calls `AuthClient.refresh()`), not abstract summaries ("the service delegates to the client"). Include a Mermaid (` ```mermaid `) or ASCII diagram only when multiple components interact or data transforms through stages and a visual clarifies more than prose.

### Where Things Live
Provide a brief file and directory map for starting work in this area.

### Gotchas
Call out non-obvious behavior, historical context, pitfalls, and any open questions or untraced gaps.

## Communication style

- Use concrete language and name real symbols and files.
- Explain why complex parts are complex, and do not pad simple parts.
