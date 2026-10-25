---
date: 2026-10-25
slug: spec-images-in-notes
type: run
status: completed
tags: [spec, images, attachments, editor, e01]
---

# Run: spec for issue #10 (E01-S03, images in notes)

## Goal

Write a specification for E01-S03 on top of the S01 spec (`2026-10-24-markdown-notes-and-app-foundations.md`), designed with S04 (file management), E02 (sync/E2EE) and E03 (PDF, whiteboards) in mind.

## Done

- Read issue #10, epic #5, issues #11–#14 and #16, the backlog, the product brief, `BACKWARD_COMPATIBILITY.md`, the Tauri config and the S01 spec.
- Ran the Open Questions gate (Q1–Q8) with the owner; recorded the answers.
- Wrote `.ai/specs/2026-10-25-images-in-notes.md`: two phases (display, then paste/drop), step-level plan, AC traceability, forward-compatibility table.

## Decisions

- Paste and drop only; no file picker (Q1).
- One `attachments/` folder at the workspace root, behind an `AttachmentLocation` union so an Obsidian-style setting can be added later; S04 rewrites links on note move using `resolveLinkTarget`/`buildRelativeLink` (Q2).
- Display through `readBytes` → `Blob` URLs, not the asset protocol; `dragDropEnabled: false` on the window.
- File-kind registry introduced (deferred by S01 Q7).

## Open issues

- Clipboard and drop behavior on WebKitGTK/WebView2 is unverified until the Phase 2 spike.
- The fresh-context scope-cohesion review was not run; self-review only.
- Depends on S01 Phase 2b, which is not implemented yet.
