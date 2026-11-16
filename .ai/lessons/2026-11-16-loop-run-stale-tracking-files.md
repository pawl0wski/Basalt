---
date: 2026-11-16
slug: loop-run-stale-tracking-files
type: lesson
status: active
tags: [process, runs, automation, git]
---

# A resumed loop run can have stale tracking files

Resuming `om-auto-create-pr-loop` work, the run folder disagreed with the
repository:

- `PLAN.md` still showed Steps 4.1 and 4.2 as `todo` although their commits
  (`126e277`, `db31a2f`) were already on the branch; the `## Phase 4 notes`
  section had been added without flipping the table.
- `HANDOFF.md` said "Phase 1 Step 1.1 / Last commit: none" — never rewritten
  after the first checkpoint.
- `e2e/move-notes.spec.ts` (Step 4.3, 597 lines, 30 tests) was written and
  green but **untracked** — a crash or a `git clean` would have lost it.

The tracking files are a resume aid, not the source of truth. Before continuing
a run, reconcile them against reality: `git log --oneline`, `git status`, and
the diff between the branch and its remote. Commit each Step's artifact in the
same Step (the loop's 1:1 step↔commit rule), so an interrupted run never leaves
finished work only in the working tree.
