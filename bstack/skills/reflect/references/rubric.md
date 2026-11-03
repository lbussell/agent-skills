# Reflect Lenses and Rubric

## 1. Three Review Lenses

Scan the active session through all three lenses before filtering:

### Judgment Lens
Focus on durable principles that save future agents time:
- Mistakes made and corrections received from the user
- User preferences and workflow patterns
- Codebase architecture, invariants, and gotchas discovered
- Decisions and their rationale
- Friction in skill execution or workflow ordering
- Repeated manual steps that should be automated or encoded

### Tooling Lens
Focus on concrete tool, command, path, or configuration facts that survive code drift:
- Tool invocations and command flags that had to be discovered
- Library or framework quirks (config, lockfiles, env-var behavior, version gotchas)
- Non-obvious file or path conventions
- Test commands, CI flags, and local reproduction steps
- Debugging entry points (traces, logs, endpoints)
- **Self-sufficiency gaps**: moments where the user manually supplied context (a ticket ID, chat thread URL, trace ID, error event link, or PR number) that the agent could have fetched itself using an available MCP tool or sibling skill

### Divergent Lens
Focus on second-order effects and blind spots:
- Decisions that worked only by luck or for the wrong reasons
- Verifications that were skipped, deferred, or self-reported instead of artifact-checked
- Cases where a local fix missed second-order effects (callers, sibling consumers, downstream telemetry)
- Architectural smells that an immediate fix papered over
- Visible skills that should have triggered but did not, or were invoked too late
- Implicit assumptions about scope, side effects, or user intent

## 2. Scope Rule

Route findings only to skills, tools, or MCPs that the session actually used (read `SKILL.md`, called `skill`, or ran its documented commands) or to a skill visible in the catalog that failed to trigger when it would have helped (`tune description: <skill path>`). Drop speculative routings to skills the session neither used nor missed.

## 3. Acceptance Criteria

Evaluate every candidate learning against these criteria:

- **Durability**: Still true in 6 months once file paths, SHAs, tool versions, and specific code shapes change.
- **Specificity**: Broad enough to apply across tasks, precise enough that a future agent recognizes when to apply it. Reject vague platitudes ("write good code") and transient facts ("file X has 175 lines").
- **Existing-skill-first**: Propose a new skill (`new skill: <kebab-name>`) only when no existing skill is a real home, the pattern recurs, and the topic deserves its own skill.
- **Decision-changing**: A future agent does something different because of the edit, not just reads more text.
- **Structural-mechanism check**: Route to `Backlog` when a lint rule, script, metadata flag, or runtime check already enforces the rule or could enforce it cheaply. Skill prose is for judgment and workflows that mechanisms cannot enforce.
- **Skill-was-used**: Accept only findings that route to a skill, tool, or MCP used in the session, or `tune description: <skill path>` for a missed trigger. Otherwise reject as `skill-not-used`.
- **Already-covered**: Read the target skill before proposing a body edit. If the proposal duplicates clear, well-placed guidance, reject as `already-covered`. If existing guidance is buried or weak, reframe the proposal to tighten or move the existing text rather than duplicating it.

## 4. Output Format

Present the review in this exact structure, with one sentence per cell and no preamble:

### Accepted

| Problem | Proposal | Routing |
|---|---|---|
| <failure mode in a skill used in this session> | <change to that skill's body> | <skill path + section> |
| <skill existed in catalog but did not trigger> | <tune the skill's description so it triggers> | `tune description: <skill path>` |
| <recurring pattern with no existing skill home> | <draft a new skill> | `new skill: <kebab-name>` |

### Rejected

For each rejected candidate:
- **Principle**: <one sentence>
- **Reason**: `<durability | specificity | existing-skill-first | decision-changing | structural | duplicate | skill-not-used | already-covered>`

### Backlog

For each item best enforced by a tool or check, describe the pattern, what happened in the session, and the suggested lint rule, script, or check.
