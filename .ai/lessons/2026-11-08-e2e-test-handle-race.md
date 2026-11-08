---
date: 2026-11-08
slug: e2e-test-handle-race
type: lesson
status: active
tags: [e2e, playwright, testing]
---

# E2E test handle race and the `gotoWelcome` helper

The memory platform installs `window.__basaltTestFs` after the app starts. Tests that called `page.evaluate` right after `page.goto("/")` sometimes found the handle missing, or seeded a workspace that startup then replaced. They passed locally and failed intermittently.

Fix: `gotoWelcome(page)` in `basalt-app/e2e/support.ts` navigates, waits for the "Open folder as workspace" button, then waits for `window.__basaltTestFs`. `openWorkspaceWith(page, root, files, flags)` builds on it. Use these helpers; never touch the handle straight after `goto`. After the helper change the whole suite (77 tests at the time) passed three consecutive runs.

Wait for an observable condition (a button, a function result), not a timeout.
