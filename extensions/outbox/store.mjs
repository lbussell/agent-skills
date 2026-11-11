import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export class OutboxError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "OutboxError";
        this.status = status;
    }
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,99}$/;
const DECISION_TYPES = new Set(["text", "yes_no"]);
const MAX_TEXT = 200_000;

function optionalString(value, field, max) {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string") throw new OutboxError(`${field} must be a string.`);
    const trimmed = value.trim();
    if (trimmed.length > max) throw new OutboxError(`${field} is too long (max ${max} characters).`);
    return trimmed;
}

function normalizeValue(type, value, field) {
    if (type === "text") {
        if (value === undefined || value === null) return "";
        if (typeof value !== "string") throw new OutboxError(`${field}: text decisions need a string value.`);
        if (value.length > MAX_TEXT) throw new OutboxError(`${field}: value is too long.`);
        return value;
    }
    if (value === undefined || value === null) return null;
    if (typeof value !== "boolean") throw new OutboxError(`${field}: yes_no decisions need true, false, or null.`);
    return value;
}

export function normalizeProposal(input) {
    if (!input || typeof input !== "object") throw new OutboxError("Proposal must be an object.");
    if (typeof input.id !== "string" || !ID_PATTERN.test(input.id)) {
        throw new OutboxError(
            "id must be 1-100 characters, start with a letter or digit, and contain only letters, digits, and . _ : / # -",
        );
    }
    const rawDecisions = input.decisions ?? [];
    if (!Array.isArray(rawDecisions)) throw new OutboxError("decisions must be an array.");

    const seen = new Set();
    const decisions = rawDecisions.map((raw, index) => {
        const label = `decisions[${index}]`;
        if (!raw || typeof raw !== "object") throw new OutboxError(`${label} must be an object.`);
        const name = optionalString(raw.name, `${label}.name`, 120);
        if (!name) throw new OutboxError(`${label}.name is required.`);
        if (seen.has(name)) throw new OutboxError(`Duplicate decision name "${name}".`);
        seen.add(name);
        if (!DECISION_TYPES.has(raw.type)) throw new OutboxError(`${label}.type must be "text" or "yes_no".`);
        const proposed = normalizeValue(raw.type, raw.value, `${label}.value`);
        return {
            name,
            type: raw.type,
            description: optionalString(raw.description, `${label}.description`, 2000),
            proposed,
            value: proposed,
        };
    });

    return {
        id: input.id,
        title: optionalString(input.title, "title", 200),
        description: optionalString(input.description, "description", 5000),
        createdAt: new Date().toISOString(),
        decisions,
    };
}

export function isEdited(proposal) {
    return proposal.decisions.some((d) => d.value !== d.proposed);
}

function fenced(text) {
    const longestRun = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
    const fence = "`".repeat(longestRun + 1);
    return `${fence}text\n${text}\n${fence}`;
}

function formatDecision(decision) {
    if (decision.type === "yes_no") {
        const answer = decision.value === true ? "Yes" : decision.value === false ? "No" : "(no answer)";
        return `### ${decision.name}\n${answer}`;
    }
    return `### ${decision.name}\n${decision.value === "" ? "(empty)" : fenced(decision.value)}`;
}

export function formatApproval(proposal) {
    const header = `[outbox] Proposal \`${proposal.id}\` approved with the following content (${
        isEdited(proposal) ? "edited" : "user did not edit"
    }):`;
    const body = proposal.decisions.length ? proposal.decisions.map(formatDecision).join("\n\n") : "(no decisions)";
    return `${header}\n\n${body}`;
}

export function formatDecline(proposal, reason) {
    const text = reason.trim() || "(no reason given)";
    return `[outbox] Proposal \`${proposal.id}\` declined with the following reason: ${text}`;
}

export class OutboxStore {
    #proposals = new Map();
    #listeners = new Set();
    #file;

    constructor(file) {
        this.#file = file;
        this.#load();
    }

    onChange(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    list() {
        return [...this.#proposals.values()];
    }

    add(input) {
        const proposal = normalizeProposal(input);
        if (this.#proposals.has(proposal.id)) {
            throw new OutboxError(`A proposal with id "${proposal.id}" is already pending. Use a different id.`, 409);
        }
        this.#proposals.set(proposal.id, proposal);
        this.#commit();
        return proposal;
    }

    setValues(id, values) {
        const proposal = this.#require(id);
        if (!Array.isArray(values) || values.length !== proposal.decisions.length) {
            throw new OutboxError("Your edits are out of date. Reload this panel and try again.");
        }
        const checked = proposal.decisions.map((d, i) => normalizeValue(d.type, values[i], `values[${i}]`));
        checked.forEach((value, i) => (proposal.decisions[i].value = value));
        this.#commit(false);
        return proposal;
    }

    setValue(id, index, value) {
        const proposal = this.#require(id);
        const decision = proposal.decisions[index];
        if (!decision) throw new OutboxError("That decision no longer exists. Reload this panel to refresh.");
        decision.value = normalizeValue(decision.type, value, "value");
        this.#commit(false);
    }

    remove(id) {
        const proposal = this.#require(id);
        this.#proposals.delete(id);
        this.#commit();
        return proposal;
    }

    restore(proposal) {
        this.#proposals.set(proposal.id, proposal);
        this.#commit();
    }

    #require(id) {
        const proposal = this.#proposals.get(id);
        if (!proposal) throw new OutboxError(`\u201c${id}\u201d was already resolved or removed. Reload this panel to refresh the list.`, 404);
        return proposal;
    }

    #commit(notify = true) {
        this.#save();
        if (notify) for (const listener of this.#listeners) listener();
    }

    #load() {
        if (!this.#file) return;
        try {
            const data = JSON.parse(readFileSync(this.#file, "utf8"));
            for (const proposal of data.proposals ?? []) this.#proposals.set(proposal.id, proposal);
        } catch {
            // Missing or unreadable file: start empty.
        }
    }

    #save() {
        if (!this.#file) return;
        try {
            mkdirSync(dirname(this.#file), { recursive: true });
            const temp = `${this.#file}.tmp`;
            writeFileSync(temp, JSON.stringify({ proposals: this.list() }, null, 2));
            renameSync(temp, this.#file);
        } catch {
            // Persistence is best effort; the in-memory state stays authoritative.
        }
    }
}
