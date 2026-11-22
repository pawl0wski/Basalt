# IMAGES-014 — Shows the read-only notice and inserts nothing when an image is pasted in a read-only workspace

| Field          | Value                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-014                                                                                                                                                                              |
| Status         | Active                                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                                      |
| Requirement    | [Edge cases — Read-only workspace](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                               |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"shows the read-only notice and inserts nothing when an image is pasted in a read-only workspace"` |
| Run            | `npx playwright test --grep @IMAGES-014` (from `basalt-app/`)                                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                                        |

## Scenario

Given a read-only workspace with note `a` containing `text`
When the owner pastes `x.png`
Then a notice says `The workspace folder is read-only. Nothing was changed.`
And the editor text is `text` and only `a.md` exists

## Steps observed in the app

| #   | Action      | Observed result   |
| --- | ----------- | ----------------- |
| 1   | Paste x.png | Notice; unchanged |

## Related cases

IMAGES-016.
