### Orchestrate

Run this playbook when coordinating a multi-day program across many stacked pull requests and subagents.
If a single agent can finish the work within one session, use [Autonomous run](./autonomous-run.md) for a single predicate-driven loop or [`figure-it-out`](../../figure-it-out/SKILL.md) for a custom multi-part workflow.

As the coordinator, author worker briefs, drain completion queues, keep the merge frontier green, and make program-level decisions while delegating all code edits to subagents.
Scale coordination ceremony to the size of the units: collapse templates and dedicated verifier steps when running cheap, near-identical units.

Follow three rules across the program:

- Treat subagent completions as queue events to process at drain points.
- Include the standing orders in every `task` spawn and every `write_agent` continuation.
- Write complete, self-contained briefs so workers can execute without asking questions.

#### Roles and placement

Keep the hierarchy to at most three levels: coordinator, track sub-coordinator, and worker or verifier.
Define tracks to fit the project, such as build, verification, and landing.

| Role | Placement and scope | Responsibilities |
| --- | --- | --- |
| Coordinator | Main session | Frame the program, author briefs, drain `inbox/`, update store files at drain points, and report to the user. Delegate code edits, conflict resolutions, and chain rebases to `task` subagents, or fast-forward and cherry-pick verified commits directly when local git operations are fast. |
| Sub-coordinator | Background `task` subagent, one per track when a track exceeds roughly ten concurrent workers | Own the track's units, author worker briefs, maintain a rolling window of up to ten active children, and return aggregated rollups at wave boundaries. |
| Worker | `task` subagent with one exclusive worktree or branch ([Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md)) | Implement the scoped change, run local checks, and report the branch, head SHA, and results. |
| Verifier | `task` subagent on a different model family from the worker | Run expensive, judgment-heavy, or high-impact verification against acceptance criteria and report a verdict for `ledger.tsv`. |

#### Store layout

Create `orchestrate/<project-slug>/` in the session workspace.
Give each file a single writer that publishes facts while readers aggregate at read time.
Keep every file in plain Markdown, TSV, or JSON so it remains readable without custom tooling.

| File or directory | Purpose | Update rule |
| --- | --- | --- |
| `preferences.md` | Numbered standing orders covering model policy, stack shape, verification bar, forbidden paths, and escalation policy | Append a line whenever you repeat a correction ([Encode Lessons in Structure](../references/principle-encode-lessons-in-structure.md)). |
| `overview.md` | Durable log of pull requests and issues created during the program | Append new entries as pull requests and issues are created. |
| `units.tsv` | Unit tracking table (`id`, `track`, `state`, `branch`, `pr`, `head_sha`, `brief_path`) | Update rows in place at drain points. |
| `frontier.json` | Computed merge frontier (ordered pull request list, branch names, head SHAs, generation number, and lowest unmerged pull request) | Recompute after every merge or stack change. |
| `ledger.tsv` | Verification ledger keyed by pull request number and head SHA | Append one row per verification verdict. |
| `inbox/` | Completion pointer files (`agent`, `unit`, `status`, `report_path`) | Write on subagent completion and clear at each drain. |
| `gates.md` | Open user questions with options and default actions | Record before asking the user and clear when resolved. |
| `decisions.tsv` | Program decision log ([`show-me-your-work`](../../show-me-your-work/SKILL.md)) | Append a row for each significant decision or audit pass. |
| `status.md` | Human-readable program status summary | Regenerate from `units.tsv` and `ledger.tsv` at each drain. |

#### The brief

Include every field below when spawning a worker subagent.
If you cannot fill a field, finish scoping the unit before spawning the worker.

```text
GOAL         One sentence stating the outcome so an agent with no chat history can execute it
SCOPE        Paths this unit may edit, paths it must leave untouched, and its exclusive worktree or branch
CONTEXT      File and PR pointers, plus full upstream reports when this unit depends on them
ACCEPTANCE   Checkable criteria, one per line
VERIFY       Exact verification commands or verification skill path, plus known pitfalls
TIMEBOX      Runtime limit after which the worker returns partial findings and stops
FORBIDDEN    No PR retargets, merges, rebases, force-pushes, or out-of-scope edits, plus unit-specific bans
REPORT       Status, branch, head SHA, PRs, verdict, commands run, deviations, and follow-up items
STANDING     <preferences.md pasted verbatim, or store path on initial spawn>
```

Size the brief to the unit.
For a one-command unit, collapse the template to a single paragraph that names the goal, scope, verification command, and report format.
Reference `preferences.md` by path on initial `task` spawns if needed, and paste `preferences.md` verbatim on every `write_agent` continuation.

When spawning a sub-coordinator, include its track boundary, unit list, rolling concurrency cap, drain protocol, and rollup format (one line per child with name, status, pull request, head SHA, and verdict, plus track status and frontier changes).
Paste upstream reports into dependent briefs so downstream workers have complete context.
Audit one sampled worker brief per sub-coordinator during each wave, and if a brief is incomplete, update the sub-coordinator's instructions before refilling its wave.
Spawn a fresh subagent with consolidated scope whenever a brief changes.

#### Steps

1. Define the exit condition as a countable predicate, such as "all 126 units merged with `unit-test-verified` or higher in `ledger.tsv`."
   Estimate the unit count, stack layout, and wall-clock budget.
   If a single agent can finish the work within that budget, stop here and run [Autonomous run](./autonomous-run.md) directly in this session.
   Reserve the last 30% of the budget to stop spawning new units and land verified work.
   If the track decomposition or architecture has competing shapes, run the [`arena`](../../arena/SKILL.md) skill before the pilot.
   Present the framing to the user and begin local, reversible preparation.
2. Create `orchestrate/<project-slug>/` and its store files.
   Start `decisions.tsv` using the [`show-me-your-work`](../../show-me-your-work/SKILL.md) skill, write `preferences.md` before spawning any subagent, and initialize `frontier.json` from existing pull requests.
3. Run one pilot unit through the entire lifecycle: brief, worker, verification, stack entry, ledger row, and merge preparation.
   Use the pilot results to fix gaps in the brief template, verification recipe, or unit sizing before fanning out.
   When a program consists of cheap, near-identical units, run the first unit with inline verification as the pilot and fan out as soon as it succeeds.
4. Maintain a rolling window of active workers up to the concurrency cap, refilling slots as workers finish.
   Spawn track sub-coordinators only when active workers exceed what one coordinator drain can process.
   Recompute ready units after each drain and copy upstream outputs into downstream briefs.
5. Process `inbox/` in batches at each drain point using the queue rules below.
6. Integrate verified units continuously alongside active waves.
   Keep the lower stack green before advancing upper links.
   Update `frontier.json` whenever a pull request merges or reports a new head SHA.
7. Drain the final `inbox/`, reconcile every spawned subagent to a terminal state (`done`, `abandoned`, or `zombie-reconciled`), verify the exit predicate on the real artifact, and confirm that every landed pull request has a ledger verdict matching its final head SHA.
   Review `decisions.tsv` per [`show-me-your-work`](../../show-me-your-work/SKILL.md) (using [`council`](../../../skills/council/SKILL.md) for cross-model review when warranted), record recurring lessons in `preferences.md`, and leave the store directory intact as the postmortem record.

#### Queue and drain

- When a subagent finishes, write a pointer file to `inbox/` (`agent`, `unit`, `status`, `report_path`) and finish your current critical section before draining.
- Complete critical sections before starting a drain: authoring a brief, mutating a stack, resolving a conflict, recording a user gate, or updating `ledger.tsv` and `frontier.json`.
- Drain `inbox/` at four points: after finishing a critical section, at a track rollup, when a background watcher subagent reports a frontier event, and before reporting to the user.
- In each drain, read and clear `inbox/`, classify each pointer (`landed`, `needs-verify`, `failed`, `zombie`, or `noise`), update `units.tsv` and `ledger.tsv`, regenerate `status.md`, and spawn the next wave of ready units.
- If a completion requires code or behavior review, spawn a verifier unit to inspect the diff and test the change.
- Account for every spawned child at each track rollup as completed, respawned, or absorbed into another unit.
- End each drain turn with a three-line summary stating state counts, what changed, and open user gates.

#### Stack safety

- Recompute `frontier.json` after every merge and stack change to record the ordered pull request list, branch names, head SHAs, generation number, and lowest unmerged pull request.
- Query `gh pr` to read pull request chain order and state, and read local branch refs in the stacker's checkout to resolve head SHAs.
- Treat any work branch without an associated pull request as an error to fix before restacking.
- Assign exactly one stacker per stack in `preferences.md` to serialize chain rebases, force-pushes, base retargets, and merges ([Separate Before Serializing Shared State](../references/principle-separate-before-serializing-shared-state.md)).
- Have workers report merge conflicts to the stacker instead of rebasing, retargeting, closing, or merging pull requests themselves.
- Route all pull request closures and base retargets through the stacker so upper branches are never orphaned.
- Run a background watcher subagent to monitor merged pull requests for reverts, post-merge CI failures, and follow-up issues.

#### Verification

Scale verification to the unit's risk and cost.
When `VERIFY` is a single fast command, have the worker run it and return the output for the coordinator to spot-check.
When verification is expensive, judgment-heavy, or high-impact, spawn a dedicated verifier subagent on a different model family from the worker ([Prove It Works](../references/principle-prove-it-works.md)).

Check the pull request's current head SHA with `gh pr view <pr> --json headRefOid` before trusting any row in `ledger.tsv`.
Record one row per verdict in `ledger.tsv`, keyed by pull request number and head SHA, using the values below:

| Verdict | Meaning | Next action |
| --- | --- | --- |
| `live-ui-verified` | Verified on the live target surface | Land the pull request when CI passes. |
| `unit-test-verified` | Verified by unit or integration tests | Land non-UI changes when CI passes. |
| `type-check-only` | Checked only by static types or build | Run runtime or test verification for any behavioral change. |
| `verifier-blocked` | Verification blocked by an environment issue | Respawn verification once the environment recovers. |
| `verifier-failed` | Verification found a defect | Spawn a fix unit to repair the branch. |

If both a worker and a verifier record a row for the same pull request and head SHA, the verifier's row takes precedence.
When a rebase or fix changes a pull request's head SHA, re-verify the new head SHA.
Require workers to push their branches and verifiers to write `ledger.tsv` rows and receipts immediately upon completion.

#### Liveness and failure

- Check subagent liveness through read-only side effects (`ledger.tsv`, `units.tsv`, `gh pr`, and pushed git branches) because calling `write_agent` wakes an idle subagent.
- When a subagent stops producing side effects past its timebox, record a synthetic failure pointer in `inbox/` (`unit`, `failure_mode`, `last_evidence`, `options`) and replan immediately.
- Handle subagent failures by failure mode:

| Failure mode | Recovery action |
| --- | --- |
| Context limit or out-of-memory | Respawn the unit in a fresh subagent with smaller scope. |
| Network drop | Retry the unit with the same brief. |
| Tool error | Retry the unit on a different model. |
| Unknown failure | Retry once, and after two failed retries mark the unit `abandoned` and replan around it. |

- If a late subagent reports back after being replaced, reconcile its output against `frontier.json` and `ledger.tsv` and extract any useful findings through a fresh unit.
- If a broken upstream change, invalid acceptance check, or infrastructure outage threatens all active work, add a stop rule to the top of `preferences.md`, let in-flight units finish, fix the root cause, and then remove the stop rule.
- If your own tools fail repeatedly, write a handoff note to the store stating what completed, where branches live, and how to resume, then stop the run.
- When resuming after a session interruption, read `preferences.md` and `units.tsv`, recompute `frontier.json`, reattach surviving work by pull request and branch, and spawn fresh subagents from stored briefs.

#### Escalation

Batch user escalations into `gates.md` and `status.md`, and continue non-blocked work around open gates.
Preserve explicit user approval gates before pushing commits, opening pull requests, or merging unless the user pre-authorized those actions for the program.

| Category | Handling | Examples |
| --- | --- | --- |
| Escalate to the user | Record an entry in `gates.md` with options and a recommended default, and include it in the status report. | Remote pushes and pull request actions not pre-authorized, force-pushes to shared branches, deployments, deletions, closing another author's pull request, product or preference decisions no experiment can settle, standing orders that conflict with reality, and unrecoverable blockers. |
| Handle autonomously | Execute the action and log the decision in `decisions.tsv`. | Frontier updates, stack rebases, subagent retries, CI flake triage, review-thread triage, formatting fixes, and rejecting out-of-scope edits. |

During a run, fix only mid-run discoveries that block the merge frontier, and record all other findings as follow-up items in `overview.md`.

**Reply:** At checkpoints and program close, report the exit predicate and progress counts from `units.tsv` and `ledger.tsv`, track summaries, the current frontier with clickable pull request links and head SHAs, verification verdicts, abandoned units with reasons, open user gates from `gates.md`, the store path, and the `decisions.tsv` path.
