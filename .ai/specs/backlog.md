# Backlogs

## .ai/specs/product-brief.md

Backlog source: .ai/specs/product-brief.md
Last filed: 2026-10-18

| Id          | Issue | Title                                                              | Epic        | Depends on | Adopted |
| ----------- | ----- | ------------------------------------------------------------------ | ----------- | ---------- | ------- |
| E01         | #5    | Local Markdown notes that work offline                             | —           | —          | no      |
| E02         | #6    | Self-hosted sync with client-side E2EE                             | —           | —          | no      |
| E03         | #7    | Later (parked, no stories)                                         | —           | —          | no      |
| E01-S01     | #8    | The owner can create and edit notes stored as plain Markdown files | #5          | —          | no      |
| E01-S03     | #10   | The owner can add images to notes                                  | #5          | #8         | no      |
| E02-S01     | #11   | The owner can run their own sync server and connect Basalt to it   | #6          | #8         | no      |
| E02-S01-T01 | #12   | Write the sync and E2EE spec                                       | #11 (story) | —          | no      |
| E02-S02     | #13   | Notes are encrypted on the client before leaving the device        | #6          | #11        | no      |
| E02-S03     | #14   | Changes sync between the owner's devices                           | #6          | #13        | no      |

Note: the live-preview editor (`.ai/specs/implemented/2026-11-08-live-preview-editor.md`, AC-01.18) was extracted from E01-S01 and has no story of its own; it is tracked under epic #5.

## Epic 01 test findings (owner feedback, 2026-11-16)

Backlog source: Epic 01 test findings (owner feedback, 2026-11-16)
Last filed: 2026-11-16

| Id      | Issue | Title                                                           | Epic | Depends on | Adopted |
| ------- | ----- | --------------------------------------------------------------- | ---- | ---------- | ------- |
| E01-S05 | #39   | The owner can rename, move and delete folders                   | #5   | #16        | no      |
| E01-S06 | #34   | The note name follows its first heading                         | #5   | #8, #16    | no      |
| E01-S07 | #36   | The status bar shows word count instead of the save state       | #5   | #8         | no      |
| E01-S08 | #33   | Informational conflicts appear as toasts                        | #5   | #16        | no      |
| E01-S09 | #35   | Scrolling and scrollbars follow one model                       | #5   | #16        | no      |
| E01-S10 | #32   | Live preview handles fenced code and backslash escapes          | #5   | —          | no      |
| E01-S11 | #37   | The owner can format text with Ctrl+B and Ctrl+I                | #5   | #8         | no      |
| E01-S12 | #40   | The owner can resize images by dragging                         | #5   | #10        | no      |
| E04     | #38   | Mobile-ready interface                                          | —    | #5         | no      |
| E05     | #31   | Extended Markdown compatibility                                 | —    | #5         | no      |

E04 and E05 are parked as epics; their stories will be filed after their specs are written. The table above records the Epic 01 test findings; every E01 finding now has a spec: E01-S05 and E01-S06 (2026-11-16), E01-S07–E01-S12 (2026-11-17), all under `.ai/specs/`.
