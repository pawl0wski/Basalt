---
date: 2026-11-16
slug: workspace-scope-and-forbidden-path
type: lesson
status: active
tags: [tauri, fs-scope, images, e2e, windows, bug]
---

# Non-recursive workspace scope, `forbidden path` and the memory platform

Incident: on the built Tauri app (Windows), adding an image always showed "The workspace folder is read-only", although the folder was writable. Spec: `.ai/specs/2026-11-16-fix-workspace-scope-and-image-drop.md`.

- `tauri-plugin-dialog` `open({ directory: true })` grants a non-recursive fs scope: the folder and its direct children only. Everything below a sub-folder (`attachments/…`) fails in plugin-fs with `forbidden path: …, maybe it is not allowed on the scope for allow-read-dir`. Pass `recursive: true`. `tauri-plugin-persisted-scope` stores the narrow grant, so a restart does not fix a workspace picked by an older build; the owner must pick the folder again (the "Grant access" banner does this without closing tabs).
- Do not map scope denial to the OS permission code. `forbidden path` was folded into `permission-denied`, whose text says "read-only", so a plugin scope problem was shown as a read-only folder. It now has its own `scope-denied` code, matched first in `mapPluginError` because the message embeds the full path, which can contain words other patterns match (`not found`, `os error 2`).
- The memory platform and the fakes have no fs scope, so no test could see this. `BasaltTestFs.setScopeDenied(prefix)` now simulates it; use it for any feature that touches sub-folders.
- Plugin-fs scope errors are workspace-level state, not per-feature errors. Wrap the workspace fs once (`withScopeReporting`) and show one banner, instead of adding a retry button to each notice.
- Playwright gotcha: `reuseExistingServer` in the Playwright config reuses any server already listening on port 1420. Another worktree's vite can be running there, and e2e then runs against that worktree's stale UI and fails for no visible reason in your code. Before running e2e, check the port (`ss -ltnp | grep 1420`), stop the foreign server or run on a temporary config with a different port, and remove that config afterwards.
- A synthetic drop lands at the click point, so an e2e that types and then drops must assert the typed text through the saved file minus the inserted link, not through the whole document.
- UNVERIFIED: the manual desktop check on the built Windows and Linux apps (pick a workspace, drop an image into `attachments/`, restart, drop again, and re-grant over a scope persisted by a build made before the fix), and that the Linux/macOS scope error wording equals the Windows one. Do not mark this verified until the owner confirms.
