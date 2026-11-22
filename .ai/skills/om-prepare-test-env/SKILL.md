# om-prepare-test-env — Basalt specifics

Extends the installed `om-prepare-test-env` skill. Entrypoint: `sh .ai/scripts/test-env-up.sh` (teardown: `sh .ai/scripts/test-env-down.sh`).

Only the POSIX `sh` flavor is maintained (maintainer decision, 2026-11-22). Do not generate `test-env-up.ps1` / `test-env-down.ps1`; on Windows run the `.sh` scripts from WSL2 or Git Bash.

## Run recipe (discovered 2026-11-22)

- Mode `discovered`: the repo's own browser recipe from `README.md` § Running the app — Vite dev server of `basalt-app/packages/app` with `VITE_BASALT_PLATFORM=memory`, bound to `127.0.0.1:1420` (`strictPort`). No backing services, no credentials.
- Prep chain: `(cd basalt-app && npm ci)`, cached on `basalt-app/package.json`, `package-lock.json`, `packages/*/package.json` and the Node version. Source edits are hot-reloaded and never trigger a restart.
- Browser: the repo's own `@playwright/test` (Chromium). The script installs Chromium only when its executable is missing (`--with-deps` when passwordless sudo exists).
- Port 1420 matters: `basalt-app/playwright.config.ts` uses `reuseExistingServer`, so `npm run test:e2e` attaches to this server. If 1420 is busy the script picks a free port and the e2e suite starts its own.
- Readiness probes: `/` contains `<div id="root">`; `/src/platform/create-platform.ts` contains `"memory"` (proves the memory platform is on); `/src/main.tsx` transforms.

## Gotchas baked into the script

- No Node in a fresh sandbox: the script installs `nodejs-22` + `npm` via apt when passwordless sudo and the DHI repo exist; otherwise it stops with a clear message. CI uses Node 22.
- `NODE_USE_ENV_PROXY=1` in the sandbox makes every `node` call print `UNDICI-EHPA`; the scripts add `--disable-warning=UNDICI-EHPA` to `NODE_OPTIONS`.
- A direct-mode mount carries the Windows host's `node_modules` (win32 esbuild/rollup). The script refuses to `npm ci` over it instead of clobbering the host install; use clone mode or a scratchpad copy.

## Timings (2026-11-22, Linux sandbox, clone mode)

Cold 75s (npm ci + Chromium download), warm 0.3s (reused), cached restart 2s, dependency change 12s.
