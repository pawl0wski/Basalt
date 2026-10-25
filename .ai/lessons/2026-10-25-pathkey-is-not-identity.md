---
date: 2026-10-25
slug: pathkey-is-not-identity
type: lesson
status: active
tags: [workspace, paths, spec-review, bug]
---

# `pathKey` detects collisions; it is never a file's identity

## Finding

The first draft of the E01-S03 spec keyed the image cache (and S04's "moved path" comparison) by `pathKey(path)` (NFC + case fold). On a case-sensitive file system (Linux) `A.png` and `a.png` are two different files, so a note linking both would show the same image twice, and invalidating one would drop both.

## Rule

- Identity of a workspace file (cache keys, "is this the same file", watcher matching, link rewriting) is exact `WorkspacePath` equality.
- `pathKey` is only for deciding whether a **new** name would collide with an existing one (note creation, attachment naming), so Basalt never creates names that clash on case-insensitive or normalizing file systems.

## Related review findings worth reusing

- When a feature validates files in `app` (stat → symlink/size checks → read), check whether the same rules already exist in a `core` use case; S01 keeps domain rules in `core`.
- An API taking a value the caller cannot know (e.g. raw link destinations owned by the editor's syntax tree) is a sign the method belongs on the other side of the boundary.
- When display decides a format by bytes, invalidation must not filter by file extension.
