---
date: 2026-11-16
slug: os-trash-needs-custom-rust
type: lesson
status: active
tags: [tauri, rust, trash, delete, security]
---

# Moving files to the OS trash needs a narrow custom command

- No official Tauri 2 plugin moves a file to the operating system trash:
  `tauri-plugin-fs` exposes `remove` only, which deletes permanently. The
  E01-S04 spec (C-1) therefore allows one small custom Rust command,
  `move_to_trash(paths)`, built on the community `trash` crate. Permanent
  `remove` is never used as a fallback; if the OS has no trash the move fails
  and nothing changes.
- Authorize inside the command, not only in TypeScript. The frontend
  `WorkspacePath` rejects `..`/absolute paths, but the command is the real
  boundary: check every path against the runtime workspace fs scope
  (`tauri_plugin_fs::FsExt::fs_scope()` → `Scope::is_allowed`) before calling
  `trash::delete`. There is no `$HOME/**` scope.
- Application commands registered with `tauri::generate_handler!` need no
  capability entry; the ACL/capability system gates plugin commands, not your
  own. The already-granted `fs` scope is what the command validates against.
- The value of a per-path trash port (`WorkspaceTrash.moveToTrash(paths)`)
  called once per note is C-8 partial failure: a bulk delete continues past a
  failure and can name how many were not deleted. The memory platform's fake
  trash is what the e2e exercises; a read-only flag there reproduces the R-4
  message path.
- UNVERIFIED here: the installed toolchain (rustc 1.63) is too old for edition
  2024, and `rustfmt`/`clippy` are absent, so the command, `cargo test` and
  `tauri build` could not run in this sandbox — only a `rustc --emit=metadata`
  parse check. The Rust gate must run in CI.
