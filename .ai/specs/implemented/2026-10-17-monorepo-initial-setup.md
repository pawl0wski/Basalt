---
date: 2026-10-17
slug: monorepo-initial-setup
type: spec
status: implemented
tags: [monorepo, architecture, packages]
---

# Monorepo Initial Setup

## Goal

Restructure the Tauri + React scaffold into a npm workspaces monorepo under `basalt-app/packages/`, and document the architecture in `AGENTS.md` and `README.md`.

## Package Layout

```
basalt-app/
├── src-tauri/              # Tauri Rust backend (unchanged)
├── packages/
│   ├── app/                # Main app: routing, pages, layout, Tauri integration
│   ├── core/               # Shared logic: file ops, markdown parsing, encryption, types
│   ├── ui/                 # Shared UI: shadcn components, themes, design system
│   └── api/                # Backend API client for future sync server
├── package.json            # Workspace root
└── tauri.conf.json
```

## Details

- **app** — gets the existing `src/`, `index.html`, `vite.config.ts`, `tsconfig.json`. Depends on `@tauri-apps/api`, React, Zustand (future), shadcn/ui (future).
- **core** — framework-agnostic: types, encryption utils, file operations, markdown parsing.
- **ui** — design system: shadcn/ui primitives, theme tokens, layout components. Depends on `@basalt/core` for types.
- **api** — HTTP client for sync server communication. Depends on `@basalt/core` for types.

## Config Changes

- Root `package.json` — add `"workspaces": ["packages/*"]`, proxy dev/build scripts via `-w packages/app`, keep `@tauri-apps/cli` at root.
- `tauri.conf.json` — update `frontendDist` to `../packages/app/dist`, rename product to `"Basalt"`, update identifier.
- `vite.config.ts` — update `src-tauri` ignore path for new nested location.

## Workspace Model

Users pick a directory (default `~/Basalt`). Notes are plain `.md` files on disk — no custom database. This mirrors Obsidian's vault approach.
