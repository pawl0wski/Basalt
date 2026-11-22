---
date: 2026-11-22
slug: review-pr-43-word-count
type: run
status: completed
tags: [review, word-count, status-bar]
---

# Review PR #43

Reviewed E01-S07 at `dcb4ea9` against `master`. GitHub rejected a formal change request from the author’s account, so the findings were posted in the PR conversation. Pipeline labels are disabled. [Review findings](https://github.com/pawl0wski/Basalt/pull/43#issuecomment-7080233319)

Changed the synchronous counter to scan for the first Unicode letter or number in each whitespace-delimited token. Chromium measurements on the same synthetic note just under 5 MiB ranged from 156–229 ms before the change and 62–89 ms after it. The new counter agreed with the original on 25,000 generated inputs. Unit and browser tests cover Unicode, external reloads, and the non-live status bar. Updated the specs to reflect the trailing slot, English formatting, and tab-based unsaved indicator.

The full local gate passed, including 1,543 unit tests, 179 Playwright cases across the interrupted full run and a workspace-spec retry, and the design-token check. A temporary Rust 1.100.0 toolchain and Linux development libraries provided formatting and Clippy. The browser tests used the in-memory platform. The GitHub Actions job list was accessible for the original head, while the PR check rollup and branch protection required additional permissions. GitHub approval requires a separate reviewer.
