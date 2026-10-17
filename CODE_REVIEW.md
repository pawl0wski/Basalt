# Code review rules

Applied automatically by `om-code-review` and `om-auto-review-pr`. Project conventions live in `AGENTS.md` and the engineering standards spec at `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md`.

## Review priorities

1. **Correctness** — the change does what the ticket or spec says, including error paths and edge cases.
2. **Security and privacy** — Basalt is end-to-end encrypted: no secrets, keys, or credentials committed, logged, or exposed; plaintext note content must not leave the client; untrusted data (files, API responses, IPC payloads) is validated at runtime.
3. **Contracts** — check changes against `BACKWARD_COMPATIBILITY.md`.
4. **Quality** — readability, minimal state, no speculative abstraction.

## Repo-specific checks

- **Rust stays minimal.** `basalt-app/src-tauri/` is a thin host (bootstrap, plugin registration). New Rust code or custom Tauri commands are a finding unless a spec documents why a plugin or TypeScript cannot do the job.
- **Package boundaries.** `@basalt/app` (routing, pages, Tauri integration via app-owned adapters), `@basalt/core` (shared logic, types), `@basalt/ui` (shadcn components, design system), `@basalt/api` (sync API client). Flag imports that cross these boundaries the wrong way.
- **UI uses shadcn/ui components** from `@basalt/ui`, not ad-hoc Tailwind re-implementations.
- **React structure.** Presentational components render from typed props and emit callbacks; containers/hooks connect state. A container for a component with no integration needs is unnecessary. Component files and folders are PascalCase.
- **TypeScript.** Strict types; flag unjustified `any` and type assertions; state is minimal and derived values are computed, not stored; no unnecessary memoization.
- **No code comments** unless explicitly requested.
- **Tests are mandatory and meaningful.** Every change ships Vitest unit tests (Rust tests for native code) covering behavior, edge cases, and the exact scenario of a fixed bug; they must fail if the protected behavior breaks. Flag trivial tests that only exercise code. Every new user-facing feature or workflow also needs Playwright coverage in `basalt-app/e2e/`; changed behavior must update existing e2e tests.
- **AI workspace artifacts.** Specs, run logs, and lessons under `.ai/` follow the naming and front-matter rules in `AGENTS.md`; specs are moved, never deleted. Documentation and AI artifacts are in English.
- **Formatting.** Prettier (`npm run format:check`) and ESLint with zero warnings.

## Validation gate

The commands in `.ai/agentic.config.json` (`validation.commands`) must pass. A failing gate is a blocker finding, reported together with all other findings.

## Severity guidance

- **Blocker** — incorrect behavior, data loss, leaked secret/plaintext, broken contract, failing gate, missing tests for new behavior.
- **Major** — violated package boundary or Rust-minimization policy, unvalidated untrusted input, missing e2e coverage for a user-facing feature.
- **Minor** — naming, style, or simplification suggestions that do not affect behavior.
