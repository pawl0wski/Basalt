# Final gate — 2026-11-16-manage-notes-and-folders

Run log for the E01-S04 (spec phases A–D) implementation. Full validation gate
from `SDLC.md`, run on the run's worktree.

## Result

| Command | Result |
| --- | --- |
| `npm run format:check` | pass — "All matched files use Prettier code style!" |
| `npm run lint` | pass — `eslint . --max-warnings 0`, no output |
| `npm run typecheck` | pass — all workspaces + `tsc -p e2e` |
| `npm test` | pass — 106 files, 1473 tests |
| `npm run build` | pass — `tsc && vite build` |
| `npm run test:e2e` | pass — 162 tests (30 in `e2e/move-notes.spec.ts`) |
| `npm run test:stories` | pass — 47 files, 237 tests |
| `npm run check:tokens` | pass — "No values outside the tokens." |
| `npm run rust:fmt` | **not run** — `cargo fmt` unavailable (no `rustfmt` component in this sandbox) |
| `npm run rust:lint` | **not run** — `cargo clippy` unavailable (no `clippy` component in this sandbox) |

No Rust changed in this run, so the two Rust commands are environment
limitations, not code failures. They must be run in CI.

## What the run delivered

Spec phases A–D, all committed 1:1 with their Steps (see `PLAN.md`):

- **Core** — `WorkspaceFileSystem.rename`, `buildTree` (C-5 filtering and
  ordering), `rewriteRelativeLinks` (Lezer, with a round-trip property test),
  `renameNote`, `moveNotes`, `createFolder` use cases.
- **ui** — `Tree` (multi-select, drop target, keyboard, per-depth row style),
  `ContextMenu`, rename and new-folder dialogs with an inline error line.
- **app** — `features/tree` store, actions and wiring; the notes store
  `renamePath` so tabs, sessions, autosave and settings follow a path change;
  i18n `tree.*`.
- **e2e** — `manage-notes.spec.ts` (AC-04.1, 04.3, 04.4, 04.6, 04.7, 04.8,
  04.9) and `move-notes.spec.ts` (AC-04.5, 04.7, 04.10, 04.11, 04.13).

## Not delivered (blocked / out of scope)

- **Phase E — delete** (AC-04.2, AC-04.12, the "Delete N notes" entry of
  AC-04.11). Blocked on C-1 (custom Rust `move_to_trash`), C-8 and C-9 owner
  confirmation. `deleteNotes` and `WorkspaceTrash` are not implemented. The PR
  uses `Refs #16`, never `Closes #16`.
- **C-5 per-folder read errors.** `WorkspaceFileSystem.list()` is a flat
  recursive listing that fails as a whole, so a single unreadable folder cannot
  be reported inline. The ui `Tree` renders a folder `error`; the adapter never
  sets it. Supporting it needs a port change (partial results with per-directory
  errors) and is out of scope for A–D.

## Unverified

- Real Tauri `rename` and native HTML5 drag-and-drop on Linux WebKitGTK /
  Windows WebView2. Only fakes and the memory platform were exercised. Listed
  in the PR.
