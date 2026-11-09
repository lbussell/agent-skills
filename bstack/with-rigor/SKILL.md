---
name: with-rigor
description: >-
  Run engineering tasks with structured playbooks, explicit design principles, deliberate subagents, clear prose, and verified work.
  Use for /with-rigor or requests to work with engineering rigor.
  Use only when explicitly asked.
icon: crown
color: yellow
---

# With rigor

Match each task to a playbook, apply the relevant engineering principles, verify the result on the real artifact, and stop at a locally verified PR-ready state for user review.

## Non-negotiables

Apply these rules and skill triggers across every task, regardless of which playbook you run.
Ground your decisions in the [Principles](#principles) section below and read the full reference file for every principle that applies.
In your reply, name each principle that shaped a decision and state the specific choice it changed.
Cite only principles whose reference file you read during the current session.

Route each situation below to its required skill, playbook, or rule:

| Situation | Required action |
| --- | --- |
| Nontrivial change, architecture decision, or "are we sure?" question | Run the [`how`](../how/SKILL.md) skill to ground the architecture before deciding or editing. |
| Empirical fork about behavior, timing, layout, output, or performance | Build a quick experiment with the [Prototype](playbooks/prototype.md) playbook to observe the answer. During a read-only [Investigation](playbooks/investigation.md), answer from the evidence. |
| Product or preference question that no experiment can settle | Ask the user with `ask_user`. |
| Writing any code | Define the data shape first and choose its structure using [Model the Domain](references/principle-model-the-domain.md). |
| Code that crosses a function or module boundary | Run the [`architect`](../architect/SKILL.md) skill to explore designs in parallel before implementing. |
| Design or code bakeoff with multiple valid shapes | Run the [`arena`](../arena/SKILL.md) skill to compare candidates, select a base, and graft improvements. |
| Contested design or high-stakes tradeoff | Run the [`council`](../../skills/council/SKILL.md) skill for multi-model review before shipping. |
| Nontrivial multi-step implementation | Record the four-item throughput checkpoint from step 3 of the [Feature](playbooks/feature.md) playbook. |
| Writing or editing any prose, including user replies | Apply the [`unslop`](../unslop/SKILL.md) skill and follow [Writing the reply](#writing-the-reply). |
| Writing or reviewing a skill or instruction file | Apply the [`review-skill`](../review-skill/SKILL.md) skill. |
| Writing documentation, READMEs, RFCs, or commit messages | Apply the [`technical-writing`](../technical-writing/SKILL.md) skill. |
| Submitting a pull request | Apply the [`formatting-pull-request`](../../skills/formatting-pull-request/SKILL.md) skill. |
| Measuring performance or reporting a benchmark | Apply [Explain the Number](references/principle-explain-the-number.md) before reporting or acting on the number. |
| Shipping a UI, CLI, or TUI change | Reproduce bugs and verify fixes directly on the target surface. |
| Long, autonomous, or multi-phase work | Maintain a decision log using the [`show-me-your-work`](../show-me-your-work/SKILL.md) skill. When the task requires an auditable record, commit the log; otherwise keep it local. |
| Broken skill encountered during a task | Report the issue to the user, and fix it locally only when asked. Never open an unrequested pull request. |

## Principles

Read the linked reference file in full whenever a principle applies to your task.

### Core

| Principle | When to apply | Rule |
| --- | --- | --- |
| [Laziness Protocol](references/principle-laziness-protocol.md) | Refactoring, sizing a diff, or considering a new abstraction or layer | Delete unnecessary code and make the smallest change that solves the problem. |
| [Foundational Thinking](references/principle-foundational-thinking.md) | Before writing logic | Define core types and data structures, sequence scaffolding before features, and identify state shared across concurrent actors. |
| [Redesign from First Principles](references/principle-redesign-from-first-principles.md) | Integrating a new requirement into an existing design | Redesign the component as if the new requirement had existed from day one. |
| [Attack the Premise](references/principle-attack-the-premise.md) | Two or more fixes that share one assumption fail the same check | Write the assumption down and test it directly before writing another fix that depends on it. |
| [Subtract Before You Add](references/principle-subtract-before-you-add.md) | Sequencing an addition, refactor, or rewrite | Remove dead code and unused abstractions first, then build on the simpler base. |
| [Minimize Reader Load](references/principle-minimize-reader-load.md) | Reviewing or shaping code that is hard to trace | Count layers and hidden state, inline single-caller wrappers, and shrink mutable scope. |
| [Outcome-Oriented Execution](references/principle-outcome-oriented-execution.md) | Planned rewrites and migrations with phase boundaries | Converge directly on the target architecture without preserving temporary compatibility layers. |
| [Experience First](references/principle-experience-first.md) | Product, UX, or feature-scope tradeoffs | Prioritize user experience over implementation convenience. |
| [Exhaust the Design Space](references/principle-exhaust-the-design-space.md) | Novel interactions or architectural decisions with no precedent | Build two or three competing prototypes and compare them before committing to one design. |
| [Build the Lever](references/principle-build-the-lever.md) | Repetitive edits or complex verification | Write a script, codemod, or generator that performs or verifies the work so reviewers can rerun it. |

### Architecture

| Principle | When to apply | Rule |
| --- | --- | --- |
| [Model the Domain](references/principle-model-the-domain.md) | Writing stateful logic, heavy branching, or repeated shape assumptions | Encode domain rules in a data structure such as a state machine, typed model, lookup table, or reducer. |
| [Boundary Discipline](references/principle-boundary-discipline.md) | Wiring validation, error handling, or framework adapters | Validate and parse external data at system boundaries, trust internal types, and keep business logic pure. |
| [Type System Discipline](references/principle-type-system-discipline.md) | Designing types or function signatures in a typed language | Make invalid states unrepresentable, brand primitive identifiers, and parse external inputs at boundaries. |
| [Make Operations Idempotent](references/principle-make-operations-idempotent.md) | Designing commands, lifecycle steps, or retry loops | Ensure repeated runs converge to the same end state. |
| [Migrate Callers Then Delete Legacy APIs](references/principle-migrate-callers-then-delete-legacy-apis.md) | Introducing a new internal API while old callers exist | Migrate all callers and delete the legacy API in the same change. |
| [Separate Before Serializing Shared State](references/principle-separate-before-serializing-shared-state.md) | Concurrent actors might write to the same file, branch, key, or object | Give each actor an isolated target before adding locks or serialization. |

### Verification

| Principle | When to apply | Rule |
| --- | --- | --- |
| [Prove It Works](references/principle-prove-it-works.md) | Before declaring a task complete | Verify behavior directly on the real artifact. |
| [Fix Root Causes](references/principle-fix-root-causes.md) | Debugging a defect | Trace the symptom to the first place the system went wrong and fix it there. Add a guard only when the state it handles is valid. |
| [Sequence Work into Verifiable Units](references/principle-sequence-verifiable-units.md) | Multi-step changes, migrations, and commit stacks | Break work into small units, verify each unit locally before starting the next, and order commits so each step passes checks. |
| [Test Behavior, Not Implementation](references/principle-test-behavior-not-implementation.md) | Writing, updating, or reviewing tests | Assert observable outputs and behavior so tests fail only when user-facing behavior breaks. |
| [Explain the Number](references/principle-explain-the-number.md) | Reporting or acting on a benchmark, latency, throughput, or evaluation metric | Identify the resource or code path that bounds the measurement and rule out confounding factors with evidence. |

### Delegation and meta

| Principle | When to apply | Rule |
| --- | --- | --- |
| [Guard the Context Window](references/principle-guard-the-context-window.md) | Large tool outputs, long files, repeated reads, or fan-out planning | Delegate bulk reading and analysis to subagents and keep concise summaries in the main thread. |
| [Never Block on the Human](references/principle-never-block-on-the-human.md) | Reversible local implementation choices | Make a reasonable choice, complete the local work up to the PR-ready checkpoint, and present the result for review. |
| [Encode Lessons in Structure](references/principle-encode-lessons-in-structure.md) | Repeating the same instruction or correction | Encode the rule as a lint check, type constraint, test, or script. |

## Autonomy

Drive well-defined tasks locally to a verified, PR-ready state, then pause.
Use subagents, local tools, prototypes, and verification freely to complete the work with full engineering rigor.
Present the verified local result so the user can review it, request changes, or approve submitting a pull request.

Always pause for explicit user approval before taking any remote, pull request, or public action:

- Pushing commits with `git push`, including follow-up pushes during pull request validation or review feedback.
- Opening, marking ready, retargeting, or merging a pull request.
- Replying to or resolving pull request review threads, updating issues, or sending external messages.
- Force-pushing, deploying, or deleting data.

When the user grants an autonomous run (such as "don't stop", "going to bed", or "run until done"), continue local execution until the exit condition is met.
If a product question arises during an autonomous run and an experiment cannot settle it, apply a reasonable default, explain the decision, and state how the user can change it.
Hold remote pushes and pull request creation for approval unless the user explicitly authorized them for the run.

When the user asks whether to do something, proposes extra scope, or shares an approach, give your candid technical judgment.
Decline or push back when a change adds unnecessary complexity or does not solve the root problem.

## Subagents

Run the matched playbook in the main session and delegate bounded steps such as exploration, implementation slices, and verification to `task` subagents.
When a routed skill such as [`arena`](../arena/SKILL.md) or [`architect`](../architect/SKILL.md) defines subagent roles, follow that skill's configuration.

Follow these defaults when spawning `task` subagents:

- Use `agent_type: "explore"` for read-only investigation and `agent_type: "general-purpose"` for tasks that edit files or run commands.
- Pass file paths and concise requirements in the prompt so subagents read the files directly.
- Rely on the runtime default model and reasoning effort unless the user or custom instructions specify an override, or a multi-model skill requires distinct model families.
- Review every subagent's diff and output yourself and write your own summary.
- Spawn a fresh subagent with consolidated context for new tasks, retries, and follow-up rounds.
- Reuse an existing subagent with `write_agent` only when the follow-up depends on state held by that agent, such as an isolated worktree, uncommitted edits, or a running process.

## Writing the reply

Write clear, natural prose that makes sense on first read:

- Write direct sentences with normal grammar and articles.
- Use a colon, semicolon, parentheses, or plain hyphen instead of the full em dash.
- State what changed, why, and how you verified it.
- Omit filler, internal process recitals, and boilerplate sections that a coworker or maintainer does not need.
- State who the change affects and what changes for them before describing implementation details, then note what future maintainers inherit.
- Link only artifacts that you produced or read during the current session.
- Format pull request references as clickable Markdown links (`[#123](https://github.com/<owner>/<repo>/pull/123)`).
- Include the evidence or confidence label (measured, inferred, or guessed) in the same sentence as each technical claim.
- Run every verification check that you can execute locally before replying.

## Comments

Write code comments only to explain a non-obvious reason that the code itself cannot express.
Omit phase-narrating comments such as `// Phase 1: add cards` in tests and verification scripts.
Put step descriptions inside assertion messages or log strings, such as `assert(ok, 'persisted across restart')`.
Apply these rules to every file you create or edit, including diffs produced by subagents.

## Playbooks

Match the task to a playbook below and read its full steps.
Use `sql` with `todos` and `todo_deps` to create a todo list whose first items are the matched playbook's steps, copied verbatim, before adding task-specific items.
If a playbook step does not apply, keep the item in the list and mark it `skip: <reason>`.

When a task spans a large migration, an ambitious multi-part change, or an unfamiliar workflow that no playbook below fits, use the [`figure-it-out`](../figure-it-out/SKILL.md) skill to design a custom playbook.
When a standing multi-day program requires coordinating many stacked pull requests across a fleet of subagents, use the [Orchestrate](playbooks/orchestrate.md) playbook.

### Build and change code

| Playbook | When to use | Summary |
| --- | --- | --- |
| [Feature](playbooks/feature.md) | Building new or changed behavior | Design from a named data shape, implement in verifiable units, and verify on the target surface. |
| [Bug fix](playbooks/bug-fix.md) | Fixing a reported defect | Reproduce the defect, isolate the root cause with runtime evidence, and verify the fix on the same surface. |
| [Refactoring](playbooks/refactoring.md) | Restructuring code without changing behavior | Pin existing behavior first, reshape the code in small verified steps, and reduce reader load. |
| [Perf issue](playbooks/perf-issue.md) | Improving a measured performance bottleneck | Capture a baseline trace, apply the cheapest effective optimization, and verify the delta against the baseline. |
| [Hillclimb](playbooks/hillclimb.md) | Iteratively improving a single metric toward a target | Run a hypothesis loop with a frozen benchmark harness, a decision log, and one kept change per proven win. For a one-off bottleneck, use [Perf issue](playbooks/perf-issue.md). |
| [Prototype](playbooks/prototype.md) | Settling a design or behavioral question quickly | Build a throwaway sketch in an isolated scratch directory to compare options and observe the result. |
| [Visual parity](playbooks/visual-parity.md) | Matching UI appearance across implementations or styling systems | Capture baseline screenshots first and iterate per component until image diffs reach zero. |
| [Authoring or modifying a skill](playbooks/authoring-a-skill.md) | Creating or editing a `SKILL.md` file | Write concise instructions, verify all file and skill links, and review with [`review-skill`](../review-skill/SKILL.md). |
| [Opening a PR](playbooks/opening-a-pr.md) | Concluding any code-changing playbook | Stop at a verified PR-ready state, wait for user approval to commit or push, and format the pull request with [`formatting-pull-request`](../../skills/formatting-pull-request/SKILL.md). |

### Investigate, diagnose, and evaluate

| Playbook | When to use | Summary |
| --- | --- | --- |
| [Investigation](playbooks/investigation.md) | Answering read-only architecture, history, or tradeoff questions | Route through [`how`](../how/SKILL.md) and [`why`](../why/SKILL.md) to produce a cited explanation or recommendation. |
| [Runtime forensics](playbooks/runtime-forensics.md) | Diagnosing a live runtime issue such as a leak, CPU spin, or UI glitch | Capture live profiles or traces, isolate the mechanism, and map the cause to source without applying a fix. |
| [Trace forensics](playbooks/trace-forensics.md) | Diagnosing a captured profile, trace, spindump, or heap snapshot | Load and query the captured artifact to identify the hot path, retainer chain, or blocked thread. |
| [Eval](playbooks/eval.md) | Testing how a skill or prompt change affects agent behavior | Run blinded parallel candidates and a blinded judge to evaluate the variant before promoting it. |

### Plan, automate, and manage sessions

| Playbook | When to use | Summary |
| --- | --- | --- |
| [Multi-phase or multi-PR plan](playbooks/multi-phase-plan.md) | Planning work that spans multiple phases or stacked pull requests | Prototype open questions and produce a structured checklist with per-PR verification gates. |
| [Autonomous run](playbooks/autonomous-run.md) | Driving a single long-running task until an exit condition passes | Define a checkable predicate, iterate locally in small verified steps, and log each attempt. |
| [Orchestrate](playbooks/orchestrate.md) | Coordinating a multi-day program across many pull requests and subagents | Author worker briefs, manage a durable state store, verify units into a ledger, and maintain stack safety. If one agent can finish the work within one session, use [Autonomous run](playbooks/autonomous-run.md). |
| [Autopilot-full](playbooks/autopilot-full.md) | Running a queue of independent pull requests with pre-authorized autonomy | Assign one owner per pull request and verify each change independently before landing. |
| [Autopilot-stack](playbooks/autopilot-stack.md) | Building an autonomous queue of changes as one linear pull request stack | Build and verify each link in dependency order so the user can review and land the stack. |
| [Shipping](playbooks/shipping.md) | Landing a stack of verified pull requests | Verify each pull request independently and merge the contiguous verified run from the bottom of the stack upward. |
| [Session pickup](playbooks/session-pickup.md) | Resuming in-flight work from a prior session or branch | Reconstruct state from session history and git commits, identify the resume point, and continue without redoing finished work. |
| [Pause safely](playbooks/pause-safely.md) | Suspending in-flight work cleanly for later resumption | Stop at an atomic boundary, save local state, and write a concise resume note. |
| [Worktree and simulator cleanup](playbooks/worktree-cleanup.md) | Reclaiming disk space from stale git worktrees and simulators | Audit active sessions and uncommitted work before pruning merged worktrees and unused simulator runtimes. |
