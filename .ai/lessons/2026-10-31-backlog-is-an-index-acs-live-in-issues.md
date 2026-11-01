---
date: 2026-10-31
slug: backlog-is-an-index-acs-live-in-issues
type: lesson
status: active
tags: [backlog, acceptance-criteria, screen-map, design-system]
---

# The backlog file is only an index; acceptance criteria live in the issues

## What happened

While mapping screens for epic E01, `.ai/specs/backlog.md` turned out to hold only ids, issue numbers and titles. The acceptance criteria are in GitHub issues #8, #10 and #16, and E01-S04 has no spec at all. The brief has no Key flows or Business rules ("Deferred"), so flow order had to come from the specs.

## Lesson

- For any flow or screen work, read the issues (`gh issue view <n>`), not just `backlog.md`, and number the criteria (`AC-<story>.<n>`) so screens and gaps can cite them.
- Compare the design system with the specs before mapping screens: it contains parts no story mentions (activity bar sections, outline panel, counts) and rules that clash with the epic (a sync word in the status bar while E01 has no sync; a Toast with Undo while the criterion says the file is removed).
- Record such clashes as questions to the owner instead of choosing a side.
