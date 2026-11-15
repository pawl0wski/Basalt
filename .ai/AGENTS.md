# AI workspace conventions

All AI-generated artifacts (specifications, run logs, and lessons) live under `.ai/`.

## Directory structure

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

## Naming

- `YYYY-MM-DD` is the date a spec or lesson was created, or the date a run started. Use the current date; never reuse an old date for new content.
- `slug` is a short kebab-case descriptor (e.g. `sync-protocol-v2`, `fix-e2ee-key-rotation`).

## Rules

1. **Specifications** — If work goes off track, stop and re-plan. When a spec is fully implemented, move it to `.ai/specs/implemented/`; when it is superseded or dropped, move it to `.ai/specs/archive/`. Do not delete spec files.
2. **Run logs** — Include the goal, what was done, decisions made, outcomes, and any open issues.
3. **Lessons** — Append a one-line summary to `.ai/lessons.md` (dated, with a link to the full entry) and write the full detail to a new file in `.ai/lessons/`.
4. **Metadata** — Every spec, run log, and detailed lesson file in `.ai/` must start with the YAML front matter below.

## Front matter

```yaml
---
date: 2026-10-17 # YYYY-MM-DD creation date
slug: sync-protocol-v2 # kebab-case slug used in the filename
type: spec # spec | run | lesson
status: draft # spec: draft | implemented | archived; run: completed | interrupted; lesson: active
tags: [sync, e2ee] # relevant tags, e.g. e2ee, sync, tauri, bug
---
```
