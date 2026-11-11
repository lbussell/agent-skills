import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { OutboxError } from "./store.mjs";

const STATIC_FILES = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/app.css": ["app.css", "text/css; charset=utf-8"],
    "/app.js": ["app.js", "text/javascript; charset=utf-8"],
};
const MAX_BODY_BYTES = 2_000_000;
const UNREADABLE = "Couldn\u2019t read that request. Reload this panel and try again.";
const OUT_OF_DATE = "This panel is out of date. Reload it and try again.";

/**
 * Loopback HTTP server that serves the outbox UI and its JSON/SSE API.
 * Every API call needs the per-process token, which only the URL handed to
 * the canvas contains, so other local pages cannot drive the outbox.
 */
export function createOutboxServer({ store, uiDir, approve, decline, log }) {
    const token = randomBytes(24).toString("hex");
    const tokenBuffer = Buffer.from(token);
    const streams = new Set();
    let server;
    let port = 0;
    let heartbeat;

    const snapshot = () => JSON.stringify({ proposals: store.list() });
    const broadcast = () => {
        const frame = `event: state\ndata: ${snapshot()}\n\n`;
        for (const res of streams) res.write(frame);
    };
    store.onChange(broadcast);

    const hasValidToken = (url) => {
        const given = Buffer.from(url.searchParams.get("t") ?? "");
        return given.length === tokenBuffer.length && timingSafeEqual(given, tokenBuffer);
    };

    function send(res, status, body, type = "application/json; charset=utf-8") {
        res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
        res.end(typeof body === "string" ? body : JSON.stringify(body));
    }

    async function readJson(req) {
        if (!(req.headers["content-type"] ?? "").startsWith("application/json")) {
            throw new OutboxError(UNREADABLE, 415);
        }
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) throw new OutboxError("This proposal is too large to send. Shorten the text and try again.", 413);
            chunks.push(chunk);
        }
        try {
            return JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
            throw new OutboxError(UNREADABLE);
        }
    }

    async function handleApi(req, res, url) {
        if (req.method === "GET" && url.pathname === "/api/state") return send(res, 200, snapshot());

        if (req.method === "GET" && url.pathname === "/api/events") {
            res.writeHead(200, {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-store",
                Connection: "keep-alive",
            });
            res.write(`event: state\ndata: ${snapshot()}\n\n`);
            streams.add(res);
            req.on("close", () => streams.delete(res));
            return;
        }

        if (req.method !== "POST") return send(res, 404, { error: UNREADABLE });
        const body = await readJson(req);

        if (url.pathname === "/api/draft") {
            store.setValue(String(body.id), Number(body.index), body.value);
            return send(res, 200, { ok: true });
        }
        if (url.pathname === "/api/resolve") {
            if (body.action === "approve") {
                const { edited } = await approve(String(body.id), body.values);
                return send(res, 200, { ok: true, edited });
            }
            if (body.action === "decline") {
                await decline(String(body.id), typeof body.reason === "string" ? body.reason : "");
                return send(res, 200, { ok: true });
            }
            throw new OutboxError(UNREADABLE);
        }
        return send(res, 404, { error: UNREADABLE });
    }

    async function handle(req, res) {
        try {
            if (req.headers.host !== `127.0.0.1:${port}`) return send(res, 403, { error: OUT_OF_DATE });
            const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

            if (url.pathname.startsWith("/api/")) {
                if (!hasValidToken(url)) return send(res, 403, { error: OUT_OF_DATE });
                return await handleApi(req, res, url);
            }

            const entry = req.method === "GET" ? STATIC_FILES[url.pathname] : undefined;
            if (!entry) return send(res, 404, "Not found", "text/plain; charset=utf-8");
            send(res, 200, await readFile(join(uiDir, entry[0]), "utf8"), entry[1]);
        } catch (error) {
            if (error instanceof OutboxError) return send(res, error.status, { error: error.message });
            log(`Request failed: ${error?.stack ?? error}`);
            send(res, 500, { error: "The outbox hit an unexpected error. Your edits are kept; try again, or reload this panel." });
        }
    }

    return {
        async start() {
            if (server) return `http://127.0.0.1:${port}/?t=${token}`;
            server = createServer((req, res) => void handle(req, res));
            await new Promise((resolve, reject) => {
                server.once("error", reject);
                server.listen(0, "127.0.0.1", resolve);
            });
            port = server.address().port;
            heartbeat = setInterval(() => {
                for (const res of streams) res.write(": ping\n\n");
            }, 25_000);
            heartbeat.unref();
            return `http://127.0.0.1:${port}/?t=${token}`;
        },
        async stop() {
            if (!server) return;
            clearInterval(heartbeat);
            for (const res of streams) res.end();
            streams.clear();
            const closing = server;
            server = undefined;
            const closed = new Promise((resolve) => closing.close(() => resolve()));
            closing.closeAllConnections();
            await closed;
        },
    };
}
