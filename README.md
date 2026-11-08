# Basalt

> A modern note-taking app with end-to-end encryption, multi-platform sync, and rich editing capabilities.

Basalt is a feature-rich note-taking application built with **Tauri**, offering native performance on desktop and a companion Android app. It combines the freedom of local notes with the power of cloud synchronization — secured by full **end-to-end encryption (E2EE)**.

This is not another minimalist notebook. Basalt is designed for people who need advanced knowledge management tools, without compromising on privacy or security.

---

## Features

- **E2EE** — everything is encrypted client-side. Not even our servers can read your notes.
- **Sync** — your notes are available across all your devices in real time.
- **Native apps** — desktop (Windows, macOS, Linux) via Tauri + a dedicated Android app.
- **Rich editor** — full Markdown support, diagrams, tables, embedded files, and more.
- **Knowledge management** — tags, folders, backlinks, graph view.
- **Plugins & extensions** — extend the app with your own modules.
- **Offline-first** — fully functional without an internet connection.
- **Dark mode** — plus full theming support.

Data is encrypted on the client before leaving the device. The server stores only encrypted blobs and minimal metadata required for sync.

The sync backend is open-source and fully self-hostable. You can deploy it on your own infrastructure for complete control over your data.

---

## Architecture

### Tech Stack

| Layer | Choice |
|---|---|
| Desktop/Mobile shell | **Tauri v2** (targets: desktop + Android); Rust limited to a thin, logic-free host |
| Native capabilities | Official Tauri plugins (filesystem, dialog, opener) called from TypeScript |
| Frontend framework | **React 19** with **TypeScript** |
| UI components | **shadcn/ui** (Radix primitives + Tailwind CSS) |
| State management | **Zustand** |
| Build tool | **Vite** |
| Monorepo | npm workspaces under `packages/` |

### Workspace Model

Users create a workspace at a directory of their choosing (default: `~/Basalt`). Inside that directory, notes are stored as plain **Markdown files** (`.md`) alongside other attachments. The app reads and writes files directly on the local filesystem — there is no custom file format or database. This is similar to the Obsidian vault model.

### Package Architecture

```
basalt-app/
├── src-tauri/              # Minimal Tauri host: bootstrap + plugin registration only
├── packages/
│   ├── app/                # Main app: routing, pages, layout, Tauri integration
│   ├── core/               # Shared logic: file ops, markdown parsing, encryption, types
│   ├── ui/                 # Shared UI: shadcn components, themes, design system
│   ├── editor/             # Markdown editor on CodeMirror 6 (framework-agnostic)
│   └── api/                # Backend API client for future sync server
├── package.json            # Workspace root
└── tauri.conf.json
```

- **`@basalt/app`** — the main application. Contains pages, routing, layout, i18n (`i18next` + `react-i18next`, typed keys, English only for now), and Tauri plugin integration through app-owned adapters (file system, dialogs, window management) under `src/platform/`. `createPlatform()` selects the Tauri platform or, for browser tests, the in-memory one (excluded from production bundles, verified by `npm run check:bundle`). Until `__basaltTestFs.setPickerResult(...)` is called, the in-memory folder picker opens a seeded `/demo` workspace so the browser build can be tried by hand; `setPickerResult(null)` makes it cancel and `setPickerResult(undefined)` restores the demo default.
- **`@basalt/core`** — framework-agnostic shared logic. Markdown parsing, encryption primitives, file operations, shared TypeScript types, and utility functions.
- **`@basalt/ui`** — the design system. shadcn/ui components, theme tokens, layout primitives, and reusable UI patterns. Depends only on `@basalt/core` for types.
- **`@basalt/editor`** — the Markdown editor built on CodeMirror 6. A leaf package: no React, no Tauri, no other `@basalt/*` dependency (enforced by ESLint). `@basalt/app` wraps it in a React component.
- **`@basalt/api`** — HTTP client and data layer for future sync server communication. Authentication, API types, and request handling.

### Development

```bash
# Install dependencies (from basalt-app/)
npm install

# Run in development mode
npm run dev          # Vite dev server
npm run tauri dev    # Tauri desktop dev
npm run tauri android dev  # Android dev

# Build for production
npm run tauri build
```

### Rust Policy

Basalt is a TypeScript-first project. Rust is kept to the minimum that Tauri requires:

- `src-tauri/` only bootstraps the app and registers official Tauri plugins. It contains no business logic, no custom commands, and no crypto/sync/parsing code.
- All domain logic (Markdown, E2EE via Web Crypto or a vetted WASM/JS library, sync, file workflows) lives in `@basalt/core` and `@basalt/app`.
- Native capabilities are reached through official Tauri plugins with least-privilege capabilities and scopes, wrapped in app-owned TypeScript adapters.
- A custom Rust command is a last resort: it needs a documented reason why a plugin or TypeScript cannot do the job, and its own spec.
