---
date: 2026-11-08
slug: match-prototype-title-bar
type: lesson
status: active
tags: [ui, prototype, title-bar]
---

# Match the prototype's title bar exactly

The prototype's `TitleBar` has no title text; tabs and the + button sit on the left, right after the sidebar toggle. The app had added a "Basalt" title (welcome screen and workspaces with no open tabs), which pushed the + button away from the tabs. The `title` prop and `window.title` i18n key were removed.

- When porting a screen from a prototype, compare screenshots of every state (welcome, workspace without tabs, with tabs), not only the main one.
- The prototype also has a right-panel toggle that the app does not yet render; that is a separate, known difference.
