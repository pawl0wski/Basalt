---
date: 2026-10-17
slug: implement-engineering-standards
type: run
status: completed
tags: [engineering-standards, ci, typescript, react, tauri]
---

# Implement Engineering Standards

## Goal

Implement the approved current engineering standards specification at `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md`.

## Work done

- Added root formatting, lint, typecheck, test, and Rust check scripts to the npm workspace.
- Added flat ESLint configuration for TypeScript and React, including package import restrictions for `core`, `ui`, and `api` boundaries.
- Added Vitest with jsdom and React Testing Library setup; added Button rendering, disabled state, and interaction tests.
- Added strict TypeScript configurations for the shared packages and typecheck/test scripts to every package.
- Updated the app to import the UI component through the `@basalt/ui` package API.
- Renamed the React component file `button.tsx` to `Button.tsx`; moved the non-component variant helper to `buttonVariants.ts`.
- Added GitHub Actions CI for formatting, lint, typecheck, tests, frontend build, Rust checks, and desktop builds. Linux checks and the Linux Tauri build use Alpine containers; Windows builds use a native runner. macOS builds are not included because macOS is not currently supported.
- Configured Alpine Linux CI jobs to use `node:22-alpine3.24`; installed the Node compatibility package for GitHub JavaScript actions and Alpine packages for Rust/Tauri WebKitGTK builds.
- Updated the specification's implementation status notes.

## Verification

- `npm ci` completed successfully.
- `npm run format:check` passed for the app workspace; Prettier also passed for root `AGENTS.md`, the specification, and the workflow file.
- `npm run lint` passed.
- `npm run typecheck` passed for all four workspaces.
- `npm test` passed: 3 Button tests.
- `npm run build` passed.
- `git diff --check` passed.
- Rust formatting could not be run locally because `cargo` is not installed in the environment. The CI workflow installs the Rust toolchain and runs Rust checks.
- The GitHub Actions workflow cannot be executed locally because Docker is not installed in the environment; Alpine package resolution and the Alpine Tauri link are therefore validated only by CI.

## Open items

- CI jobs report quality-check outcomes but are intentionally not enforced through branch protection or required status checks.
- Dependency installation reported 10 existing/resolved dependency audit findings (1 moderate, 7 high, 2 critical); no automatic audit fix was applied.
