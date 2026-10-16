import { joinSession, createCanvas } from "@github/copilot-sdk/extension";
import { PipelineMonitor } from "./monitor.mjs";
import { startServer } from "./server.mjs";

let initialization;
const urlsSchema = {
	type: "object",
	required: ["urls"],
	additionalProperties: false,
	properties: {
		urls: {
			type: "array",
			minItems: 1,
			uniqueItems: true,
			items: { type: "string" },
		},
	},
};
const emptySchema = { type: "object", additionalProperties: false };

async function ready() {
	return initialization;
}

const session = await joinSession({
	canvases: [
		createCanvas({
			id: "azure-pipelines",
			displayName: "Azure pipelines",
			description:
				"Watch Azure pipeline runs, stages, and jobs with renewable authentication and agent notifications.",
			inputSchema: {
				...urlsSchema,
				required: [],
			},
			actions: [
				{
					name: "watch",
					description:
						"Add Azure DevOps build-results URLs to the shared session monitor. Polling and completion/error notifications run automatically.",
					inputSchema: urlsSchema,
					handler: async (ctx) => (await ready()).monitor.watch(ctx.input.urls),
				},
				{
					name: "unwatch",
					description: "Stop monitoring the given pipeline run URLs.",
					inputSchema: urlsSchema,
					handler: async (ctx) =>
						(await ready()).monitor.unwatch(ctx.input.urls),
				},
				{
					name: "status",
					description:
						"Read run and stage status, job counts by status, running/failed job details, polling errors, and last-successful-update times.",
					inputSchema: emptySchema,
					handler: async () => (await ready()).monitor.summary(),
				},
				{
					name: "refresh",
					description:
						"Refresh all watched runs immediately, including completed runs. Retries authentication after an external az login.",
					inputSchema: emptySchema,
					handler: async () => (await ready()).monitor.refresh(),
				},
			],
			open: async (ctx) => {
				const { monitor, server } = await ready();
				if (ctx.input?.urls?.length) await monitor.seed(ctx.input.urls);
				return { title: "Azure pipelines", url: server.url };
			},
		}),
	],
});

initialization = (async () => {
	const monitor = await PipelineMonitor.load(session);
	const server = await startServer(monitor);
	monitor.start();
	return { monitor, server };
})();
await initialization;
