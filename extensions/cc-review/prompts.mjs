export const ANGLES = {
    "line-scan": {
        title: "Line-by-line diff scan",
        kind: "correctness",
        text: `Read every hunk in the diff, line by line.
Then read the enclosing function for each hunk.
Bugs in unchanged lines of a touched function are in scope, because the change re-exposes them or fails to fix them.
For every line, ask what input, state, timing, or platform makes the line wrong.
Look for inverted or wrong conditions, off-by-one errors, null or undefined dereferences, missing \`await\`, falsy-zero checks, wrong-variable copy-paste, errors swallowed in a catch, and unescaped regex metacharacters.`,
    },
    "removed-behavior": {
        title: "Removed-behavior audit",
        kind: "correctness",
        text: `For every line that the diff deletes or replaces, name the invariant or behavior that the line enforced.
Then search the new code for the place that re-establishes that invariant.
If you can't find it, report a candidate: a removed guard, a dropped error path, a narrowed validation, or a deleted test that covered a real case.`,
    },
    "cross-file": {
        title: "Cross-file trace",
        kind: "correctness",
        text: `For each function that the diff changes, search for its callers.
Check whether the change breaks a call site: a new precondition, a changed return shape, a new exception, or a timing or ordering dependency.
Also check the callees: does another change in the same diff make a call unsafe?`,
    },
    "language-pitfalls": {
        title: "Language pitfalls",
        kind: "correctness",
        text: `Scan for the classic pitfalls of the diff's language and framework.
Examples: JavaScript falsy-zero, \`==\` coercion, and closures that capture a loop variable; Python mutable default arguments and late-binding closures; Go nil-map writes and range-variable capture; SQL injection; time zone and DST drift; float equality.
Report each instance that the diff introduces.`,
    },
    wrapper: {
        title: "Wrapper and proxy correctness",
        kind: "correctness",
        text: `Apply this angle when the diff adds or changes a type that wraps another type, such as a cache, proxy, decorator, or adapter.
Check that every method routes to the wrapped instance, not back through a registry, session, or global.
For example, a caching provider that holds a \`delegate\` field but resolves IDs with \`session.get(...)\` instead of \`delegate.get(...)\` re-enters the cache or recurses.
Also check that the wrapper forwards every method that its callers use.
If the diff has no wrapper types, return no findings.`,
    },
    reuse: {
        title: "Reuse",
        kind: "cleanup",
        text: `Report new code that re-implements something the codebase already has.
Search shared and utility modules and the files next to the change.
Name the existing helper to call instead.`,
    },
    simplification: {
        title: "Simplification",
        kind: "cleanup",
        text: `Report unnecessary complexity that the diff adds: redundant or derivable state, copy-paste with small variations, deep nesting, and dead code left behind.
Name the simpler form that does the same job.`,
    },
    efficiency: {
        title: "Efficiency",
        kind: "cleanup",
        text: `Report wasted work that the diff introduces: redundant computation, repeated I/O, independent operations that run in sequence, and blocking work added to startup or hot paths.
Also report long-lived objects built from closures or captured environments.
These objects keep the whole enclosing scope alive, which leaks memory when that scope holds large values.
Prefer a class or struct that copies only the fields it needs.
Name the cheaper alternative.`,
    },
    altitude: {
        title: "Altitude",
        kind: "altitude",
        text: `Check that each change fixes the root cause at the right depth instead of patching a symptom.
Special cases added to shared infrastructure are a sign that the fix is not deep enough.
When a simpler, more general change to the underlying mechanism would remove the special case, name that change.`,
    },
    conventions: {
        title: "Conventions",
        kind: "conventions",
        text: `Find the instruction files that govern the changed code:
- \`AGENTS.md\` at the repository root and in each ancestor directory of a changed file.
  An \`AGENTS.md\` file applies only to files at or below its directory.
- \`.github/copilot-instructions.md\`.
- \`.github/instructions/*.instructions.md\` files whose \`applyTo\` glob matches a changed file.

Read each file that exists, then check the diff for clear violations of the rules that the file states.
Report a violation only when you can quote the exact rule and the exact line that breaks it.
Do not report style preferences or inferences from the "spirit" of a file.
In the finding, name the instruction file path and quote the rule.
If no instruction file applies, return no findings.`,
    },
};

export const MAX_ANGLES = Object.keys(ANGLES);

export const BASE_ANGLES = MAX_ANGLES.filter((id) => id !== "language-pitfalls" && id !== "wrapper");

export const KINDS = [...new Set(Object.values(ANGLES).map((a) => a.kind))];

const oneLine = (text) => text.replace(/\s+/g, " ").trim();

const FINDING_ITEM_FIELDS = `Each finding has these fields:
- \`file\`: repository-relative path.
- \`line\`: 1-based line number in the new version of the file.
  For deleted code, use the nearest surviving line in the same hunk.
  Use \`0\` only for a deleted file or a file-wide issue.
- \`summary\`: one sentence that states the problem.
- \`failure_scenario\`: for \`correctness\`, the concrete inputs or state and the wrong output or crash that results.
  For other kinds, the concrete cost: what is duplicated or wasted, what becomes harder to maintain, or which rule is broken.
- \`kind\`: ${KINDS.map((k) => `\`${k}\``).join(", ")}.
- \`severity\`: \`high\` for a crash, data loss or corruption, a security flaw, a broken caller contract, or a major hot-path stall; \`medium\` for wrong behavior on a reachable edge case, significant waste or duplication, or a clear rule violation; \`low\` for a minor local defect or cleanup.`;

const FINDING_FIELDS = `Return \`{ "findings": [...] }\`.
Return \`{ "findings": [] }\` when you have no findings.
Do not return a placeholder finding.
${FINDING_ITEM_FIELDS}`;

const SINGLE_REVIEW_FIELDS = `Return \`{ "scope": "...", "empty": false, "findings": [...] }\`.
Set \`scope\` to one or two sentences describing what you reviewed (target, base, and whether uncommitted or untracked changes were included).
If there is nothing to review, set \`empty\` to \`true\` and \`findings\` to \`[]\`.
Otherwise, set \`empty\` to \`false\`, and return \`findings: []\` when you have no findings.
Do not return a placeholder finding.
${FINDING_ITEM_FIELDS}`;

function scopeBlock(scope) {
    const source = scope.local
        ? `The working tree contains the reviewed version of each file, so you can read files from disk.`
        : `The working tree does not contain the reviewed version.
Read files with \`git --no-pager show ${scope.head}:<path>\` instead of reading them from disk.`;
    return `## Review scope

${scope.description}

These commands print the diff under review:

\`\`\`
${scope.commands}
\`\`\`

\`git diff --no-index\` exits with code 1 when it finds differences.
That exit code is expected.

${source}

This review is read-only.
Do not modify files, branches, the index, or other git state.
Pass \`--no-pager\` to every \`git\` command.`;
}

const DEFAULT_BASE = `Find the merge base of \`HEAD\` and the default branch (\`origin/HEAD\`, falling back to \`origin/main\`, then \`main\`).
Do not use \`@{upstream}\`: for a pushed feature branch it hides the branch's own commits.`;

function targetRules(target) {
    if (!target) {
        return `No target was given.
Review the current branch plus uncommitted and untracked changes:
- ${DEFAULT_BASE}
- If there are uncommitted changes to tracked files, run \`git --no-pager diff <base>\`.
  This shows committed and uncommitted changes in one diff.
- Otherwise, run \`git --no-pager diff <base> HEAD\`.
- Also include each untracked file that \`git ls-files --others --exclude-standard\` lists.
  Diff each one with \`git --no-pager diff --no-index /dev/null <path>\`.`;
    }
    return `The user asked to review: \`${target}\`.
Follow that request literally; do not widen the scope to the whole branch when the user asked for a narrower slice.
Match the target to the right diff:
- Uncommitted or working-tree changes: run \`git --no-pager diff HEAD\`, plus each untracked file that \`git ls-files --others --exclude-standard\` lists (\`git --no-pager diff --no-index /dev/null <path>\`).
  Do not include committed branch changes.
- Staged changes: run \`git --no-pager diff --cached\`.
- Pull request number or URL: run \`gh pr view <pr> --json baseRefName,headRefOid\` to get the base branch and head commit.
  Run \`git fetch origin <baseRefName>\` so that \`origin/<baseRefName>\` is current.
  If \`HEAD\` is the head commit, diff from the merge base of \`origin/<baseRefName>\` and \`HEAD\`.
  Otherwise, run \`git fetch origin pull/<number>/head\`, then diff from the merge base of \`origin/<baseRefName>\` and \`FETCH_HEAD\`.
  Fetching does not change the working tree or any branch.
- Branch: diff from the merge base of the default branch and the branch to the branch.
- Commit or commit range: diff that commit (\`git --no-pager diff <sha>~1 <sha>\`) or range (\`git --no-pager diff <range>\`).
- File or directory path: use the branch-plus-uncommitted diff limited to that path.
  ${DEFAULT_BASE}
  Pass \`-- <path>\` to \`git --no-pager diff <base>\` (or \`<base> HEAD\`), and include only untracked files under that path.
- Any other description (for example "last 2 commits" or "uncommitted changes in src/"): run the matching read-only \`git diff\` command.`;
}

function gatherScopeBlock(target) {
    return `## Review scope

${targetRules(target)}

\`git diff --no-index\` exits with code 1 when it finds differences.
That exit code is expected.
If the reviewed revision is not checked out in the working tree, read files with \`git --no-pager show <sha>:<path>\` instead of reading them from disk.
This review is read-only.
Do not modify files, branches, the index, or other git state.
Pass \`--no-pager\` to every \`git\` command.`;
}

export function scopePrompt(target) {
    return `Determine the scope of a read-only code review.
Do not review the code yet.
Do not modify files, branches, the index, or other git state.
Pass \`--no-pager\` to every \`git\` command.

${targetRules(target)}

Other agents run your \`commands\` later, and a fetch can move a ref in the meantime.
In \`commands\`, write every commit as a full SHA.
Do not use \`FETCH_HEAD\`, \`origin/...\`, branch names, or \`$(...)\` substitutions.
\`HEAD\` is allowed only when the scope includes uncommitted changes.

Run each \`git diff\` command with \`--stat\` added to confirm its output without printing the whole diff.
Return an object with these fields:
- \`description\`: one or two sentences that name the target, the base, and whether the scope includes uncommitted or untracked changes.
- \`commands\`: the exact shell commands, one per line, that print the complete unified diff under review.
  Do not include \`--stat\` here.
  Use \`""\` when \`empty\` is \`true\`.
- \`head\`: the full commit SHA of the reviewed version, or \`HEAD\` when the scope includes uncommitted changes.
- \`local\`: \`true\` when the working tree contains the reviewed version of every changed file; otherwise \`false\`.
- \`empty\`: \`true\` when there is nothing to review; otherwise \`false\`.`;
}

export function lowPrompt(target, cap) {
    return `${gatherScopeBlock(target)}

## Read

Gather the unified diff, then review only the diff hunks.
Skip test and fixture hunks (\`test/\`, \`spec/\`, \`__tests__/\`, \`*_test.*\`, \`*.test.*\`, \`fixtures/\`, \`testdata/\`).
This level does not review test changes.
Do not start subagents, and do not read full files.

## Find

Report runtime-correctness bugs that the hunk alone shows: inverted or wrong conditions, off-by-one errors, null or undefined dereferences where adjacent lines show the value can be absent, removed guards, falsy-zero checks, missing \`await\`, wrong-variable copy-paste, and errors swallowed in a catch that should propagate.
Use \`kind: "correctness"\` for these.
Also report new code that duplicates a helper visible in the diff context, and dead code that the diff leaves behind.
Use \`kind: "cleanup"\` for these.
Do not report style, naming, performance, missing tests, or anything outside the hunk.

If your first pass finds fewer than ${cap} issues, do one more pass over the largest changed file and any removed code blocks.
Report only real defects.
Do not pad the list.
Return at most ${cap} findings, most severe first.

${SINGLE_REVIEW_FIELDS}`;
}

const STANCE = {
    precision: `Report only issues that a maintainer would act on.
Leave out a candidate when you can't name a concrete failure or cost.`,
    recall: `Catch every real bug that a careful reviewer would catch.
Missing a real bug costs more than reporting a false positive.
Include a candidate when you can name a concrete failure scenario, even if you are not sure that it triggers.`,
};

export function inlinePrompt(target, angleIds, perAngle, stance, cap) {
    const angles = angleIds
        .map((id, i) => `### ${i + 1}. ${ANGLES[id].title} (\`kind: "${ANGLES[id].kind}"\`)\n\n${ANGLES[id].text}`)
        .join("\n\n");
    return `You are reviewing a code change.
${STANCE[stance]}

${gatherScopeBlock(target)}

## Check each angle

Work through these ${angleIds.length} angles yourself, one at a time.
Do not start subagents.
Find up to ${perAngle} candidates for each angle.
Do not skip a candidate because another angle already found something on the same line.
For correctness angles, follow the guidance at the top.
For cleanup, altitude, and conventions angles, report a candidate only when you can name a concrete cost or quote an exact rule violation.

${angles}

## Report

Combine the candidates from all angles.
Two candidates are duplicates when they describe the same defect or cost.
For each group of duplicates, keep the one with the most concrete failure scenario.
Return at most ${cap} findings, most severe first.
Put correctness bugs before other kinds.
Do not invent findings to fill the list.

${SINGLE_REVIEW_FIELDS}`;
}

export function finderPrompt(scope, angleId, perAngle) {
    const angle = ANGLES[angleId];
    const guidance =
        angle.kind === "correctness"
            ? `${STANCE.recall}\nA verifier checks each candidate.`
            : `Report a candidate only when you can name a concrete cost or quote an exact rule violation.`;
    return `You are one of several code reviewers.
Each reviewer covers one angle.

${scopeBlock(scope)}

## Your angle: ${angle.title}

${angle.text}

## Report

${guidance}
Report up to ${perAngle} candidates from this angle only.
Do not skip a candidate because another angle might also catch it.
Set \`kind\` to \`${angle.kind}\`.

${FINDING_FIELDS}`;
}

export function dedupPrompt(candidates, lockedCount = 0) {
    const list = candidates
        .map((c, i) => `${i}. \`${c.file}:${c.line}\` [${c.kind}/${c.severity}] ${oneLine(c.summary)} Scenario: ${oneLine(c.failure_scenario)}`)
        .join("\n");
    const locked = lockedCount
        ? `\nCandidates 0 to ${lockedCount - 1} are already verified.
Never drop one of them.
When a later candidate duplicates one of them, drop the later candidate.\n`
        : "";
    return `Find duplicates in this list of code review candidates.
Each candidate is one line that starts with its index.
Two candidates are duplicates when they describe the same underlying defect or cost, even at different lines in the same flow.
For example, a removed guard and the dereference that it protected are one defect.
Two candidates that flag the same line for different reasons are not duplicates.
Do not judge whether a candidate is correct.
Do not read any files.
${locked}
${list}

For each group of duplicates, keep the candidate with the most concrete failure scenario.
Break ties by \`correctness\` before other kinds, then by higher severity.
Return \`{ "drop": [{ "index": <number>, "duplicateOf": <number> }, ...] }\`.
List each dropped candidate with the index of the candidate that you keep in its place.
Return \`{ "drop": [] }\` when there are no duplicates.`;
}

const VERDICTS = {
    correctness: `- \`CONFIRMED\`: you can trace concrete inputs or state through the code to a wrong output, crash, or data corruption.
- \`PLAUSIBLE\`: the mechanism exists in the code and a realistic state triggers it.
Use this verdict by default.
Do not refute a candidate because it is speculative or depends on runtime state when that state is realistic.
Examples: concurrency races, null or undefined on a rare but reachable path (an error handler, a cold cache, a missing optional field), falsy-zero treated as missing, off-by-one on a boundary that the code does not exclude, retry storms or partial failures, and a regex or allowlist that lost an anchor.
- \`REFUTED\`: only when you can show it from the code.
The code contradicts the claim, a type, constant, or invariant makes the path impossible, or a guard in the diff or the surrounding code handles it.`,
    other: `- \`CONFIRMED\`: for \`conventions\`, the quoted rule exists in an instruction file that governs the path, and the quoted line violates it.
For \`cleanup\` or \`altitude\`, the duplication, dead code, waste, or symptom patch exists as described, and the named alternative keeps the required behavior.
- \`PLAUSIBLE\`: the cost is credible from the diff, but full confirmation depends on workload or callers outside the diff.
State the assumption.
- \`REFUTED\`: the helper, rule, or redundancy does not exist, the instruction file does not govern the path, the simpler form changes required behavior, or the claim is a style preference that no rule states.`,
};

export function verifyPrompt(scope, candidate) {
    const verdicts = candidate.kind === "correctness" ? VERDICTS.correctness : VERDICTS.other;
    return `Verify one code review candidate.

${scopeBlock(scope)}

## Candidate

- Location: \`${candidate.file}:${candidate.line}\`
- Kind: ${candidate.kind}
- Summary: ${candidate.summary}
- Failure scenario or cost: ${candidate.failure_scenario}

Start with the diff for \`${candidate.file}\` and the code around line ${candidate.line}.
Read other files only when you need to trace callers, callees, or guards.
Then choose one verdict:

${verdicts}

Return \`{ "verdict": "...", "evidence": "..." }\`.
In \`evidence\`, quote the line that supports your verdict and explain your reasoning.`;
}

export function sweepPrompt(scope, known, refuted, cap) {
    const format = (list) =>
        list.length ? list.map((f) => `- \`${f.file}:${f.line}\` [${f.verdict}] ${oneLine(f.summary)}`).join("\n") : "(none)";
    return `You are a fresh code reviewer looking for defects that earlier reviewers missed.
${STANCE.recall}

${scopeBlock(scope)}

## Known findings

A verifier accepted each of these findings, except those marked \`UNVERIFIED\`.
The verifier for an \`UNVERIFIED\` finding failed, so treat that finding as unchecked: if it names the wrong line or mechanism, report the real defect.

${format(known)}

## Rejected candidates

A verifier rejected these candidates.
Do not report the same claim again.
If a rejected candidate pointed near a real defect but named the wrong line or mechanism, report the real defect.

${format(refuted)}

## Sweep for gaps

Read the diff and the enclosing functions again.
Look only for defects that the known findings do not cover.
Do not re-derive or re-confirm a known finding.
Focus on the defects that a first pass tends to miss:
- moved or extracted code that dropped a guard or anchor
- second-tier pitfalls, such as a dataclass default evaluated once, \`hash()\` non-determinism, a smaller lock scope, or a predicate method with side effects
- setup and teardown asymmetry in tests
- flipped configuration defaults

Report up to ${cap} new candidates.
If you find nothing new, return no findings.
Do not pad the list.

${FINDING_FIELDS}`;
}
