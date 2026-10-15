import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
    addProposalToQueue,
    applyDecision,
    applyDraftEdits,
    computeFingerprint,
    createProposal,
    formatDecisionPrompt,
    normalizeInputs,
    readPersistedProposals,
    reopenProposal,
    resetProposalValues,
    writePersistedProposals,
} from "./state.mjs";

test("normalizeInputs validates and assigns unique ids", () => {
    const inputs = normalizeInputs([
        { label: "Title", type: "text", value: "Fix null check" },
        { label: "Title", type: "text", value: "Second title" },
        { id: "draft", label: "Submit as draft", type: "checkbox", value: true },
    ]);

    assert.deepEqual(inputs, [
        {
            id: "title",
            label: "Title",
            type: "text",
            value: "Fix null check",
            originalValue: "Fix null check",
        },
        {
            id: "title-2",
            label: "Title",
            type: "text",
            value: "Second title",
            originalValue: "Second title",
        },
        {
            id: "draft",
            label: "Submit as draft",
            type: "checkbox",
            value: "decline",
            originalValue: "decline",
        },
    ]);
});

test("applyDraftEdits, resetProposalValues, applyDecision, and reopenProposal manage proposal lifecycle", () => {
    const initial = createProposal(
        [
            { id: "title", label: "Title", type: "text", value: "Initial title" },
            { id: "body", label: "Body", type: "text", value: "Line 1\nLine 2" },
            { id: "draft", label: "Submit as draft", type: "checkbox" },
        ],
        "Create PR",
    );

    assert.equal(initial.name, "Create PR");
    assert.equal(initial.status, "pending");
    assert.equal(initial.inputs[2].value, "decline");
    assert.equal(initial.inputs[2].originalValue, "decline");
    assert.equal(initial.fingerprint, computeFingerprint(initial.inputs, "Create PR"));

    const edited = applyDraftEdits(initial, {
        values: {
            title: "Edited title",
            draft: true,
        },
    });
    assert.equal(edited.inputs[0].value, "Edited title");
    assert.equal(edited.inputs[0].originalValue, "Initial title");
    assert.equal(edited.inputs[2].value, true);

    const singleReset = resetProposalValues(edited, "title");
    assert.equal(singleReset.inputs[0].value, "Initial title");
    assert.equal(singleReset.inputs[2].value, true);

    const approved = applyDecision(edited, {
        decision: "approved",
        values: {
            title: "Final title",
            body: "Line 1\nLine 2",
            draft: true,
        },
    });
    assert.equal(approved.status, "approved");
    assert.equal(
        formatDecisionPrompt(approved),
        [
            'Approved "Create PR" in Outbox:',
            "",
            "- **Title**: Final title",
            "- **Body**:",
            "```",
            "Line 1",
            "Line 2",
            "```",
            "- **Submit as draft**: Yes",
        ].join("\n"),
    );

    const reopened = reopenProposal(approved);
    assert.equal(reopened.status, "pending");

    const declinedChoice = applyDraftEdits(reopened, {
        values: {
            draft: false,
        },
    });
    assert.equal(declinedChoice.inputs[2].value, false);

    const declined = applyDecision(declinedChoice, {
        decision: "declined",
        declineReason: "Focus on the parser bug only.",
    });
    assert.equal(declined.status, "declined");
    assert.equal(
        formatDecisionPrompt(declined),
        [
            'Declined "Create PR" in Outbox: Focus on the parser bug only.',
            "",
            "Edited fields before declining:",
            "- **Title**: Final title",
            "- **Submit as draft**: No",
        ].join("\n"),
    );
});

test("requires a proposal name and rejects colliding pending names", () => {
    assert.throws(
        () => createProposal([{ label: "Title", type: "text", value: "A" }], ""),
        /Proposal name is required/,
    );

    const first = addProposalToQueue(
        [],
        [{ label: "Title", type: "text", value: "First" }],
        "PR #1",
    );
    assert.equal(first.proposals.length, 1);

    assert.throws(
        () =>
            addProposalToQueue(
                first.proposals,
                [{ label: "Title", type: "text", value: "Duplicate" }],
                "PR #1",
            ),
        /A pending proposal named "PR #1" already exists/,
    );
});

test("persisted proposals round-trip to workspacePath", async (t) => {
    const dir = await mkdtemp(join(tmpdir(), "outbox-state-"));
    t.after(() => rm(dir, { recursive: true, force: true }));

    const first = createProposal(
        [{ id: "title", label: "Title", type: "text", value: "First" }],
        "prop-1",
    );
    const second = createProposal(
        [{ id: "title", label: "Title", type: "text", value: "Second" }],
        "prop-2",
    );
    await writePersistedProposals(dir, {
        proposals: [first, second],
        lastOpenFingerprints: { outbox: first.fingerprint },
    });
    const loaded = await readPersistedProposals(dir);

    assert.deepEqual(loaded, {
        proposals: [first, second],
        lastOpenFingerprints: { outbox: first.fingerprint },
    });
});
