---
date: 2026-11-08
slug: delegating-by-tasks-with-a-tracker
type: lesson
status: active
tags: [process, subagents, quality]
---

# Delegating a large spec by tasks with a tracker

## What worked

- A tracker (`.ai/track.md`) with one task per subagent, committed task by task, kept a 20+ commit implementation reviewable. Each subagent appended notes (what is verified, UNVERIFIED, open issues), so later tasks and the final docs had faithful input without re-reading code.
- Splitting an oversized task (2b.2 became 2b.2a to 2b.2f) before delegating, instead of letting one subagent run out of context, gave smaller and more testable commits.
- Writing "verified against mocks only" and "UNVERIFIED" into the task title kept caveats from being lost when the checklist was ticked.

## Gaps subagents left repeatedly

- Hardcoded English inside `@basalt/ui` components (title bar tab labels, "Toggle sidebar", "Sections", the Save-failed dialog). The app rule is that only containers translate and `ui` has no i18n dependency, so `ui` components need label props with the strings supplied by the container. Check new `ui` components for literal user-facing strings.
- Vitest imports leaking into a browser entry: `@basalt/core/testing` imports `vitest`, so the browser (memory platform) needs a separate subpath (`@basalt/core/testing/in-memory`). Keep test frameworks out of any module the app imports at runtime.
- Platform wiring forgotten in the composition root: `main.tsx` awaited `createPlatform()` and ignored the result until a later task. When a task adds a port or platform, state who wires it and when, and check the wiring in the task that depends on it.
- Older tests left behind by a new helper or behavior (see the e2e handle race lesson).

## Rule

Review each subagent result against the project rules (i18n, tokens, naming, tests, no comments), not only against "tests pass".
