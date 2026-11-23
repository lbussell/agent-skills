import { defineWorkflow, joinSession } from "@github/copilot-sdk/extension";
import { LEVELS, phasesFor, runReview, summarize } from "./workflow.mjs";

const argsSchema = {
    type: ["object", "null"],
    properties: { target: { type: "string" } },
};

const nameOf = (level) => `cc-review-${level}`;

const workflows = Object.entries(LEVELS).map(([level, config]) =>
    defineWorkflow({
        meta: {
            name: nameOf(level),
            description:
                `Code review at ${level} effort. ${summarize(config)}. ` +
                "args: { target?: string } - optional PR number or URL, branch, commit range, or path. " +
                "Omit target to review the current branch plus uncommitted and untracked changes. " +
                "The result includes a `report` field that says how to present it.",
            phases: phasesFor(config.mode).map((title) => ({ title })),
            argsSchema,
        },
        run: (ctx) => runReview(ctx, level),
    }),
);

function formatFailure(name, run) {
    const header = `[${name}] The review workflow run \`${run.runId}\` ended with status \`${run.status}\`.`;
    if (run.status === "cancelled") {
        return `${header}\nTell the user that the review was cancelled.`;
    }
    if (run.failure?.type === "workflow_limit_reached") {
        const { kind, value, suggestedValue } = run.failure;
        const suggestion = suggestedValue ? ` The suggested new limit is ${suggestedValue}.` : "";
        return (
            `${header} It reached the \`${kind}\` limit of ${value}.${suggestion}\n` +
            `Tell the user, and offer to resume the run with \`run_dynamic_workflow\` and \`resumeFromRunId: "${run.runId}"\`, raising only \`${kind}\`.`
        );
    }
    if (run.status === "paused" || run.status === "halted") {
        const why =
            run.pauseInfo?.type === "user"
                ? "The user paused it."
                : run.pauseInfo?.type === "checkpoint"
                  ? `It paused at checkpoint \`${run.pauseInfo.key}\`.`
                  : run.reason
                    ? `Reason: ${run.reason}`
                    : "";
        return (
            `${header} ${why}\n` +
            `Tell the user, and offer to resume the run with \`run_dynamic_workflow\` and \`resumeFromRunId: "${run.runId}"\`.`
        );
    }
    const reason = run.error ?? run.reason ?? run.failure?.type ?? "unknown error";
    return `${header} Error: ${reason}\nTell the user that the review failed, and offer to run it again.`;
}

function formatResult(name, run) {
    if (run.status !== "completed") return formatFailure(name, run);
    return (
        `[${name}] The review workflow finished. Follow the \`report\` instructions in this result.\n\n` +
        "```json\n" +
        JSON.stringify(run.result, null, 2) +
        "\n```"
    );
}

let resolveSession;
const sessionReady = new Promise((resolve) => (resolveSession = resolve));

const commands = Object.entries(LEVELS).map(([level, config]) => ({
    name: nameOf(level),
    description: `${summarize(config)}. Optional argument: PR, branch, range, or path.`,
    handler: async ({ args }) => {
        const session = await sessionReady;
        const name = nameOf(level);
        const target = args?.trim();
        const log = (message, logLevel) => session.log(message, { level: logLevel }).catch(() => {});
        await log(`${name}: reviewing ${target || "current changes"}...`);
        // Don't block the command on the whole review; report back when the run settles.
        void session.workflow
            .run(name, { args: target ? { target } : {}, notifyOnComplete: false, logPhaseNames: true })
            .then(
                (run) =>
                    session
                        .send({ prompt: formatResult(name, run) })
                        .catch((error) =>
                            log(
                                `${name}: run ${run.runId} ended as ${run.status}, but the result could not be delivered (${error?.message ?? error}). Ask Copilot to inspect run ${run.runId}.`,
                                "error",
                            ),
                        ),
                (error) => log(`${name} failed to start: ${error?.message ?? error}`, "error"),
            );
    },
}));

resolveSession(await joinSession({ workflows, commands }));
