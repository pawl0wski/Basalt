---
date: 2026-10-17
slug: resolve-conflicts-with-rebase
type: lesson
status: active
tags: [git, workflow, pull-request]
---

# Resolve conflicts with rebase, not merge

When a pull request branch conflicts with `master`, fetch and rebase the branch onto `origin/master` and resolve conflicts commit by commit. Do not merge `master` into the feature branch; that adds a merge commit to the PR history.

- Run `git fetch origin && git rebase origin/master`, resolve conflicts, `git add`, `git rebase --continue`.
- Update the remote branch with `git push --force-with-lease`, never a plain `--force`.
- Force-pushing rewrites published history, so only do it on the PR's own branch, never on `master`.
- After a rebase, re-check renamed files (for example specs moved to `.ai/specs/implemented/`) and path references to them in `AGENTS.md` and CI.
- Correction origin: on PR #3 the conflict was first resolved with `git merge origin/master`.
