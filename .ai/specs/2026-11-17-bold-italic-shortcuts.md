---
date: 2026-11-17
slug: bold-italic-shortcuts
type: spec
status: draft
tags: [editor, shortcuts, markdown, bold, italic, e01]
---

# The owner can format text with Ctrl+B and Ctrl+I (E01-S11)

Source issue: #37 (E01-S11, epic #5). Depends on: #8 (E01-S01, foundations). Builds on `.ai/specs/implemented/2026-11-08-live-preview-editor.md` (the "live preview spec") and the editor keymap in `basalt-app/packages/editor/src/createMarkdownEditor.ts`. Related specs in this PR: `.ai/specs/2026-11-16-note-name-follows-first-heading.md` (E01-S06, adds editor selection events; no behavioral overlap) and `.ai/specs/2026-11-16-rename-move-delete-folders.md` (E01-S05). Design authority: `.ai/specs/product-brief.md`. Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec"). Screen ids (s03) refer to `prototypes/e01-screen-map.md`.

## 📝 TLDR

The owner (the only confirmed user, D02) formats notes today by typing Markdown markers by hand: the editor mounts the CodeMirror `defaultKeymap` and `historyKeymap` plus app shortcuts for open, save and new, and binds no bold or italic command. This spec (future behavior) adds `Mod-b` and `Mod-i` (Ctrl on Windows/Linux, Cmd on macOS) toggle commands in `@basalt/editor`: a selection is wrapped in `**`/`*` and unwrapped by a second press, a cursor inserts the empty marker pair, whitespace-only selections and IME composition are no-ops, every press is one undo step, and the saved file keeps the Markdown source (AC-11.5).

## 📝 Decisions (owner)

| Id  | Topic            | Decision                                                                                                                           |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Shortcuts in E01 | Ctrl+B and Ctrl+I are expected in E01; they are part of the Epic 01 test findings (owner, 2026-11-16; backlog E01-S11, issue #37). |
| D-2 | Scope            | Shortcuts only: no formatting toolbar, no other shortcuts and no rich-text editing (issue #37, 2026-11-16).                        |

## 📝 Acceptance criteria

The issue's five criteria are refined below; the derived ones make the decisions explicit. Screen ids refer to the screen map.

| Id       | Criterion                                                                                                                                                                                                    | Screen |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| AC-11.1  | Given selected text, when the owner presses Ctrl/Cmd+B, then the selection is wrapped in `**` and the line renders bold in live preview once the cursor leaves it; pressing again removes the markers.       | s03    |
| AC-11.2  | Given no selection, when the owner presses Ctrl/Cmd+I, then the `*` markers are inserted and the cursor is between them; pressing again (with the cursor still between them) removes them.                   | s03    |
| AC-11.3  | Given an IME composition in progress (`compositionstart` to `compositionend`), then the shortcut does nothing and the text is unchanged.                                                                     | s03    |
| AC-11.4  | Given Undo after the shortcut, then the change is undone in one step (text and selection restored) and never merges with preceding typing; Redo reapplies it as one step.                                    | s03    |
| AC-11.5  | Given a saved note, then the file contains the Markdown markers and nothing else changes; the note is plain Markdown.                                                                                        | s03    |
| AC-11.6  | The platform modifier is used: Ctrl on Windows/Linux, Cmd on macOS (`Mod-b`/`Mod-i`). Shift, Alt or other modifier combinations are not bound.                                                               | s03    |
| AC-11.7  | Given several selections, one press toggles every selection in one transaction; one Undo reverts them all.                                                                                                   | s03    |
| AC-11.8  | Given nested emphasis, Ctrl/Cmd+B on `***text***` leaves `*text*` and Ctrl/Cmd+I leaves `**text**`; bolding `*text*` or italicising `**text**` produces `***text***` (bold + italic).                        | s03    |
| AC-11.9  | Given a whitespace-only selection, the shortcut does nothing: no markers, no transaction, no undo entry.                                                                                                     | s03    |
| AC-11.10 | Given a selection that already includes its markers (`**text**` selected, or the cursor between the empty pair `**\|**`), one press removes them and keeps the inner text selected (or the cursor in place). | s03    |
| AC-11.11 | The shortcut works only while the editor has focus: with focus in the tree, a tab or a dialog, Ctrl/Cmd+B and Ctrl/Cmd+I do nothing.                                                                         | s03    |

## 📝 Not doing

- **A formatting toolbar.** Out of scope (issue #37); no new controls, menus or panels.
- **Other shortcuts.** Strikethrough, inline code, headings, lists, links, code blocks and a shortcut settings screen stay out; only bold and italic are bound.
- **Rich-text or WYSIWYG editing.** The document stays the exact Markdown source (standards spec, `@basalt/editor`).
- **Word-under-cursor expansion.** With no selection the markers are inserted empty (AC-11.2); the issue's open question is settled by its acceptance criteria. VS Code's Markdown All in One expands to the word (market check), which this spec deliberately skips.
- **Syntax-tree context checks.** The toggle is textual and deterministic: the same rules apply inside code blocks, link labels, quotes and headings; no Lezer-tree inspection.
- **Detecting and unwrapping the emphasis span around a bare cursor.** Only the exact `**|**`/`*|*` context toggles off; a cursor inside a non-empty span inserts markers (Edge cases, Resolved assumptions).
- **Underscore emphasis.** `__text__` and `_text_` are not detected or produced; only `**` and `*`.
- **A context-menu or command-palette entry.** E01 has no command palette (S01 Q7); the shortcuts are the only entry points.
- **Changing browser defaults.** No global handler outside the editor; no `preventDefault` on unhandled combinations.

## 📝 Problem statement

- The owner tested epic E01 and reported the missing formatting shortcuts (owner feedback, 2026-11-16, issue #37). Today `createMarkdownEditor` mounts `keymap.of([...defaultKeymap, ...historyKeymap])`; no emphasis command exists in `@basalt/editor`, so bolding a word means typing `**` around it manually.
- The cost today: the owner leaves the keyboard flow after every selection, mistypes or leaves unbalanced markers, and re-selects to fix them; the workflow they use daily in Obsidian (D-1) is missing.
- Who: the owner, the only confirmed user (D02). No other user is confirmed; wider adoption is not a goal.

## 📝 Proposed solution

Extend the existing keymap in `@basalt/editor` with two commands and one pure function:

1. **Toggle, not always-wrap.** A second press undoes the first (the issue's AC: "pressing again removes the markers").
2. **Empty markers, not word expansion.** With no selection the pair is inserted and the cursor lands between the markers (AC-11.2).
3. **One transaction per press.** All selection ranges are changed in one transaction, annotated `isolateHistory.of("full")`, so Undo is exactly one step (AC-11.4) and never merges with typing.
4. **Platform modifier through CodeMirror.** `Mod-b`/`Mod-i` map to Ctrl on Windows/Linux and Cmd on macOS (AC-11.6); the app-level keymap is untouched.

Toggle semantics, per selection range `[from, to]` with marker `m` (`**` for bold, `*` for italic):

1. Let `open` and `close` be the lengths of the `*` runs immediately before `from` and after `to` (0 when absent). A `*` preceded by an unescaped backslash is escaped and does not count.
2. **Unwrap (outside).** If `open === close` and the run carries the style — `open >= 2` for bold, `open` odd for italic — delete one marker before `from` and one after `to`; the range shrinks by the marker length on both sides.
3. **Unwrap (inside).** Otherwise, if the selection itself starts and ends with such runs (equal length, same style test, runs separate: `to - from >= open + close`) — delete the markers at the selection's ends; the inner text stays selected.
4. **Wrap.** Otherwise, if the selection is non-empty and not whitespace-only, insert the marker at both ends; the selection stays on the original text.
5. **Insert.** Otherwise, if the selection is empty, insert the marker twice at the cursor and place the cursor between the insertions (`**|**`, `*|*`).
6. **No-op.** A whitespace-only selection produces no edit: CommonMark does not render `** **` as emphasis, so wrapping it would not satisfy AC-11.1.

The parity rule makes nesting symmetric: on `***text***`, bold removes two asterisks per side (`*text*`) and italic removes one (`**text**`); on plain text, each adds its own marker.

Alternatives considered:

- **Bind in the app keymap** (`basalt-app/packages/app/src/features/keymap/keymap.ts`). The app keymap is a window-level listener with no editor view; it would duplicate modifier handling and lose CodeMirror's focus scoping. Rejected.
- **Syntax-tree-aware toggle** (unwrap exactly the enclosing `StrongEmphasis`/`Emphasis` node). Parser coupling and new failure modes for no AC gain; the textual rules already cover nested and marker-inclusive cases. Revisit with E05 if the rough edges in Edge cases matter.
- **Always wrap, never unwrap.** Rejected: the AC requires a second press to remove.
- **Word-under-cursor expansion.** Rejected: the AC specifies empty markers.
- **Rich-text editing.** Out of scope (issue #37).

## 📝 Architecture

- **`@basalt/editor` (the only package that changes).** New `src/formatting.ts`: `computeEmphasisToggle(text, range, marker)` (pure, no CodeMirror state), `toggleBold` / `toggleItalic` (`Command` from `@codemirror/view`), and `emphasisKeymap` (`readonly KeyBinding[]`). `src/createMarkdownEditor.ts` changes the existing line `keymap.of([...defaultKeymap, ...historyKeymap])` to put the emphasis bindings first: `keymap.of([...emphasisKeymap, ...defaultKeymap, ...historyKeymap])`. This order is required: `defaultKeymap` binds `Mod-i` to `selectParentSyntax`, so italic only wins if it is registered first. `src/index.ts` re-exports the commands, the keymap and the pure helper (additive).
- **`@basalt/app`.** No change. `features/keymap/keymap.ts` binds only `o`, `s`, `n` and `resolveShortcut` returns `null` for `b`/`i`; `NoteEditor` passes no new options. The CodeMirror keymap handles the keys while the editor is focused, and nothing is bound outside it (AC-11.11).
- **`@basalt/core`.** No change: the toggle is editor behaviour, not a domain rule, and it needs no file access.
- **`src-tauri`.** No change: no new Tauri permission, Rust command or dependency. `@codemirror/commands` (for `isolateHistory`; `undo`/`redo` in tests) and `@codemirror/view` are already dependencies of `packages/editor`.
- **Overlap with E01-S06.** That spec adds `onSelectionChange`, `onBlur` and `focus(position)` to `createMarkdownEditor`. The formatting command produces one ordinary document-plus-selection transaction, which E01-S06's listener observes like any edit; the toggle does not move the cursor off its line, so it cannot trigger a title commit. The two changes touch different parts of `createMarkdownEditor.ts` and can merge in either order.

## 📝 Data model

No new entity and no persisted-format change: bold and italic are ordinary Markdown markers in the note text, and the file stays plain Markdown (`BACKWARD_COMPATIBILITY.md` "Workspace on disk" is untouched; nothing is injected into notes). In memory, nothing new is stored: the editor state's document and selection change through one transaction per press, and the undo history gains one event per press. Autosave persists the toggled text through the existing S01 path, and the EOL/BOM rules are unchanged. No data-model graph: this section adds or changes no entities.

## 📝 API contracts

```ts
// @basalt/editor — src/formatting.ts
import type { Command, KeyBinding } from "@codemirror/view";
import type { TextRange } from "./livePreview";

export type EmphasisMarker = "**" | "*";

/** One range's toggle plan; `range` is in the coordinates after `changes`. */
export type EmphasisEdit = {
  readonly changes: readonly {
    readonly from: number;
    readonly to: number;
    readonly insert: string;
  }[];
  readonly range: TextRange;
};

/** Returns null for a whitespace-only selection; never throws; pure. */
export function computeEmphasisToggle(
  text: string,
  range: TextRange,
  marker: EmphasisMarker,
): EmphasisEdit | null;

export const toggleBold: Command;
export const toggleItalic: Command;
export const emphasisKeymap: readonly KeyBinding[];
```

Command behaviour (shared by both commands):

- Returns `false` without dispatching when the editor is read-only (`view.state.readOnly`) or the view is composing (`view.compositionStarted`, which covers the whole `compositionstart`–`compositionend` window; CodeMirror itself additionally ignores key events while `view.composing`). AC-11.3.
- Plans every selection range through `computeEmphasisToggle` and merges the edits into one transaction via `state.changeByRange`, with `userEvent: "input.format"` and `annotations: isolateHistory.of("full")`. Ranges are planned in main-first order; a range whose change interval would overlap an already-planned one is left unchanged, so the merged changeset is always valid and the main range always applies. AC-11.4, AC-11.7.
- Returns `true` only when at least one range changed; otherwise `false` so other keymaps still see the event.
- `emphasisKeymap` is `[{ key: "Mod-b", run: toggleBold }, { key: "Mod-i", run: toggleItalic }]`, registered before `defaultKeymap` (see Architecture). AC-11.6.

## 📝 UI/UX

- **No new control.** The shortcuts act on the editor surface (s03): no toolbar, no menu, no visible state.
- **Live preview.** The cursor line keeps showing its source (existing rule, live preview spec); once the cursor leaves the line the existing decorations render the emphasis (`.cm-lp-strong`, `.cm-lp-em`) because the markers are ordinary Markdown. No preview change is needed.
- **Saving.** Autosave and the save state are unchanged; the status bar shows the same wording.
- **Accessibility.** No new accessible name, role or text; the commands are part of the editor's existing keyboard interaction and require editor focus. Screen readers hear the text changes through the editor's normal content updates.
- **i18n.** No new keys: the feature shows no text.

Prototype: `prototypes/workspace-basic/` (screen map `prototypes/e01-screen-map.md`; screen s03; no new screens).

## 📝 Edge cases & failure scenarios

| Scenario                                                                       | Behaviour                                                                                                               |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Whitespace-only selection (`" "`, `"\n\n"`)                                    | No-op: no transaction, no undo entry.                                                                                   |
| Selection with leading or trailing whitespace (`" text "`)                     | Wrapped exactly as selected (`** text **`); CommonMark may not render it as emphasis. Undo reverts.                     |
| Nested emphasis (`***text***`)                                                 | Ctrl/Cmd+B → `*text*`; Ctrl/Cmd+I → `**text**`; each press is one undo step.                                            |
| Bolding italic (`*text*`) or italicising bold (`**text**`)                     | Wraps: `***text***` (bold + italic).                                                                                    |
| Selection includes its own markers (`**text**` selected)                       | Markers removed; the inner text stays selected.                                                                         |
| Markers on one side only (`**text`, `text**`)                                  | Wrapped (`****text**`); unusual input, Undo reverts.                                                                    |
| Cursor between the empty pair (`**\|**`, `*\|*`)                               | Markers removed; the press toggles off.                                                                                 |
| Cursor inside a non-empty span (`**bo\|ld**`)                                  | Empty markers are inserted at the cursor (`**bo****ld**`); the enclosing span is not detected. Documented rough edge.   |
| Escaped markers (`\*text\*`)                                                   | Escaped runs do not count as emphasis; the selection is wrapped and the backslashes stay as they are.                   |
| Underscore emphasis (`__text__`, `_text_`)                                     | Not detected; the shortcut wraps in asterisks (`**__text__**`).                                                         |
| Selection inside or spanning a code block or inline code                       | Same textual rules; markers are inserted literally (no context check).                                                  |
| Several selections                                                             | Every range toggles in one transaction; one Undo reverts them all.                                                      |
| Selections whose marker runs overlap (adjacent spans with no separator)        | The later range is left unchanged so the merged changeset stays valid; the main range always toggles.                   |
| IME composition in progress                                                    | The command is a no-op from `compositionstart` to `compositionend`; CodeMirror also ignores key events while composing. |
| Read-only editor state                                                         | No change, no undo entry; `false` is returned.                                                                          |
| Editor not focused (tree, tab bar, dialog)                                     | The editor keymap does not see the event and the app keymap does not bind `b`/`i`: nothing happens.                     |
| Empty document                                                                 | `**\|**` (bold) or `*\|*` (italic); pressing again returns to empty.                                                    |
| Selection spanning lines                                                       | Wrapped at the selection boundaries (`**a\nb**`); CommonMark renders the emphasis across the line break.                |
| Undo after several presses                                                     | Each press is its own history event (`isolateHistory`); Undo steps back one press at a time, Redo reapplies.            |
| Toggle immediately after typing                                                | The toggle never groups with the typing: Undo removes only the toggle, the next Undo removes the typing.                |
| Ctrl/Cmd+Shift+B, Alt combinations, or a non-US layout producing another `key` | Not bound; CodeMirror leaves the event to the next handler.                                                             |

## 📝 Risks & impact review

- **Hard to reverse:** none. The file format is untouched (ordinary Markdown markers), and the keymap is code. `BACKWARD_COMPATIBILITY.md` protected surfaces do not change.
- **`Mod-i` shadows CodeMirror's binding.** `defaultKeymap` (checked in `@codemirror/commands` 6.x, 2026-11-17) binds `Mod-i` to `selectParentSyntax`; the emphasis keymap must stay first in the `keymap.of` array. A unit test presses Ctrl+I and asserts italic, not parent selection, so a future reorder fails loudly instead of silently regressing.
- **Textual toggle, not syntax-aware.** Unusual selections (markers on one side only, a selection spanning two emphasis spans, a cursor inside a non-empty span) can produce text that does not render as intended. Mitigations: the AC cases are exact and covered by tests, Undo is one step, autosave never loses data (the file is exactly the editor text), and the Edge cases table records each behaviour. A syntax-tree toggle is the natural follow-up (E05 territory).
- **Several-selection merging.** Overlapping planned changes are reduced to the main range rather than throwing from `changeByRange`, so pathological input cannot corrupt the document or crash the command.
- **Undo granularity.** `isolateHistory` changes history grouping for these two commands only; typing grouping is unchanged.
- **Public exports.** `@basalt/editor` gains additive exports (commands, keymap, helper); it is not on the protected surface list. Any consumer updates in the same PR.
- **No new Tauri permission, Rust command or dependency.**
- **Market check (2026-11-17).** Obsidian exposes Toggle bold / Toggle italic commands with Ctrl/Cmd+B and Ctrl/Cmd+I defaults and supports `**`/`*`, `__`/`_` and `***` for bold + italic (help vault checked for the syntax; the default hotkeys are general knowledge, not re-verified). VS Code's Markdown All in One binds `ctrl+b`/`ctrl+i` to `toggleBold`/`toggleItalic` and, with no selection, expands to the word under the cursor (source read 2026-11-17). Both keep the file as Markdown source. This spec follows the issue's AC instead of word expansion, skips underscore detection and skips the extension's context heuristics.
- **E01-S06 interaction.** No behavioural overlap: the title commit observes the toggle as an ordinary edit and the cursor stays on its line (Architecture).
- **What tests can and cannot prove.** Playwright runs on the memory platform; key presses are real Chromium events, so the binding, the document and the saved file are proven there. The macOS Cmd mapping, real IME behaviour and OS keyboard-layout differences are not covered by CI; they rely on CodeMirror's platform handling plus unit tests around `view.compositionStarted` and the `Mod-` bindings.

## 📝 Decisions in play

- **D05** (MVP = local Markdown notes, local-first) — this spec is editor ergonomics inside that scope; no scope change.
- **D02** (built for the owner first) — justifies the minimal textual toggle over a heavier syntax-aware implementation.
- **N01, N02, N03** — untouched; nothing here proposes a superseding entry.
- The owner decision of 2026-11-16 (Ctrl+B and Ctrl+I are expected in E01) is recorded as D-1. No business rules exist yet.

## Resolved assumptions (autonomous defaults)

The issue's open questions and the spec-internal ones resolved without a gate (autonomous run, 2026-11-17). Override before merge if a different call is wanted.

| #     | Question                                                           | Chosen answer                                                                                                                                                      | Rationale                                                                                                                             |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| RA-1  | Toggle the selection or always wrap it? (issue)                    | Toggle: the second press unwraps.                                                                                                                                  | The issue's acceptance criteria say "pressing again removes the markers"; matches Obsidian and Markdown All in One.                   |
| RA-2  | With no selection, word under the cursor or empty markers? (issue) | Empty markers, cursor between them.                                                                                                                                | The issue's acceptance criteria settle it; word expansion is a larger behaviour and stays out.                                        |
| RA-3  | Nested bold/italic? (issue)                                        | Marker-run parity: bold active for runs ≥ 2, italic for odd runs; `***x***` + B → `*x*`, + I → `**x**`.                                                            | Smallest rule that keeps both toggles symmetric on nested emphasis; matches CommonMark's `***`.                                       |
| RA-4  | Whitespace-only selection? (issue)                                 | No-op, no undo entry.                                                                                                                                              | `** **` is not emphasis in CommonMark, so wrapping would not make it render bold (AC-11.1).                                           |
| RA-5  | Selection that already includes its markers?                       | Unwrap; the inner text stays selected.                                                                                                                             | Matches Markdown All in One's `isWrapped` check; avoids `****text****` on a triple-click selection.                                   |
| RA-6  | Cursor inside a non-empty emphasis span (`**bo\|ld**`)?            | Insert the empty pair at the cursor; no span detection. ⚠ NEEDS HUMAN CONFIRMATION                                                                                 | The AC's no-selection rule read literally; a span-unwrap or cursor-exit behaviour is also defensible and some editors do that.        |
| RA-7  | Conflicts with app-level shortcuts now or in E02? (issue)          | None: the app keymap binds only `o`/`s`/`n`, and E02 (sync) defines no editor shortcuts. The only shadowed binding is CodeMirror's `Mod-i` → `selectParentSyntax`. | Checked `features/keymap/keymap.ts` and the backlog; keeping `Mod-b`/`Mod-i` reserved while the editor is focused is the requirement. |
| RA-8  | Underscore emphasis detection?                                     | No; only `**`/`*` are produced or detected.                                                                                                                        | The issue's scope names `**`/`*`; underscore support is a separate decision.                                                          |
| RA-9  | Context awareness (code blocks, links, quotes)?                    | No; the command is textual and deterministic.                                                                                                                      | Matches the reference implementations and keeps the command parser-free; E01-S10/E05 territory.                                       |
| RA-10 | Where the keymap lives?                                            | Inside `createMarkdownEditor` in `@basalt/editor`, before `defaultKeymap`.                                                                                         | The editor owns its keyboard behaviour; no app wiring and one place to test precedence.                                               |

## 📋 Phasing

1. **PR A, pure toggle.** `formatting.ts` with `computeEmphasisToggle` and its Vitest suite. No wiring, no visible change.
2. **PR B, commands and keymap.** `toggleBold`/`toggleItalic`, `emphasisKeymap`, the `createMarkdownEditor` wiring and `index.ts` exports, editor unit tests and the new Playwright spec. Closes #37.

Closes #37 on PR B only.

## 📋 Implementation plan

Each step is testable and leaves the app working. Vitest next to the code in `basalt-app/packages/editor/src/`, Playwright in `basalt-app/e2e/` (a new `formatting.spec.ts`), and the validation gate from `SDLC.md` before the PR.

**Phase A — pure toggle (PR A)**

1. `formatting.ts`: `computeEmphasisToggle` with the toggle rules (unwrap outside, unwrap inside, wrap, insert, whitespace no-op), run counting with the escape guard and the parity rule. Tests in `formatting.test.ts`: wrap/unwrap outside/inner, empty insert/remove, whitespace-only null, escaped runs (`\*a\*`), `***text***` under both markers, `*text*` + bold → `***text***`, and per-range plans for several ranges.

**Phase B — commands, keymap, e2e (PR B)**

2. `toggleBold`/`toggleItalic`: the `readOnly` and `compositionStarted` guards; one transaction via `state.changeByRange` with `userEvent: "input.format"` and `isolateHistory.of("full")`; the main-first overlap fallback; `false` when nothing changed. View-level tests: one press = one transaction; typing then toggle then Undo leaves the typing and Redo reapplies; read-only returns `false`; a `compositionstart` event on the content DOM makes the command a no-op until `compositionend`; two adjacent ranges whose marker runs overlap toggle only the main range. (AC-11.3, AC-11.4, AC-11.7, AC-11.8.)
3. `emphasisKeymap`, the `createMarkdownEditor` wiring before `defaultKeymap`, and the `index.ts` exports. Tests: a Ctrl+I keydown runs italic and not `selectParentSyntax`; Ctrl+B inserts `**|**`; binding-order regression test. (AC-11.6.)
4. e2e `formatting.spec.ts` on the memory platform: type and select text, press `Control+b`, see the source on the active line and the rendered `.cm-lp-strong` after moving the cursor, press again and see the markers removed; the `*|*` insertion and removal; a whitespace-only selection is a no-op; a selection including its markers unwraps; `Control+z` restores in one step; the saved file contains the markers (`readSavedText`); with focus in the tree the shortcut does nothing. (AC-11.1, AC-11.2, AC-11.4, AC-11.5, AC-11.9, AC-11.10, AC-11.11.)
5. Run the `SDLC.md` validation gate (format:check, lint, typecheck, test, build, test:e2e, rust:fmt, rust:lint); the Rust steps are unchanged but part of the gate.
