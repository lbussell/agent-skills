import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { loadPrompt } from "./prompt.mjs";

async function fixture(t, files) {
    const root = await mkdtemp(join(tmpdir(), "review-prompts-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const [name, text] of Object.entries(files)) {
        const path = join(root, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, text);
    }
    return root;
}

test("includes expand in place, recursively and relative to their containing file", async (t) => {
    const root = await fixture(t, {
        "review.md": "Before\r\n  @shared/instructions.md  \r\nAfter",
        "shared/instructions.md": "Shared\n@detail.md",
        "shared/detail.md": "Details",
    });

    assert.equal(await loadPrompt(join(root, "review.md")), "Before\nShared\nDetails\nAfter");
});

test("repeated includes are allowed", async (t) => {
    const root = await fixture(t, {
        "review.md": "@shared.md\n@shared.md",
        "shared.md": "First",
    });

    assert.equal(await loadPrompt(join(root, "review.md")), "First\nFirst");
});

test("prompt edits apply to the next load", async (t) => {
    const root = await fixture(t, {
        "review.md": "@shared.md",
        "shared.md": "First",
    });
    const path = join(root, "review.md");

    assert.equal(await loadPrompt(path), "First");
    await writeFile(join(root, "shared.md"), "Updated");
    assert.equal(await loadPrompt(path), "Updated");
});

test("inline references and ordinary Markdown remain unchanged", async (t) => {
    const text = "# Review\n\nMention @missing.md inline.\n- @missing.md";
    const root = await fixture(t, { "review.md": text });

    assert.equal(await loadPrompt(join(root, "review.md")), text);
});

test("missing includes reject the prompt load", async (t) => {
    const root = await fixture(t, { "review.md": "@missing.md" });

    await assert.rejects(loadPrompt(join(root, "review.md")), { code: "ENOENT" });
});

test("direct and indirect circular includes reject the prompt load", async (t) => {
    const root = await fixture(t, {
        "self.md": "@self.md",
        "first.md": "@second.md",
        "second.md": "@./first.md",
    });

    await assert.rejects(loadPrompt(join(root, "self.md")), /Circular prompt include:/);
    await assert.rejects(loadPrompt(join(root, "first.md")), /Circular prompt include:/);
});
