---
date: 2026-11-22
slug: test-env-entrypoint
type: lesson
status: active
tags: [tooling, sandbox, tests, qa]
---

# Start the QA environment with `.ai/scripts/test-env-up.sh`

`sh .ai/scripts/test-env-up.sh` brings up the memory-platform dev server on `http://127.0.0.1:1420` and writes `.ai/qa/test-env.json`. It reuses a healthy running server in under a second and skips `npm ci` while the lockfile and manifests are unchanged. `sh .ai/scripts/test-env-down.sh` stops it.

Gotchas it handles:

- The sandbox has no Node; the script installs `nodejs-22` and `npm` (DHI apt repo) when passwordless sudo exists.
- `NODE_USE_ENV_PROXY=1` makes every `node` call print an `UNDICI-EHPA` warning; the scripts pass `--disable-warning=UNDICI-EHPA`.
- In direct mode the mounted `node_modules` is the Windows host's (see `2026-11-22-sandbox-node-modules-are-windows-only.md`); the script refuses to run `npm ci` over it rather than overwrite the host install.
