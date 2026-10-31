---
date: 2026-10-31
slug: ci-format-and-scrollable-story-content
type: lesson
status: active
tags: [ci, prettier, a11y, storybook]
---

# Run format:check and the story a11y tests before pushing; scrollable story content needs tabIndex

CI failed on `format:check` (`design-system.md` was not Prettier-formatted) and on the axe rule `scrollable-region-focusable`: a `<pre className="overflow-x-auto">` inside the `MainScreen` story had no `tabIndex={0}`. Any scrollable element, including demo content inside stories, must be keyboard-focusable (`tabIndex={0}` plus `focus-visible:focus-ring`, as in `ErrorState`). Before pushing, run `npm run format:check` and `npm run safety-net`.
