---
date: 2026-11-22
slug: pr-base-sha-can-lag
type: lesson
status: active
tags: [git, pull-request]
---

GitHub's PR metadata reported an older base SHA for PR #44 than the remote `master` ref. The latest `master` commit contained the conflicting additions.

Fetch the PR's named base branch before resolving conflicts. Use the fetched branch tip to reproduce the merge and verify that it is an ancestor of the updated PR head.
