---
date: 2026-10-25
slug: images-in-notes
type: spec
status: draft
tags: [notes, images, attachments, editor, workspace, file-kinds, e01]
---

# Images in notes (E01-S03)

Source issue: #10 (E01-S03, epic #5, depends on #8). Builds on `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (the "S01 spec": ports, `WorkspacePath`, `AppError`/`Result`, watcher, autosave, `@basalt/editor`, memory platform, i18n). Design authority: `.ai/specs/product-brief.md` (D05). Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec").

Prototype: `prototypes/workspace-basic/` (screen map: `prototypes/e01-screen-map.md`; review notes: `prototypes/feedback/prototype-feedback-consolidated.md`). Screens of this story: s07 (display) and s08 (paste and drop).

## 📝 TLDR

The owner wants pictures in notes (D05). After S01 the app edits plain Markdown only: an image link is shown as raw text and there is no way to put an image file into the workspace. This spec (future behavior) lets the owner **paste or drop** an image into the open note: the file is copied into the workspace's `attachments/` folder, a standard Markdown image link `![alt](relative/path.png)` is inserted, and the editor displays the image below the line, with a placeholder when the file is missing, unreadable, unsupported or remote. It also delivers the primitives later stories reuse: the file-kind registry deferred by S01 (Q7), binary file access, `readDir` and `mkdir` in the ports, note-relative link resolution and building (E01-S04 rewrites links when notes move), and an attachment-location policy shaped so an Obsidian-style "where new attachments go" setting can be added later without touching callers.

## 📝 Decisions from the Open Questions gate (2026-10-25)

| Id  | Question               | Answer (owner)                                                                                                                                                                                |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Ways to add an image   | Paste from the clipboard and drag-and-drop onto the editor. **No file picker for now.**                                                                                                       |
| Q2  | Where copied images go | One workspace-wide `attachments/` folder at the root for now. When a note is moved (S04), its links are rewritten. Keep in mind that the location will later be configurable, as in Obsidian. |
| Q3  | File names             | Original name, ` 1`, ` 2`… on collision; pasted images without a name become `Pasted image YYYYMMDDHHmmss.<ext>`.                                                                             |
| Q4  | Formats                | PNG, JPEG, GIF, WebP, AVIF, SVG (SVG only through `<img>`, scripts never run). No HEIC.                                                                                                       |
| Q5  | Display                | Now, as an image widget below the line containing the link; the Markdown source stays visible. With live preview (AC-01.18 in the S01 spec, owner decision D-5, 2026-10-31) the `![](…)` source is hidden on lines the cursor is not on and shown on the line with the cursor, so the Markdown link stays viewable for AC2 (s07).                                          |
| Q6  | Images in the sidebar  | Not listed in S03; the S04 spec decides whether its folder tree shows attachments.                                                                                                            |
| Q7  | Remote images          | Not loaded; a placeholder says the image is remote.                                                                                                                                           |
| Q8  | Spec split             | One spec, two PRs: display first, then adding.                                                                                                                                                |

### Decisions from the spec review (2026-10-25)

| Id  | Topic                             | Decision (owner)                                                                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Listing the attachment folder     | Add `readDir(path)` (direct children only) to `WorkspaceFileSystem` and its contract suite; `addImage` never scans the whole workspace. S04 reuses it for the folder tree.                   |
| R2  | Partial file after a failed write | Accepted and documented: if a byte write fails midway, a truncated file may remain under the chosen name. Basalt does not try to remove it; no link is inserted.                             |
| R3  | Placeholder texts                 | A separate `attachments.placeholder.*` dictionary, justified below (i18n): placeholders describe the state of a link in the note, which is a different context than an operation's error.    |
| R4  | Extension of a stored image       | Keep the original extension (case preserved) when it belongs to the detected format; otherwise use the format's canonical extension.                                                         |
| R5  | Several links inserted at once    | One file: the link is inserted at the position. Several files: each link on its own line, adding a line break before/after when the position is not at a line boundary.                      |
| R6  | Focus-fallback revalidation       | On window focus, cached images are re-`stat`ed and re-read only when `size` or `mtimeMs` changed. S01 G3 (no mtime shortcut) applies to saving notes, not to displaying images.              |
| R7  | Decompression bombs               | Pixel limit read from the image header: more than `MAX_IMAGE_PIXELS` (100 megapixels) is `too-large`, for adding and for display. Formats whose header gives no dimensions (SVG) are exempt. |

### Decisions from the grilling session (2026-10-25)

| Id  | Topic                                   | Decision (owner)                                                                                                                                                                                                                                         |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Obsidian-style links                    | No fallback lookup (vault-root or shortest-path by file name). A destination is resolved only relative to the note; `![](x.png)` written by Obsidian for `attachments/x.png` shows "Image not found". Consistent with S01 G1.                            |
| G2  | Reference-style images and HTML `<img>` | Out of scope: no widget, text unchanged. S04 must treat link reference definitions (`[ref]: path`) as destinations to rewrite.                                                                                                                           |
| G3  | Watcher invalidation matching           | Cache keys stay exact `WorkspacePath`s, but `invalidate` drops every entry whose `pathKey` equals a changed path's `pathKey` or lies under it (folder events). Covers case-insensitive file systems and folder renames; over-invalidation only re-reads. |
| G4  | Revalidating failed entries             | Each cache entry stores a stat fingerprint `missing` or `{ kind, size, mtimeMs }`; any change (including `missing` → file) drops the entry on focus revalidation (R6).                                                                                   |
| G5  | Image dimensions in the widget          | Header dimensions travel to the editor (`ImageSource.width/height`); the widget sets `width`/`height` on `<img>` and derives `estimatedHeight` from them, so re-created widgets do not shift layout while scrolling. SVG (no dimensions) unchanged.      |
| G6  | Memory bound for displayed images       | A loader byte budget, `IMAGE_CACHE_BUDGET_BYTES` = 256 MiB, counted as the sum of cached image byte sizes (decoded bitmaps are the browser's). Failures weigh nothing.                                                                                   |
| G7  | Eviction never hides a visible image    | The editor reports widget removal through `ImageOptions.release(destination)`; the loader reference-counts mounted uses and evicts only unused entries, least recently used first. The budget is soft: mounted images may exceed it.                     |
| G8  | Phase of the budget                     | Phase 1, in the loader step.                                                                                                                                                                                                                             |
| G9  | Binary support in the memory platform   | Moved to Phase 1, step 4: the in-memory FS stores bytes, `externalWrite` accepts `Uint8Array`, and the memory platform can seed binary files for Playwright.                                                                                             |

### Defaults applied without a gate question (override if wrong)

- Every added image is **copied** into `attachments/`, even when the source already lives in the workspace: a pasted or dropped browser `File` carries bytes, not a path, so "link the existing file" cannot be detected reliably.
- Image bytes reach the app only through the browser File API (`paste`, `drop`). The Tauri window gets `dragDropEnabled: false` so HTML5 drops deliver `File` objects; this also unblocks HTML5 drag-and-drop for the S04 sidebar on Windows.
- Images are displayed from bytes read through the workspace port (`readBytes` → `Blob` → object URL), not through Tauri's asset protocol: no new protocol, no new scope, and the memory platform used by Playwright works unchanged.
- The format is decided by the file's **bytes** (magic-number sniffing), not by its MIME type or name; the stored extension follows R4.
- Links are relative to the note, `/`-separated, with characters that CommonMark or other editors misread percent-encoded (see Link format); alt text is the file name without extension. This matches Obsidian but gives screen readers a weak description for pasted images (`Pasted image 20261025143012`); accepted for the owner-first MVP (D02). Wikilinks (`![[…]]`) are neither written nor read (S01 G1).
- Limits for adding and for displaying an image: `MAX_IMAGE_BYTES` = 20 MiB (checked before reading) and `MAX_IMAGE_PIXELS` = 100 000 000 (R7). Both are constants in `core`; no other package defines them.
- Removing a link, or undoing its insertion, never deletes the image file; orphan clean-up is out of scope.
- Clipboard paste with non-empty `text/plain` is a text paste, even if image data is also present (Word, Excel and browsers put an image rendition next to copied text). The Phase 2 spike checks whether "Copy image" in a browser puts the image URL into `text/plain`; if it does, this rule is revisited with a spec amendment.
- Non-blocking problems while adding (unsupported file, too large, write failed) are reported in a dismissible notice above the editor, built on the existing `Alert` primitive; no toast library is added.

## 📝 Out of scope

- A file picker / "Insert image" command (Q1); pasting files copied in a file manager (the clipboard holds a path list, not image data — such a paste stays a text paste).
- Showing or opening attachments from the sidebar, an image viewer, renaming/moving/deleting attachments (Q6, S04).
- Rewriting links when notes move (S04 uses the functions defined here); a configurable attachment location (later, see Forward compatibility).
- Image resizing syntax (`![alt|300](…)`), captions, galleries, image editing, drawing and whiteboards (D05, Later).
- Remote images (Q7), `data:` URLs, HEIC (Q4), orphan clean-up, deduplication of identical images, removal of truncated files after a failed write (R2).
- Obsidian-style resolution (vault-root or shortest-path lookup by file name) and wikilinks (G1).
- Reference-style images (`![alt][ref]`) and HTML `<img>` tags: no widget, text unchanged (G2).

## 📝 Problem Statement

- Notes without pictures do not cover the owner's Obsidian workflow; images are in the MVP (D05, issue #10).
- AC2 requires portability: the reference must be a normal Markdown image link and the file must sit in the workspace, so other editors (Obsidian, VS Code, GitHub) show the same note.
- Later stories depend on choices made here:
  - **S04** moves and renames notes and folders; relative image links break unless they are rewritten, so S04 needs exact, shared rules for resolving and building links.
  - **A configurable attachment location** (owner, Q2) needs one place that decides where a new attachment goes.
  - **E02** syncs every workspace file, including binaries; attachments must have a stable identity and a simple write pattern.
  - **E03** adds file kinds (PDF annotation, whiteboards in draw.io format, D04); the file-kind registry deferred by S01 (Q7) is introduced now.

### Design constraints

| Constraint                | Source                                                                         | Consequence here                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Plain, portable files     | AC2; `BACKWARD_COMPATIBILITY.md` (Workspace on disk: "notes plus attachments") | CommonMark image links relative to the note; no sidecars, no metadata, no `.basalt/` files                        |
| Local-first               | S01 Q11                                                                        | No network requests for display (Q7); everything works on the memory platform and offline                         |
| Thin Rust host            | `AGENTS.md`                                                                    | No custom commands: browser File API for input, plugin-fs for storage, `Blob` URLs for display                    |
| Framework-agnostic editor | S01 architecture                                                               | `@basalt/editor` gets callbacks for loading and adding images; it never touches the file system, React or i18n    |
| Domain rules in `core`    | S01 (note use cases)                                                           | Reading and validating an image (`readImage`) and adding one (`addImage`) are `core` use cases; `app` only adapts |
| Sync later                | E02                                                                            | Attachments are created once (`createExclusive`) and never rewritten by Basalt; identity is their `WorkspacePath` |

## 📝 Proposed Solution

Two vertical slices on top of the S01 primitives:

1. **Display** — `@basalt/editor` gains an image-preview extension that finds image nodes in the Markdown syntax tree and renders a block widget below each line that contains them. When a widget is rendered, it asks an app-provided `resolve(destination)` callback for either an image `src` or a placeholder label. The app implements it with `@basalt/core`'s `resolveLinkTarget` and `readImage` use case, wrapped in a per-session image loader that caches results and owns the `Blob` URLs; the S01 workspace watcher invalidates it.
2. **Adding** — the editor intercepts `paste` and `drop` events that carry files and hands them to an app-provided `onFiles` callback, remembering the insertion position and mapping it through edits made while the files are written. The app reads each `File`, and `@basalt/core`'s `addImage` use case sniffs the format, checks the limits, plans a free name in the attachment folder, creates the folder if needed, writes the file exclusively and returns the link text; the editor inserts the returned links.

Alternatives considered:

- **Tauri asset protocol (`convertFileSrc`).** Streams large files without copying into JS memory, but needs `assetProtocol` enabled with a scope that must be extended at runtime for the picked workspace (Rust `asset_protocol_scope()` or persisted-scope coverage, unverified), adds a protected-surface change, and does not work on the memory platform, so e2e could not show images. Rejected at a 20 MiB limit; revisit if large images become common.
- **Tauri `onDragDropEvent` (native drop with paths).** Gives paths instead of bytes, but dropped paths are outside the fs scope, so reading them needs scope widening; it also blocks HTML5 drag-and-drop inside the app on Windows. Rejected in favor of `dragDropEnabled: false`.
- **Clipboard via `@tauri-apps/plugin-clipboard-manager` (`readImage`).** Returns raw RGBA that must be re-encoded and loses the original format. Kept only as the fallback if the webview's `paste` event does not expose images on a platform (Risks, spike).
- **Attachments next to each note / per-note folders.** Rejected by the owner for now (Q2); kept possible through `AttachmentLocation`.
- **Content-hash file names.** Dedupe and sync-friendly, but unreadable for the owner; rejected (Q3).
- **Parsing links with a regular expression in `core`.** Fragile around code blocks, escapes and angle-bracket destinations. Display uses the editor's Lezer tree; `core` only resolves and builds link destinations. Parsing whole files for link rewriting is S04's decision.
- **Image validation in the app's loader.** Would duplicate `addImage`'s checks and put domain rules outside `core` (S01). Rejected in favor of the `readImage` use case.
- **Filtering the recursive `list()` to find taken names.** No port change, but scans the whole workspace for every added image. Rejected in favor of `readDir` (R1).

## 📝 Architecture

```text
basalt-app/
├── src-tauri/            tauri.conf.json: main window dragDropEnabled: false (only change)
└── packages/
    ├── core/             file kinds, image sniffing and limits, link resolve/build, attachment location, name planning, readImage, addImage; ports gain readBytes, readDir, mkdir, byte content in createExclusive (+ ./testing, contract suite)
    ├── editor/           image-preview extension, file paste/drop handling, refreshImages() on the handle
    ├── ui/               unchanged (Alert reused for the notice)
    └── app/              features/attachments/: image loader (cache + object URLs), add-images action, window drop guard, notice; editor wiring; i18n texts; e2e
```

Dependency rules from the S01 spec are unchanged: `editor` stays a leaf (CodeMirror/Lezer only), `core` stays free of browser globals except the standard `Uint8Array`/`TextDecoder`. `File` → bytes conversion and `Blob`/object URLs live in `app`. New dev dependencies, both test-only in `core`: `fast-check` (property tests) and `@lezer/markdown` (CommonMark parse of generated links).

### `@basalt/core` additions

1. **File kinds (registry, S01 Q7).** A readonly list `FILE_KINDS` of `{ id, extensions }` with `fileKindOf(path): FileKindId | null`. S03 registers `markdown` (`.md`) and `image` (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.svg`), all case-insensitive. The **longest matching extension wins**, so a future, more specific kind (for example draw.io's `.drawio.svg`, D04) takes precedence over `image` regardless of where it is listed. `isMarkdownPath` from S01 becomes `fileKindOf(path) === "markdown"`; listing and the note-list refresh use the registry. No plugin mechanism: adding a kind is a code change in `core`.
2. **Image sniffing and limits.** `detectImage(bytes): ImageInfo | null` with `ImageInfo = { format: ImageFormat; dimensions: { width: number; height: number } | null }` and `ImageFormat = "png" | "jpeg" | "gif" | "webp" | "avif" | "svg"`.
   - Format by magic numbers: PNG signature, JPEG `FF D8 FF`, `GIF87a`/`GIF89a`, `RIFF….WEBP`, ISO-BMFF `ftyp` with `avif`/`avis` brand; for SVG, a non-fatal UTF-8 decode (`new TextDecoder("utf-8")`, never throws on binary input) and a check for an `<svg` root after an optional BOM, XML declaration, comments and doctype.
   - Dimensions from the header: PNG `IHDR`, GIF logical screen descriptor, JPEG first `SOFn` marker, WebP `VP8 `/`VP8L`/`VP8X` chunk, AVIF `ispe` property. SVG and any header that cannot be parsed give `null` (exempt from the pixel limit; a decode failure is still caught by the widget).
   - `IMAGE_FORMATS` maps each format to its MIME type, its accepted extensions and its canonical extension (`jpeg` → accepted `.jpg`, `.jpeg`; canonical `.jpg`).
   - `MAX_IMAGE_BYTES = 20 * 1024 * 1024`, `MAX_IMAGE_PIXELS = 100_000_000`; `exceedsImageLimits(size, info): boolean` is the single check used by `readImage` and `addImage`.
3. **Link resolution.** `resolveLinkTarget(notePath, rawDestination): LinkTarget`:
   - `LinkTarget = { kind: "workspace"; path: WorkspacePath } | { kind: "remote" } | { kind: "unsupported-scheme" } | { kind: "invalid" }`.
   - Strips CommonMark angle brackets (`<…>`), then `#fragment` and `?query`. A scheme (`^[A-Za-z][A-Za-z0-9+.-]*:`) yields `remote` for `http`/`https` and `unsupported-scheme` otherwise (`data:`, `file:`, `obsidian:`, and Windows drive letters such as `C:`).
   - A leading `/` or `\`, any `\`, an invalid percent-escape or an empty destination yields `invalid`. Root-relative links are deliberately not supported because editors disagree on what `/` means.
   - The destination is split on `/`; `.` and `..` are resolved on the raw (still encoded) segments against the note's directory, and a path that escapes the workspace root yields `invalid`. Then each segment is percent-decoded; a segment that decodes to `.` or `..`, or contains `/`, `\`, NUL or a control character, yields `invalid`. The result goes through `toWorkspacePath` (the single place for path safety).
   - There is no fallback lookup: a destination that does not exist relative to the note is not searched for elsewhere in the workspace (G1).
4. **Link building.** `buildRelativeLink(notePath, targetPath): string` returns the shortest relative destination (`attachments/x.png`, `../attachments/x.png`), each segment encoded with `encodeLinkSegment` (see Link format). `formatImageLink(alt, destination)` escapes `\`, `[` and `]` in the alt text. `resolveLinkTarget(n, buildRelativeLink(n, p))` returns `p` for every valid pair (property test).
5. **Attachment location.** `AttachmentLocation` is a discriminated union with one variant today: `{ kind: "workspace-folder"; folder: WorkspacePath }`, and `DEFAULT_ATTACHMENT_LOCATION = { kind: "workspace-folder", folder: "attachments" }`. `attachmentFolderFor(notePath, location): WorkspacePath | null` (`null` = workspace root, for a future "root" option). Callers never compute the folder themselves.
6. **Name planning** (pure functions, no I/O).
   - `sanitizeFileName(name): string` makes an untrusted name valid under the same rules as S01's `validateNoteName` (which it shares a rule table with): forbidden characters (`/ \ : * ? " < > |`, control characters) become `-`, leading dots are removed (dot-entries are hidden by listing and `.…basalt-tmp` is reserved), trailing dots and spaces are trimmed, Windows reserved names get a `_` suffix, the stem is shortened so the whole name fits in 255 UTF-8 bytes, an empty result becomes the fallback base.
   - `splitFileName(name)`: the extension is the part after the last dot (none if there is no dot or the only dot was leading); the stem is the rest.
   - `pastedImageBaseName(now: Date)` returns `Pasted image YYYYMMDDHHmmss` in local time.
   - `attachmentExtension(originalExtension, format)` (R4): the original extension, case preserved, if it is one of the format's accepted extensions compared case-insensitively; otherwise the canonical extension. `IMG_001.JPG` stays `.JPG`; a JPEG named `photo.png` becomes `photo.jpg`.
   - `planAttachmentName({ originalName, format, now, taken })` combines the above and returns the first free name `base.ext`, `base 1.ext`, `base 2.ext`…; `taken` is a set of `pathKey`s, so case-only and Unicode-form-only collisions count as taken.
7. **Attachment use cases** (`createAttachments({ fs })` returns `readImage` and `addImage`):

   ```ts
   readImage(path: WorkspacePath): Promise<Result<{ bytes: Uint8Array; info: ImageInfo }>>;

   addImage(input: {
       notePath: WorkspacePath;
       bytes: Uint8Array;
       originalName: string | null; // null for unnamed clipboard data
       now: Date;
       location?: AttachmentLocation; // default DEFAULT_ATTACHMENT_LOCATION
   }): Promise<Result<{ path: WorkspacePath; linkText: string }>>;
   ```

   `readImage` sequence: `stat` (`not-found` passed through; directory or symlink → `invalid-path`, symlinks are never followed per S01; size > `MAX_IMAGE_BYTES` → `too-large` without reading); `readBytes`; `detectImage` (null → `unsupported`); pixel limit → `too-large`.

   `addImage` sequence: size > `MAX_IMAGE_BYTES` → `too-large`; `detectImage` (null → `unsupported`); pixel limit → `too-large`; resolve the folder with `attachmentFolderFor`; `stat` it: `not-found` → `mkdir`, any other error → returned, a file or symlink → `invalid-path`; `readDir(folder)` → `taken` keys; `planAttachmentName`; `createExclusive`. On `already-exists` (race with another program or device) the losing name is added to `taken` and the name is planned again, at most 5 attempts, then `already-exists`. Any other write error is returned as is; a truncated file may remain (R2). Returns the new path and `formatImageLink(stem, buildRelativeLink(notePath, path))`.

8. **`AppError` codes.** Adds `unsupported` (format not recognised). All other failures reuse S01 codes.

### `@basalt/editor` additions

`createMarkdownEditor(parent, options)` gains two optional groups; existing options and handle methods are unchanged.

```ts
interface ImageOptions {
  resolve(destination: string): Promise<ImageSource>; // raw destination from the syntax tree
  release(destination: string): void; // a widget that resolved this destination was removed from the DOM (G7)
  labels: { loading: string; broken: string }; // texts already translated by the app
}
type ImageSource =
  | { kind: "image"; src: string; width: number | null; height: number | null } // header dimensions, null when unknown (G5)
  | { kind: "placeholder"; label: string }; // text already translated by the app

interface FileInputOptions {
  onFiles(
    files: readonly File[],
    source: "paste" | "drop",
  ): Promise<readonly string[]>; // link texts to insert, possibly empty
}

interface MarkdownEditor {
  // existing: getText, setText, focus, destroy
  refreshImages(): void; // re-resolve every rendered image widget
}
```

- **Image preview.**
  - A `StateField` derives block widget decorations from the Lezer Markdown tree (`Image` nodes and their `URL` child): one widget per image, placed after the end of the line that contains it, in document order. Block decorations must come from a state field, not a view plugin (CodeMirror rule).
  - The field recomputes when the document changes **or the syntax tree changes** (`syntaxTree(tr.state) !== syntaxTree(tr.startState)`), because Lezer parses long documents incrementally in transactions without document changes; otherwise images near the end of a long note would never appear.
  - The widget carries the destination and the alt text taken from the tree; widget equality is destination plus alt, so typing elsewhere keeps existing widgets.
  - `resolve` is called from `toDOM`, so only widgets CodeMirror actually renders read bytes. The widget renders a loading box with `labels.loading` and an `estimatedHeight`, then an `<img>` (max-width 100%, height auto, `alt` from the tree, `draggable=false`) or a placeholder box with the label; it calls `view.requestMeasure()` after the image loads or fails so scrolling and click mapping stay correct. `<img>` decoding errors fall back to `labels.broken`.
  - When `ImageSource` carries dimensions, the `<img>` gets `width`/`height` attributes so the browser reserves the aspect ratio before decoding, and `estimatedHeight` is derived from them (scaled to the editor width) once the widget has resolved; a widget CodeMirror re-creates while scrolling therefore keeps its height (G5).
  - The widget's `destroy` calls `release(destination)` for every destination it resolved, so the app knows which images are mounted (G7).
  - `refreshImages()` calls `resolve` again for every mounted widget and updates the DOM in place only when the result changed (a different `src` or label), so an unchanged image does not flicker. It takes no arguments because only the editor knows which destinations are in the document.
  - The widget never changes the document; the editor text remains the exact Markdown source (S01 rule).
- **File input.**
  - DOM handlers for `paste` and `drop`, registered with a precedence above CodeMirror's default handlers (whose `drop` would insert file contents as text). Handled only when the event's `DataTransfer` contains files and, for paste, `text/plain` is empty; otherwise CodeMirror's default behavior runs.
  - The insertion position is the selection (paste, replacing it) or `posAtCoords` of the drop point. Each pending `onFiles` call gets its own entry in a state field that maps all pending positions through every transaction, so typing or a second paste during a slow write does not misplace either link.
  - Insertion (R5): one link is inserted at the position; several links are each put on their own line, with a line break added before when the position is not at a line start and after when it is not at a line end. The insertion is one undoable transaction.
  - An empty or rejected result inserts nothing; if the editor was destroyed or `setText` replaced the document in the meantime, the result is dropped. Drag-over shows a drop caret; internal text drags are untouched.
- Live preview (S01 Phase 3) can later hide the `![…](…)` source on inactive lines without changing this API.

### `@basalt/app` additions (`features/attachments/`)

- **Image loader** (`createImageLoader({ attachments, notePath })`), one per open note session, i18n-free:
  - `load(destination): Promise<ImageLoadResult>` with `ImageLoadResult = { kind: "image"; src: string; dimensions: { width: number; height: number } | null } | { kind: "failed"; reason: "remote" | "invalid" | "unsupported-scheme" | AppErrorCode }`. It calls `resolveLinkTarget`; for `workspace` it calls `attachments.readImage`, wraps the bytes in `new Blob([bytes], { type })` and creates an object URL.
  - Results, including failures, are cached by the **exact `WorkspacePath`** (never by `pathKey`: on a case-sensitive file system `A.png` and `a.png` are different files). Each entry remembers a stat fingerprint: `missing` or `{ kind, size, mtimeMs }` (G4). Concurrent requests for the same path share one promise.
  - Object URLs are owned by the loader: when an entry is replaced, the new result is stored first and the old URL is revoked afterwards, so a widget that CodeMirror re-creates while scrolling never gets a revoked URL.
  - `invalidate(paths): boolean` drops every entry whose `pathKey` equals the `pathKey` of a changed path or starts with it followed by `/` (a changed folder invalidates everything below it), and reports whether anything was dropped (G3). Matching by `pathKey` covers a link written as `Attachments/X.PNG` on a case-insensitive file system that reports `attachments/x.png`; over-matching on a case-sensitive one only causes a re-read.
  - `revalidate(): Promise<boolean>` re-`stat`s every cached path and drops entries whose fingerprint changed, including `missing` → file (R6, G4).
  - **Byte budget (G6, G7).** `IMAGE_CACHE_BUDGET_BYTES` = 256 MiB, a constant in the loader module (display-only, unlike the `core` limits). The loader counts the byte size of every cached image; failures weigh nothing. `load` increments a per-path use count and `release(destination)` decrements it. After each successful load, while the total exceeds the budget, the least recently used entry with a use count of zero is evicted and its URL revoked. Mounted entries are never evicted, so the budget is soft when the visible images alone exceed it.
  - `dispose()` revokes everything on note switch, workspace change and close.
  - The container wraps the loader into the editor's `resolve` and `release`, translating `ImageLoadResult` into an `ImageSource` (dimensions passed through, placeholder labels, see i18n).
- **Watcher wiring.** The S01 workspace watcher emits changed `WorkspacePath`s. The container passes **all** of them to `loader.invalidate` (no file-kind filter: display decides the format by bytes, so a link to a file without an image extension still refreshes) and calls `editor.refreshImages()` when it returns `true`. An image replaced on disk updates, and a placeholder turns into the image when the missing file appears. In focus-fallback mode the container calls `loader.revalidate()` on window focus and refreshes when it returns `true`.
- **Add-images action** (`addImagesFromFiles({ files, notePath, attachments, now })`): ignores files whose `size` exceeds `MAX_IMAGE_BYTES` before reading them (`too-large`), reads the rest with `file.arrayBuffer()` one by one, calls `addImage` for each and returns the link texts in order. Failures are collected into one notice: the number of skipped files and the reason of the first one (`errors.<code>`).
- **Window drop guard.** With `dragDropEnabled: false` the webview's default for a file dropped outside the editor is to navigate to it. A `dragover`/`drop` listener on `window` calls `preventDefault` for file drags that the editor did not handle.
- **Notice.** A dismissible `Alert` above the editor (`role="status"`), separate from the S01 persistent save banner; it never pauses autosave.
- **i18n.** New namespace `attachments` in `locales/en.json`:
  - `attachments.placeholder.<reason>` for `missing`, `unreadable`, `unsupported`, `tooLarge`, `remote`, `invalid`, `broken`, `loading` (R3). It is a separate dictionary from `errors.*` because a placeholder describes the state of a link inside the note, and several reasons (`remote`, `invalid`, `broken`, `loading`) are not `AppError` codes at all. The container maps `ImageLoadResult` to a placeholder key in one exhaustive function (`not-found` → `missing`, `invalid-path`/`permission-denied`/`unknown` → `unreadable`, `too-large` → `tooLarge`, …). `errors.*` remains the single mapping for operation errors such as the add notice.
  - Notice texts with counts, and `errors.unsupported`.
  - Tests: every `AppError` code has an `errors.*` entry (S01 test, now covering `unsupported`), and every `ImageLoadResult` reason maps to an existing placeholder key (exhaustive switch plus a test).

### Forward compatibility

| Later work                                  | What this spec prepares                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S04: move/rename a note**                 | Rewriting the moved note's links is `buildRelativeLink(newNotePath, resolveLinkTarget(oldNotePath, d).path)` for every relative destination `d`; links that resolve to `remote`/`invalid`/`unsupported-scheme` are left byte-for-byte unchanged. S04 chooses how to find destinations in a closed file (most likely `@lezer/markdown`, which the editor already uses) and owns the multi-file write. Link reference definitions (`[ref]: path`) are destinations too, even though S03 does not display reference-style images (G2). `mkdir` and `readDir` already exist in the port. |
| **S04: move/rename a folder or attachment** | Same functions, applied to every note whose links resolve into the moved path. Identity is exact `WorkspacePath` equality; `pathKey` only detects name collisions. Whether attachments appear in the tree is S04's decision (Q6).                                                                                                                                                                                                                                                                                                                                                    |
| **Configurable attachment location** (Q2)   | New `AttachmentLocation` variants, matching Obsidian's options: `{ kind: "same-folder" }`, `{ kind: "subfolder"; name }`, `{ kind: "workspace-folder"; folder }`, root. Only `attachmentFolderFor` changes. The setting is workspace-wide and should sync, so it belongs in `.basalt/` (S01 Q9) — its own spec creates that file. Changing the setting never moves existing files.                                                                                                                                                                                                   |
| **E02 sync and E2EE**                       | Attachments are ordinary workspace files identified by `WorkspacePath`, created once with `createExclusive` and never rewritten by Basalt, so sync can treat them as immutable blobs; two devices creating the same name is a create/create conflict the sync spec resolves by renaming (links are only in the note that created them). A truncated file left by a failed write (R2) is an ordinary file to sync. Nothing here is device-specific.                                                                                                                                   |
| **E03: PDF, whiteboards**                   | New `FILE_KINDS` entries (longest extension wins); the paste/drop pipeline dispatches by kind, so PDFs can later be added as attachments with a `[name](…)` link using the same location, naming and link functions. `.drawio.svg` files would already display as images.                                                                                                                                                                                                                                                                                                            |
| **Live preview (S01 Phase 3)**              | The image widget is a separate extension; Phase 3 adds source hiding around it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Android (later)**                         | Paste and drop go through the WebView's File API; no desktop-only path handling in `core`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## 📝 Data Model

- **Workspace on disk:** images are regular files in `attachments/` (created on first use, never pre-created). Notes reference them with standard CommonMark image links relative to the note. Nothing else is written: no sidecars, no image metadata, no index. This matches `BACKWARD_COMPATIBILITY.md` ("notes plus attachments"); the S01 rule "nothing but notes is written into the workspace" (S01 Data Model and design constraints) becomes "nothing but notes and the attachments the owner added".
- **`basalt.json`:** unchanged. The future attachment-location setting is workspace-wide, not per-device, so it does not go here.
- **In memory:** `FileKindId`, `ImageFormat`, `ImageInfo`, `LinkTarget`, `AttachmentLocation`, `ImageSource`, `ImageLoadResult` (types above); loader cache entries `{ path: WorkspacePath, result: ImageLoadResult, fingerprint: "missing" | { kind, size, mtimeMs }, bytes, useCount, lastUsed }`, with object URLs owned by the loader. No persisted entities change, so no data-model graph is produced.

### Link format

- `![<stem>](<destination>)`; `<stem>` is the file name without extension, with `\`, `[`, `]` backslash-escaped.
- `<destination>` is relative to the note's directory, `/`-separated, never starting with `/` or `./`. In each segment, `encodeLinkSegment` percent-encodes ASCII control characters, space, `"`, `#`, `%`, `(`, `)`, `:`, `<`, `>`, `?`, `[`, `\`, `]`, `^`, `` ` ``, `{`, `|`, `}`. `:` is encoded so that a first segment like `a:b.png` is never read as a URL scheme. Non-ASCII letters are kept as-is (CommonMark allows them, and they stay readable).
- Example: note `Projects/Plan.md`, image `attachments/Pasted image 20261025143012.png` → `![Pasted image 20261025143012](../attachments/Pasted%20image%2020261025143012.png)`.
- Reading accepts any CommonMark image destination, including `<…>` and unencoded forms other editors write.

## 📝 API Contracts

```ts
interface WorkspaceFileSystem {
  // S01: list, stat, readText, writeTextAtomic, watch
  createExclusive(
    path: WorkspacePath,
    content: string | Uint8Array,
  ): Promise<Result<void>>; // widened: bytes written as-is; a failure midway may leave a truncated file (R2)
  readBytes(path: WorkspacePath): Promise<Result<Uint8Array>>; // not-found; does not check symlinks — use readImage
  readDir(path: WorkspacePath): Promise<Result<readonly FileEntry[]>>; // direct children only, no symlink follow; not-found; invalid-path if not a directory
  mkdir(path: WorkspacePath): Promise<Result<void>>; // creates missing parents; ok if it already exists as a directory; already-exists if a file is in the way
}
```

- Contract suite additions (memory and Tauri adapters): bytes round-trip exactly (including `0x00` and invalid UTF-8), `createExclusive` with bytes refuses overwrite, `readBytes` on a missing path → `not-found`, `readDir` returns direct children only (not grandchildren), reports symlinks without following, `not-found` for a missing directory and `invalid-path` for a file, `mkdir` is idempotent, creates parents, fails with `already-exists` over a file and `permission-denied` in a read-only workspace, all writes emit watch events.
- Tauri adapter: `readBytes` → plugin-fs `readFile`; `readDir` → plugin-fs `readDir`; `createExclusive` bytes → `writeFile` with `createNew: true`; `mkdir` → plugin-fs `mkdir` with `recursive: true`. Capabilities: `fs:allow-read-dir` (already in S01) and `fs:allow-mkdir` (already planned in S01, now also used inside the runtime workspace scope); no new permission.
- Memory platform (Phase 1, G9): the in-memory FS stores bytes (text written with `writeTextAtomic` reads back as its exact UTF-8 bytes); `__basaltTestFs` gains `readBytes(path)` for assertions; `externalWrite` accepts `Uint8Array`; the initial workspace can be seeded with binary files.
- `tauri.conf.json`: the main window gets `"dragDropEnabled": false`. Protected surface (Tauri host configuration); justified here, called out in the PR body. CSP stays `null`; if a CSP is introduced later it must allow `img-src 'self' blob:`.

## 📝 UI/UX

All user-facing text comes from `locales/en.json`.

- **Paste:** with the editor focused, Ctrl/Cmd+V of image data (screenshot tool, "Copy image" in a browser) copies the image to `attachments/` and inserts the link at the cursor, replacing the selection. The image appears below the line as soon as the link is inserted. Text pastes are unchanged.
- **Drop:** dragging one or more image files from the file manager onto the editor shows a drop caret. Dropping one file inserts its link at the drop point; dropping several inserts each link on its own line (R5). Dropping anywhere outside the editor does nothing (window drop guard: no navigation, no file opened in the webview).
- **Several files with failures:** successful images are inserted; one notice lists how many files were skipped and why (for example "2 files were not added: format not supported").
- **Display:** every image link in the note gets a widget below its line, scaled to the editor width, keeping its aspect ratio. When the image header gives dimensions, the widget reserves the final height, so scrolling a note with many images does not make the text jump (G5); otherwise a box of estimated height limits layout jumps. An image evicted from the cache after scrolling far away (G6) briefly shows the loading box again when scrolled back. Placeholders are a bordered box with an icon and a short text: "Image not found: attachments/x.png", "Image could not be read", "Format not supported", "Image is too large (over 20 MiB or 100 megapixels)", "Remote images are not loaded", "Invalid image link". The note text is never changed by a placeholder (AC3).
- **No open note:** paste and drop have no target; nothing happens.
- **Accessibility:** `<img>` gets the link's alt text (for pasted images a timestamp name, an accepted compromise, see Defaults); placeholders are text, readable by screen readers; the notice uses `role="status"`; widgets are not focusable and do not trap the cursor (arrow keys move over them as over a line break).
- **Prototype:** `prototypes/workspace-basic/` (s07, s08).
- **Notice dismissal (s08):** the notice has a close button, which needs a close affordance on `Alert` (design-system gap DSG-06). It stays until closed, a second add replaces it, and switching notes removes it (default, GAP-18; override if wrong).

## 📝 Edge Cases & Failure Scenarios

| Scenario                                                                              | Behavior                                                                                                                                      |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Read-only workspace                                                                   | `mkdir`/`createExclusive` → `permission-denied`; nothing inserted; notice; note text and autosave state unchanged.                            |
| `stat` of the attachment folder fails with something other than `not-found`           | The error is returned; no `mkdir` is attempted; notice.                                                                                       |
| `attachments` exists as a file or symlink                                             | `invalid-path`; notice; nothing written.                                                                                                      |
| Name already taken (case-only or Unicode-form-only too)                               | Next free suffix via `pathKey`; an existing file is never overwritten.                                                                        |
| Another program creates the same name between `readDir` and write                     | `createExclusive` → `already-exists` → name added to `taken`, planned again (max 5 attempts).                                                 |
| Write fails midway (disk full, permission revoked)                                    | Error returned; no link inserted; notice. A truncated file may remain under the chosen name (R2, accepted).                                   |
| File too large (> 20 MiB)                                                             | Rejected from `File.size` before reading; notice. On display: placeholder decided by `stat`, file not read.                                   |
| Image with more than 100 megapixels (decompression bomb)                              | `too-large` from the header dimensions; adding: notice, nothing written; display: placeholder, nothing decoded.                               |
| SVG or a header whose dimensions cannot be read                                       | Pixel limit not applied; a decode failure shows the "broken" placeholder.                                                                     |
| Not an image, or HEIC, or a renamed non-image `.png`                                  | Sniffing fails → `unsupported`; adding: notice, nothing written; display: placeholder.                                                        |
| File extension does not match the bytes (a JPEG named `.png`)                         | Adding: stored with `.jpg` (R4). Display of an existing file: shown with the sniffed MIME type.                                               |
| Extension matches but differs in case or variant (`IMG_001.JPG`, `photo.jpeg`)        | Kept as is (R4).                                                                                                                              |
| Unsafe original name (`../x.png`, `con.png`, `a:b.png`, `.hidden.png`, 300-byte name) | `sanitizeFileName`; leading dots removed; the file always lands inside the attachment folder.                                                 |
| Unnamed clipboard image, or browser-provided generic name `image.png`                 | Unnamed: `Pasted image <timestamp>`. Generic names are kept as given (`image.png`, `image 1.png`).                                            |
| Two pastes within the same second                                                     | `Pasted image <ts>.png`, then `Pasted image <ts> 1.png`; both links land at their own mapped positions.                                       |
| Several files dropped in the middle of a line                                         | Each link on its own line; line breaks added before/after so the surrounding text stays on its own lines (R5).                                |
| Clipboard has text and an image (Word, Excel, web page selection)                     | Text paste (default rule).                                                                                                                    |
| File copied in a file manager, then pasted                                            | The clipboard holds a path or URI list, not image data → ordinary text paste (out of scope; drop works).                                      |
| File dropped outside the editor                                                       | Window drop guard prevents navigation; nothing happens.                                                                                       |
| Typing while a large image is being written                                           | Link inserted at the mapped original position; no keystrokes lost.                                                                            |
| Note switched, workspace changed or window closed during the write                    | The file may be written; the link is not inserted (orphan, documented). The S01 flush rules run as usual.                                     |
| Undo after adding                                                                     | Removes the link; the file stays.                                                                                                             |
| Note has an unresolved conflict or deleted-file banner                                | Adding still works; the link is part of the local text that the banner protects.                                                              |
| Image link to a missing file (AC3)                                                    | "Image not found" placeholder; when the file appears later, the watcher turns it into the image.                                              |
| Image replaced or deleted on disk while shown                                         | Watcher → loader invalidation → `refreshImages` → widget updates (new image or placeholder).                                                  |
| Link to a file without an image extension that contains an image (`![](diagram)`)     | Displayed (format by bytes) and refreshed by the watcher like any other cached path.                                                          |
| Obsidian-style link without the folder (`![](x.png)` for `attachments/x.png`)         | Resolved relative to the note only → "Image not found" placeholder; no workspace-wide search (G1).                                            |
| Reference-style image (`![a][ref]`) or HTML `<img>`                                   | No widget; text unchanged (G2).                                                                                                               |
| Link casing differs from disk on a case-insensitive file system (`Attachments/X.PNG`) | Displayed; a watcher event for `attachments/x.png` still invalidates it (`pathKey` matching, G3).                                             |
| Attachment folder renamed or deleted outside Basalt (one folder event)                | Every cached path under the folder is invalidated; widgets turn into "Image not found" (G3).                                                  |
| Missing image appears while the watcher is in focus-fallback mode                     | On window focus the `missing` fingerprint no longer matches → re-read → image shown (G4).                                                     |
| `A.png` and `a.png` both exist (case-sensitive file system) and both are linked       | Two cache entries, two different images.                                                                                                      |
| Link points outside the workspace (`../../x.png` from the root) or absolute path      | `invalid` placeholder; nothing is read outside the workspace.                                                                                 |
| `file:`, `data:` or `C:\…` destination                                                | `unsupported-scheme` placeholder.                                                                                                             |
| Encoded separators or dot segments (`a%2Fb.png`, `%2E%2E/x.png`, `x%00.png`)          | `invalid` placeholder.                                                                                                                        |
| Link to a symlink or a directory                                                      | "Image could not be read" placeholder (symlinks are never followed, S01 rule).                                                                |
| `https://` image                                                                      | "Remote images are not loaded" placeholder; no request (Q7).                                                                                  |
| Image link inside a fenced code block or inline code                                  | Not an `Image` node in the syntax tree → no widget.                                                                                           |
| Image link near the end of a long note                                                | Widget appears once Lezer finishes parsing (state field recomputes on tree changes).                                                          |
| Link with `<…>` destination, `%20`, title (`![a](x.png "t")`) or a `#fragment`        | Resolved per the rules above; title ignored.                                                                                                  |
| Alt text edited                                                                       | Widget updates its `alt`; the image is not reloaded (cached).                                                                                 |
| Corrupt image with a valid header                                                     | `<img>` fails to decode → "broken" placeholder.                                                                                               |
| SVG with scripts or external references                                               | Rendered through `<img>` from a `Blob` URL: scripts do not run and external resources are not fetched.                                        |
| Many large images in one note                                                         | Bytes are read only for rendered widgets; images off screen are evicted once the cache exceeds 256 MiB (G6, G7); all released on note switch. |
| Visible images alone exceed the budget                                                | Nothing visible is evicted; the cache temporarily exceeds the budget (soft limit, G7).                                                        |
| Watcher in focus-fallback mode                                                        | On window focus, cached images whose `size` or `mtimeMs` changed are re-read; others stay (R6).                                               |

## 📝 Risks & Impact Review

- **Hard to reverse:** the link format and the `attachments/` layout end up in the owner's notes and in other editors. Mitigated by using plain CommonMark with relative destinations (readable everywhere) and by never moving existing files when the location policy changes later.
- **Unverified platform assumptions** (Phase 2, step 1 spike, Linux WebKitGTK and Windows WebView2): with `dragDropEnabled: false`, HTML5 `drop` delivers `File` objects from the system file manager; `paste` exposes image data in `clipboardData.files` for screenshots and "Copy image" from a browser, and whether `text/plain` then carries the image URL (which would make the paste a text paste under the default rule); `Blob` URLs render in `<img>` with `csp: null`; the window drop guard prevents navigation. Fallbacks: for paste, `@tauri-apps/plugin-clipboard-manager` `readImage()` re-encoded to PNG (new plugin and capability → amend this spec); for drop, the native drag-drop event plus a scope extension (needs its own spec). Results are recorded as a lesson.
- **`dragDropEnabled: false` is global for the window.** Accepted: the app has no use for native drop paths, and S04's internal drag-and-drop needs HTML5 events anyway.
- **Memory.** Adding: bytes pass through JS memory three times briefly (`arrayBuffer`, `Uint8Array`, IPC). Displaying: IPC bytes, the `Blob` and the decoded bitmap per rendered image. Cached `Blob`s are bounded by the soft 256 MiB loader budget (G6, G7); decoded bitmaps are managed by the browser and not counted. Acceptable with the 20 MiB and 100 megapixel caps; the asset protocol is the escape hatch if not.
- **Truncated files** from failed writes (R2) and **orphaned files** from undo, deleted links or interrupted inserts accumulate in `attachments/`. Accepted for the MVP; a clean-up command needs its own story.
- **Link rewriting is S04's work.** Until S04 ships, notes cannot be moved inside Basalt, so links cannot break through Basalt; external moves break relative links the same way they do in any editor.
- **Standards drift.** The registry replaces `isMarkdownPath`; the S01 spec's "registry with E01-S03" decision is fulfilled. S01 carries cross-references to the port additions here (`readBytes`, `readDir`, `mkdir`) and to the registry. README's workspace section and the standards spec are updated in Phase 2.
- **What tests can and cannot prove.** Playwright on the memory platform proves app behavior, paste/drop handling with synthetic events and the exact bytes written; it cannot prove real clipboard and OS drag-and-drop behavior, which the spike and the manual smoke test on built Linux and Windows apps cover (documented in the Phase 2 PR).
- **Market check (general knowledge, not freshly verified).** Obsidian: paste/drop copy into a configurable location (vault root, a folder, same folder as the note, subfolder), `Pasted image YYYYMMDDHHmmss.png` names, wikilinks by default with an option for Markdown links and relative paths; links are updated on rename/move. Typora: copies into `./assets` or a custom folder, relative Markdown links. Logseq: one `assets/` folder at the graph root. We take Obsidian's naming and configurability direction with Logseq's single-folder default and Markdown links (AC2).

## 📝 Decisions in play

- **D05** (images in notes are in the MVP) — implemented here.
- **D02** (built for the owner first) — justifies paste/drop only, no picker, no clean-up, English only, timestamp alt text.
- **N03** (no tags, backlinks, graph, themes) — respected; link resolution is not a backlinks feature.
- **N01** (no iOS/web in the MVP) — respected.
- S01 **Q7** (registry introduced with E01-S03) — fulfilled. S01's "nothing but notes written into the workspace" rule — extended to user-added attachments, consistent with `BACKWARD_COMPATIBILITY.md`. S01's "E01-S04 adds `mkdir`" — `mkdir` (and `readDir`) arrive earlier, here, because they are used here.
- Nothing proposed supersedes an active entry.

## 📋 Phasing

Prerequisite: S01 Phase 2b (issue #8 closed). Live preview (S01 Phase 3) is not a prerequisite.

1. **Phase 1 — Display images (PR 1).** File-kind registry, `readBytes`, sniffing with dimensions and limits, link resolution, `readImage`, editor image preview, loader with watcher invalidation, focus revalidation and byte budget, placeholders. Notes written in other editors show their images when the links are relative to the note (G1). AC2 (read side) and AC3.
2. **Phase 2 — Add images by paste and drop (PR 2).** `readDir`, `mkdir`, byte `createExclusive`, name planning, link building, attachment location, `addImage`, editor file input, window config and drop guard, notice, docs. AC1 and AC2 (write side). Closes #10.

Phases are sequential; each leaves the app working.

## 📋 Implementation Plan

Vitest next to code, Playwright in `basalt-app/e2e/` against the memory platform.

### Phase 1 — Display images (PR 1)

1. `FILE_KINDS`, `fileKindOf`; replace `isMarkdownPath` usages (listing, note-list refresh). Tests: every extension case-insensitively, unknown → `null`, longest extension wins regardless of list order (a test-only `.drawio.svg` entry listed after `image`), listing still returns only notes.
2. `detectImage`, `IMAGE_FORMATS`, `MAX_IMAGE_BYTES`, `MAX_IMAGE_PIXELS`, `exceedsImageLimits`. Tests with tiny fixture files per format: format and dimensions, truncated headers (format still detected when the signature is complete, dimensions `null`; a truncated signature → `null`), a text file named `.png`, SVG with BOM/XML declaration/comments, binary data that is not valid UTF-8 (no throw), an HTML file, empty input, a header declaring 20 000 × 20 000 px → over the pixel limit.
3. `resolveLinkTarget` and percent-decoding. Tests: note in root and in sub-folders, `..` within and beyond the root, `<…>` destinations, `%20` and invalid escapes, `%2F`/`%5C`/`%00`/`%2E%2E` → `invalid`, `#`/`?` stripping, `http`/`https`/`data`/`file`/`C:` schemes, leading `/`, `\`, empty, NFD names preserved.
4. `readBytes` in the port, memory FS and contract suite; Tauri adapter with mocked IPC; byte storage in the in-memory FS, `externalWrite` with `Uint8Array`, binary seeding of the memory platform (G9). Tests: exact byte round-trip (including `0x00` and invalid UTF-8), text written with `writeTextAtomic` reads back as its exact UTF-8 bytes, `externalWrite` of bytes emits a watch event, `not-found`.
5. `readImage` use case. Tests with the in-memory FS: `not-found`, directory and symlink → `invalid-path`, over `MAX_IMAGE_BYTES` → `too-large` without calling `readBytes`, unsupported bytes → `unsupported`, over `MAX_IMAGE_PIXELS` → `too-large`, valid image → bytes and info.
6. `@basalt/editor` image preview (`ImageOptions`, `labels`, `release`, `refreshImages`). Tests (jsdom): one widget per image node in order, none inside code blocks or for reference-style images, `<img>` gets `width`/`height` when dimensions are given and none when `null`, destroying a widget calls `release` with its destination, widgets appear after the tree finishes parsing a long document without further edits, typing elsewhere does not call `resolve` again, editing alt updates `alt` without calling `resolve`, `refreshImages` re-resolves mounted widgets and leaves DOM untouched when the result is unchanged, placeholder and loading labels rendered, `getText` unchanged by widgets.
7. App image loader, object URL ownership, invalidation, revalidation, disposal; watcher and focus-fallback wiring; result-to-placeholder mapping; i18n `attachments` namespace and `errors.unsupported`. Tests with fake ports: each failure reason maps to a placeholder key, shared in-flight promise, `A.png` and `a.png` cached separately, `invalidate` re-reads and returns `false` for uncached paths, a watcher path without an image extension still invalidates, a path differing only in case invalidates (G3), a folder path invalidates every entry below it but not a sibling with the same prefix (`attachments` vs `attachments-old/x.png`), `revalidate` re-reads only entries with a changed fingerprint, including a `missing` entry whose file appeared (G4), the budget evicts the least recently used released entry and revokes its URL, a mounted entry is never evicted even over budget, failures do not count towards the budget (G6, G7), the old object URL is revoked only after the new result is stored, all URLs revoked on dispose (spy on `URL.revokeObjectURL`).
8. Playwright: a note with an existing image link shows the image (`naturalWidth > 0`); `externalDelete` of the image shows "Image not found" and the note bytes are unchanged (AC3); `externalWrite` of the missing file shows the image; a remote link shows the remote placeholder and no request is made (`page.on("request")`); an unsupported file shows its placeholder.

### Phase 2 — Add images by paste and drop (PR 2)

1. Spike: `dragDropEnabled: false` in `tauri.conf.json`; verify paste (screenshot tool, browser "Copy image" including what lands in `text/plain`, Word text+image), drop (file manager, several files, non-image) and a drop outside the editor (no navigation with the guard) on Linux and Windows; record results in a lesson. Apply a fallback from Risks only with a spec amendment.
2. `readDir`, `mkdir` and byte `createExclusive` in the port, memory FS, contract suite and Tauri adapter. Tests per the contract additions, including read-only workspace.
3. `encodeLinkSegment`, `buildRelativeLink`, `formatImageLink`, `sanitizeFileName` (shared rule table with `validateNoteName`), `splitFileName`, `pastedImageBaseName`, `attachmentExtension`, `planAttachmentName`, `AttachmentLocation`/`attachmentFolderFor`. Tests: unsafe names, leading dots, reserved names, 255-byte limit with multi-byte characters, stem/extension split (`my.photo.v2.png`, no extension, leading dot only), R4 extension rule (`.JPG` kept, `.jpeg` kept, JPEG named `.png` → `.jpg`), suffix sequence with case-only and NFC/NFD collisions, timestamp format, alt escaping, `:` encoded, and the round-trip property `resolveLinkTarget(n, buildRelativeLink(n, p)).path === p` over generated note and target paths (`fast-check`, including names with `:`, `#`, `%` and spaces); a CommonMark parse of the generated link (`@lezer/markdown`, test-only in `core`) yields the same destination.
4. `addImage` use case. Tests: folder created on first use, existing folder reused, folder `stat` failing with `permission-denied` is returned without `mkdir`, folder is a file/symlink → `invalid-path`, taken names read with `readDir` (no `list()` call), `too-large` by bytes and by pixels, `unsupported`, R4 extension, retry on `already-exists` race with the losing name added to `taken`, gives up after 5, a non-`already-exists` write error is returned without retry, read-only → `permission-denied` and nothing created, link text for a note in a sub-folder.
5. `@basalt/editor` file input (`FileInputOptions`). Tests: paste with files and empty text → `onFiles`; paste with text → default; file drop never inserts file contents as text; drop position from coordinates; position mapped through edits during a pending promise; two overlapping pending inserts land at their own positions; one link inserted inline, several links each on their own line with line breaks added only where needed (start, middle and end of a line); empty/rejected result inserts nothing; destroy or `setText` during the promise drops the result; insertion is a single undo step.
6. App wiring: `addImagesFromFiles`, size pre-check, sequential reads, aggregated notice, `now` from the container, window drop guard. Tests with fake ports: multiple files with mixed outcomes, notice counts, no `arrayBuffer` call for oversize files, autosave marks the note dirty after insertion, the guard prevents the default only for file drags outside the editor.
7. Playwright: paste an image (synthetic `ClipboardEvent` with a `DataTransfer` file) → link text in the editor, file bytes in `attachments/` via `__basaltTestFs.readBytes`, image visible, note saved with the exact link (AC1, AC2); a second paste in the same second gets the ` 1` suffix; drop two images and one PDF in the middle of a line → two links on their own lines, one notice; drop a file outside the editor → URL unchanged, nothing inserted; paste into a note in a sub-folder writes `../attachments/…`; read-only workspace → notice and nothing inserted; text paste unchanged.
8. Docs: README workspace section (`attachments/`, link format, paste/drop), standards spec note on the file-kind registry, lesson(s), run log, manual smoke test on built Linux and Windows apps (paste screenshot, drop file, open the workspace in Obsidian and see the image — AC2). Move this spec to `implemented/`.

### Acceptance criteria traceability (issue #10)

| Criterion                                                                           | Verified by                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Open note + owner adds an image → note references it and the image is displayed (s07, s08) | Phase 2 steps 4–6 unit tests; step 7 e2e (paste and drop); manual smoke on built apps                   |
| Opened in another editor → normal Markdown image link, file in the workspace (s07, s08) | Phase 2 step 3 CommonMark parse and round-trip tests; step 7 e2e byte assertions; manual Obsidian check |
| (proposed, negative) Missing or unreadable image → placeholder, note text unchanged (s07) | Phase 1 steps 5–7 unit tests; step 8 e2e (`externalDelete`, note bytes unchanged)                       |
