# Basalt design system: guide for agents

Read this first when you build or change any UI. It is a short version of the Storybook in `basalt-app/packages/ui` (run `npm run storybook`). Details, states and examples are on each component page.

## Character

Focused, graphite, own, tool-like, orderly. Not generic, loud, childish, function-hiding or cloud-corporate. Minimal in decoration, not in function. Plain technical English: no exclamation marks, emoji or marketing text.

## Rules that cannot be broken

1. Every value comes from a token. No hex, rgb, hsl or oklch outside `src/tokens/`, no Tailwind palette classes (`bg-zinc-900`, `text-white`), no arbitrary values (`p-[13px]`). `npm run check:tokens` must report 0.
2. No gradients, shadows, blur, glow, `rounded-2xl` or pills (the only pill is the switch track). Two radii: `rounded-control` (4 px) and `rounded-container` (8 px).
3. Build from the components below. Do not write your own button, dialog, input or menu. If something is missing, say so in the pull request instead of inventing it.
4. Status is never shown by color alone: use a word and an icon. `status-danger` is never a button background.
5. Switches, checkboxes and radios never stand on `surface-raised`.
6. An error that needs the user to act is an Alert or a banner, never a Toast.
7. Selected list or tree rows are inset, rounded rows: `group-focus-within:aria-selected:bg-tree-selected` with `aria-selected:bg-state-selected`, text `text-note`, no accent bar (see `NoteList`). Rows in dense lists show focus with `focus-visible:focus-ring-inset`.
8. Every control has an accessible name and a visible focus ring (`focus-visible:focus-ring`). Every field has a visible label.
9. The app opens on notes (no login first). Sync state is always visible as a word in the status bar.
10. Interface text is English and comes from props; do not hardcode text that must be translated.
11. Do not add comments to code unless asked (repository rule).

## Components (import from `@basalt/ui`)

| Component                   | Import                          | Use it for                                                                  | Do not use it for                      |
| --------------------------- | ------------------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| Button                      | `Button`                        | Starting an action: variants `primary`, `secondary`, `ghost`, `destructive` | Navigation, icon-only controls         |
| IconButton                  | `IconButton`                    | Frequent known action as an icon; `aria-label` required, shown as a tooltip | Rare or unfamiliar actions             |
| TextLink                    | `TextLink`                      | Going to another place; `inline` is underlined                              | Actions that change data               |
| Input                       | `Input`                         | One line of text, inside a Field                                            | Fixed lists, many lines                |
| Field, Label                | `Field`, `Label`                | Label, control, hint and error joined (ARIA included)                       | Checkbox and Switch                    |
| Checkbox                    | `Checkbox`                      | Option saved with a form                                                    | Immediate on/off                       |
| Select                      | `Select`                        | One value from about 4 to 12                                                | Two or three options                   |
| Switch                      | `Switch`                        | On/off applied at once                                                      | Options saved later                    |
| RadioGroup                  | `RadioGroup`                    | One of two to five visible options                                          | Long lists                             |
| Card, CardRow               | `Card`, `CardRow`               | A group of settings rows under one heading                                  | A single control, a card in a card     |
| StatusIndicator             | `StatusIndicator`               | Sync state in words (`synced`, `syncing`, `conflict`, `error`)              | One-off results                        |
| Alert                       | `Alert`                         | Message that stays until fixed (`info`, `warning`, `danger`)                | Field errors, passing results          |
| Skeleton                    | `Skeleton`                      | Placeholder while loading                                                   | Failed loads, empty places             |
| ScrollArea                  | `ScrollArea`                    | A named region whose content can be taller than its box                     | Page scroll, content that always fits  |
| Tooltip                     | `Tooltip`                       | Name or shortcut of an icon                                                 | Information needed to finish a task    |
| Dialog                      | `Dialog`                        | Short focused task                                                          | Yes/no questions, long forms           |
| ConfirmDialog               | `ConfirmDialog`                 | Confirming something hard to undo; focus on Cancel                          | Things that can be undone with a Toast |
| Menu                        | `Menu`                          | Three or more actions on one object                                         | One or two actions                     |
| Popover                     | `Popover`                       | A few controls next to a trigger                                            | A name for an icon                     |
| Toast                       | `ToastProvider`, `useToast`     | A short result with an optional Undo                                        | Errors that need action                |
| Tabs                        | `Tabs`                          | Sibling views of one object                                                 | Steps, separate pages                  |
| EmptyState                  | `EmptyState`                    | Why a place is empty and the next step                                      | Loading, failures                      |
| ErrorState                  | `ErrorState`                    | A view that could not be shown                                              | Problems the view survives             |
| NoteList                    | `NoteList`                      | The flat note list (listbox)                                                | Form choices                           |
| NoteSidebar                 | `NoteSidebar`                   | Left column of an open workspace                                            | The welcome screen                     |
| AppShell                    | `AppShell`                      | The window regions: title bar, activity bar, panels, status bar             | Building your own shell in a screen    |
| TitleBar                    | `TitleBar`                      | Panel toggles, open-note tabs, new note, window buttons                     | Sibling views of one object (Tabs)     |
| ActivityBar                 | `ActivityBar`                   | Switching between the app sections (Notes, Search, Bookmarks, Settings)     | Actions on a note                      |
| SidePanel                   | `SidePanel`                     | The right panel: a titled frame with search and close, content in a slot    | The left note column (NoteSidebar)     |
| SaveStatus, StatusBar       | `SaveStatus`, `StatusBar`       | Save state and counts in the bottom bar                                     | Sync state                             |
| NoteBanner                  | `NoteBanner`                    | Why the open note cannot save or open                                       | Failures while leaving the note        |
| SaveFailedDialog            | `SaveFailedDialog`              | What to do with text that could not be saved                                | Failures while staying in the note     |
| NewNoteDialog               | `NewNoteDialog`                 | Naming a new note                                                           | Renaming                               |
| ImagePlaceholder, NoteImage | `ImagePlaceholder`, `NoteImage` | An image in a note, or why it cannot be shown                               | Whole-note errors                      |
| WelcomeScreen               | `WelcomeScreen`                 | The screen with no workspace: one action                                    | An empty workspace                     |

Patterns (proposals, see Storybook): Form, List with filters, Detail view, Delete confirmation.

## Semantic tokens (use these classes)

| Token                         | Class                                   | Use it for                                                                                 |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `surface-frame`               | `bg-surface-frame`                      | Title bar, activity bar, status bar, field fill                                            |
| `surface-editor`              | `bg-surface-editor`                     | Editor and page background                                                                 |
| `surface-card`                | `bg-surface-card`                       | Cards grouping settings, side panels                                                       |
| `surface-raised`              | `bg-surface-raised`                     | Menus, dialogs, tooltips, popovers, alerts                                                 |
| `state-hover`                 | `bg-state-hover`                        | Row or control hover (not inside `surface-raised`)                                         |
| `state-selected`              | `bg-state-selected`                     | Selected row when the list has no focus, active item, hover inside `surface-raised`        |
| `tree-selected`               | `bg-tree-selected`                      | Selected row of a list or tree while the list has focus (accent tint); text is `text-note` |
| `border-divider`              | `border-border-divider`                 | Lines between sections and rows, outline of raised layers                                  |
| `border-control`              | `border-border-control`                 | Outline of inputs, checkboxes, off switch                                                  |
| `text-note`                   | `text-text-note`                        | Note text and headings only                                                                |
| `text-ui`                     | `text-text-ui`                          | Interface text                                                                             |
| `text-muted`                  | `text-text-muted`                       | Descriptions, hints, inactive items                                                        |
| `text-link`                   | `text-text-link`                        | Links                                                                                      |
| `text-on-accent`              | `text-text-on-accent`                   | Text on `action-primary`                                                                   |
| `icon-default`, `icon-active` | `text-icon-default`, `text-icon-active` | Icons                                                                                      |
| `action-primary`              | `bg-action-primary`                     | Primary button, on switch, checked box, active indicator                                   |
| `focus-ring`                  | `focus-visible:focus-ring`              | Keyboard focus                                                                             |
| `status-danger`               | `text-status-danger`                    | Errors, destructive text                                                                   |
| `status-warning`              | `text-status-warning`                   | Warnings, conflicts                                                                        |
| `code-block-bg`               | `bg-code-block-bg`                      | Code blocks                                                                                |

Spacing: `gap-in-group` (4 px) for related things, `gap-between-groups` and `p-panel` (12 px), `p-settings-card` (16 px), `p-section` (32 px). Sizes: `h-icon-button` (28 px), `size-icon` (16 px), `h-tree-row` (28 px), `w-sidebar` (300 px), `h-status-bar` (24 px). Widths: `max-w-note` (700 px), `max-w-prose` (65 ch). Type: `text-size-ui` (13 px), `text-size-ui-small` (12 px), note sizes `text-size-note*`. Breakpoints: `tablet:` (768 px), `desktop:` (1440 px). When you add a token class to `theme.css`, also add it to `src/lib/utils.ts` (tailwind-merge).

## If ... then use ...

| If                                        | Then                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| The user starts an action                 | Button (one `primary` per view)                                          |
| The user goes somewhere                   | TextLink                                                                 |
| The user types one line                   | Field with Input                                                         |
| The user picks one of few visible options | RadioGroup                                                               |
| The user picks one of many                | Select                                                                   |
| A setting applies at once                 | Switch                                                                   |
| A setting is saved later                  | Checkbox                                                                 |
| You ask before deleting                   | ConfirmDialog (confirm button is a verb and the object)                  |
| A message about one field                 | The Field `error` prop                                                   |
| A message that stays                      | Alert or NoteBanner                                                      |
| A passing result                          | Toast (with Undo if it helps)                                            |
| Sync state                                | StatusIndicator in the status bar                                        |
| A list is loading                         | Skeleton                                                                 |
| A list is empty                           | EmptyState (two different messages: nothing yet, nothing for the filter) |
| A load failed                             | ErrorState                                                               |

## What to avoid

- Generic AI look: gradients, glass, glow, sparkles, emoji as icons, three identical cards, everything in pills, card in card, shadow as the only separator, everything centered.
- Notion-like hiding: controls only on hover, actions under "···", no status bar.
- Cloud SaaS: login before notes, plan badges, avatars.
- A feature that looks glued on: its own colors, spacing, dialogs.
- Invisible sync: sync only as a toast or a spinner.
- Implementation: values outside tokens, `div` with `onClick`, placeholder as label, status by color only, disabled button with no explanation, toast for an action-needed error, essential information in a tooltip, a variant added for one screen.

## Commands (from `basalt-app/`)

```bash
npm run storybook           # dev server on port 6006
npm run build-storybook     # production build
npm run safety-net          # check:tokens + test:stories:themes, the same gate CI runs
npm run check:tokens        # values outside tokens in packages/ui and packages/app, must be 0
npm run test                # unit tests, includes contrast tests
npm run test:stories:themes # stories as tests with accessibility checks
npm run lint
npm run typecheck
```

Every new component needs: unit tests, stories (playground, variants, state matrix, long content, narrow screen, `play` test), a docs page with 13 sections, a catalog entry and an update to this file.
