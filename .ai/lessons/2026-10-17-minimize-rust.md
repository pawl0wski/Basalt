---
date: 2026-10-17
slug: minimize-rust
type: lesson
status: active
tags: [rust, tauri, architecture]
---

# Keep Rust minimal

Basalt is TypeScript-first. `src-tauri/` only bootstraps Tauri and registers official plugins. The template `greet` command and the unused `serde`/`serde_json` dependencies were removed.

- Build features in TypeScript on top of official Tauri plugins (filesystem, dialog, opener) with least-privilege scopes.
- Add a custom Rust command only when a plugin or TypeScript cannot do the job, and document why in a spec.
- Rust tests and the CI `cargo test` step are needed only once custom Rust code exists.
- `Cargo.lock` was edited by hand because no Rust toolchain was available in that run; run `cargo check` once to confirm it is consistent.
