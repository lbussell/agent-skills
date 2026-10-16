import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const resource = "499b84ac-1321-427f-aa17-267ca6975798";
let cachedToken;
let acquiring;

export function parseRun(value) {
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error("Enter an Azure DevOps build-results URL.");
	}
	const parts = url.pathname.split("/").filter(Boolean);
	const buildId = url.searchParams.get("buildId");
	if (
		url.protocol !== "https:" ||
		url.hostname !== "dev.azure.com" ||
		url.port ||
		url.username ||
		url.password ||
		parts.length !== 4 ||
		parts[2] !== "_build" ||
		parts[3] !== "results" ||
		!/^[1-9]\d*$/.test(buildId ?? "")
	) {
		throw new Error(
			"Expected https://dev.azure.com/{organization}/{project}/_build/results?buildId={id}.",
		);
	}
	for (const part of parts.slice(0, 2)) {
		if (!/^[\w .-]+$/.test(decodeURIComponent(part))) {
			throw new Error("The organization or project name is invalid.");
		}
	}
	const base = `https://dev.azure.com/${parts[0]}/${parts[1]}`;
	return {
		url: `${base}/_build/results?buildId=${buildId}`,
		api: `${base}/_apis/build/builds/${buildId}`,
		buildId,
	};
}

async function accessToken() {
	if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000)
		return cachedToken.value;
	if (!acquiring) {
		acquiring = (async () => {
			let stdout;
			try {
				const args = [
					"account",
					"get-access-token",
					"--resource",
					resource,
					"--output",
					"json",
					"--only-show-errors",
				];
				const result =
					process.platform === "win32"
						? await exec(
								process.env.ComSpec ?? "cmd.exe",
								["/d", "/s", "/c", `az ${args.join(" ")}`],
								{ timeout: 60_000, windowsHide: true },
							)
						: await exec("az", args, { timeout: 60_000 });
				stdout = result.stdout;
			} catch {
				throw new Error(
					"Azure CLI authentication failed. Install Azure CLI if missing, run az login --allow-no-subscriptions in the organization's tenant, then Refresh. Monitoring will retry automatically.",
				);
			}
			let token;
			try {
				token = JSON.parse(stdout);
			} catch {
				throw new Error(
					"Azure CLI returned invalid token data. Update Azure CLI and run az login again.",
				);
			}
			const expiresAt = Number(token.expires_on) * 1000;
			if (
				typeof token.accessToken !== "string" ||
				!token.accessToken ||
				!Number.isFinite(expiresAt) ||
				expiresAt <= Date.now()
			) {
				throw new Error(
					"Azure CLI returned an invalid or expired token. Update Azure CLI and run az login again.",
				);
			}
			cachedToken = { value: token.accessToken, expiresAt };
			return cachedToken.value;
		})().finally(() => {
			acquiring = undefined;
		});
	}
	return acquiring;
}

async function request(url, allowMissing = false) {
	for (let attempt = 0; attempt < 2; attempt++) {
		const token = await accessToken();
		const response = await fetch(`${url}?api-version=7.1`, {
			headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
			redirect: "manual",
			signal: AbortSignal.timeout(30_000),
		});
		if (response.status === 401 && attempt === 0) {
			if (cachedToken?.value === token) cachedToken = undefined;
			await response.body?.cancel();
			continue;
		}
		if (response.status === 404 && allowMissing) {
			await response.body?.cancel();
			return null;
		}
		if (!response.ok) {
			await response.body?.cancel();
			if ([401, 403, 302, 203].includes(response.status)) {
				throw new Error(
					`Azure DevOps access failed (HTTP ${response.status}). Run az login in the organization's tenant and check pipeline read permissions, then Refresh.`,
				);
			}
			throw new Error(
				`Azure DevOps request failed (HTTP ${response.status}). Monitoring will retry automatically.`,
			);
		}
		if (!response.headers.get("content-type")?.includes("application/json")) {
			await response.body?.cancel();
			throw new Error(
				"Azure DevOps returned a sign-in page instead of pipeline data. Run az login in the organization's tenant, then Refresh.",
			);
		}
		return response.json();
	}
}

function recordStatus(record) {
	return {
		id: record.id,
		name: record.name,
		state: record.state,
		result: record.result ?? null,
		attempt: record.attempt,
		startTime: record.startTime ?? null,
		finishTime: record.finishTime ?? null,
		order: record.order ?? 0,
		issues: (record.issues ?? []).map(({ type, message }) => ({
			type,
			message,
		})),
	};
}

export async function readRun(run) {
	const build = await request(run.api);
	if (
		!build ||
		String(build.id) !== run.buildId ||
		typeof build.status !== "string"
	) {
		throw new Error("Azure DevOps returned invalid build data.");
	}
	const timeline = await request(
		`${run.api}/timeline`,
		build.status !== "completed",
	);
	if (timeline && !Array.isArray(timeline.records)) {
		throw new Error("Azure DevOps returned invalid timeline data.");
	}
	const records = timeline?.records ?? [];
	const byId = new Map(records.map((record) => [record.id, record]));
	const parentsWithJobs = new Set();
	for (const record of records.filter((record) => record.type === "Job")) {
		let parent = byId.get(record.parentId);
		const visited = new Set([record.id]);
		while (parent && !visited.has(parent.id)) {
			visited.add(parent.id);
			parentsWithJobs.add(parent.id);
			parent = byId.get(parent.parentId);
		}
	}
	const ordered = records.toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const stages = ordered
		.filter((record) => record.type === "Stage")
		.map((record) => ({ ...recordStatus(record), phases: [], jobs: [] }));
	const stageById = new Map(stages.map((stage) => [stage.id, stage]));
	const phases = [];
	for (const record of ordered.filter((record) => record.type === "Phase")) {
		let parent = byId.get(record.parentId);
		const visited = new Set([record.id]);
		while (parent && parent.type !== "Stage" && !visited.has(parent.id)) {
			visited.add(parent.id);
			parent = byId.get(parent.parentId);
		}
		const phase = recordStatus(record);
		const stage = stageById.get(parent?.id);
		if (stage) stage.phases.push(phase);
		else phases.push(phase);
	}
	const jobs = [];
	// Azure creates job records lazily; phases expose jobs that have not started yet.
	for (const record of ordered.filter(
		(record) =>
			record.type === "Job" ||
			(record.type === "Phase" && !parentsWithJobs.has(record.id)),
	)) {
		let parent = byId.get(record.parentId);
		let phaseId = record.type === "Phase" ? record.id : null;
		const visited = new Set([record.id]);
		while (parent && parent.type !== "Stage" && !visited.has(parent.id)) {
			visited.add(parent.id);
			if (parent.type === "Phase" && !phaseId) phaseId = parent.id;
			parent = byId.get(parent.parentId);
		}
		const job = recordStatus(record);
		job.phaseId = phaseId;
		job.awaitingJob = record.type === "Phase";
		const stage = stageById.get(parent?.id);
		if (stage) stage.jobs.push(job);
		else jobs.push(job);
	}
	return {
		id: build.id,
		name: build.definition?.name ?? `Build ${build.id}`,
		buildNumber: build.buildNumber,
		status: build.status,
		result: build.result ?? null,
		startTime: build.startTime ?? null,
		finishTime: build.finishTime ?? null,
		stages,
		phases,
		jobs,
		timelinePending: timeline === null,
	};
}
