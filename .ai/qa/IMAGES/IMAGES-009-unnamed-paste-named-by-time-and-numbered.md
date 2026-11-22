# IMAGES-009 — Names an unnamed pasted image by time and adds a numeric suffix when a name is already taken

| Field          | Value                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | IMAGES-009                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                               |
| Priority       | Medium                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                   |
| Requirement    | [Edge cases — Unnamed clipboard image… Two pastes within the same second / Name already taken](../../specs/implemented/2026-10-25-images-in-notes.md)                                |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"names an unnamed pasted image by time and adds a numeric suffix when a name is already taken"` |
| Run            | `npx playwright test --grep @IMAGES-009` (from `basalt-app/`)                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                     |

## Scenario

Given an empty note is open
When the owner pastes `shot.png` twice and then an image without a name
Then three previews appear
And the files include `attachments/shot.png` and `attachments/shot 1.png`
And exactly one file is named `Pasted image <14 digits>.png`

## Steps observed in the app

| #   | Action                 | Observed result              |
| --- | ---------------------- | ---------------------------- |
| 1   | Paste shot.png twice   | shot.png, shot 1.png         |
| 2   | Paste an unnamed image | Pasted image <timestamp>.png |

## Related cases

IMAGES-008.
