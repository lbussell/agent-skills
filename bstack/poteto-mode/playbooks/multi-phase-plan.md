### Multi-phase or multi-PR plan

Run this playbook to produce an executable checklist for work that spans multiple phases or stacked pull requests.
Deliver the written plan and wait for explicit user approval before starting implementation.

1. If the change touches only one or two files with a straightforward approach, tell the user that a multi-phase plan is unnecessary and stop.
2. Settle open technical or behavioral questions with the [Prototype](./prototype.md) playbook before writing the plan.
   Record the branch, commit SHA, and screenshots for Appendix A.
   Follow [Never Block on the Human](../references/principle-never-block-on-the-human.md) and ask the user only about product or preference decisions that an experiment cannot settle.
3. Delegate codebase exploration to `task` subagents (`agent_type: "explore"`) to follow [Guard the Context Window](../references/principle-guard-the-context-window.md).
   Have each subagent return file paths, repository conventions, test commands, and entry points as concise summaries.
4. Copy the plan template below into the plan file and fill every placeholder.
   Unless the user specifies a path, write the plan under `docs/` in the session workspace.
   Keep every heading and sub-block in the template order.
   Give each pull request its own section and verification evidence following [Sequence Work into Verifiable Units](../references/principle-sequence-verifiable-units.md).
   Name the execution playbook in **How to read this** using [Autopilot-full](./autopilot-full.md), [Autopilot-stack](./autopilot-stack.md), or [Orchestrate](./orchestrate.md).
5. Apply the [`technical-writing`](../../technical-writing/SKILL.md) and [`unslop`](../../unslop/SKILL.md) skills to the plan.
   Write the plan body as a procedural how-to guide and put explanations and reference material in the appendices.
   State the task or finding clearly in each heading.
6. Check the finished plan against the template to confirm that every placeholder is filled, every heading is in order, and every pull request section includes verification and merge blocks ([Encode Lessons in Structure](../references/principle-encode-lessons-in-structure.md)).
7. Present the plan path to the user and stop until the user approves execution.

#### Verification requirements

Follow [Prove It Works](../references/principle-prove-it-works.md): mark a pull request verified only when its unit, live, and performance checks all pass.
Include every verification block below in each pull request section:

| Block | Requirement |
| --- | --- |
| `Verify, unit` | Name the test file, the test cases added, and the exact command to run. |
| `Verify, live` | Fan out ten independent `task` verifier subagents at the pull request head to exercise the real surface through the project's verification skill or harness. |
| Regression lane | Dedicate Lane 1 of `Verify, live` to running the primary scenario on both trunk and head. If trunk lacks the feature, record that fact and verify the new behavior and final user-visible state on head. |
| `Verify, perf` | Define the metric, an interleaved probe run on both trunk and head, the trunk baseline measured first, and the numeric threshold that fails the check. When trunk lacks the feature, set an absolute budget for the diff-added work and final user-visible state. |
| `Review gate` | If the pull request changes a user interaction, capture screenshots and a 30 to 60 second video for user review before merge. When no interaction changes, write `None (<PR id> is not review-gated)`. |

If a pull request touches two surfaces, include live verification lanes for both surfaces.
If a surface has no verification skill or harness, record that risk in Appendix C and specify the steps each live lane runs to exercise the surface.

#### Plan template

````markdown
# <Program> plan

<Summarize in under ten lines what changes, who it affects, the rule the program enforces, and the ordered pull request IDs.>

## How to read this

Each checkbox represents one unit of work and names the evidence required to check it, such as a file path, log line, screenshot, test run, or commit SHA.
Check a box only after you produce and verify its evidence.
The body is a procedural checklist, and the appendices hold background explanations and reference records.

This program runs `bstack/poteto-mode/playbooks/<execution playbook>.md`.
<State who merges each pull request and which pull request IDs pause at merge-ready for user review.>

A pull request is verified only when its unit, live, and performance checks are all checked.

## Program checklist

### Arm the program

- [ ] Present this plan to the user and wait for explicit approval before starting execution.
- [ ] Read these files from trunk at program start and re-read them during each audit pass:
  - [ ] `git show origin/main:bstack/poteto-mode/playbooks/<execution playbook>.md`
  - [ ] `git show origin/main:<verification skill path>`
  - [ ] `git show origin/main:bstack/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:bstack/<each additional skill the program uses>`
- [ ] When the user approves execution, run periodic audit passes until all delegated work completes.
- [ ] During each audit pass, re-read the execution playbook, verify active subagents by their side effects, replace any stalled subagent, log a row in the decision trail, and post a short status update only when tracked state changed.
- [ ] If the user issues a hold or stop, instruct every active owner to stop writing immediately.

### Spawn owners

- [ ] Spawn one owner subagent per pull request following the execution playbook lifecycle.
- [ ] Follow this dependency graph, starting dependent work only after its parent merges or branching from the parent branch when stacking:
  - [ ] <PR id> and <PR id> branch independently from `main`.
  - [ ] <PR id> depends on <PR id>.
- [ ] Enforce file boundaries so <PR id or group> edits only `<glob>`.
- [ ] Enforce the review gate so <PR ids> pause for user review with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Use `gh pr` for all pull request operations.
- [ ] Complete and verify the change locally first, then get user approval before pushing or opening the pull request per `bstack/poteto-mode/playbooks/opening-a-pr.md`.
- [ ] Run the repository's lint and typecheck commands locally before pushing with git hooks enabled.
- [ ] Remove unnecessary code comments and apply `bstack/unslop/SKILL.md` before requesting review.
- [ ] Triage every automated review comment by fixing real defects and replying to false positives with a concrete technical reason.
- [ ] Rebase onto current trunk before reporting code-ready, and keep that merge base during fix rounds unless trunk conflicts or causes a CI failure.

### Verdict and merge, for every PR

- [ ] Fan out independent `task` verifier subagents once at the code-ready head: one gates lane, the ten live lanes from **Verify, live**, the performance lane from **Verify, perf**, and two or more diff audit lanes.
- [ ] Run another full verifier fan-out only if the branch adds new behavior, a redesign, or a large diff.
- [ ] Use a single verifier subagent after a rebase, conflict resolution, or minor fix.
- [ ] Audit the verification receipts before issuing a clean verdict.
- [ ] Mark the verdict clean only when every lane passes, and send any defect back to the owner.
- [ ] Require a fresh verdict for any new head SHA unless prior lane results remain valid under the patch-id rule in `bstack/poteto-mode/playbooks/shipping.md`.
- [ ] <State the merge or stack-append rule from the execution playbook.>

### Boot recipe, for every live lane

Run each live lane in an independent `task` subagent at the pull request head:

- [ ] Run `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] <Start the backend and target surface, and wait until ready.>
- [ ] <Drive the surface through the project's verification skill or harness and collect read-only diagnostics.>
- [ ] Save every screenshot to `<scratch-dir>/verify-<pr-id>/lane-<n>/<slug>.png` and return the file paths in the lane report.

## <Task as a verb phrase> (<PR id>)

**Depends on:** <PR id, or None>

**Files:**

- [ ] Edit `<path>`.
- [ ] Create `<path>`.
- [ ] Delete `<path>`.

**Build:**

- [ ] <Describe one change, naming the symbol and file path.>

**You see:**

- [ ] <Describe one observable result with the exact log line or screen state.>

**Verify, unit:**
A pull request is verified only when its unit, live, and performance boxes are all checked.

- [ ] <Name the test file and added test case, and run `<command>`.>

**Verify, live:**
A pull request is verified only when its unit, live, and performance boxes are all checked.
Fan out ten independent `task` verifier subagents at the pull request head using the boot recipe.

- [ ] Lane 1 (regression lane against trunk): Run <the primary scenario> on trunk and head (or if trunk lacks the feature, record that fact and verify <the new behavior and final user-visible state> on head), save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 2: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 3: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 4: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 5: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 6: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 7: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 8: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 9: Run <scenario>, save `<slug>.png`, and pass when <predicate>.
- [ ] Lane 10: Run <scenario>, save `<slug>.png`, and pass when <predicate>.

**Verify, perf:**
A pull request is verified only when its unit, live, and performance boxes are all checked.

- [ ] Metric: <Define what is measured on trunk and head, or the diff-added work and end-to-end state when trunk lacks the feature.>
- [ ] Probe: <Specify the command or procedure run interleaved on trunk and head.>
- [ ] Baseline: <Record the trunk baseline measurement first.>
- [ ] Rule: <State the numeric threshold that fails the check.>

**Review gate:**
The user reviews interaction changes before merge.

- [ ] Copy lane <n> screenshots to `<media path>/<pr-id>-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the change and save it to `<media path>/<pr-id>-review.mp4`.
- [ ] Present the screenshots and video to the user, pause at merge-ready, and wait for user approval.

**Merge:**

- [ ] Confirm a clean verification verdict at the exact head SHA.
- [ ] Confirm all automated review comments are triaged.
- [ ] Rebase onto current trunk after the verdict with `git patch-id` unchanged.
- [ ] <Merge the pull request after user approval, or append it to the stack per the execution playbook.>

## Close the program

- [ ] Confirm that every checkbox above is checked with its evidence.
- [ ] Report the final program summary required by the execution playbook.

## Appendix A: Prototype evidence

<List each question settled by a prototype with its branch, commit SHA, and artifact links, followed by any questions that remain open.>

## Appendix B: Alternatives rejected

<List each alternative design considered and the technical reason it was rejected.>

## Appendix C: Risks

<List each risk, the pull request where it applies, and the signal the owner monitors.>

## Appendix D: Links and reading list

<List reference documents to read before editing, which pull requests require [`how`](../../how/SKILL.md) or [`council`](../../../skills/council/SKILL.md), and the decision log path for [`show-me-your-work`](../../show-me-your-work/SKILL.md).>
````

**Reply:** Report the plan file path, the pull request IDs with their dependencies and review-gate status, what prototypes proved, and any open questions that require a user decision.
