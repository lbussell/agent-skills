import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { createOutboxServer } from "./server.mjs";
import { OutboxError, OutboxStore, formatApproval, formatDecline, isEdited } from "./store.mjs";

const CANVAS_ID = "outbox";
const DEFAULT_INSTANCE_ID = "outbox";
const uiDir = join(dirname(fileURLToPath(import.meta.url)), "ui");
const SEND_FAILED = "Couldn\u2019t send your decision to Copilot. Nothing was lost; try again.";

const proposalSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            description:
                "Unique id for this proposal, e.g. 'pr-description'. Letters, digits and . _ : / # - only. It is echoed back in the user's decision message.",
        },
        title: { type: "string", description: "Short heading shown to the user. Defaults to the id." },
        description: { type: "string", description: "Optional plain-text context explaining what is being proposed." },
        decisions: {
            type: "array",
            description: "The items the user can edit or answer. Names must be unique within the proposal.",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Label shown to the user and used in the reply message." },
                    type: {
                        type: "string",
                        enum: ["text", "yes_no"],
                        description: "'text' is freeform editable text; 'yes_no' is a question the user may also leave unanswered.",
                    },
                    description: { type: "string", description: "Optional help text shown under the name." },
                    value: {
                        type: ["string", "boolean"],
                        description:
                            "Your proposed content. A string for 'text'; true/false for 'yes_no'. Omit a yes_no value to leave it unanswered by default.",
                    },
                },
                required: ["name", "type"],
            },
        },
    },
    required: ["id"],
};

let resolveSession;
const sessionReady = new Promise((resolve) => (resolveSession = resolve));
const runtime = sessionReady.then(createRuntime);
const openInstances = new Set();

function createRuntime(session) {
    const file = session.workspacePath ? join(session.workspacePath, "outbox", "proposals.json") : undefined;
    const store = new OutboxStore(file);
    const log = (message, level = "info") => void session.log(`outbox: ${message}`, { level }).catch(() => {});

    async function approve(id, values) {
        store.setValues(id, values);
        const proposal = store.remove(id);
        try {
            await session.send({ prompt: formatApproval(proposal) });
        } catch (error) {
            store.restore(proposal);
            log(`session.send failed for approval of ${id}: ${error?.message ?? error}`, "warning");
            throw new OutboxError(SEND_FAILED, 502);
        }
        return { edited: isEdited(proposal) };
    }

    async function decline(id, reason) {
        const proposal = store.remove(id);
        try {
            await session.send({ prompt: formatDecline(proposal, reason) });
        } catch (error) {
            store.restore(proposal);
            log(`session.send failed for decline of ${id}: ${error?.message ?? error}`, "warning");
            throw new OutboxError(SEND_FAILED, 502);
        }
    }

    async function ensureCanvasOpen() {
        try {
            const { openCanvases } = await session.rpc.canvas.listOpen();
            if (openCanvases.some((c) => c.canvasId === CANVAS_ID)) return;
            await session.rpc.canvas.open({ canvasId: CANVAS_ID, instanceId: DEFAULT_INSTANCE_ID });
        } catch (error) {
            log(`could not open the outbox panel automatically: ${error?.message ?? error}`, "warning");
        }
    }

    function submit(input) {
        const proposal = store.add(input);
        void ensureCanvasOpen();
        return proposal;
    }

    const server = createOutboxServer({ store, uiDir, approve, decline, log });
    return { store, server, submit };
}

function submitResult(proposal) {
    return (
        `Proposal \`${proposal.id}\` is now in the user's outbox. They can edit and then approve or decline it. ` +
        `Their decision will arrive later as a message starting with "[outbox]". ` +
        `Do not wait or poll for it: continue with other work, or end your turn.`
    );
}

function toCanvasError(error) {
    return error instanceof OutboxError ? new CanvasError("outbox_invalid", error.message) : error;
}

const outboxCanvas = createCanvas({
    id: CANVAS_ID,
    displayName: "Outbox",
    description:
        "Review queue where Copilot proposes text and yes/no decisions for the user to edit inline, then approve or decline.",
    actions: [
        {
            name: "submit_proposal",
            description: "Add a proposal to the outbox for the user to review. Same input as the outbox_submit_proposal tool.",
            inputSchema: proposalSchema,
            handler: async (ctx) => {
                const { submit } = await runtime;
                try {
                    return submitResult(submit(ctx.input));
                } catch (error) {
                    throw toCanvasError(error);
                }
            },
        },
        {
            name: "list_pending",
            description: "List the proposals currently waiting for the user's decision.",
            handler: async () => {
                const { store } = await runtime;
                return store.list().map((p) => ({
                    id: p.id,
                    title: p.title || p.id,
                    decisions: p.decisions.map((d) => d.name),
                    createdAt: p.createdAt,
                }));
            },
        },
    ],
    open: async (ctx) => {
        const { server } = await runtime;
        openInstances.add(ctx.instanceId);
        return { url: await server.start(), title: "Outbox" };
    },
    onClose: async (ctx) => {
        openInstances.delete(ctx.instanceId);
        if (openInstances.size === 0) await (await runtime).server.stop();
    },
});

const session = await joinSession({
    canvases: [outboxCanvas],
    tools: [
        {
            name: "outbox_submit_proposal",
            description:
                "Submit a proposal to the user's outbox: a review queue where they edit text and answer yes/no decisions inline, then approve or decline, without back-and-forth in chat. " +
                "Use it when you want the user to review or tweak content (a PR description, commit message, plan, reply) or make choices. " +
                "The user's decision arrives later as a message starting with \"[outbox]\"; do not wait or poll for it.",
            parameters: proposalSchema,
            handler: async (args) => {
                const { submit } = await runtime;
                try {
                    return submitResult(submit(args));
                } catch (error) {
                    if (error instanceof OutboxError) return { textResultForLlm: error.message, resultType: "failure" };
                    throw error;
                }
            },
        },
    ],
});

resolveSession(session);
