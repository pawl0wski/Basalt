# IMAGES-013 — Ignores a file dropped outside the editor and prevents the browser from navigating to it

| Field          | Value                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-013                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                               |
| Requirement    | [Edge cases — File dropped outside the editor](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                            |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"ignores a file dropped outside the editor and prevents the browser from navigating to it"` |
| Run            | `npx playwright test --grep @IMAGES-013` (from `basalt-app/`)                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                 |

## Scenario

Given note `a` containing `keep` is open
When the owner drops `x.png` on the page body
Then the drop is prevented, the URL is unchanged and the note and files are unchanged

## Steps observed in the app

| #   | Action       | Observed result |
| --- | ------------ | --------------- |
| 1   | Drop on body | Nothing changes |

## Related cases

IMAGES-012.
