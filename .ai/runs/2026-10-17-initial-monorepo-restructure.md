---
date: 2026-10-17
slug: initial-monorepo-restructure
type: run
status: completed
tags: [monorepo, architecture, setup]
---

# Initial Monorepo Restructure

## Goal

Restructure the default Tauri + React scaffold into a npm workspaces monorepo with `packages/app`, `packages/core`, `packages/ui`, `packages/api`. Update `AGENTS.md` and `README.md` with architecture documentation.

## Work Done

1. Created `.ai/` directory structure (`specs/`, `runs/`, `lessons/`) with `AGENTS.md` and `CLAUDE.md` enforcing front-matter metadata conventions.
2. Moved `src/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `public/` into `packages/app/`.
3. Created `packages/core/`, `packages/ui/`, `packages/api/` with `package.json` and `src/index.ts` stubs.
4. Updated root `package.json` — added `workspaces`, moved deps to `@basalt/app`, proxied scripts.
5. Updated `tauri.conf.json` — product name → `"Basalt"`, `frontendDist` → `../packages/app/dist`, identifier → `com.basalt.app`.
6. Updated `AGENTS.md` with tech stack table, workspace model, and package architecture.
7. Updated `README.md` with full architecture section.
8. Ran `npm install` — 44 packages, 0 vulnerabilities.

## Decisions

- Used npm workspaces over pnpm/turborepo for simplicity — single lockfile, no extra tooling.
- Kept `src-tauri/` at the monorepo root since Tauri's CLI and `tauri.conf.json` expect it there.
- Used `@basalt/*` npm scope for internal packages.

## Open Issues

- None. The restructure is complete and `npm run tauri dev` should work unchanged (untested in this run).
