# TABS-003 — Keeps the text and the undo history of each tab separate when switching between tabs

| Field          | Value                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-003                                                                                                                                                             |
| Status         | Active                                                                                                                                                               |
| Priority       | High                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                   |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                     |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"keeps the text and the undo history of each tab separate when switching between tabs"` |
| Run            | `npx playwright test --grep @TABS-003` (from `basalt-app/`)                                                                                                          |
| Review         | AI draft — awaiting human review                                                                                                                                     |

## Scenario

Given notes `a` and `b` are open with `aaa` and `bbb` typed
And the clock is frozen
When the owner switches to `a` and presses Ctrl+Z
Then `a` no longer contains `aaa`
And `b` still contains `bbb`

## Steps observed in the app

| #   | Action                  | Observed result |
| --- | ----------------------- | --------------- |
| 1   | Type aaa in a, bbb in b | Both unsaved    |
| 2   | Switch to a, Ctrl+Z     | a loses aaa     |
| 3   | Switch to b             | b keeps bbb     |

## Related cases

Blocker: write the requirement (per-tab undo and text) before a human reviews this scenario.
