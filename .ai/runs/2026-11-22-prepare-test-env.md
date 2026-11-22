---
date: 2026-11-22
slug: prepare-test-env
type: run
status: completed
tags: [tooling, qa, tests]
---

# Generate the reusable QA test environment

## Goal

Run `om-prepare-test-env`: no entrypoint existed, so discover how Basalt runs and generate verified up/down scripts plus the shared descriptor.

## What was done

- Discovered the recipe from `README.md`, `basalt-app/playwright.config.ts`, `packages/app/vite.config.ts` and CI: memory-platform Vite dev server on port 1420, prep `npm ci`, Playwright Chromium. No services, no credentials.
- Installed Node 22 + npm (DHI apt) in the sandbox; the script now does this itself when possible.
- Wrote `.ai/scripts/test-env-up.sh` and `test-env-down.sh` (POSIX sh): PID-checked lock, reuse check (PID, three readiness probes, TTL, dependency freshness), build cache over manifests and lockfile, health wait, descriptor `.ai/qa/test-env.json`.
- Added `.gitattributes` (`*.sh` LF) and gitignored the per-checkout state files (build cache, lock, stamp, app log).
- Repo-local notes in `.ai/skills/om-prepare-test-env/SKILL.md`; lesson `2026-11-22-test-env-entrypoint.md`.

## Decisions

- Wrap the repo's own dev server rather than `vite preview` of a build: it is what the e2e suite uses, and HMR keeps it fresh without restarts. Freshness therefore tracks dependency inputs only.
- Prefer port 1420 so `npm run test:e2e` reuses the server via `reuseExistingServer`.
- Node 22 to match CI (the older lesson used 24).
- Refuse `npm ci` over a Windows-host `node_modules` instead of overwriting it.

## Outcomes

Cold 75s, warm 0.3s (same `runId`, reused), cached restart 2s, dependency touch → rebuild 12s. Down is idempotent. Concurrent boots serialize on the lock. Playwright 1.64.1 doctor: Chromium launches, `data:` page renders, the app exposes `window.__basaltTestFs`.

## Open issues

- None. The maintainer decided the POSIX sh flavor is enough; no PowerShell entrypoint will be generated.
