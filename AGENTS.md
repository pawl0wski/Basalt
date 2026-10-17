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
- Do not add comments to code unless asked.
- Verify changes with relevant tests, lint, and typecheck before considering the task complete.
- After a correction or bug fix, record reusable findings in `.ai/lessons.md` and `.ai/lessons/`.
- Never commit secrets or keys. Never log or expose credentials.
