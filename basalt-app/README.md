# basalt-app

This is the monorepo root for the Basalt application source code.

See the [project-level README](../README.md) for overall project documentation.

## Package Architecture

See `packages/` for the monorepo packages:

- `packages/app` — main application (Vite + React, Tauri plugin adapters)
- `packages/core` — shared logic and types
- `packages/ui` — shared UI components
- `packages/api` — backend API client

## Rust

`src-tauri/` is a minimal Tauri host (bootstrap and plugin registration). Keep application logic in TypeScript; see the "Rust Policy" section of the project README.
