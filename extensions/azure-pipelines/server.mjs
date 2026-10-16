import { createServer } from "node:http";
import { readFile, writeFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const assets = new Map(
	await Promise.all(
		[
			["/canvas.css", "text/css", "./canvas.css"],
			["/canvas.js", "text/javascript", "./canvas.js"],
		].map(async ([path, type, file]) => [
			path,
			{ type, content: await readFile(new URL(file, import.meta.url), "utf8") },
		]),
	),
);

export async function startServer(monitor) {
	const connectionFile = join(dirname(monitor.file), "connection.json");
	let connection;
	try {
		connection = JSON.parse(await readFile(connectionFile, "utf8"));
		if (
			!Number.isInteger(connection.port) ||
			connection.port < 1 ||
			connection.port > 65535 ||
			!/^[a-f0-9]{48}$/.test(connection.key)
		) {
			throw new Error("Invalid saved Azure pipelines canvas connection.");
		}
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const key = connection?.key ?? randomBytes(24).toString("hex");
	let origin;
	const server = createServer(async (req, res) => {
		res.setHeader("Cache-Control", "no-store");
		res.setHeader("X-Content-Type-Options", "nosniff");
		if (req.headers.host !== new URL(origin).host) {
			res.writeHead(403).end();
			return;
		}
		const url = new URL(req.url, origin);
		if (
			url.searchParams.get("key") !== key ||
			(req.headers.origin && req.headers.origin !== origin)
		) {
			res.writeHead(403).end();
			return;
		}
		try {
			if (req.method === "GET" && url.pathname === "/") {
				res.setHeader("Content-Type", "text/html; charset=utf-8");
				res.setHeader("Referrer-Policy", "no-referrer");
				// The host mirrors app theme tokens through an injected stylesheet.
				res.setHeader(
					"Content-Security-Policy",
					"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
				);
				res.end(html.replaceAll("{{key}}", key));
			} else if (req.method === "GET" && assets.has(url.pathname)) {
				const asset = assets.get(url.pathname);
				res.setHeader("Content-Type", `${asset.type}; charset=utf-8`);
				res.end(asset.content);
			} else if (req.method === "GET" && url.pathname === "/state") {
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify(monitor.snapshot()));
			} else if (
				req.method === "POST" &&
				["/watch", "/unwatch", "/refresh"].includes(url.pathname)
			) {
				if (req.headers["content-type"] !== "application/json") {
					res.writeHead(415).end();
					return;
				}
				let body = "";
				for await (const chunk of req) {
					body += chunk;
					if (body.length > 16_384) throw new Error("Request is too large.");
				}
				const input = JSON.parse(body);
				if (
					url.pathname !== "/refresh" &&
					(!Array.isArray(input.urls) ||
						!input.urls.length ||
						!input.urls.every((item) => typeof item === "string"))
				) {
					throw new Error("Provide an array of pipeline URLs.");
				}
				await (url.pathname === "/refresh"
					? monitor.refresh()
					: url.pathname === "/watch"
						? monitor.watch(input.urls)
						: monitor.unwatch(input.urls));
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify(monitor.snapshot()));
			} else {
				res.writeHead(404).end();
			}
		} catch (error) {
			res.writeHead(400, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: error.message }));
		}
	});
	async function listen(port) {
		await new Promise((resolve, reject) => {
			const onError = (error) => {
				server.removeListener("listening", onListening);
				reject(error);
			};
			const onListening = () => {
				server.removeListener("error", onError);
				resolve();
			};
			server.once("error", onError);
			server.once("listening", onListening);
			server.listen(port, "127.0.0.1");
		});
	}
	// Keep the session's URL stable even when the host does not rehydrate its iframe.
	try {
		await listen(connection?.port ?? 0);
	} catch (error) {
		if (error.code !== "EADDRINUSE" || !connection) throw error;
		await monitor.session.log(
			"Azure pipelines canvas port is occupied. Assigning a new port; reopen the canvas to reconnect.",
			{ level: "error" },
		);
		await listen(0);
	}
	origin = `http://127.0.0.1:${server.address().port}`;
	try {
		await writeFile(
			`${connectionFile}.tmp`,
			JSON.stringify({ port: server.address().port, key }),
			{ mode: 0o600 },
		);
		await rename(`${connectionFile}.tmp`, connectionFile);
	} catch (error) {
		server.close();
		throw error;
	}
	return {
		url: `${origin}/?key=${key}`,
		close: () =>
			new Promise((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
				server.closeAllConnections();
			}),
	};
}
