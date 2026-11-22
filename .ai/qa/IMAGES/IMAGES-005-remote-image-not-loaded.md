# IMAGES-005 — Shows the remote-images-not-loaded placeholder and sends no request when a note links an https image

| Field          | Value                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | IMAGES-005                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                               |
| Priority       | High                                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                                   |
| Requirement    | [Edge cases — `https://` image](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                               |
| Implementation | [`basalt-app/e2e/images.spec.ts`](../../../basalt-app/e2e/images.spec.ts) — `"shows the remote-images-not-loaded placeholder and sends no request when a note links an https image"` |
| Run            | `npx playwright test --grep @IMAGES-005` (from `basalt-app/`)                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                     |

## Scenario

Given a note links `https://images.example.test/a.png`
When the owner opens the note
Then the text `Remote images are not loaded` is shown
And no request to `images.example.test` was made

## Steps observed in the app

| #   | Action        | Observed result         |
| --- | ------------- | ----------------------- |
| 1   | Open the note | Placeholder; no request |

## Related cases

IMAGES-006.
