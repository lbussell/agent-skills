const key = new URL(location.href).searchParams.get("key");
const runs = document.querySelector("#runs");
const connectionError = document.querySelector("#connection-error");
const actionError = document.querySelector("#action-error");
const expanded = new Map();
let signature;
let updating = false;
let busy = false;

const labels = {
	succeeded: "Succeeded",
	failed: "Failed",
	inProgress: "Running",
	pending: "Pending",
	notStarted: "Not started",
	postponed: "Postponed",
	completed: "Completed",
	canceled: "Canceled",
	cancelling: "Canceling",
	skipped: "Skipped",
	abandoned: "Abandoned",
	succeededWithIssues: "Warnings",
	notReady: "Not ready",
	none: "Pending",
	unknown: "Unknown",
};
const paths = {
	succeeded:
		'<circle cx="8" cy="8" r="7" fill="currentColor" stroke="none"/><path d="m4.5 8 2.2 2.2 4.8-4.6" stroke="var(--surface)" stroke-width="1.7"/>',
	failed:
		'<circle cx="8" cy="8" r="7" fill="currentColor" stroke="none"/><path d="m5.5 5.5 5 5m0-5-5 5" stroke="var(--surface)" stroke-width="1.7"/>',
	inProgress:
		'<circle cx="8" cy="8" r="6.5" opacity=".3"/><path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" stroke-width="2"/>',
	pending: '<circle cx="8" cy="8" r="6.5"/><path d="M8 4v4l2.5 1.5"/>',
	skipped: '<circle cx="8" cy="8" r="6.5"/><path d="M4.5 8h7"/>',
	canceled: '<circle cx="8" cy="8" r="6.5"/><path d="m3.4 3.4 9.2 9.2"/>',
	succeededWithIssues:
		'<path d="M8 1.5 15 14H1Z"/><path d="M8 6v3.5m0 2v.1" stroke-width="1.7"/>',
	chevron: '<path d="m6 3 5 5-5 5"/>',
	refresh: '<path d="M13.5 6A5.5 5.5 0 1 0 13 11M13.5 2v4h-4"/>',
};

function node(tag, text, className) {
	const element = document.createElement(tag);
	if (text !== undefined) element.textContent = text;
	if (className) element.className = className;
	return element;
}

function icon(name, className = "icon") {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 16 16");
	svg.setAttribute("fill", "none");
	svg.setAttribute("stroke", "currentColor");
	svg.setAttribute("stroke-width", "1.3");
	svg.setAttribute("stroke-linecap", "round");
	svg.setAttribute("stroke-linejoin", "round");
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("class", className);
	svg.innerHTML = paths[name] ?? paths.pending;
	return svg;
}

function value(record) {
	return record.result ?? record.state ?? record.status ?? "unknown";
}

function statusSymbol(record) {
	const state = value(record);
	const element = node("span", undefined, "status-symbol");
	if (Object.hasOwn(labels, state)) element.classList.add(state);
	const label = labels[state] ?? state;
	element.title = label;
	element.setAttribute("role", "img");
	element.setAttribute("aria-label", label);
	element.append(icon(state === "abandoned" ? "failed" : state));
	return element;
}

function relative(date) {
	const seconds = Math.max(
		0,
		Math.floor((Date.now() - Date.parse(date)) / 1000),
	);
	if (seconds < 5) return "just now";
	if (seconds < 60) return `${seconds}s ago`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	return `${Math.floor(seconds / 3600)}h ago`;
}

function elapsed(record) {
	if (!record.startTime) return "-";
	const seconds = Math.max(
		0,
		Math.floor(
			((record.finishTime ? Date.parse(record.finishTime) : Date.now()) -
				Date.parse(record.startTime)) /
				1000,
		),
	);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m ${remainingSeconds}s`;
}

function duration(record) {
	const element = node("span", elapsed(record), "duration");
	if (record.startTime) {
		element.dataset.start = record.startTime;
		if (record.finishTime) element.dataset.finish = record.finishTime;
	}
	return element;
}

function setError(element, message) {
	element.textContent = message;
	element.hidden = !message;
}

function defaultExpanded(record) {
	return ["inProgress", "failed", "succeededWithIssues", "abandoned"].includes(
		value(record),
	);
}

const statusGroups = [
	{ states: ["failed", "abandoned"], label: "failed", className: "failed" },
	{
		states: ["inProgress", "cancelling"],
		label: "running",
		className: "inProgress",
	},
	{
		states: ["succeededWithIssues"],
		label: "warnings",
		className: "succeededWithIssues",
	},
	{ states: ["succeeded"], label: "succeeded", className: "succeeded" },
	{ states: ["canceled"], label: "canceled", className: "canceled" },
	{ states: ["skipped"], label: "skipped", className: "skipped" },
	{
		states: [
			"pending",
			"notStarted",
			"postponed",
			"notReady",
			"none",
			"unknown",
		],
		label: "pending",
	},
	{ states: ["completed"], label: "completed" },
];

function stageSummary(jobs, groups) {
	const summary = node("span", undefined, "stage-summary");
	for (const group of groups) {
		const count = jobs.filter((job) =>
			group.states.includes(value(job)),
		).length;
		const stat = node(
			"span",
			count ? `${count} ${group.label}` : "",
			`stage-stat ${group.className ?? ""}`.trim(),
		);
		if (!count) {
			stat.classList.add("empty");
			stat.setAttribute("aria-hidden", "true");
		}
		summary.append(stat);
	}
	return summary;
}

function disclosure(record, id, jobs, groups) {
	if (!expanded.has(id)) expanded.set(id, defaultExpanded(record));
	const button = node("button", undefined, "disclosure item");
	const summaryText = stageSummary(jobs, groups).textContent.trim() || "0 jobs";
	button.type = "button";
	button.dataset.focus = id;
	button.dataset.toggle = id;
	button.setAttribute("aria-expanded", String(expanded.get(id)));
	button.setAttribute(
		"aria-label",
		`${record.name}: ${labels[value(record)] ?? value(record)}, ${summaryText}`,
	);
	button.append(
		icon("chevron", "icon disclosure-icon"),
		statusSymbol(record),
		node("span", record.name, "item-name"),
	);
	button.addEventListener("click", () => {
		expanded.set(id, !expanded.get(id));
		applyVisibility();
	});
	return button;
}

function row(record, className, name, summary, hasSummaryColumn) {
	const element = node("tr", undefined, className);
	const cell = node("td");
	cell.append(name);
	element.append(cell);
	if (hasSummaryColumn) {
		const summaryCell = node("td", undefined, "summary-cell");
		if (summary) summaryCell.append(summary);
		element.append(summaryCell);
	}
	const durationCell = node("td", undefined, "duration-cell");
	durationCell.append(duration(record));
	element.append(durationCell);
	return element;
}

const compareNames = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: "base",
}).compare;

function appendJobs(body, jobs, phases, stageId, hasSummaryColumn) {
	const phaseById = new Map(phases.map((phase) => [phase.id, phase]));
	const sorted = jobs.toSorted((a, b) => {
		const phaseA = phaseById.get(a.phaseId);
		const phaseB = phaseById.get(b.phaseId);
		return (
			(phaseA?.order ?? 0) - (phaseB?.order ?? 0) ||
			compareNames(phaseA?.name ?? "", phaseB?.name ?? "") ||
			(a.order ?? 0) - (b.order ?? 0) ||
			compareNames(a.name, b.name)
		);
	});
	for (const record of sorted) {
		const name = node("div", undefined, "item");
		const details = node("span", undefined, "job-details");
		details.append(node("span", record.name, "item-name"));
		if (record.attempt > 1)
			details.append(node("span", `Attempt ${record.attempt}`, "attempt"));
		name.append(statusSymbol(record), details);
		const element = row(record, "job-row", name, undefined, hasSummaryColumn);
		element.dataset.stage = stageId;
		body.append(element);
	}
}

function table(data, runUrl) {
	const element = node("table", undefined, "pipeline-table");
	element.setAttribute(
		"aria-label",
		`${data.name} stages and jobs, sorted by phase`,
	);
	const allJobs = data.stages.flatMap((stage) => stage.jobs).concat(data.jobs);
	const groups = statusGroups.filter((group) =>
		allJobs.some((job) => group.states.includes(value(job))),
	);
	const hasSummaryColumn = groups.length > 0;
	element.style.setProperty("--status-columns", String(groups.length));
	element.style.setProperty("--summary-width", `${groups.length * 76}px`);
	const columns = node("colgroup");
	columns.append(node("col"));
	if (hasSummaryColumn)
		columns.append(node("col", undefined, "summary-column"));
	columns.append(node("col", undefined, "duration-column"));
	const body = node("tbody");
	for (const stage of data.stages) {
		const id = `${runUrl}:stage:${stage.id}`;
		const phases = stage.phases ?? [];
		const summary = stageSummary(stage.jobs, groups);
		body.append(
			row(
				stage,
				"stage-row",
				disclosure(stage, id, stage.jobs, groups),
				summary,
				hasSummaryColumn,
			),
		);
		appendJobs(body, stage.jobs, phases, id, hasSummaryColumn);
	}
	appendJobs(body, data.jobs, data.phases ?? [], "", hasSummaryColumn);
	element.append(columns, body);
	return element;
}

function applyVisibility() {
	for (const button of runs.querySelectorAll("[data-toggle]")) {
		button.setAttribute(
			"aria-expanded",
			String(expanded.get(button.dataset.toggle)),
		);
	}
	for (const row of runs.querySelectorAll("tr[data-stage]")) {
		row.hidden = Boolean(row.dataset.stage && !expanded.get(row.dataset.stage));
	}
}

function render(state) {
	const nextSignature = JSON.stringify(state);
	if (signature === nextSignature) return;
	signature = nextSignature;
	const focused = document.activeElement?.dataset.focus;
	runs.replaceChildren();
	if (!state.runs.length) {
		runs.append(
			node(
				"p",
				"No pipelines watched. Paste an Azure DevOps run URL above to see its stages and jobs.",
				"empty",
			),
		);
	}
	for (const run of state.runs) {
		const section = node("section", undefined, "run");
		const header = node("div", undefined, "run-header");
		const identity = node("div", undefined, "run-identity");
		const heading = node("h2", undefined, "run-title");
		const link = node(
			"a",
			run.data?.name ??
				`Pipeline run ${new URL(run.url).searchParams.get("buildId")}`,
		);
		link.href = run.url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		if (run.data) heading.append(statusSymbol(run.data));
		heading.append(link);
		identity.append(heading);
		const meta = node("div", undefined, "run-meta");
		const location = new URL(run.url).pathname
			.split("/")
			.filter(Boolean)
			.slice(0, 2)
			.map(decodeURIComponent)
			.join(" / ");
		meta.append(node("span", location));
		if (run.data)
			meta.append(node("span", `Run ${run.data.buildNumber ?? run.data.id}`));
		identity.append(meta);
		const stop = node("button", "Unwatch");
		stop.dataset.focus = `${run.url}:stop`;
		stop.title =
			"Remove from this monitor. This does not stop the Azure pipeline.";
		stop.setAttribute(
			"aria-label",
			`Stop watching ${run.data?.name ?? run.url}. This does not stop the Azure pipeline.`,
		);
		stop.disabled = busy;
		stop.addEventListener("click", () =>
			action("unwatch", { urls: [run.url] }),
		);
		header.append(identity, stop);
		section.append(header);
		const summary = node("div", undefined, "run-summary");
		if (run.data)
			summary.append(
				node("span", labels[value(run.data)] ?? value(run.data)),
				duration(run.data),
			);
		const updated = node("span", undefined, "updated");
		if (run.updatedAt) {
			updated.dataset.updated = run.updatedAt;
			updated.textContent = `Updated ${relative(run.updatedAt)}`;
			updated.title = new Date(run.updatedAt).toLocaleString();
		} else updated.textContent = "Waiting for first update";
		summary.append(updated);
		section.append(summary);
		if (run.error) {
			const notice = node("div", undefined, "notice");
			notice.setAttribute("role", "status");
			notice.append(
				node("strong", "Updates paused. Displayed data is stale."),
				node("span", run.error),
			);
			if (run.nextPollAt) {
				const seconds = Math.max(
					0,
					Math.ceil((Date.parse(run.nextPollAt) - Date.now()) / 1000),
				);
				notice.append(node("div", `Next retry in ${seconds}s.`, "retry"));
			}
			section.append(notice);
		}
		if (run.data?.timelinePending)
			section.append(
				node("p", "Waiting for Azure DevOps to create the timeline.", "empty"),
			);
		if (run.data && !run.data.timelinePending)
			section.append(table(run.data, run.url));
		runs.append(section);
	}
	applyVisibility();
	if (focused) {
		[...runs.querySelectorAll("[data-focus]")]
			.find((element) => element.dataset.focus === focused)
			?.focus({ preventScroll: true });
	}
}

async function request(path, input) {
	const response = await fetch(`/${path}?key=${key}`, {
		...(input === undefined
			? {}
			: {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				}),
		signal: AbortSignal.timeout(input === undefined ? 10_000 : 120_000),
	});
	if (!response.ok) {
		const text = await response.text();
		let message = `Request failed (HTTP ${response.status}).`;
		try {
			message = JSON.parse(text).error ?? message;
		} catch {
			/* Non-JSON HTTP errors keep the status message. */
		}
		throw new Error(message);
	}
	return response.json();
}

function setBusy(value) {
	busy = value;
	for (const button of document.querySelectorAll("button:not(.disclosure)"))
		button.disabled = busy;
	const refresh = document.querySelector("#refresh");
	refresh.replaceChildren(
		icon("refresh"),
		node("span", busy ? "Updating..." : "Refresh"),
	);
}

async function action(name, input) {
	if (busy) return;
	setBusy(true);
	try {
		render(await request(name, input));
		setError(actionError, "");
		setError(connectionError, "");
		if (name === "watch") document.querySelector("#urls").value = "";
	} catch (failure) {
		setError(actionError, failure.message);
	} finally {
		setBusy(false);
	}
}

document.querySelector("#add").addEventListener("submit", (event) => {
	event.preventDefault();
	action("watch", {
		urls: document.querySelector("#urls").value.trim().split(/\s+/),
	});
});
document
	.querySelector("#refresh")
	.addEventListener("click", () => action("refresh", {}));
async function update() {
	if (updating || busy) return;
	updating = true;
	try {
		render(await request("state"));
		setError(connectionError, "");
	} catch {
		setError(
			connectionError,
			"Canvas connection lost. Data may be stale. Retrying automatically; if this persists, ask the agent to reopen the Azure pipelines canvas.",
		);
	} finally {
		updating = false;
	}
}

setBusy(false);
update();
setInterval(update, 3000);
setInterval(() => {
	for (const element of runs.querySelectorAll("[data-updated]")) {
		element.textContent = `Updated ${relative(element.dataset.updated)}`;
	}
	for (const element of runs.querySelectorAll("[data-start]")) {
		element.textContent = elapsed({
			startTime: element.dataset.start,
			finishTime: element.dataset.finish,
		});
	}
}, 1000);
