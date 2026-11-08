import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

const MARKERS = ["__basaltTestFs", "basalt.memory.workspaces"];
const appDirectory = new URL("../packages/app", import.meta.url).pathname;

function build(platform) {
    const outDir = mkdtempSync(join(tmpdir(), "basalt-bundle-"));
    const env = { ...process.env };
    delete env.VITE_BASALT_PLATFORM;
    if (platform) env.VITE_BASALT_PLATFORM = platform;
    try {
        execFileSync(
            "npx",
            ["vite", "build", "--outDir", outDir, "--emptyOutDir"],
            { cwd: appDirectory, env, stdio: "pipe" },
        );
        const text = readdirSync(outDir, { recursive: true })
            .filter((file) => /\.(js|mjs|html)$/.test(String(file)))
            .map((file) => readFileSync(join(outDir, String(file)), "utf8"))
            .join("\n");
        return MARKERS.filter((marker) => text.includes(marker));
    } finally {
        rmSync(outDir, { recursive: true, force: true });
    }
}

const control = build("memory");
if (control.length !== MARKERS.length) {
    console.error(
        "Bundle check is not effective: the memory build is missing markers.",
    );
    process.exit(1);
}

const leaked = build(undefined);
if (leaked.length > 0) {
    console.error(
        `The production bundle contains test-only code: ${leaked.join(", ")}`,
    );
    process.exit(1);
}
console.log("Production bundle does not contain the memory platform.");
