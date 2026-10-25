---
date: 2026-10-24
slug: spec-markdown-notes-and-foundations
type: run
status: completed
tags: [spec, notes, architecture, dotnet, editor]
---

# Run: spec for issue #8 with foundation primitives

## Goal

Write a specification for issue #8 (E01-S01) that also designs reusable frontend primitives and a .NET backend foundation, derived from the product brief and backlog.

## Done

- Read issue #8, the backlog, the product brief and the engineering standards spec.
- Ran the Open Questions gate with the owner (Q1–Q6); recorded answers in the spec.
- Wrote `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (4 phases, step-level plan, AC traceability).

## Decisions

- One spec, four phases; issue #8 closes after Phases 1–2.
- New package `@basalt/editor` (CodeMirror 6) and new `basalt-server/` (.NET 10, EF Core SQLite/PostgreSQL, OpenAPI-generated TS client).
- Sync protocol, vaults, E2EE stay with E02-S01-T01; only reserved seams are named.

## Open issues

- "Custom Markdown editor" was interpreted as our own package on CodeMirror 6; confirm.
- Fresh-context cohesion review of the spec was not run.
- Tauri scope and persisted-scope assumptions are unverified until Phase 2 step 1.
- Phases 3 and 4 need their own issues.

## Revision 2026-10-25 (review with the owner)

- Review found contradictions (shared client/server error codes, sync pre-decisions, EOL/BOM rules, deleted-file vs conflict, data loss on workspace removal, untestable naming rule) and over-scope (registries, .NET scaffold).
- Owner decisions: backend removed from this spec and carried to E02 (separate server error codes mapped in `@basalt/api`); plain functions instead of registries; autosave now; Obsidian-style `basalt.json` in app config plus optional `.basalt/` in the workspace; plain Markdown now, custom Basalt components later; Basalt is local-first.
- Spec rewritten accordingly: `WorkspaceAccess` factory, `stat` in the port, `exists` removed, listing rules moved into use cases, defined EOL/BOM model, autosave state machine, single welcome action, Phase 3 to be extracted when #8 closes.

### Open issues

- The product brief should get a row clarifying D05 "offline-first" as local-first.
- Confirmed by the owner (2026-10-25): last workspace in `$APPCONFIG/basalt.json`, last opened note in the optional `.basalt/workspace.json`.
