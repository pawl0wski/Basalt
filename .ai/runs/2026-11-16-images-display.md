---
date: 2026-11-16
slug: images-display
type: run
status: completed
tags: [images, editor, e01, e01-s03]
---

# Run: E01-S03 Phase 1, display images (PR 2 of the E01 remainder)

## Goal

Implement Phase 1 of `.ai/specs/implemented/2026-10-25-images-in-notes.md`: image display with placeholders. Refs #10 (not Closes; adding images is Phase 2). Stacked on the live-preview PR (#24).

## What was done

- core: `FILE_KINDS`/`fileKindOf` (isMarkdownPath now uses it), `detectImage` with dimensions and limits, `resolveLinkTarget`, `readBytes` in the port, in-memory FS, Tauri adapter and contract suite, `readImage`, error code `unsupported`.
- editor: `createImagePreview` (block widgets from a state field, release counting, `refreshImages`, source hidden on inactive lines, which was handed to this PR by live-preview Q-LP5).
- app: image loader (cache, object URL ownership, invalidate/revalidate, byte budget), image hub wired to the workspace watcher and window focus, `NoteSessionEditor`, i18n `attachments.placeholder.*`.
- Tests: unit tests for each piece, 7 Playwright tests in `e2e/images.spec.ts`.

## Decisions

- Binary support in the memory platform already existed (`readBytes`, `externalWrite` with bytes, binary seeding), so G9 needed only `readBytes` on the port.
- Placeholder for non-http schemes gets its own text (`unsupportedScheme`), since the spec lists no text for it.
- No Storybook story: the placeholder lives in `@basalt/editor`, which has no UI package components; `@basalt/ui` is unchanged.
- PR targets `master` and lists `Depends on #24`; its diff includes the live-preview commit until #24 merges.

## Outcomes

format, lint, typecheck, vitest, build, check:tokens and the full Playwright suite pass. Rust gate could not run (no `cargo fmt` in the sandbox); no Rust changed.

## Open issues

- Spec stays `draft` until Phase 2 lands.
- The long-document unit test is a smoke test (see lesson).
- Real Tauri `readFile` of binary files is covered only by the mocked plugin test.
