---
date: 2026-11-16
slug: drop-images-anywhere-in-window
type: spec
status: archived
tags: [images, attachments, drag-and-drop, editor]
---

# Drop images anywhere in the Basalt window

## 📝 TLDR

The owner can already drop image files onto the **editor** (E01-S03, `.ai/specs/implemented/2026-10-25-images-in-notes.md`, shipped in #26): the file is copied to `attachments/`, a Markdown link is inserted at the drop point and the preview is shown. A drop **anywhere else in the window** (sidebar, header, empty area, "no open note" state) is swallowed by the window drop guard and does nothing. This spec (future behavior) proposes that a drop anywhere in the window adds the image to the workspace and shows it in a note, so the owner does not have to aim at the editor.

## ❓ Open Questions

- **Q1** — Is the gap above what you want, or does the existing editor drop not work for you in the built app (a bug → bug report, not a spec)?
- **Q2** — Drop outside the editor while a note is open: insert the link (a) at the cursor, (b) at the end of the note, or (c) keep ignoring it?
- **Q3** — Drop with **no open note**: (a) create a new note containing the image, (b) only save the file to `attachments/`, or (c) do nothing (as today)?
- **Q4** — Drop onto a **folder in the sidebar**: (a) save the image into that folder (overlaps E01-S04 drag-and-drop), or (b) treat it like any other drop outside the editor?
- **Q5** — Should the whole window show a drop overlay ("Drop images to add") during a file drag?
- **Q6** — Tracker: new story `E01-S05` under epic #5, or a follow-up task under E01-S03 (#10)?

## 📝 Problem Statement

Today the only drop target is the editor content. The window guard (`dragDropEnabled: false` + `preventDefault` on `window`) makes every other drop a silent no-op, with no feedback, so a drop that misses the editor looks like a broken feature.

## 📝 Proposed Solution

Reuse the existing pipeline unchanged — `@basalt/core` `addImage`, the attachment-location policy, the editor's pending-insert positions and the notice — and turn the app-level window drop guard into a drop handler that routes files according to Q2–Q4. No Tauri or Rust change: HTML5 `File` drops already work with `dragDropEnabled: false`.
