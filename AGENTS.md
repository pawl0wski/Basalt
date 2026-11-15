# AGENTS.md

Basalt is a local-first, end-to-end encrypted Markdown note-taking app: Tauri 2 host, React 19 + TypeScript in an npm workspace under `basalt-app/packages/` (`app`, `core`, `ui`, `editor`, `api`). Architecture and workspace model: `README.md`. Run all npm commands from `basalt-app/`.

## Hard rules

- Every change ships with unit tests (Vitest; Rust tests for native code) that guard against regressions: cover edge cases, error paths, and the exact scenario of a fixed bug; assert observable outcomes; each test must fail when the behavior it protects breaks. No trivial tests.
- Every new user-facing feature or workflow is covered by Playwright tests in `basalt-app/e2e/` (`npm run test:e2e`); update existing e2e tests when behavior changes. They must pass in CI.
- Verify with relevant tests, lint, and typecheck before calling a task done. Before pushing, run the full validation gate in `SDLC.md`.
- Validate untrusted data (files, IPC payloads, HTTP responses) at runtime.
- Never commit secrets or keys. Never log or expose credentials.
- Do not add comments to code unless asked.
- Minimize Rust: build features in TypeScript on official Tauri plugins; custom Rust needs a spec justifying it (see `basalt-app/src-tauri/AGENTS.md`).
- Write documentation, specs, and AI artifacts in English.
- Write a spec in `.ai/specs/` before implementing a non-trivial feature. At the end of every autonomous run, write a run log to `.ai/runs/`. After a correction, a bug fix, or a discovered gotcha, record a lesson. Format for all three: `.ai/AGENTS.md`.

## Task routing

Before starting, read the files listed for the task, and the listed `§` sections where given.

| Task                                | Read                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bug fix                             | `.ai/lessons.md`; `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § Testing strategy                                                                         |
| New feature                         | `.ai/specs/backlog.md`; `.ai/AGENTS.md`; `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § Engineering standards                                             |
| Refactor                            | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § Code design principles, § Dependency direction; `basalt-app/eslint.config.js`; `BACKWARD_COMPATIBILITY.md` |
| Review                              | `CODE_REVIEW.md`; `BACKWARD_COMPATIBILITY.md`                                                                                                                                              |
| Writing a spec, run log, or lesson  | `.ai/AGENTS.md`                                                                                                                                                                            |
| UI, components, styling             | `basalt-app/packages/ui/docs/design-system.md` (run `npm run check:tokens`)                                                                                                                |
| React components, containers, hooks | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § React component and presentation pattern                                                                   |
| TypeScript style                    | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § TypeScript and JavaScript                                                                                  |
| User-facing text, i18n              | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § Internationalization                                                                                       |
| Errors and logging                  | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § Errors and logging                                                                                         |
| Adding a dependency                 | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § Dependencies                                                                                               |
| Files on disk, workspace format     | `BACKWARD_COMPATIBILITY.md`; `README.md` § Workspace Model                                                                                                                                 |
| Playwright tests, memory platform   | `README.md` § Running the app; `basalt-app/e2e/support.ts`                                                                                                                                 |
| Pull request, validation gate       | `SDLC.md`; `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § Pull request standards                                                                          |
| CI                                  | `.github/workflows/ci.yml`; `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § CI standards                                                                   |
| Product scope, backlog, screens     | `.ai/specs/product-brief.md`; `.ai/specs/backlog.md`; `prototypes/e01-screen-map.md`                                                                                                       |
| `packages/app`                      | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § `@basalt/app`                                                                                              |
| `packages/core`                     | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § `@basalt/core`                                                                                             |
| `packages/ui`                       | `basalt-app/packages/ui/docs/design-system.md`; `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § `@basalt/ui`                                               |
| `packages/editor`                   | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § `@basalt/editor`                                                                                           |
| `packages/api`                      | `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` § `@basalt/api`                                                                                              |
| `src-tauri`, Rust, capabilities     | `basalt-app/src-tauri/AGENTS.md`                                                                                                                                                           |

Check routes and size budgets: `node .ai/scripts/check-agent-routes.mjs`.
