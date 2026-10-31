import { spawnSync } from "node:child_process";
import process from "node:process";
import { themes } from "../.storybook/themes.ts";

let failed = false;
for (const theme of themes) {
    console.log(`\nStories as tests, theme: ${theme}`);
    const result = spawnSync("npx", ["vitest", "run"], {
        stdio: "inherit",
        env: { ...process.env, STORYBOOK_THEME: theme },
    });
    if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
