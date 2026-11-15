# AGENTS.md

## Project Overview

Basalt is a note-taking application. See `README.md` for the project architecture, technology choices, and workspace model.

## AI Workspace Conventions

All AI-generated artifacts (specifications, run logs, and lessons) live under the `.ai/` directory.

### Directory Structure

```
.ai/
├── specs/
│   ├── YYYY-MM-DD-slug.md    # New specifications
│   ├── implemented/          # Specifications that have been fully implemented
│   └── archive/              # Specifications that are superseded, rejected, or no longer relevant
├── runs/
│   └── YYYY-MM-DD-slug.md    # Logs of AI autonomous runs
├── lessons.md                # Index/summary of lessons learned
└── lessons/
    └── YYYY-MM-DD-slug.md    # Detailed lessons learned entries
```

### Naming Conventions

- `YYYY-MM-DD` is the date a spec or lesson was created, or the date a run started.
- `slug` is a short kebab-case descriptor (e.g. `sync-protocol-v2`, `fix-e2ee-key-rotation`).

### Rules

1. **Specifications** — Write a new spec in `.ai/specs/` before implementing a non-trivial feature. If work goes off track, stop and re-plan. When a spec is fully implemented, move it to `.ai/specs/implemented/`; when it is superseded or dropped, move it to `.ai/specs/archive/`. Do not delete spec files.
2. **Run logs** — At the end of every autonomous AI run, write a log to `.ai/runs/` following the naming convention. Include the goal, what was done, decisions made, outcomes, and any open issues.
3. **Lessons** — After a correction, fixing a bug, discovering a gotcha, or learning something worth remembering long-term, record it:
   - Append a one-line summary to `.ai/lessons.md` (dated, with a link to the full entry).
   - Write the full detail to a new file in `.ai/lessons/` following the naming convention.
4. **Metadata** — Every spec, run log, and detailed lesson file in `.ai/` must start with the YAML front matter shown below.
5. Use the current date (`YYYY-MM-DD`) when naming files. Never reuse an old date for new content.

### Example Front Matter

```yaml
---
date: 2026-10-17 # YYYY-MM-DD creation date
slug: sync-protocol-v2 # kebab-case slug used in the filename
type: spec # spec | run | lesson
status: draft # spec: draft | implemented | archived; run: completed | interrupted; lesson: active
tags: [sync, e2ee] # relevant tags, e.g. e2ee, sync, tauri, bug
---
```

## Engineering Guidelines

- When you build or change UI, read `basalt-app/packages/ui/docs/design-system.md` first: use `@basalt/ui` components and design tokens, and run `npm run check:tokens`.
- Follow the current engineering standards specification at `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` for package boundaries, coding principles, React component/presentation patterns, testing, PRs, and CI.
- Build current requirements only, share genuinely common rules rather than superficial similarities, and keep modules/components focused without splitting cohesive code mechanically.
- In React, presentational components render from typed props and emit callbacks; containers/integration hooks connect state/actions. Do not add a container when a component has no application integration needs.
- Name React component files and component folders in PascalCase (for example, `Button.tsx` and `WorkspaceStatus/`), never lowercase. Non-component files follow their package's established naming convention.
- Validate untrusted data at runtime, avoid unjustified `any`/assertions, keep state minimal, derive values when possible, and avoid unnecessary abstractions or memoization.
- Minimize Rust: implement features in TypeScript using official Tauri plugins. `basalt-app/src-tauri/` stays a thin host (bootstrap, plugin registration). Add custom Rust code or commands only when a plugin or TypeScript cannot do the job, and document the justification in a spec.
- Do not add comments to code unless asked.
- Every change must ship with unit tests (Vitest; Rust tests for native code) that guard against regressions: cover edge cases, error paths, and the exact scenario of a fixed bug; assert observable outcomes rather than implementation details; and make sure each test fails when the behavior it protects is broken. Do not add trivial tests that only exercise code without verifying anything meaningful.
- Every new user-facing feature or workflow must also be covered by Playwright integration tests in `basalt-app/e2e/` (`npm run test:e2e`). Update the existing e2e tests when behavior changes. Integration tests run in CI and must pass there.
- Verify changes with relevant tests, lint, and typecheck before considering the task complete. Before pushing, run the full validation gate listed in `SDLC.md`.
- Never commit secrets or keys. Never log or expose credentials.

## Documentation language

- Write and maintain repository documentation, specifications, and AI-generated artifacts in English.
- User-facing application text should follow the product's localization requirements (see "Internationalization" in the engineering standards specification).
