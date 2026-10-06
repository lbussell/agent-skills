import { defineWorkflow, joinSession } from "@github/copilot-sdk/extension";
import { loadPrompt } from "./prompt.mjs";

const reviewCommentsSchema = {
    type: "object",
    required: ["comments"],
    properties: {
        comments: {
            type: "array",
            items: {
                type: "object",
                required: ["file", "startLine", "endLine", "comment"],
                properties: {
                    file: { type: "string" },
                    startLine: { type: "integer" },
                    endLine: { type: "integer" },
                    comment: { type: "string" },
                },
            },
        },
    },
};

const reviewWorkflow = defineWorkflow({
    meta: {
        name: "review",
        description: "Reviews an implementation.",
        phases: [{ title: "Review" }],
        argsSchema: {
            type: "object",
            required: ["userRequest", "codeToReview"],
            properties: {
                userRequest: { type: "string" },
                codeToReview: { type: "string" },
            },
        },
    },

    run: async (ctx) => {
        ctx.phase("Review");

        const instructions = await loadPrompt(
            new URL("./review.md", import.meta.url),
        );
        const prompt = `${instructions}

## Review context

The operator's request was:

${ctx.args.userRequest}

The code to review is:

${ctx.args.codeToReview}`;

        return ctx.agent(prompt, {
            label: "Over-engineering review",
            schema: reviewCommentsSchema,
        });
    },
});

await joinSession({ workflows: [reviewWorkflow] });
