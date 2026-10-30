---
date: 2026-10-30
slug: wire-checks-into-ci
type: lesson
status: active
tags: [ci, design-system, storybook, tokens]
---

# A check that only exists as a local script is not a safety net

`check:tokens` and the Storybook story tests existed as npm scripts, but CI ran neither, so violations could be merged. When adding a quality gate, add the CI job in the same change and a single entry command (`npm run safety-net`) that CI and developers both use.

Also keep the scan roots wide enough: `check:tokens` originally scanned only `packages/ui`, so `packages/app` was unprotected. Test the CLI's exit code (not only the pure `findViolations` function) so the gate cannot silently stop failing.
