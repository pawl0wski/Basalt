---
date: 2026-11-22
slug: e2e-clock-and-alert-roles
type: lesson
status: active
tags: [e2e, playwright, testing]
---

# Drive time with page.clock, and do not assume Alert means role alert

- `page.clock.install` must run before `page.goto` (inside `openWorkspaceWith` the goto happens), so call `installClock` first, then open the workspace, then `freezeClock`. A frozen clock stops autosave, the 300 ms watcher debounce, toast auto-dismiss and the 600 ms folder hover-open, so every wait needs an explicit `advanceClock`.
- Assertions that poll a saved file without advancing the frozen clock time out; this shows up only after the freeze, so add `advanceClock(page, AUTOSAVE_DELAY_MS)` before each save poll.
- `@basalt/ui` `Alert` has role `status` for info and warning and `alert` only for danger. Replacing `.bs-alert` with `getByRole("alert")` turns a "no message" assertion into one that passes vacuously; assert `status` as well (scope it to the sidebar to avoid the Notifications region).
- A helper that wraps `openWorkspaceWith` must not be renamed by a blanket search and replace, or it calls itself.
