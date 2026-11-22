# NOTES-064 — Rejects a name with a separator inline and leaves the file unchanged when a note is renamed

| Field          | Value                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-064                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                      |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                               |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"rejects a name with a separator inline and leaves the file unchanged when a note is renamed"` |
| Run            | `npx playwright test --grep @NOTES-064` (from `basalt-app/`)                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                        |

## Scenario

Given note `alpha` exists
When the owner types `x/y` as the new name and presses Enter
Then the dialog shows `cannot contain` and the Rename button is disabled
And the dialog stays open and the only file is `alpha.md`

## Steps observed in the app

| #   | Action      | Observed result              |
| --- | ----------- | ---------------------------- |
| 1   | Type x/y    | Message; button disabled     |
| 2   | Press Enter | Dialog open; files unchanged |

## Related cases

NOTES-056.
