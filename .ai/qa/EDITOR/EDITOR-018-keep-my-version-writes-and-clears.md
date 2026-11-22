# EDITOR-018 — Writes the typed text and clears the banner when Keep my version is chosen on a conflict

| Field          | Value                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-018                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                           |
| Requirement    | [Edge cases — open note is dirty](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (Keep my version overwrites)                                                                 |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"writes the typed text and clears the banner when Keep my version is chosen on a conflict"` |
| Run            | `npx playwright test --grep @EDITOR-018` (from `basalt-app/`)                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                             |

## Scenario

Given the conflict banner is shown for `a`
When the owner chooses Keep my version
Then the banner disappears and the tab is saved
And the file holds `base mine`

## Steps observed in the app

| #   | Action                 | Observed result            |
| --- | ---------------------- | -------------------------- |
| 1   | Choose Keep my version | No alert; file `base mine` |

## Related cases

EDITOR-019, EDITOR-020.
