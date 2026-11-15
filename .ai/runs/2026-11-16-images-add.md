---
date: 2026-11-16
slug: images-add
type: run
status: completed
tags: [images, editor, e01, e01-s03]
---

# Run: E01-S03 Phase 2, add images by paste and drop (PR 3)

## Goal

Implement Phase 2 of `.ai/specs/implemented/2026-10-25-images-in-notes.md`. Closes #10. Stacked on the display PR (#25).

## What was done

- core: `readDir`, `mkdir` and byte `createExclusive` in the port, in-memory FS, Tauri adapter (and the fake plugin-fs), contract suite; `encodeLinkSegment`, `buildRelativeLink`, `formatImageLink`; name planning (`sanitizeFileName`, `splitFileName`, `pastedImageBaseName`, `attachmentExtension`, `planAttachmentName`); `AttachmentLocation`; `addImage`. `fast-check` and `@lezer/markdown` added as core devDependencies for the property and CommonMark round-trip tests.
- editor: file input extension (paste and drop, position mapping through edits, several links on their own lines, one undo step, read-only and destroy safe).
- app: `addImagesFromFiles`, aggregated dismissible notice, window drop guard, `tauri.conf.json` `dragDropEnabled: false`.
- ui: `Alert` gained `onDismiss`/`dismissLabel` (DSG-06) with test and story.
- docs: README images section, standards addendum on the file-kind registry, spec moved to `implemented/`.
- Tests: unit tests per piece; 8 Playwright tests in `e2e/add-images.spec.ts`.

## Decisions

- `taken` for `planAttachmentName` holds `pathKey`s of file names inside the folder (not full paths).
- `attachmentFolderFor` ignores the note path today (single variant).
- The "same second" paste e2e uses a named file twice for determinism; the unnamed-name pattern is asserted by regex.
- Spec marked implemented although the Phase 2 desktop spike and smoke test could not run here; this is listed as UNVERIFIED in the spec and the PR.

## Open issues

- Manual spike and smoke test on built Linux and Windows apps (clipboard, drag-and-drop, Obsidian check).
- Rust gate could not run locally (no `cargo fmt`); `tauri.conf.json` changed, so `npm run tauri build -- --no-bundle` per `src-tauri/AGENTS.md` was also not run.
