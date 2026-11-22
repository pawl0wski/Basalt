---
date: 2026-11-22
slug: live-word-count-allocation
type: lesson
status: active
tags: [editor, performance, word-count]
---

# Measure per-keystroke work on supported large notes

A synchronous whitespace split allocated over a million token strings for a supported note close to 5 MiB. In headless Chromium, the counter took 156–229 ms across 11 samples. A scan that matched the first letter or number and consumed the rest of each word took 62–89 ms on the same input.

When adding live note statistics, measure the transformation on representative and maximum-size inputs. Keep timing measurements separate from deterministic unit tests and cover Unicode whitespace and letters outside the Basic Multilingual Plane when changing tokenization.
