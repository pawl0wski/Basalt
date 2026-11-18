---
date: 2026-11-17
slug: e01-remaining-specs
type: run
status: completed
tags: [e01, specs, review, e01-s07, e01-s08, e01-s09, e01-s10, e01-s11, e01-s12]
---

# Run: remaining E01 specs (S07–S12) and the review of all E01 specs

## Goal

Write the missing specs for the Epic 01 test findings and add them to PR #42, then review every spec in that PR.

## What was done

- Identified the Epic 01 stories without a spec: E01-S07 (#36), E01-S08 (#33), E01-S09 (#35), E01-S10 (#32), E01-S11 (#37), E01-S12 (#40). E01-S05 and E01-S06 already had specs in PR #42.
- One subagent per story wrote the spec with `om-spec-writing --autonomous` (six in parallel), each grounded in the issue, the product brief, the S01/S03/S04/live-preview specs, the two specs already in the PR, and the actual code:
  - `.ai/specs/2026-11-17-status-bar-word-count.md` (E01-S07)
  - `.ai/specs/2026-11-17-informational-toasts.md` (E01-S08)
  - `.ai/specs/2026-11-17-scrolling-model.md` (E01-S09)
  - `.ai/specs/2026-11-17-live-preview-fences-and-escapes.md` (E01-S10)
  - `.ai/specs/2026-11-17-bold-italic-shortcuts.md` (E01-S11)
  - `.ai/specs/2026-11-17-resize-images-by-dragging.md` (E01-S12)
- Committed as `b7355c5` and pushed to `session/983eb6-session-2a3359` (PR #42). Updated the PR title to "docs(spec): add the E01-S05–E01-S12 specs" and the body with all eight specs and their owner decisions. Updated the backlog note: every E01 finding now has a spec.
- Reviewed all eight specs in the PR with one fresh-context adversarial reviewer per spec (the `om-spec-writing` review format), verifying code claims against the repository.

## Decisions

- Autonomous defaults per spec are recorded in each spec's `Resolved assumptions (autonomous defaults)` section. The high-stakes ones needing the owner:
  - E01-S07: word count only (no character count); per-keystroke update; empty bar with no note.
  - E01-S08: the rename-dialog collision stays inline (the issue's AC says toast); the S06 title error becomes a toast (supersedes S06's alert); `not-found`/`invalid-path` → toast.
  - E01-S09: thin always-visible scrollbars on Windows/Linux, macOS keeps the platform overlay; native scrolling over `ScrollArea`.
  - E01-S10: an off-active fence line stays as an empty code-styled line (no collapse).
  - E01-S11: no-selection press inserts empty markers (no word-under-cursor, no enclosing-span detection).
  - E01-S12: the width is persisted as an Obsidian-compatible `![alt|300](path)` suffix in pixels.

## Review outcome

Verdicts: E01-S10 proceed; the other seven revise. The most consequential findings:

- Cross-spec conflicts inside the PR: E01-S06's title alert vs E01-S08's toast; E01-S05/E01-S09's sidebar notice vs E01-S08's toast for a failed move; E01-S07's removal of the save-state wording vs E01-S11's "the status bar shows the same wording".
- E01-S12 (Critical): the editor cannot import the `@basalt/core` helpers the spec names (leaf-package rule, `no-restricted-imports`); the `ImageWidget.eq`/`updateDOM` mitigation does not survive CodeMirror's widget-reuse path.
- E01-S11 (High): a no-op `Mod-i` falls through to `selectParentSyntax`; AC-11.7 (multiple selections) is unreachable because `allowMultipleSelections` is never enabled.
- E01-S05 (High): AC-05.5's reserved-name rule has no implementation step; the move validation contradicts itself on `to === from`.
- E01-S06 (High): AC-06.4 contradicts AC-06.6/D-3 on the empty heading; the e2e update list misses `editor.spec.ts` (the `# ` initial content breaks it).
- E01-S08 (High): the error matrix does not match the real `AppErrorDetail` union and conflicts with S05's `flush-failed` routing; the S06 title-error branch depends on an unimplemented draft.
- E01-S09 (High): the macOS overlay promise has no mechanism; the failed-move surface conflicts with E01-S08.
- E01-S07 (Medium): the refined AC-01.11/AC-01.19 wording is not stated.

## Open issues

- The review findings above are not yet applied to the specs; the owner reviews the PR next.
- The `⚠ NEEDS HUMAN CONFIRMATION` items in each spec await the owner.
- The validation gate was not run locally (no `node_modules` in this checkout); CI runs it on the PR. Docs-only change: no code, no dependency, no Tauri permission.
