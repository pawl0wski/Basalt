# FOLDERS-014 — Shows an already-exists toast and keeps the folder in place when its name exists in the destination

| Field          | Value                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-014                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                |
| Priority       | Medium                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                    |
| Requirement    | [AC-05.2](../../specs/implemented/2026-11-16-rename-move-delete-folders.md) and [AC-08.1](../../specs/2026-11-17-informational-toasts.md)                                             |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"shows an already-exists toast and keeps the folder in place when its name exists in the destination"` |
| Run            | `npx playwright test --grep @FOLDERS-014` (from `basalt-app/`)                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                      |

## Scenario

Given folders `a/x` and `b/X` exist
When the owner drags `x` onto `b`
Then a toast says it already exists in the destination
And `a/x/n.md` is still there

## Steps observed in the app

| #   | Action        | Observed result  |
| --- | ------------- | ---------------- |
| 1   | Drag x onto b | Toast; unchanged |

## Related cases

NOTES-016.
