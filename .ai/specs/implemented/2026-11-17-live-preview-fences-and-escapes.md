---
date: 2026-11-17
slug: live-preview-fences-and-escapes
type: spec
status: implemented
tags: [live-preview, markdown, fences, escapes, editor, e01]
---

# Live preview handles fenced code and backslash escapes (E01-S10)

Source issue: #32 (E01-S10, epic #5). Depends on: none (the live-preview editor is implemented). Builds on `.ai/specs/implemented/2026-11-08-live-preview-editor.md` (the "live-preview spec", implemented in PR #24), which this spec amends. Design authority: `.ai/specs/product-brief.md`. Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec"). Screen ids (s03) refer to `prototypes/e01-screen-map.md`.

## 📝 TLDR

The owner (the only confirmed user, D02) sees a fenced code block keep its fence lines in live preview, and sees `\*` instead of a literal `*`. This spec (future behavior) hides the opening and closing fence markers and the optional info string when the cursor and selection are not on their line, shows the source on the active line, and renders every parser-level backslash escape literally off the active line. The document is never modified: the saved file keeps the exact source bytes. The owner's 2026-11-16 decision reverses the live-preview test that kept fences visible.

## 📝 Decisions (owner)

| Id  | Topic       | Decision                                                                                                                                                                                                                     |
| --- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Fences      | The opening and closing fence markers of a fenced code block hide when the cursor and selection are not on their line; the active fence line shows its source. This reverses the test that kept fences visible (2026-11-16). |
| D-2 | Escapes     | Backslash escapes render literally off the active line (`\*` shows `*`, `` \` `` shows `` ` ``, and so on); the active line shows the source. The saved file keeps the escape bytes (2026-11-16).                            |
| D-3 | Scope       | Syntax highlighting by language (E05), a language label UI and a change to the Markdown dialect stay out of scope (2026-11-16, issue #32).                                                                                   |
| D-4 | Spec update | The live-preview spec and the test that currently asserts fences stay visible are updated by this story (2026-11-16, issue #32).                                                                                             |

## 📝 Acceptance criteria

The issue's five criteria are refined below; the derived ones make the decisions and the existing active-line rule explicit. Screen ids refer to the screen map.

| Id       | Criterion                                                                                                                                                                                                                                     | Screen |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC-10.1  | Given a fenced code block and a cursor that is not on a fence line, then the code text is visible with its block styling and the opening and closing fence markers and the optional info string are not visible.                              | s03    |
| AC-10.2  | Given the cursor or selection on an opening or closing fence line, then that line shows its full source (for example ` ```js `); the other fence line stays hidden while its own line is not active.                                          | s03    |
| AC-10.3  | Given `Test` inside a fenced block with a blank line before it (` ```\n\nTest\n``` `), then the rendered block shows the blank line and `Test`, and no fence syntax.                                                                          | s03    |
| AC-10.4  | Given an escaped backtick in text and a line that is not active, then a literal backtick is rendered and the saved file still contains the backslash and the backtick.                                                                        | s03    |
| AC-10.5  | Given any CommonMark-escapable punctuation escaped with a backslash (an escaped asterisk, hash, bracket, and so on), then off the active line the backslash is hidden and the literal character renders; on the active line the source shows. | s03    |
| AC-10.6  | Given an unclosed fence, then no content is lost, the opening fence line hides when it is not active, and the source is recoverable by putting the cursor on it.                                                                              | s03    |
| AC-10.7  | Given a tilde fence (`~~~`) or a fence with an info string, then the same hiding and active-line rules apply.                                                                                                                                 | s03    |
| AC-10.8  | Given a selection that spans a fence line or an escape, then every line the selection touches shows its source (the existing `activeLineNumbers` rule).                                                                                       | s03    |
| AC-10.9  | Given escapes inside a fenced code block or an inline code span, then the backslash stays visible (no escape processing inside code); given mixed inline code and an escape on one line, both render correctly.                               | s03    |
| AC-10.10 | The document is never changed by rendering: the editor text and the saved file are the exact source, including every fence marker and every backslash.                                                                                        | s03    |

## 📝 Not doing

- **Syntax highlighting by language.** E05 owns it; the info string is hidden, not interpreted.
- **A language label** (a `js` chip where the opening fence was). The issue excludes a language label UI.
- **Collapsing the whole fence line.** The line stays as an empty, code-styled line; the collapsed alternative is the owner override recorded in Resolved assumptions 1 (⚠ NEEDS HUMAN CONFIRMATION).
- **Changing the Markdown dialect or the parser's escape set.** Both come from `@lezer/markdown` (GFM base); the spec renders what the parser already parses.
- **Hard-break rendering for a trailing backslash.** `\` at the end of a line is a CommonMark hard break, not an escape; E05.
- **Hiding fence syntax inside inline or indented code.** There is none; code content is `CodeText`.
- **Escapes inside link destinations.** The destination is shown as source today (`cm-lp-link-url`), and this spec does not hide it.
- **Folding, a copy button, line numbers or a wrap toggle** for code blocks. No story asks for them.
- **A setting, command or keyboard shortcut** to toggle the behavior.
- **Changes to `@basalt/app`, `@basalt/core`, `@basalt/ui`, `src-tauri`, i18n or the workspace format.**

## 📝 Problem statement

- The owner tested epic E01 and reported the rendering gap (owner feedback, 2026-11-16, issue #32): a fenced block never looks rendered in live preview, and a backslash escape keeps its backslash.
- The live-preview spec records the old behavior: "Styled only: links, list and task markers, blockquotes, fenced and indented code, headings." `packages/editor/src/livePreview.test.ts` pins it twice: `"hides inline code backticks but not fenced code fences"` (line 103, expecting hidden ranges `[[2, 3], [4, 5]]` only) and `"hides nothing inside a code block that looks like emphasis"` (line 118). The owner's decision of 2026-11-16 (D-1, D-2) reverses that.
- The cost today: the owner reads fence syntax between paragraphs of a note that is otherwise rendered, and an escaped character never looks literal. Who: the owner, the only confirmed user (D02).
- The escape half is a rendering gap, not a data gap: the parser already produces `Escape` nodes for `\` plus CommonMark's escapable punctuation, and nothing in the live preview consumes them.

## 📝 Proposed solution

Extend the existing live-preview decoration builder; add no new extension, provider or API.

1. **Fences.** In `buildLivePreviewDecorations`'s existing `"FencedCode"` case — which already applies the `cm-lp-codeblock` line styling — hide the opening fence line's content (the `CodeMark` through the `CodeInfo`, or just the `CodeMark` when there is no info string) and the closing `CodeMark`, unless their line is in `activeLineNumbers(state)`. The existing `hidden = Decoration.replace({})` does the hiding; the line remains as an empty, code-styled line, so it keeps its height and stays reachable and clickable for AC-10.2.
2. **Escapes.** Add an `"Escape"` case: off the active line, hide only the backslash (`[node.from, node.from + 1]`); the escaped character stays in the document and renders literally. Code spans and fenced blocks are parsed as `CodeText`, so their backslashes are untouched.
3. **Tests and docs.** Replace the two fence tests that pin the old behavior, add unit and editor-level coverage and Playwright cases, and amend the live-preview spec (D-4).

Alternatives considered and rejected:

- **Collapsing the whole fence line (Obsidian-like).** A zero-height line is skipped by CodeMirror's vertical cursor motion (`moveVertically` resolves the point above the code line to the line above the fence), so the cursor could not reach the fence line and AC-10.2 would fail; it would also need a block-active rule and a `StateField`, because a `display: none` line influences vertical layout and CodeMirror allows only direct decorations to do that. Recorded as the owner's override option in Resolved assumptions 1 (⚠ NEEDS HUMAN CONFIRMATION).
- **A language label widget on the opening fence line.** Out of scope (D-3; E05).
- **Replacing the whole `Escape` node with a widget that shows the escaped character.** An inline widget changes cursor mapping for no visible gain over hiding the one backslash.
- **A `@basalt/core` helper.** The rule is a decoration over the syntax tree and has no second consumer; `@basalt/core` stays untouched (standards spec, YAGNI).
- **Turning off or reconfiguring the Markdown parser.** Out of scope; it would change what the saved file means.

## 📝 Architecture

- **`@basalt/editor`.** `packages/editor/src/livePreview.ts` is the only production file. `buildLivePreviewDecorations(state, ranges)` gains the fence hiding inside its `"FencedCode"` branch and an `"Escape"` branch; `activeLineNumbers` and the `hidden` decoration are reused unchanged; `livePreview` (the view plugin plus `livePreviewTheme`) is unchanged. The plugin's `update` already rebuilds on `docChanged`, `selectionSet`, `viewportChanged` and syntax-tree changes, so selection-only moves re-render. The node names are the ones `@lezer/markdown` 1.8.1 (through `@codemirror/lang-markdown` 6.5.2) produces: `FencedCode` with `CodeMark` and optional `CodeInfo` children, and `Escape` spanning the backslash plus one escapable character.
- **`@basalt/app`.** No change: `NoteEditor` and `NoteSessionEditor` pass options to `createMarkdownEditor`, which already installs `livePreview`; no new prop, text or i18n key.
- **`@basalt/core` and `@basalt/ui`.** No change.
- **`src-tauri`.** No change: no new Tauri permission, Rust command or dependency.
- **Constraint that shapes the design.** Every new replace decoration stays within one line (a fence line or a single escape), which is safe from the view plugin; the 2026-11-15 lesson records that a view-plugin replace must not cover a line break, and block-level decorations must come from a state field. Keeping the fence line as an empty line avoids both problems.
- **Tests.** `packages/editor/src/livePreview.test.ts` (pure decoration tests plus editor-level jsdom tests) and the `live preview` block of `basalt-app/e2e/editor.spec.ts` (Playwright). The live-preview spec's Implementation notes are amended.

## 📝 Data model

No new entities and no persisted-format change. The note on disk is byte-identical: rendering is decoration only, the editor state's document is untouched, and `onChange` is not called by a cursor move. The only state is the in-memory `DecorationSet` rebuilt from the syntax tree and the selection. No data-model graph: this section adds or changes no entities.

## 📝 API contracts

```ts
// @basalt/editor — livePreview.ts (no signature or export change)
export function buildLivePreviewDecorations(
    state: EditorState,
    ranges: readonly TextRange[],
): DecorationSet;
export function activeLineNumbers(state: EditorState): Set<number>;
export const livePreview: Extension;
```

Internal rules of `buildLivePreviewDecorations`:

- **`FencedCode`.** Keep `addLineDecorations` (every block line gets `cm-lp-codeblock`). For each `CodeMark` child of the `FencedCode` node, when the marker's line is not active, push `hidden.range(marker.from, marker.to)`; for the opening marker, extend the end to the `CodeInfo` end when one exists (`node.node.getChild("CodeInfo")?.to ?? marker.to`), so the info string hides with the marker. An unclosed fence has no closing `CodeMark`. The existing `"CodeMark"` branch keeps handling only `InlineCode`.
- **`Escape`.** When its line is not active, push `hidden.range(node.from, node.from + 1)`; the escaped character (the second position) stays visible.
- No other node changes; `Decoration.set(out, true)` sorts the ranges.

Both new ranges stay on one line, so no block widget, state field or direct provider is added. The public exports are unchanged, so no consumer (only `@basalt/app`'s `NoteEditor`) changes.

## 📝 UI/UX

- **Fenced block (s03).** With the cursor elsewhere, the owner sees the code text in the block style and an empty first and last line where the fences were (the empty code-styled line reads as block padding). Moving the cursor to a fence line shows ` ```js ` there; leaving it hides it again.
- **Escapes (s03).** Off the active line `\*` shows `*`, `\#` shows `#`, `` \` `` shows `` ` `` and `\\` shows `\`; on the active line the source shows. Nothing else on the line changes.
- **No new controls, dialogs, text or states.** The editor keeps one surface; no preview or source panel appears.
- **Accessibility.** The fence line is a normal line for clicks and arrow keys (the reason the empty line was chosen over a collapsed one); the hidden backslash is plain text, not a focusable element; the editor's `aria-label` and keyboard behavior are unchanged; the rendered text is what a screen reader reads.

Prototype: `prototypes/workspace-basic/` (screen map `prototypes/e01-screen-map.md`; screen s03). Its editor is the DSG-01 stand-in; no prototype work is needed.

## 📝 Edge cases & failure scenarios

| Scenario                                                       | Behaviour                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Unclosed fence (` ``` ` with no closing fence)                 | Only the opening marker hides; the content stays; the source shows when the cursor is on the opening line.    |
| Tilde fence (`~~~js`)                                          | The same rules as a backtick fence.                                                                           |
| Info string (` ```js `, ` ``` js `)                            | Hidden with the opening marker; shown in full on the active line.                                             |
| Closing fence longer than the opening                          | The whole `CodeMark` hides; the parser decides which fence closes the block.                                  |
| Closing fence shorter than the opening                         | Does not close the block (parser rule); it stays code content and is not hidden as a marker.                  |
| Cursor on the opening fence                                    | That line shows its source; the closing fence stays hidden while its own line is not active.                  |
| Cursor on the closing fence                                    | That line shows its source; the opening fence stays hidden.                                                   |
| Cursor on a code line inside the block                         | The fence lines stay hidden (per-line rule); the cursor line is the code line.                                |
| Selection spanning the block                                   | Every touched line shows its source; untouched fence lines stay hidden.                                       |
| Fence inside a blockquote (the quote marker on the fence line) | The marker and info hide; the `>` quote marker stays visible (the existing rule never hides quote markers).   |
| Fence inside a list item                                       | The list marker and indentation on the fence line stay visible; only the fence marker and info hide.          |
| Indented code block                                            | No markers to hide; the block styling is unchanged.                                                           |
| Empty fenced block (` ``` ` immediately followed by ` ``` `)   | Two empty fence lines off the active block; no content is lost.                                               |
| Fence at the very start or end of the document                 | Same behaviour; positions stay in range.                                                                      |
| `\*`, `\#`, `` \` ``, `\\`                                     | Off the active line the backslash hides and the literal character shows; on the active line the source shows. |
| `\a` (backslash before a non-escapable character)              | No `Escape` node; the source stays, which is the literal rendering CommonMark gives.                          |
| A trailing `\` at the end of a line                            | Not an `Escape` node (a hard break); the source stays; hard-break rendering is out of scope (E05).            |
| Escape inside a fenced block or an inline code span            | Code content is `CodeText`; the backslash stays visible, as CommonMark requires.                              |
| Mixed inline code and an escape on one line                    | Both decorations apply independently (backticks hidden, escaped character rendered).                          |
| Escape in a link label                                         | The backslash hides and the label renders literally; a link destination is shown as source (no hiding).       |
| Escape at the start or end of a line or document               | Valid positions; no out-of-range decoration.                                                                  |
| CRLF note                                                      | The app normalises to LF in memory (S01) and writes the file's EOL back; decorations are position-based.      |
| Saved file                                                     | Rendering never changes the document; the saved file equals the source, fences and backslashes included.      |
| Cursor or selection move only                                  | Decorations rebuild; `onChange` is not called and no save is scheduled.                                       |
| Image link inside a fenced block                               | Code text, not an `Image` node; no image widget and no overlap with the hidden marker.                        |

## 📝 Risks & impact review

- **Hard to reverse:** none. The change is decoration-only; removing the new branches restores today's rendering. The note on disk is untouched, and `BACKWARD_COMPATIBILITY.md` protected surfaces (workspace format, `@basalt/core`/`@basalt/ui`/`@basalt/api` exports, Tauri configuration, validation scripts) are unchanged.
- **The empty fence line is a visual call owned by the owner** (Resolved assumption 1, ⚠ NEEDS HUMAN CONFIRMATION). The override to Obsidian-style collapse needs a block-active rule (the fence line is unreachable once it has zero height) and a `StateField` for layout-affecting decorations, so it is a separate change, not a CSS tweak.
- **Cursor mapping around a hidden backslash.** A one-character replace decoration: a click or selection near the escaped character maps to the line, the line becomes active, and the source shows. No atomic range is added.
- **Hidden markers vs. block styling.** The fence line keeps `cm-lp-codeblock`; the empty code-styled line is the visible result. The existing test `"styles each line of a blockquote and a fenced block"` (three `cm-lp-codeblock` lines) stays valid.
- **The `Escape` node never occurs inside code**, so the codeblock styling and the image widgets are unaffected.
- **Market check (general knowledge, not freshly verified, 2026-11-17).** Obsidian's live preview, which is also CodeMirror 6, hides fenced-code fence syntax when the cursor is outside the block and shows it when the fence line is active; backslash escapes render as the literal character off the active line. Typora and Logseq likewise hide fence syntax in their live or preview modes; VS Code and GitHub render Markdown only in a separate preview pane, so the fence source stays visible there. This spec takes the hiding and literal-escape goals but keeps the fence line as an empty line instead of collapsing it, and adds neither syntax highlighting (E05) nor a language label.
- **The live-preview spec is amended, not rewritten** (D-4): AC-01.18 stays true, the element list and Implementation notes gain the fence and escape hiding, and the test that pinned visible fences is replaced. The E01-S05 and E01-S06 specs (2026-11-16) are orthogonal: they change the tree and the title commit, not the editor decorations.
- **No new Tauri permission, Rust command, dependency, persisted format or i18n string.**
- **What tests can and cannot prove.** Playwright runs on the memory platform, so it proves the rendered text and the saved text through the app's ports, not a real disk write; the save path's byte round-trip is already covered by the S01 tests and is unchanged here.

## 📝 Decisions in play

- **D02** (built for the owner first) — the owner's E01 finding drives the change.
- **D05** (MVP = Markdown notes) — rendering only; no scope change.
- **Screen-map D-5** (2026-10-31: live preview, as in Obsidian) — supports the goal; the empty-line choice is the deliberate, reversible deviation from Obsidian's collapse (Resolved assumption 1, ⚠ NEEDS HUMAN CONFIRMATION).
- **N03** (no README features) — untouched; no new feature surface.
- Nothing proposed here supersedes an active entry.

## Resolved assumptions (autonomous defaults)

| #   | Question from the issue                                             | Chosen answer                                                                                                                                             | Rationale                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Hide the whole fence line or leave an empty line?                   | Hide the fence markers and the info string with the existing replace decoration; the line stays as an empty, code-styled line. ⚠ NEEDS HUMAN CONFIRMATION | Reuses the existing primitive and the per-line rule, keeps the fence line reachable and clickable (AC-10.2), and avoids layout-affecting decorations; a collapsed line is skipped by vertical cursor motion and needs a block-active rule plus a `StateField`. |
| 2   | Do we show a small language label where the opening fence was?      | No label.                                                                                                                                                 | The issue lists a language label UI as out of scope; E05 owns language-aware behavior.                                                                                                                                                                         |
| 3   | Which escape characters must be supported, and do any stay visible? | All CommonMark-escapable ASCII punctuation (`\` + one of ``!"#$%&'()*+,-./:;<=>?@[\]^_`{\|}~``); nothing stays visible except on the active line.         | Exactly the set `@lezer/markdown` already parses into `Escape` nodes, so there is no custom table to maintain; matches the issue's "and so on".                                                                                                                |
| 4   | How should the active-line rule work for a multi-line selection?    | Every line the selection touches shows its source; untouched lines render.                                                                                | The existing `activeLineNumbers` rule already used for headings, emphasis and inline code (AC-01.18); no new rule.                                                                                                                                             |

## 📋 Phasing

1. **PR A, fences.** The fence decoration in `livePreview.ts`, unit and editor-level tests, the Playwright fence cases, and the live-preview spec/test update. Ships the fence half.
2. **PR B, escapes.** The `Escape` decoration in `livePreview.ts`, unit and editor-level tests, and the Playwright escape cases. Ships the escape half.

Closes #32 on PR B only.

## 📋 Implementation plan

Each step is testable and leaves the app working. Vitest next to the code, Playwright in the `live preview` block of `basalt-app/e2e/editor.spec.ts`, and the validation gate from `SDLC.md`.

**Phase A — fences (PR A)**

1. `buildLivePreviewDecorations`: inside the `"FencedCode"` branch, hide the opening `CodeMark` plus its `CodeInfo` and the closing `CodeMark` when their line is not active; keep the block styling. Unit tests: markers hidden off the active line and shown on it; info string hidden with the marker; tilde fence; unclosed fence; longer closing fence; fence inside a blockquote (the quote marker stays); empty fenced block.
2. `livePreview.test.ts`: replace `"hides inline code backticks but not fenced code fences"` with a test that asserts the two fence markers are also hidden; update `"hides nothing inside a code block that looks like emphasis"` to expect only the fence markers; keep `"styles each line of a blockquote and a fenced block"`. Editor-level tests: the fence line's `textContent` is empty off the active line and the source on it; `getText` is unchanged.
3. Amend `.ai/specs/implemented/2026-11-08-live-preview-editor.md`: record both the fence and escape hiding in the element list item 2 and in the Implementation notes' "Hidden:" list, and add an "Amended 2026-11-17 by `.ai/specs/2026-11-17-live-preview-fences-and-escapes.md` (E01-S10)" line; AC-01.18 stays as written. The escape half of the amendment is implemented in PR B.
4. Playwright: seed a note with a fenced block, an info string, a blank line and `Test`; assert the fence lines have no text while the code text and the blank line are visible, the saved text equals the source; move the cursor to the opening and closing fence lines and assert the source; an unclosed fence keeps its content; a selection spanning the block shows the source. (AC-10.1, 10.2, 10.3, 10.6, 10.7, 10.8, 10.10)

**Phase B — escapes (PR B)**

5. `buildLivePreviewDecorations`: add the `"Escape"` branch (hide the backslash off the active line). Unit tests: `\*`, `\#`, `` \` ``, `\\`, `\a`, a trailing `\`, an escape inside an inline code span and inside a fenced block, mixed inline code and an escape, the active line.
6. Editor-level tests: the rendered text off the active line, the source on it, and `getText` unchanged.
7. Playwright: seed `\*literal\*` and an escaped backtick; assert the literal characters off the active line, the source on it, and that the saved text keeps the backslashes. (AC-10.4, 10.5, 10.9, 10.10)
