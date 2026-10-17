# AGENTS.md

Instructions for AI agents working in the Basalt repository.

## Project Overview

Basalt is a note-taking application. See `README.md` for the project architecture, technology choices, and workspace model.

## AI Workspace Conventions

All AI-generated artifacts (specifications, run logs, and lessons) live under the `.ai/` directory. Every AI agent **must** follow these conventions when producing or updating these files.

### Directory Structure

```
.ai/
├── specs/
│   ├── implemented/          # Specifications that have been fully implemented
│   └── archive/              # Specifications that are superseded, rejected, or no longer relevant
├── runs/
│   └── YYYY-MM-DD-slug.md    # Logs of AI autonomous runs
├── lessons.md                # Index/summary of lessons learned
└── lessons/
    └── YYYY-MM-DD-slug.md    # Detailed lessons learned entries
```

### Naming Conventions

- **Specifications** (`.ai/specs/`): `YYYY-MM-DD-slug.md`
  - `YYYY-MM-DD` is the date the spec was created.
  - `slug` is a short, kebab-case descriptor (e.g. `sync-protocol-v2`).
- **Run logs** (`.ai/runs/`): `YYYY-MM-DD-slug.md`
  - `YYYY-MM-DD` is the date the run started.
  - `slug` is a short, kebab-case descriptor of the run's goal (e.g. `fix-e2ee-key-rotation`).
- **Lessons** (`.ai/lessons/`): `YYYY-MM-DD-slug.md`
  - Same date + kebab-case slug pattern.

### Rules

1. **Specifications** — Write a new spec in `.ai/specs/` before implementing a non-trivial feature. When a spec is fully implemented, move it to `.ai/specs/implemented/`. When a spec is superseded or dropped, move it to `.ai/specs/archive/`. Do not delete spec files.
2. **Run logs** — At the end of every autonomous AI run, write a log to `.ai/runs/` following the naming convention. Include the goal, what was done, decisions made, outcomes, and any open issues.
3. **Lessons** — After fixing a bug, discovering a gotcha, or learning something worth remembering long-term, record it:
   - Append a one-line summary to `.ai/lessons.md` (dated, with a link to the full entry).
   - Write the full detail to a new file in `.ai/lessons/` following the naming convention.
   - Lessons are the LLM's long-term memory: record findings, improvements, and pitfalls so future runs don't repeat mistakes.
4. **Metadata** — Every spec, run log, and detailed lesson file in `.ai/` must start with a YAML front-matter block documenting:
   - `date:` — the YYYY-MM-DD creation date
   - `slug:` — the kebab-case slug used in the filename
   - `type:` — one of `spec`, `run`, `lesson`
   - `status:` — for specs: `draft` | `implemented` | `archived`; for runs: `completed` | `interrupted`; for lessons: `active`
   - `tags:` — a list of relevant tags (e.g. `e2ee`, `sync`, `tauri`, `bug`)
5. Use the current date (`YYYY-MM-DD`) when naming files. Never reuse an old date for new content.

### Example Front Matter

```yaml
---
date: 2026-10-17
slug: sync-protocol-v2
type: spec
status: draft
tags: [sync, e2ee]
---
```

## Engineering Guidelines

- For complex tasks, plan before implementation and write a specific spec in `.ai/specs/`. If work goes off track, stop and re-plan.
- Follow existing code conventions in `basalt-app/`; check neighboring files before writing new code.
- Write and maintain repository documentation, specifications, and AI-generated artifacts in English. User-facing application text should follow the product's localization requirements.
- Follow the current engineering standards specification at `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` for package boundaries, coding principles, React component/presentation patterns, testing, PRs, and CI.
- Apply YAGNI, DRY, and SRP pragmatically: build current requirements, share genuinely common rules rather than superficial similarities, and keep modules/components focused without splitting cohesive code mechanically.
- In React, separate presentational components from containers/integration hooks where that improves clarity: presentational components render from typed props and emit callbacks; containers connect state/actions. Do not add a container when a component has no application integration needs.
- Name React component files and component folders in PascalCase (for example, `Button.tsx` and `WorkspaceStatus/`); do not use lowercase filenames for components. Non-component files follow their package's established naming convention.
- Prefer straightforward, readable TypeScript with strict types. Validate untrusted data at runtime, avoid unjustified `any`/assertions, keep state minimal, derive values when possible, and avoid unnecessary abstractions or memoization.
- Minimize Rust: implement features in TypeScript using official Tauri plugins. `basalt-app/src-tauri/` stays a thin host (bootstrap, plugin registration). Add custom Rust code or commands only when a plugin or TypeScript cannot do the job, and document the justification in a spec.
- Do not add comments to code unless asked.
- Every change must ship with unit tests (Vitest; Rust tests for native code) that guard against regressions. Write them deliberately, not to satisfy a checklist: cover the behavior that matters, including edge cases, error paths, and the exact scenario of a fixed bug; assert observable outcomes rather than implementation details; and make sure the test fails when the behavior it protects is broken. Do not add trivial tests that only exercise code without verifying anything meaningful.
- Every new user-facing feature or workflow must also be covered by Playwright integration tests in `basalt-app/e2e/` (`npm run test:e2e`). Update the existing e2e tests when behavior changes. Integration tests run in CI and must pass there.
- Verify changes with relevant tests, lint, and typecheck before considering the task complete.
- After a correction or bug fix, record reusable findings in `.ai/lessons.md` and `.ai/lessons/`.
- Never commit secrets or keys. Never log or expose credentials.

## Documentation language

- Write and maintain repository documentation, specifications, and AI-generated artifacts in English.
- User-facing application text should follow the product's localization requirements.
