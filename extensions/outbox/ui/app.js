const token = new URLSearchParams(location.search).get("t") ?? "";
const withToken = (path) => `${path}?t=${encodeURIComponent(token)}`;
const $ = (selector) => document.querySelector(selector);

const listEl = $("#list");
const emptyEl = $("#empty");
const countEl = $("#count");
const connEl = $("#conn");
const toastEl = $("#toast");
const headingEl = $("#title");

const views = new Map();
let sequence = 0;

// Keeps scroll-padding in step with the sticky action bar so focus is never hidden under it.
const footObserver = new ResizeObserver(() => {
    const tallest = Math.max(0, ...[...document.querySelectorAll(".foot")].map((foot) => foot.offsetHeight));
    document.documentElement.style.setProperty("--ob-foot-height", `${tallest}px`);
});

async function post(path, body) {
    let response;
    try {
        response = await fetch(withToken(path), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch {
        throw new Error("Couldn\u2019t reach the outbox. Reload this panel and try again.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error ?? `The outbox returned an error (${response.status}). Reload this panel and try again.`);
    }
    return data;
}

function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === false) continue;
        if (key === "class") el.className = value;
        else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
        else el.setAttribute(key, value === true ? "" : value);
    }
    el.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
    return el;
}

let toastTimer;
function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
}

function timeAgo(iso) {
    const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function autosize(area) {
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight + 2}px`;
}

const chevronSvg =
    '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>';

function buildView(proposal) {
    const uid = `p${++sequence}`;
    const decisions = proposal.decisions.map((d) => ({ ...d }));
    const label = proposal.title || proposal.id;
    const draftTimers = new Map();
    const controls = [];
    let open = true;
    let declining = false;
    let busy = false;
    let reason = "";

    const isEdited = (d) => d.value !== d.proposed;
    const anyEdited = () => decisions.some(isEdited);

    const titleId = `${uid}-title`;
    const headTag = h("span", { class: "tag", hidden: true }, "Edited");
    const metaEl = h("p", { class: "meta" });
    const titleEl = h("h2", { class: proposal.title ? "title" : "title is-id", id: titleId, tabindex: "-1" }, label);
    const toggle = h("button", {
        class: "toggle",
        type: "button",
        hidden: true,
        title: "Collapse",
        "aria-expanded": "true",
        "aria-controls": `${uid}-body`,
        "aria-labelledby": titleId,
        onclick: () => setOpen(!open),
    });
    toggle.innerHTML = chevronSvg;
    const bodyEl = h("div", { class: "body", id: `${uid}-body` });
    const head = h("div", { class: "card-head" }, h("div", { class: "titles" }, titleEl, metaEl), headTag, toggle);
    const card = h("article", { class: "card open", "aria-labelledby": titleId }, head, bodyEl);
    const el = h("li", { class: "proposal" }, card);

    function refreshMeta() {
        const count = decisions.length;
        const parts = [
            ...(proposal.title ? [h("code", {}, proposal.id)] : []),
            h("span", { class: "nowrap" }, count === 0 ? "no decisions" : count === 1 ? "1 decision" : `${count} decisions`),
            h("span", { class: "nowrap" }, timeAgo(proposal.createdAt)),
        ];
        metaEl.replaceChildren(...parts.flatMap((part, index) => (index ? [" \u00b7 ", part] : [part])));
    }

    function refreshEdited() {
        headTag.hidden = !anyEdited();
        for (const control of controls) control.refresh?.();
    }

    function queueDraft(index) {
        clearTimeout(draftTimers.get(index));
        draftTimers.set(
            index,
            setTimeout(() => post("/api/draft", { id: proposal.id, index, value: decisions[index].value }).catch(() => {}), 350),
        );
    }

    function buildDecision(d, index) {
        const fieldId = `${uid}-d${index}`;
        const helpId = `${fieldId}-help`;
        const tag = h("span", { class: "tag", hidden: true }, "Edited");
        const reset = h("button", { class: "link", type: "button", hidden: true }, "Reset");
        const tools = h("span", { class: "tools" }, tag, reset);
        const help = d.description ? h("p", { class: "decision-help", id: helpId }, d.description) : null;
        const nameId = `${fieldId}-name`;
        const isText = d.type === "text";
        const nameEl = isText
            ? h("label", { class: "decision-name", id: nameId, for: fieldId }, d.name)
            : h("span", { class: "decision-name", id: nameId }, d.name);
        let field;
        let syncField;

        if (isText) {
            const area = h("textarea", { id: fieldId, rows: "1", spellcheck: "true", "aria-describedby": help ? helpId : false });
            area.addEventListener("input", () => {
                d.value = area.value;
                autosize(area);
                refreshEdited();
                queueDraft(index);
            });
            syncField = () => {
                area.value = d.value;
                autosize(area);
            };
            controls.push({ autosize: () => autosize(area) });
            field = area;
        } else {
            const radios = [
                ["yes", "Yes"],
                ["no", "No"],
                ["none", "No answer"],
            ].map(([value, text]) => {
                const input = h("input", { type: "radio", name: fieldId, value, "aria-describedby": help ? helpId : false });
                input.addEventListener("change", () => {
                    d.value = value === "yes" ? true : value === "no" ? false : null;
                    refreshEdited();
                    queueDraft(index);
                });
                return { input, node: h("label", {}, input, h("span", {}, text)) };
            });
            syncField = () => {
                const current = d.value === true ? "yes" : d.value === false ? "no" : "none";
                for (const { input } of radios) input.checked = input.value === current;
            };
            field = h("div", { class: "seg" }, ...radios.map((r) => r.node));
        }

        const wrapper = h(
            "div",
            { class: "decision", role: isText ? false : "group", "aria-labelledby": isText ? false : nameId },
            h("div", { class: "decision-head" }, nameEl, tools),
            help,
            field,
        );

        reset.addEventListener("click", () => {
            d.value = d.proposed;
            syncField();
            refreshEdited();
            queueDraft(index);
        });
        syncField();
        const refresh = () => {
            tag.hidden = reset.hidden = !isEdited(d);
        };
        controls.push({ refresh });
        refresh();
        return wrapper;
    }

    const errorEl = h("p", { class: "error", role: "alert", hidden: true });
    const foot = h("div", { class: "foot" });

    function showError(message) {
        errorEl.textContent = message;
        errorEl.hidden = !message;
    }

    function setBusy(value) {
        busy = value;
        for (const button of foot.querySelectorAll("button")) {
            if (value) button.setAttribute("aria-disabled", "true");
            else button.removeAttribute("aria-disabled");
        }
    }

    // aria-disabled keeps the clicked button focusable while a request is in flight.
    const act = (fn) => () => {
        if (!busy) fn();
    };

    async function submit(payload, doneMessage) {
        setBusy(true);
        showError("");
        try {
            await post("/api/resolve", { id: proposal.id, ...payload });
            toast(doneMessage);
            removeView(proposal.id);
        } catch (error) {
            showError(error.message);
            setBusy(false);
        }
    }

    function renderFoot() {
        foot.replaceChildren();
        foot.classList.toggle("declining", declining);
        if (!declining) {
            foot.append(
                errorEl,
                h(
                    "div",
                    { class: "actions" },
                    h(
                        "button",
                        {
                            class: "btn",
                            type: "button",
                            onclick: act(() => {
                                declining = true;
                                showError("");
                                renderFoot();
                                foot.querySelector("textarea").focus();
                            }),
                        },
                        "Decline\u2026",
                    ),
                    h(
                        "button",
                        {
                            class: "btn primary",
                            type: "button",
                            onclick: act(() =>
                                submit({ action: "approve", values: decisions.map((d) => d.value) }, `Approved \u201c${label}\u201d and sent to Copilot.`),
                            ),
                        },
                        "Approve",
                    ),
                ),
            );
            return;
        }
        const area = h("textarea", { id: `${uid}-reason`, placeholder: "Shorten the title and drop the second paragraph." });
        area.value = reason;
        area.addEventListener("input", () => (reason = area.value));
        area.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !busy) cancelDecline();
        });
        const cancelDecline = () => {
            declining = false;
            showError("");
            renderFoot();
            foot.querySelector(".btn").focus();
        };
        const declineMessage = () =>
            area.value.trim()
                ? `Declined \u201c${label}\u201d and sent your reason to Copilot.`
                : `Declined \u201c${label}\u201d. Copilot was told no reason was given.`;
        foot.append(
            h(
                "div",
                { class: "decline" },
                h("label", { for: `${uid}-reason` }, "Why are you declining? (optional)"),
                area,
                errorEl,
                h(
                    "div",
                    { class: "actions" },
                    h("button", { class: "btn", type: "button", onclick: act(cancelDecline) }, "Cancel"),
                    h(
                        "button",
                        {
                            class: "btn danger",
                            type: "button",
                            onclick: act(() => submit({ action: "decline", reason: area.value }, declineMessage())),
                        },
                        "Decline proposal",
                    ),
                ),
            ),
        );
    }

    function layout() {
        if (!bodyEl.hidden) for (const control of controls) control.autosize?.();
    }

    function setOpen(value) {
        open = value;
        card.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.title = open ? "Collapse" : "Expand";
        bodyEl.hidden = !open;
        layout();
    }

    // A lone proposal has nothing to collapse against, so it stays open and the toggle disappears.
    function setCollapsible(value) {
        toggle.hidden = !value;
        if (!value) setOpen(true);
    }

    if (proposal.description) bodyEl.append(h("p", { class: "about" }, proposal.description));
    bodyEl.append(...decisions.map(buildDecision), foot);
    renderFoot();
    refreshMeta();
    refreshEdited();
    footObserver.observe(foot);

    return { el, layout, setCollapsible, refreshMeta, focusHead: () => titleEl.focus() };
}

function removeView(id) {
    const view = views.get(id);
    if (!view) return;
    if (view.el.contains(document.activeElement)) {
        const ids = [...views.keys()];
        const index = ids.indexOf(id);
        const next = views.get(ids[index + 1] ?? ids[index - 1]);
        if (next) next.focusHead();
        else headingEl.focus();
    }
    views.delete(id);
    view.el.classList.add("leaving");
    const finish = () => view.el.remove();
    view.el.addEventListener("transitionend", (event) => event.target === view.el && finish());
    setTimeout(finish, 600);
    updateChrome();
}

function updateChrome() {
    const total = views.size;
    emptyEl.hidden = total !== 0;
    countEl.textContent = total === 0 ? "" : `${total} waiting`;
    for (const view of views.values()) view.setCollapsible(total > 1);
}

function render(proposals) {
    const ids = new Set(proposals.map((p) => p.id));
    for (const id of [...views.keys()]) if (!ids.has(id)) removeView(id);
    for (const proposal of proposals) {
        if (views.has(proposal.id)) continue;
        const view = buildView(proposal);
        views.set(proposal.id, view);
        listEl.append(view.el);
        view.layout();
    }
    updateChrome();
}

const events = new EventSource(withToken("/api/events"));
events.addEventListener("state", (event) => {
    connEl.textContent = "";
    render(JSON.parse(event.data).proposals);
});
events.addEventListener("error", () => (connEl.textContent = "Reconnecting\u2026"));

setInterval(() => views.forEach((view) => view.refreshMeta()), 30_000);
// Textareas size to their content, so a width change can re-wrap them.
window.addEventListener("resize", () => views.forEach((view) => view.layout()));
