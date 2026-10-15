import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import {
    OUTBOX_OPEN_SCHEMA,
    OUTBOX_PROPOSE_SCHEMA,
    OutboxError,
    addProposalToQueue,
    applyDecision,
    applyDraftEdits,
    computeFingerprint,
    formatDecisionPrompt,
    readPersistedProposals,
    resetProposalValues,
    writePersistedProposals,
} from "./state.mjs";

const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));
const UI_PATH = join(EXTENSION_DIR, "ui.html");

const servers = new Map();
let pendingProposals = [];
let lastOpenFingerprints = {};
const initializedInstances = new Set();
const preToolAddedFingerprints = new Set();
let storeLoaded = false;
let session;

function resolveWorkspacePath(sessionId) {
    if (session?.workspacePath) return session.workspacePath;
    const id = sessionId || process.env.SESSION_ID;
    if (!id) return null;
    const copilotHome = process.env.COPILOT_HOME || join(homedir(), ".copilot");
    return join(copilotHome, "session-state", id);
}

async function ensureStoreLoaded(sessionId) {
    if (storeLoaded) return;
    const workspacePath = resolveWorkspacePath(sessionId);
    if (!workspacePath) return;
    storeLoaded = true;
    const persisted = await readPersistedProposals(workspacePath);
    if (Array.isArray(persisted.proposals) && pendingProposals.length === 0) {
        pendingProposals = persisted.proposals;
    }
    if (persisted.lastOpenFingerprints && typeof persisted.lastOpenFingerprints === "object") {
        lastOpenFingerprints = { ...persisted.lastOpenFingerprints, ...lastOpenFingerprints };
    }
}

async function persistProposals(sessionId) {
    const workspacePath = resolveWorkspacePath(sessionId);
    if (!workspacePath) return;
    await writePersistedProposals(workspacePath, {
        proposals: pendingProposals,
        lastOpenFingerprints,
    });
}

function findProposal(proposalId) {
    if (proposalId) {
        const found = pendingProposals.find((item) => item.id === proposalId);
        if (!found) {
            throw new OutboxError("no_proposal", `Proposal "${proposalId}" was not found.`);
        }
        return found;
    }
    if (pendingProposals.length === 0) {
        throw new OutboxError("no_proposal", "No active proposal found.");
    }
    return pendingProposals[0];
}

async function getPayloadWithVersion() {
    let uiVersion = "1";
    try {
        const html = await readFile(UI_PATH, "utf8");
        let hash = 0x811c9dc5;
        for (let i = 0; i < html.length; i += 1) {
            hash = Math.imul(hash ^ html.charCodeAt(i), 0x01000193) >>> 0;
        }
        uiVersion = String(hash);
    } catch {
        // Ignore
    }
    return {
        proposals: pendingProposals,
        uiVersion,
    };
}

async function broadcastState() {
    const statePayload = await getPayloadWithVersion();
    const payload = `event: state\ndata: ${JSON.stringify(statePayload)}\n\n`;
    for (const entry of servers.values()) {
        for (const client of entry.clients) {
            try {
                client.write(payload);
            } catch {
                entry.clients.delete(client);
            }
        }
    }
}

function toCanvasError(error) {
    if (error instanceof CanvasError) return error;
    if (error instanceof OutboxError) return new CanvasError(error.code, error.message);
    return error;
}

async function addPendingProposal(rawInputs, name, sessionId) {
    const result = addProposalToQueue(pendingProposals, rawInputs, name);
    pendingProposals = result.proposals;
    await persistProposals(sessionId);
    await broadcastState();
    return result.proposal;
}

async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }
    if (chunks.length === 0) return {};
    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        throw new CanvasError("invalid_input", "Request body is not valid JSON.");
    }
}

function sendJson(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
    });
    res.end(body);
}

function preferredPort(sessionId, instanceId) {
    const resolvedSessionId = sessionId || session?.sessionId || process.env.SESSION_ID || "";
    const seed = `outbox::${resolvedSessionId}::${instanceId}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < seed.length; i += 1) {
        hash = Math.imul(hash ^ seed.charCodeAt(i), 0x01000193) >>> 0;
    }
    const span = 65535 - 60000;
    return 60000 + (hash % span);
}

function listenOn(server, port) {
    return new Promise((resolve, reject) => {
        const onError = (error) => {
            server.removeListener("listening", onListening);
            reject(error);
        };
        const onListening = () => {
            server.removeListener("error", onError);
            resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, "127.0.0.1");
    });
}

async function startServer(sessionId, instanceId) {
    const clients = new Set();

    const server = createServer((req, res) => {
        let url;
        try {
            url = new URL(req.url ?? "/", "http://127.0.0.1");
        } catch {
            sendJson(res, 400, { error: "invalid_request", message: "Invalid URL." });
            return;
        }

        const path = url.pathname;

        if (req.method === "GET" && path === "/events") {
            res.writeHead(200, {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            });
            clients.add(res);
            req.on("close", () => {
                clients.delete(res);
            });
            getPayloadWithVersion().then((statePayload) => {
                if (!res.writableEnded) {
                    res.write(`event: state\ndata: ${JSON.stringify(statePayload)}\n\n`);
                }
            });
            return;
        }

        (async () => {
            await ensureStoreLoaded(sessionId);

            if (req.method === "GET" && path === "/") {
                const html = await readFile(UI_PATH, "utf8");
                res.writeHead(200, {
                    "Content-Type": "text/html; charset=utf-8",
                    "Content-Length": Buffer.byteLength(html),
                    "Cache-Control": "no-store",
                });
                res.end(html);
                return;
            }

            if (req.method === "GET" && path === "/api/state") {
                sendJson(res, 200, await getPayloadWithVersion());
                return;
            }

            if (req.method === "POST" && path === "/api/draft") {
                const body = await readJsonBody(req);
                const target = findProposal(body?.proposalId);
                const updated = applyDraftEdits(target, body);
                pendingProposals = pendingProposals.map((item) =>
                    item.id === target.id ? updated : item,
                );
                await persistProposals(sessionId);
                sendJson(res, 200, { proposal: updated, proposals: pendingProposals });
                return;
            }

            if (req.method === "POST" && path === "/api/reset") {
                const body = await readJsonBody(req);
                const target = findProposal(body?.proposalId);
                const updated = resetProposalValues(target, body?.fieldId);
                pendingProposals = pendingProposals.map((item) =>
                    item.id === target.id ? updated : item,
                );
                await persistProposals(sessionId);
                await broadcastState();
                sendJson(res, 200, await getPayloadWithVersion());
                return;
            }

            if (req.method === "POST" && path === "/api/decide") {
                const body = await readJsonBody(req);
                const target = findProposal(body?.proposalId);
                const decided = applyDecision(target, body);
                const prompt = formatDecisionPrompt(decided);
                pendingProposals = pendingProposals.filter((item) => item.id !== target.id);
                await persistProposals(sessionId);
                await broadcastState();
                sendJson(res, 200, await getPayloadWithVersion());
                if (session) {
                    setTimeout(() => {
                        session.send({ prompt }).catch((err) => {
                            session.log(`Outbox failed to send decision: ${err?.message ?? err}`, {
                                level: "error",
                            });
                        });
                    }, 0);
                }
                return;
            }

            sendJson(res, 404, { error: "not_found", message: "Route not found." });
        })().catch((error) => {
            if (!res.writableEnded) {
                const isKnownError = error instanceof CanvasError || error instanceof OutboxError;
                const status = isKnownError ? 400 : 500;
                sendJson(res, status, {
                    error: isKnownError ? error.code : "internal_error",
                    message: error?.message ?? String(error),
                });
            }
        });
    });

    try {
        await listenOn(server, preferredPort(sessionId, instanceId));
    } catch {
        await listenOn(server, 0);
    }

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, clients, url: `http://127.0.0.1:${port}/` };
}

session = await joinSession({
    hooks: {
        onSessionStart: async () => ({
            additionalContext:
                "When proposing text or options for the user to review and edit before submitting (such as a pull request or issue title, body, and draft checkbox), open the `outbox` canvas via `open_canvas` with `canvasId: \"outbox\"`, `instanceId: \"outbox\"`, and `input: { name: \"<unique-name>\", inputs: [...] }` (or call the `propose` canvas action if already open), then wait for the user to Approve or Decline in Outbox. Every proposal must have a unique `name` that does not collide with any currently pending proposal.",
        }),
        onPreToolUse: async (input) => {
            if (
                input.toolName === "open_canvas" &&
                input.toolArgs &&
                typeof input.toolArgs === "object" &&
                input.toolArgs.canvasId === "outbox" &&
                typeof input.toolArgs.instanceId === "string" &&
                Array.isArray(input.toolArgs.input?.inputs) &&
                input.toolArgs.input.inputs.length > 0
            ) {
                try {
                    await ensureStoreLoaded(input.sessionId);
                    const proposal = await addPendingProposal(
                        input.toolArgs.input.inputs,
                        input.toolArgs.input.name,
                        input.sessionId,
                    );
                    const fp = computeFingerprint(input.toolArgs.input.inputs, proposal.name);
                    lastOpenFingerprints[input.toolArgs.instanceId] = fp;
                    preToolAddedFingerprints.add(`${input.toolArgs.instanceId}::${fp}`);
                    initializedInstances.add(input.toolArgs.instanceId);
                    await persistProposals(input.sessionId);
                } catch (error) {
                    if (error instanceof OutboxError && error.code === "name_collision") {
                        return {
                            permissionDecision: "deny",
                            permissionDecisionReason: error.message,
                        };
                    }
                    // Leave schema validation errors to the runtime open_canvas validator.
                }
            }
        },
    },
    canvases: [
        createCanvas({
            id: "outbox",
            displayName: "Outbox",
            description:
                "Propose a named batch of text and checkbox inputs (such as a pull request or issue title, body, and draft flag) for the user to edit and approve or decline before submission.",
            inputSchema: OUTBOX_OPEN_SCHEMA,
            actions: [
                {
                    name: "propose",
                    description:
                        "Add a new named batch of proposed text and checkbox inputs to Outbox for the user to edit and approve or decline. Fails if a pending proposal already uses the same name.",
                    inputSchema: OUTBOX_PROPOSE_SCHEMA,
                    handler: async (ctx) => {
                        try {
                            await ensureStoreLoaded(ctx.sessionId);
                            const proposal = await addPendingProposal(
                                ctx.input?.inputs,
                                ctx.input?.name,
                                ctx.sessionId,
                            );
                            return { proposal, proposals: pendingProposals };
                        } catch (error) {
                            throw toCanvasError(error);
                        }
                    },
                },
                {
                    name: "get_state",
                    description:
                        "Return all pending Outbox proposals and their current edited field values.",
                    handler: async (ctx) => {
                        await ensureStoreLoaded(ctx.sessionId);
                        return getPayloadWithVersion();
                    },
                },
                {
                    name: "clear",
                    description: "Clear all pending proposals from Outbox.",
                    handler: async (ctx) => {
                        await ensureStoreLoaded(ctx.sessionId);
                        pendingProposals = [];
                        await persistProposals(ctx.sessionId);
                        await broadcastState();
                        return { proposals: pendingProposals };
                    },
                },
            ],
            open: async (ctx) => {
                try {
                    await ensureStoreLoaded(ctx.sessionId);

                    if (Array.isArray(ctx.input?.inputs) && ctx.input.inputs.length > 0) {
                        const incomingFingerprint = computeFingerprint(
                            ctx.input.inputs,
                            ctx.input.name,
                        );
                        const preToolKey = `${ctx.instanceId}::${incomingFingerprint}`;
                        const addedByPreTool = preToolAddedFingerprints.delete(preToolKey);
                        const isRehydrateSameOpen =
                            !initializedInstances.has(ctx.instanceId) &&
                            lastOpenFingerprints[ctx.instanceId] === incomingFingerprint;

                        lastOpenFingerprints[ctx.instanceId] = incomingFingerprint;
                        if (!addedByPreTool && !isRehydrateSameOpen) {
                            await addPendingProposal(ctx.input.inputs, ctx.input.name, ctx.sessionId);
                        } else {
                            await persistProposals(ctx.sessionId);
                        }
                    }
                    initializedInstances.add(ctx.instanceId);

                    let entry = servers.get(ctx.instanceId);
                    if (!entry) {
                        entry = await startServer(ctx.sessionId, ctx.instanceId);
                        servers.set(ctx.instanceId, entry);
                    }
                    return {
                        title: "Outbox",
                        url: entry.url,
                    };
                } catch (error) {
                    throw toCanvasError(error);
                }
            },
            onClose: async (ctx) => {
                const entry = servers.get(ctx.instanceId);
                if (entry) {
                    servers.delete(ctx.instanceId);
                    for (const client of entry.clients) {
                        try {
                            client.end();
                        } catch {
                            // Ignore socket close error
                        }
                    }
                    entry.clients.clear();
                    await new Promise((resolve) => entry.server.close(() => resolve()));
                }
            },
        }),
    ],
});

