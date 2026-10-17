---
date: 2026-10-17
slug: minimize-rust
type: run
status: completed
tags: [rust, tauri, docs, ci]
---

# Goal

Minimize Rust usage in the project and align documentation.

# Done

- Audit: Rust is only `lib.rs`/`main.rs` (template `greet` command, unused by the frontend) plus unused `serde`/`serde_json`.
- Removed `greet`, `serde`, `serde_json`, template metadata; updated `Cargo.lock` by hand.
- Added a "Rust Policy" to `README.md`; updated `basalt-app/README.md`, `AGENTS.md`, and the engineering standards spec (plugins-first, custom commands only with justification, Rust tests only for custom code).
- Removed the `cargo test` step from the CI Rust job.

# Open issues

- No Rust toolchain in this environment: Rust changes and `Cargo.lock` were not compiled. Run `npm run rust:lint` locally.
- Adding `tauri-plugin-fs` / `tauri-plugin-dialog` (with scopes) is the next step when workspace access is implemented.
