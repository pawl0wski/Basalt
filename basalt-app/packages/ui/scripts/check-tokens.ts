import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import { findViolations, ignoredPaths, scannedExtensions } from "./checkTokens.ts";

const packageRoot = resolve(import.meta.dirname, "..");
const targets = process.argv.slice(2);
const roots = targets.length
    ? targets.map((target) => resolve(process.cwd(), target))
    : ["src", ".storybook", "docs"].map((directory) => join(packageRoot, directory));

function* walk(path: string): Generator<string> {
    const stats = statSync(path, { throwIfNoEntry: false });
    if (!stats) return;
    if (stats.isFile()) {
        yield path;
        return;
    }
    for (const entry of readdirSync(path)) {
        if (entry === "node_modules" || entry === "storybook-static") continue;
        yield* walk(join(path, entry));
    }
}

let count = 0;
for (const root of roots) {
    for (const file of walk(root)) {
        const display = relative(process.cwd(), file);
        const posix = file.split("\\").join("/");
        if (!scannedExtensions.test(file) || ignoredPaths.some((pattern) => pattern.test(posix))) continue;
        for (const violation of findViolations(readFileSync(file, "utf8"), display)) {
            count += 1;
            console.log(
                `${violation.file}:${violation.line}:${violation.column}  ${violation.category}  ${violation.match}`,
            );
        }
    }
}

if (count > 0) {
    console.error(`\n${count} value(s) outside the tokens. Use a token class from @basalt/ui; see Foundations.`);
    process.exit(1);
}
console.log("No values outside the tokens.");
