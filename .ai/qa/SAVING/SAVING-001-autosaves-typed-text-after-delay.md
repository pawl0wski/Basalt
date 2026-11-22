# SAVING-001 — Marks the tab not saved while typing and saved again with the exact bytes on disk once the autosave delay passes

| Field          | Value                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | SAVING-001                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                               |
| Requirement    | [AC-01.19](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and the Autosave rule (1 000 ms debounce)                                                                               |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"marks the tab not saved while typing and saved again with the exact bytes on disk once the autosave delay passes"` |
| Run            | `npx playwright test --grep @SAVING-001` (from `basalt-app/`)                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                 |

## Scenario

Given a workspace with an empty note `a`, open in a tab
And the clock is frozen
When the owner types `hello world` and 1 000 ms pass
Then the tab is named `a not saved` while the delay has not passed and the file is still empty
And after the delay the tab is named `a` and the file holds exactly the bytes of `hello world`

## Steps observed in the app

| #   | Action                     | Observed result                                   |
| --- | -------------------------- | ------------------------------------------------- |
| 1   | Open note `a`              | Tab named `a`                                     |
| 2   | Type `hello world`         | Tab named `a not saved`; file on disk still empty |
| 3   | Advance the clock 1 000 ms | Tab named `a`; file holds `hello world`           |

## Related cases

SAVING-002 (save now, before the delay). Not covered: a second edit during an in-flight save (Vitest, autosave state machine).
