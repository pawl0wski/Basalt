import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

const isCi = Boolean(process.env.CI);

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: isCi,
    retries: isCi ? 1 : 0,
    reporter: isCi ? [["github"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL: "http://localhost:1420",
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:1420",
        reuseExistingServer: !isCi,
    },
});
