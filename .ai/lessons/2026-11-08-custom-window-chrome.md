---
date: 2026-11-08
slug: custom-window-chrome
type: lesson
status: active
tags: [tauri, window, ui, platform, unverified]
---

# Custom window chrome without Rust

Owner decision: the native title bar is hidden (`decorations: false` in `tauri.conf.json`) and the app draws its own bar with the `@basalt/ui` `TitleBar`.

## What was done

- `TitleBar` got an optional `title`, optional handlers (a control is drawn only when its handler is given), `windowControls.maximized` (the maximize button becomes "Restore") and `windowControls.labels` (the app passes translated names). The bar and its empty areas carry `data-tauri-drag-region`; buttons do not.
- Window access is a `WindowChrome` port in `@basalt/app` `platform/` (not in core: window chrome is not domain logic). The Tauri adapter wraps `getCurrentWindow()`, swallows rejections and derives the maximized state from `isMaximized()` on `onResized`. The memory adapter is inert. `createPlatform()` selects between them like the other ports.
- Capabilities added: `core:window:allow-close`, `allow-minimize`, `allow-toggle-maximize`, `allow-is-maximized`, `allow-start-dragging`.

## Gotchas

- `data-tauri-drag-region` applies only to the element that carries it, not to its children: put it on every non-interactive element of the bar (the title text, the spacer).
- React renders `data-x` boolean `true` as `"true"`, not `""`.
- `window.close()` fires the close request (the future close guard hooks in there); `destroy` skips it.
- `WelcomeScreen` used `<main>`; `AppShell` already renders the `main` landmark, so the welcome content is a `div` now.

## Verified here

Unit tests with a mocked window API, component tests, Playwright on the memory platform (bar, three named controls, drag attribute, viewport fill, welcome screen usable), typecheck, lint, build, bundle and token checks.

## UNVERIFIED (needs a real desktop run on Linux, Windows and macOS)

- Permission identifiers were derived from the `plugin:window|*` command names in `@tauri-apps/api` (`minimize`, `toggle_maximize`, `close`, `is_maximized`, `start_dragging`); they were not checked against the Tauri permission reference or a generated schema (no Rust toolchain or crate sources offline).
- That dragging, double-click to maximize, minimize, maximize/restore and close actually work with these permissions.
- That an undecorated window can be resized from its edges on each OS, snap/maximize behavior on Windows 11 and macOS traffic-light expectations (macOS normally shows its own controls; the HTML buttons are used on all platforms for now).
- That `onResized` fires on maximize/unmaximize everywhere so the Restore label stays in sync.
- Window shadow and rounded corners (`shadow`/`transparent` were deliberately not set).
