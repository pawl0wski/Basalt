---
date: 2026-11-08
slug: what-fakes-do-not-prove
type: lesson
status: active
tags: [testing, tauri, risk]
---

# What mocks and fakes do not prove

The Tauri adapters (`WorkspaceFileSystem`, `WorkspaceAccess`, `WorkspacePicker`, `AppSettingsStore`) were tested only against an in-memory fake of the plugin-fs IPC (`platform/tauri/testing/fake-plugin-fs.ts`). Playwright runs against the memory platform. Both prove app logic, not the real plugin or OS.

Unproven until a real desktop run: real error wording (especially on Windows), fs scope enforcement, symlink flags, atomic rename, Windows paths, real watch event shapes and whether deleting the workspace root emits an event carrying the root path (root-lost detection depends on it), mtime units, the close guard and the window permission identifiers. The Rust side could not be compiled in the sandbox (rustc 1.63, no webkit2gtk), so `Cargo.lock` is not updated.

Rules:

- A green fake-based suite is not a platform spike. Mark such tasks "verified against mocks only" and list each assumption as UNVERIFIED in the tracker, the spec status and the run log.
- Keep a manual smoke test on a built desktop app (Linux and Windows) as an explicit step before calling the spec implemented.
- Prefer one fake with a shared contract suite (`describeWorkspaceFileSystemContract`) so the fake cannot drift from the port.
