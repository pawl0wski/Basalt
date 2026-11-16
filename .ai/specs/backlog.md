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
