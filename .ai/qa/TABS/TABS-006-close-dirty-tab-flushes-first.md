# TABS-006 — Writes the typed text to disk before the tab closes when a dirty tab is closed

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-006                                                                                                                                                       |
| Status         | Active                                                                                                                                                         |
| Priority       | High                                                                                                                                                           |
| Type           | UI                                                                                                                                                             |
| Requirement    | [AC-01.16](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (closing a tab flushes the save first)                                                |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"writes the typed text to disk before the tab closes when a dirty tab is closed"` |
| Run            | `npx playwright test --grep @TABS-006` (from `basalt-app/`)                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                               |

## Scenario

Given note `a` is open with `quick` typed and not yet autosaved
And the clock is frozen so the file is still empty
When the owner uses the Close button of tab `a`
Then no tab remains
And the file holds exactly `quick`

## Steps observed in the app

| #   | Action        | Observed result       |
| --- | ------------- | --------------------- |
| 1   | Type `quick`  | File still empty      |
| 2   | Click Close a | No tabs; file `quick` |

## Related cases

SAVING-007 (failing flush).
