# NOTES-063 — Closes the Rename dialog, shows an already-exists toast and changes nothing when the new name differs only by Unicode form from another note

| Field          | Value                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-063                                                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                                                   |
| Priority       | Medium                                                                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                                                                       |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) and [AC-08.1](../../specs/2026-11-17-informational-toasts.md)                                                                                                  |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"closes the Rename dialog, shows an already-exists toast and changes nothing when the new name differs only by Unicode form from another note"` |
| Run            | `npx playwright test --grep @NOTES-063` (from `basalt-app/`)                                                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                         |

## Scenario

Given notes `alpha`, `beta`, `Café` exist
When the owner renames `alpha` to a Unicode-equivalent spelling of `Café`
Then the dialog closes, a toast says it already exists and the files and `alpha.md` text are unchanged

## Steps observed in the app

| #   | Action         | Observed result  |
| --- | -------------- | ---------------- |
| 1   | Rename to Café | Toast; unchanged |

## Related cases

NOTES-062.
