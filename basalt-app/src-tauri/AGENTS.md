# src-tauri: Tauri host

- This is a thin host: bootstrap and official plugin registration only. Implement features in TypeScript using official Tauri plugins.
- Add custom Rust code or commands only when a plugin or TypeScript cannot do the job, and document the justification in a spec in `.ai/specs/`. Full policy: "Rust and Tauri" and "`src-tauri/`" in `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md`.
- Custom Rust code ships with Rust tests (`npm run rust:test`, not run in CI).
- Before pushing a change here, run from `basalt-app/`: `npm run rust:fmt` and `npm run rust:lint` (both in CI), and `npm run tauri build -- --no-bundle` when `tauri.conf.json`, `Cargo.toml` or `capabilities/` change.
