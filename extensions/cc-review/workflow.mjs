import {
    BASE_ANGLES,
    KINDS,
    MAX_ANGLES,
    dedupPrompt,
    finderPrompt,
    inlinePrompt,
    lowPrompt,
    scopePrompt,
    sweepPrompt,
    verifyPrompt,
} from "./prompts.mjs";

// mode "single": one agent reads only the diff.
// mode "inline": one agent runs every angle itself.
// mode "parallel": one agent per angle, then one verifier per candidate, then a gap sweep.
export const LEVELS = {
    low: { mode: "single", cap: 4 },
    med: { mode: "inline", angles: BASE_ANGLES, perAngle: 6, stance: "precision", cap: 8 },
    high: { mode: "inline", angles: BASE_ANGLES, perAngle: 6, stance: "recall", cap: 10 },
    max: { mode: "parallel", angles: MAX_ANGLES, perAngle: 8, sweep: 8, cap: 15 },
};

export const phasesFor = (mode) =>
    mode === "parallel" ? ["Scope", "Find", "Dedup", "Verify", "Sweep"] : ["Review"];

export function summarize(config) {
    const cap = `up to ${config.cap} findings`;
    switch (config.mode) {
        case "single":
            return `Single agent, no parallelism: reads only the diff, no verification, ${cap}`;
        case "inline": {
            const stance = config.stance === "precision" ? "reports only solid issues" : "reports anything plausible";
            return `Single agent, no parallelism: runs ${config.angles.length} review checks itself, ${stance}, ${cap}`;
        }
        case "parallel":
            return `${config.angles.length} parallel reviewers, then 1 parallel verifier per candidate, then a gap sweep, ${cap}`;
    }
}

// Models for each role. Roles not listed here use the runtime default.
const CHECKER_MODEL = { model: "gpt-6.2-sol", reasoningEffort: "high" };
const MECHANICAL_MODEL = { model: "gpt-6.1-terra", reasoningEffort: "high" };

const REPORT = [
    "Tell the user what `scope` describes.",
    "Report every note in `coverage`; each one explains how the review fell short.",
    "If `findings` is empty, say that the review found no issues.",
    "Otherwise, list `findings` in the given order.",
    "For each one, show `file:line` (omit `:line` when `line` is 0), `severity`, `kind`, `verdict` when present, `summary`, and `failure_scenario`.",
    "Do not review the code again or fix anything unless the user asks.",
].join("\n");

const strict = (properties) => ({
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
});

const scopeSchema = strict({
    description: { type: "string" },
    commands: { type: "string" },
    head: { type: "string" },
    local: { type: "boolean" },
    empty: { type: "boolean" },
});

const findingItems = strict({
    file: { type: "string" },
    line: { type: "integer" },
    summary: { type: "string" },
    failure_scenario: { type: "string" },
    kind: { type: "string", enum: KINDS },
    severity: { type: "string", enum: ["high", "medium", "low"] },
});

const findingsSchema = strict({
    findings: { type: "array", items: findingItems },
});

const singleReviewSchema = strict({
    scope: { type: "string" },
    empty: { type: "boolean" },
    findings: { type: "array", items: findingItems },
});

const dedupSchema = strict({
    drop: { type: "array", items: strict({ index: { type: "integer" }, duplicateOf: { type: "integer" } }) },
});

const verdictSchema = strict({
    verdict: { type: "string", enum: ["CONFIRMED", "PLAUSIBLE", "REFUTED"] },
    evidence: { type: "string" },
});

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };
const VERDICT_RANK = { CONFIRMED: 0, PLAUSIBLE: 1, UNVERIFIED: 2 };

// Correctness bugs outrank every other kind, as in the source recipes.
function rank(findings) {
    const kindRank = (f) => (f.kind === "correctness" ? 0 : 1);
    return [...findings].sort(
        (a, b) =>
            kindRank(a) - kindRank(b) ||
            (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3) ||
            (VERDICT_RANK[a.verdict] ?? 2) - (VERDICT_RANK[b.verdict] ?? 2),
    );
}

// Agents sometimes return a placeholder such as `{ file: "x", summary: "x" }` instead of an empty list.
const isReal = (f) => f.file.trim() !== "" && f.summary.trim().split(/\s+/).length >= 2;
const realFindings = (result) =>
    result?.findings
        .map((f) => ({ ...f, file: f.file.trim(), summary: f.summary.trim(), failure_scenario: f.failure_scenario.trim() }))
        .filter(isReal) ?? [];

// Returns the candidates to keep. The first `lockedCount` candidates are never dropped.
async function dedup(ctx, candidates, label, lockedCount = 0) {
    if (candidates.length - lockedCount < 1 || candidates.length < 2) return candidates;
    const result = await ctx.agent(dedupPrompt(candidates, lockedCount), { label, schema: dedupSchema, ...MECHANICAL_MODEL });
    if (!result) {
        ctx.log(`${label} failed; keeping all candidates.`);
        return candidates;
    }
    const inRange = (i) => Number.isInteger(i) && i >= 0 && i < candidates.length;
    const isLocked = (i) => i < lockedCount;
    const pairs = result.drop
        .filter((p) => inRange(p.index) && inRange(p.duplicateOf) && p.index !== p.duplicateOf)
        // A locked candidate is never dropped: flip a reversed pair, and ignore a pair of two locked candidates.
        .map((p) => (isLocked(p.index) ? { index: p.duplicateOf, duplicateOf: p.index } : p))
        .filter((p) => !isLocked(p.index));

    const dropped = new Set(pairs.map((p) => p.index));
    // If the pairs form a cycle, every member of the cycle is listed as dropped; keep one of them.
    const parent = candidates.map((_, i) => i);
    const root = (i) => (parent[i] === i ? i : (parent[i] = root(parent[i])));
    for (const { index, duplicateOf } of pairs) parent[root(index)] = root(duplicateOf);
    const groups = new Map();
    candidates.forEach((_, i) => groups.set(root(i), [...(groups.get(root(i)) ?? []), i]));
    for (const members of groups.values()) {
        if (members.every((i) => dropped.has(i))) dropped.delete(members[0]);
    }
    return candidates.filter((_, i) => !dropped.has(i));
}

async function verify(ctx, scope, candidates, prefix) {
    const verdicts = await ctx.parallel(
        candidates.map((c, i) => () =>
            ctx.agent(verifyPrompt(scope, c), { label: `${prefix}:${i}`, schema: verdictSchema, ...CHECKER_MODEL }),
        ),
    );
    // A failed verifier keeps the candidate, marked UNVERIFIED, rather than silently dropping it.
    const judged = candidates.map((c, i) => ({
        ...c,
        verdict: verdicts[i]?.verdict ?? "UNVERIFIED",
        evidence: verdicts[i]?.evidence ?? "",
    }));
    const unverified = judged.filter((c) => c.verdict === "UNVERIFIED").length;
    if (unverified) ctx.log(`${unverified} verifier(s) failed; their candidates are kept as UNVERIFIED.`);
    return {
        kept: judged.filter((c) => c.verdict !== "REFUTED"),
        refuted: judged.filter((c) => c.verdict === "REFUTED"),
    };
}

function coverageNotes(stats, findings, overCap, cap) {
    const notes = [];
    if (stats.empty) notes.push("There were no changes to review.");
    if (stats.reviewRetried) notes.push("The first review agent failed, and a second attempt produced these findings.");
    if (stats.failedAngles?.length) notes.push(`These review angles failed and were not covered: ${stats.failedAngles.join(", ")}.`);
    if (stats.sweepFailed) notes.push("The final gap sweep failed, so it did not run.");
    const unverified = findings.filter((f) => f.verdict === "UNVERIFIED").length;
    if (unverified) notes.push(`${unverified} reported finding(s) could not be verified and are marked UNVERIFIED.`);
    if (overCap) notes.push(`${overCap} lower-ranked finding(s) were left out because of the limit of ${cap}.`);
    return notes;
}

function finish(ctx, level, scopeDescription, findings, stats) {
    const cap = LEVELS[level].cap;
    const ranked = rank(findings);
    const overCap = Math.max(0, ranked.length - cap);
    if (overCap) ctx.log(`Dropped ${overCap} lower-ranked findings over the cap of ${cap}.`);
    const reported = ranked.slice(0, cap);
    return {
        report: REPORT,
        level,
        scope: scopeDescription,
        coverage: coverageNotes(stats, reported, overCap, cap),
        findings: reported,
        stats: { ...stats, overCap },
    };
}

async function runParallel(ctx, scope, config) {
    ctx.phase("Find");
    const perAngle = await ctx.parallel(
        config.angles.map((angle) => () =>
            ctx.agent(finderPrompt(scope, angle, config.perAngle), { label: `find:${angle}`, schema: findingsSchema }),
        ),
    );
    const failedAngles = config.angles.filter((_, i) => perAngle[i] == null);
    if (failedAngles.length) ctx.log(`Finder angles that failed: ${failedAngles.join(", ")}`);
    const candidates = perAngle.flatMap((r) => realFindings(r).slice(0, config.perAngle));

    ctx.phase("Dedup");
    const unique = await dedup(ctx, candidates, "dedup");

    ctx.phase("Verify");
    const first = await verify(ctx, scope, unique, "verify");

    ctx.phase("Sweep");
    const sweep = await ctx.agent(sweepPrompt(scope, first.kept, first.refuted, config.sweep), {
        label: "sweep",
        schema: findingsSchema,
    });
    if (!sweep) ctx.log("Sweep failed; continuing without it.");
    const extra = realFindings(sweep).slice(0, config.sweep);
    // Drop sweep candidates that repeat an accepted or rejected candidate before paying for their verifiers.
    const seen = [...first.kept, ...first.refuted];
    const novel = (await dedup(ctx, [...seen, ...extra], "dedup-sweep", seen.length)).slice(seen.length);
    const second = await verify(ctx, scope, novel, "verify-sweep");

    return {
        findings: [...first.kept, ...second.kept],
        stats: {
            candidates: candidates.length,
            afterDedup: unique.length,
            refuted: first.refuted.length,
            failedAngles,
            sweepFailed: !sweep,
            sweepCandidates: extra.length,
            sweepNovel: novel.length,
            sweepRefuted: second.refuted.length,
        },
    };
}

export async function runReview(ctx, level) {
    const config = LEVELS[level];
    const target = typeof ctx.args?.target === "string" ? ctx.args.target.trim() : "";

    if (config.mode === "parallel") {
        ctx.phase("Scope");
        const scope = await ctx.agent(scopePrompt(target), { label: "scope", schema: scopeSchema, ...MECHANICAL_MODEL });
        if (!scope) throw new Error("Could not determine the review scope.");
        if (scope.empty || !scope.commands.trim()) return finish(ctx, level, scope.description, [], { empty: true });
        ctx.log(`Scope: ${scope.description}`);
        const { findings, stats } = await runParallel(ctx, scope, config);
        return finish(ctx, level, scope.description, findings, stats);
    }

    ctx.phase("Review");
    const prompt =
        config.mode === "inline"
            ? inlinePrompt(target, config.angles, config.perAngle, config.stance, config.cap)
            : lowPrompt(target, config.cap);
    let result = await ctx.agent(prompt, { label: "review", schema: singleReviewSchema });
    const reviewRetried = !result;
    if (reviewRetried) {
        ctx.log("The review agent failed; retrying once.");
        result = await ctx.agent(prompt, { label: "review-retry", schema: singleReviewSchema });
    }
    if (!result) throw new Error("The review agent failed twice.");
    if (result.empty) return finish(ctx, level, result.scope, [], { empty: true, reviewRetried });
    const findings = realFindings(result);
    return finish(ctx, level, result.scope, findings, { candidates: findings.length, reviewRetried });
}
