# WINDOW-002 — Marks the title bar as a drag region and its Close button as not draggable

| Field          | Value                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-002                                                                                                                                                 |
| Status         | Active                                                                                                                                                     |
| Priority       | Medium                                                                                                                                                     |
| Type           | UI                                                                                                                                                         |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                           |
| Implementation | [`basalt-app/e2e/window.spec.ts`](../../../basalt-app/e2e/window.spec.ts) — `"marks the title bar as a drag region and its Close button as not draggable"` |
| Run            | `npx playwright test --grep @WINDOW-002` (from `basalt-app/`)                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                           |

## Scenario

Given the app is open on the Welcome screen
When the title bar is inspected
Then the bar carries `data-tauri-drag-region=true`
And the Close window button does not carry it

## Steps observed in the app

| #   | Action                               | Observed result           |
| --- | ------------------------------------ | ------------------------- |
| 1   | Inspect the bar and the Close button | Attribute on the bar only |

## Related cases

Blocker: no requirement for the drag region; it can only be proven on real Tauri (see PLATFORM).
