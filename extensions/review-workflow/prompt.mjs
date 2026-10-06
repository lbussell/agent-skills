import { readFile, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function loadPrompt(file, ancestors = []) {
    const path = await realpath(file);
    if (ancestors.includes(path)) {
        throw new Error(`Circular prompt include: ${[...ancestors, path].join(" -> ")}`);
    }

    const text = await readFile(path, "utf8");
    const lines = [];
    for (const line of text.trim().split(/\r?\n/)) {
        const include = line.match(/^[ \t]*@(\S+\.md)[ \t]*$/);
        lines.push(include
            ? await loadPrompt(resolve(dirname(path), include[1]), [...ancestors, path])
            : line);
    }

    return lines.join("\n");
}
