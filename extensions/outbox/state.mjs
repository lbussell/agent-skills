import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export class OutboxError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "OutboxError";
        this.code = code;
    }
}

export const OUTBOX_INPUT_ITEM_SCHEMA = {
    type: "object",
    required: ["label", "type"],
    properties: {
        id: {
            type: "string",
            minLength: 1,
            description: "Optional field identifier (e.g. 'title', 'body', 'draft').",
        },
        label: {
            type: "string",
            minLength: 1,
            description: "Field label shown in the UI (e.g. 'Title', 'Body', 'Submit as draft').",
        },
        type: {
            type: "string",
            enum: ["text", "checkbox"],
            description: "Input control type: 'text' for a text block or 'checkbox' for a Yes/Decline/No choice.",
        },
        value: {
            type: ["string", "boolean"],
            description: "Proposed initial value for 'text' inputs. Optional for 'checkbox' inputs, which default to 'decline'.",
        },
    },
    additionalProperties: false,
};

export const OUTBOX_OPEN_SCHEMA = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            description: "Unique name for this proposal batch (must not collide with any pending proposal).",
        },
        inputs: {
            type: "array",
            minItems: 1,
            items: OUTBOX_INPUT_ITEM_SCHEMA,
            description: "Batch of proposed text or checkbox inputs for the user to edit and approve or decline.",
        },
    },
    dependentRequired: {
        inputs: ["name"],
        name: ["inputs"],
    },
    additionalProperties: false,
};

export const OUTBOX_PROPOSE_SCHEMA = {
    type: "object",
    required: ["name", "inputs"],
    properties: {
        name: {
            type: "string",
            minLength: 1,
            description: "Unique name for this proposal batch (must not collide with any pending proposal).",
        },
        inputs: {
            type: "array",
            minItems: 1,
            items: OUTBOX_INPUT_ITEM_SCHEMA,
            description: "Batch of proposed text or checkbox inputs for the user to edit and approve or decline.",
        },
    },
    additionalProperties: false,
};

function slugify(text, fallbackIndex) {
    const slug = String(text ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || `field-${fallbackIndex + 1}`;
}

function normalizeCheckboxValue(value, label) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "yes" || normalized === "true") return true;
        if (normalized === "no" || normalized === "false") return false;
        if (normalized === "decline" || normalized === "declined") return "decline";
    }
    throw new OutboxError(
        "invalid_input",
        `Checkbox input "${label}" must be a boolean or "decline".`,
    );
}

export function normalizeInputs(rawInputs) {
    if (!Array.isArray(rawInputs) || rawInputs.length === 0) {
        throw new OutboxError("invalid_input", "inputs must be a non-empty array.");
    }

    const usedIds = new Set();
    return rawInputs.map((item, index) => {
        if (!item || typeof item !== "object") {
            throw new OutboxError("invalid_input", `Input at index ${index} must be an object.`);
        }
        const label = typeof item.label === "string" ? item.label.trim() : "";
        if (!label) {
            throw new OutboxError("invalid_input", `Input at index ${index} is missing a label.`);
        }
        if (item.type !== "text" && item.type !== "checkbox") {
            throw new OutboxError(
                "invalid_input",
                `Input "${label}" has unsupported type "${item.type}". Expected "text" or "checkbox".`,
            );
        }
        let normalizedValue;
        if (item.type === "text") {
            if (typeof item.value !== "string") {
                throw new OutboxError(
                    "invalid_input",
                    `Text input "${label}" must have a string value.`,
                );
            }
            normalizedValue = item.value;
        } else {
            normalizedValue = "decline";
        }

        const baseId = typeof item.id === "string" && item.id.trim()
            ? item.id.trim()
            : slugify(label, index);
        let id = baseId;
        let suffix = 2;
        while (usedIds.has(id)) {
            id = `${baseId}-${suffix}`;
            suffix += 1;
        }
        usedIds.add(id);

        return {
            id,
            label,
            type: item.type,
            value: normalizedValue,
            originalValue: normalizedValue,
        };
    });
}

export function normalizeProposalName(name) {
    const cleanName = typeof name === "string" ? name.trim() : "";
    if (!cleanName) {
        throw new OutboxError("invalid_input", "Proposal name is required.");
    }
    return cleanName;
}

export function computeFingerprint(rawInputs, name) {
    const cleanName = normalizeProposalName(name);
    const normalized = normalizeInputs(rawInputs);
    return JSON.stringify({
        name: cleanName,
        inputs: normalized.map(({ id, label, type, originalValue }) => ({
            id,
            label,
            type,
            originalValue,
        })),
    });
}

export function createEmptyProposal() {
    return {
        status: "empty",
        inputs: [],
        declineReason: "",
        fingerprint: null,
        updatedAt: new Date().toISOString(),
    };
}

export function createProposal(rawInputs, name) {
    const cleanName = normalizeProposalName(name);
    const inputs = normalizeInputs(rawInputs);
    const fingerprint = JSON.stringify({
        name: cleanName,
        inputs: inputs.map(({ id, label, type, originalValue }) => ({
            id,
            label,
            type,
            originalValue,
        })),
    });
    return {
        id: cleanName,
        name: cleanName,
        status: "pending",
        inputs,
        declineReason: "",
        fingerprint,
        updatedAt: new Date().toISOString(),
    };
}

export function addProposalToQueue(pendingProposals, rawInputs, name) {
    const proposal = createProposal(rawInputs, name);
    const existing = Array.isArray(pendingProposals) ? pendingProposals : [];
    if (existing.some((item) => (item.name ?? item.id) === proposal.name)) {
        throw new OutboxError(
            "name_collision",
            `A pending proposal named "${proposal.name}" already exists.`,
        );
    }
    return {
        proposal,
        proposals: [...existing, proposal],
    };
}

export function applyDraftEdits(proposal, { values, declineReason } = {}) {
    if (!proposal || proposal.status === "empty") {
        throw new OutboxError("no_proposal", "No active proposal to edit.");
    }
    const nextInputs = proposal.inputs.map((input) => {
        if (!values || typeof values !== "object" || !(input.id in values)) {
            return input;
        }
        const nextValue = values[input.id];
        if (input.type === "text") {
            if (typeof nextValue !== "string") {
                throw new OutboxError("invalid_input", `Field "${input.label}" requires a string value.`);
            }
            return { ...input, value: nextValue };
        }
        return { ...input, value: normalizeCheckboxValue(nextValue, input.label) };
    });

    return {
        ...proposal,
        inputs: nextInputs,
        declineReason: typeof declineReason === "string" ? declineReason : proposal.declineReason,
        updatedAt: new Date().toISOString(),
    };
}

export function resetProposalValues(proposal, fieldId) {
    if (!proposal || proposal.status === "empty") {
        throw new OutboxError("no_proposal", "No active proposal to reset.");
    }
    const nextInputs = proposal.inputs.map((input) => {
        if (fieldId && input.id !== fieldId) {
            return input;
        }
        return { ...input, value: input.originalValue };
    });
    return {
        ...proposal,
        inputs: nextInputs,
        updatedAt: new Date().toISOString(),
    };
}

export function reopenProposal(proposal) {
    if (!proposal || proposal.status === "empty") {
        throw new OutboxError("no_proposal", "No active proposal to reopen.");
    }
    return {
        ...proposal,
        status: "pending",
        updatedAt: new Date().toISOString(),
    };
}

export function applyDecision(proposal, { decision, values, declineReason } = {}) {
    if (!proposal || proposal.status === "empty") {
        throw new OutboxError("no_proposal", "No active proposal to decide.");
    }
    if (decision !== "approved" && decision !== "declined") {
        throw new OutboxError("invalid_input", 'decision must be "approved" or "declined".');
    }
    const updated = applyDraftEdits(proposal, { values, declineReason });
    return {
        ...updated,
        status: decision,
        declineReason: decision === "declined" ? String(updated.declineReason ?? "").trim() : "",
        updatedAt: new Date().toISOString(),
    };
}

function fenceFor(text) {
    const matches = String(text).match(/`+/g) ?? [];
    const maxRun = matches.reduce((max, run) => Math.max(max, run.length), 0);
    return "`".repeat(Math.max(3, maxRun + 1));
}

function formatFieldBlock(input) {
    if (input.type === "checkbox") {
        const formatted =
            input.value === "decline"
                ? "Declined"
                : input.value
                  ? "Yes"
                  : "No";
        return `- **${input.label}**: ${formatted}`;
    }
    const text = String(input.value ?? "");
    if (!text.includes("\n")) {
        return `- **${input.label}**: ${text}`;
    }
    const fence = fenceFor(text);
    return `- **${input.label}**:\n${fence}\n${text}\n${fence}`;
}

export function formatDecisionPrompt(proposal) {
    const proposalName = proposal?.name || proposal?.id || "proposal";
    if (proposal.status === "approved") {
        const lines = [`Approved "${proposalName}" in Outbox:`, ""];
        for (const input of proposal.inputs) {
            lines.push(formatFieldBlock(input));
        }
        return lines.join("\n");
    }

    if (proposal.status === "declined") {
        const reason = String(proposal.declineReason ?? "").trim();
        const header = reason
            ? `Declined "${proposalName}" in Outbox: ${reason}`
            : `Declined "${proposalName}" in Outbox.`;
        const edited = proposal.inputs.filter((input) => input.value !== input.originalValue);
        if (edited.length === 0) {
            return header;
        }
        const lines = [header, "", "Edited fields before declining:"];
        for (const input of edited) {
            lines.push(formatFieldBlock(input));
        }
        return lines.join("\n");
    }

    throw new OutboxError("invalid_state", "Proposal has not been decided yet.");
}

function stateFilePath(workspacePath) {
    if (!workspacePath) return null;
    return join(workspacePath, "files", "outbox-state.json");
}

export async function readPersistedProposals(workspacePath) {
    const filePath = stateFilePath(workspacePath);
    if (!filePath) return { proposals: [], lastOpenFingerprints: {} };
    try {
        const content = await readFile(filePath, "utf8");
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== "object") {
            return { proposals: [], lastOpenFingerprints: {} };
        }
        if (Array.isArray(parsed.proposals)) {
            return {
                proposals: parsed.proposals.filter(
                    (item) => item && typeof item === "object" && item.status === "pending" && Array.isArray(item.inputs),
                ),
                lastOpenFingerprints:
                    parsed.lastOpenFingerprints && typeof parsed.lastOpenFingerprints === "object"
                        ? parsed.lastOpenFingerprints
                        : {},
            };
        }
        // Migrate legacy single-proposal store if pending
        const legacy = Object.values(parsed).find(
            (item) => item && typeof item === "object" && item.status === "pending" && Array.isArray(item.inputs),
        );
        const legacyName = legacy?.name || legacy?.id || "proposal";
        return {
            proposals: legacy ? [{ ...legacy, id: legacyName, name: legacyName }] : [],
            lastOpenFingerprints: {},
        };
    } catch {
        return { proposals: [], lastOpenFingerprints: {} };
    }
}

export async function writePersistedProposals(workspacePath, stateData) {
    const filePath = stateFilePath(workspacePath);
    if (!filePath) return;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(stateData, null, 2), "utf8");
}
