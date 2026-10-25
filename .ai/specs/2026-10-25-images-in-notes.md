---
date: 2026-10-25
slug: images-in-notes
type: spec
status: draft
tags: [notes, images, attachments, editor, workspace, file-kinds, e01]
---

# Images in notes (E01-S03)

Source issue: #10 (E01-S03, epic #5, depends on #8). Builds on `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (the "S01 spec": ports, `WorkspacePath`, `AppError`/`Result`, watcher, autosave, `@basalt/editor`, memory platform, i18n). Design authority: `.ai/specs/product-brief.md` (D05). Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec").

## 📝 TLDR

The owner wants pictures in notes (D05). After S01 the app edits plain Markdown only: an image link is shown as raw text and there is no way to put an image file into the workspace. This spec (future behavior) lets the owner **paste or drop** an image into the open note: the file is copied into the workspace's `attachments/` folder, a standard Markdown image link `![alt](relative/path.png)` is inserted, and the editor displays the image below the line, with a placeholder when the file is missing, unreadable, unsupported or remote. It also delivers the primitives later stories reuse: the file-kind registry deferred by S01 (Q7), binary file access and `mkdir` in the ports, note-relative link resolution and building (E01-S04 rewrites links when notes move), and an attachment-location policy shaped so an Obsidian-style "where new attachments go" setting can be added later without touching callers.

## 📝 Decisions from the Open Questions gate (2026-10-25)

| Id  | Question               | Answer (owner)                                                                                                                                                                                |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Ways to add an image   | Paste from the clipboard and drag-and-drop onto the editor. **No file picker for now.**                                                                                                       |
| Q2  | Where copied images go | One workspace-wide `attachments/` folder at the root for now. When a note is moved (S04), its links are rewritten. Keep in mind that the location will later be configurable, as in Obsidian. |
| Q3  | File names             | Original name, ` 1`, ` 2`… on collision; pasted images without a name become `Pasted image YYYYMMDDHHmmss.<ext>`.                                                                             |
| Q4  | Formats                | PNG, JPEG, GIF, WebP, AVIF, SVG (SVG only through `<img>`, scripts never run). No HEIC.                                                                                                       |
| Q5  | Display                | Now, as an image widget below the line containing the link; the Markdown source stays visible. Live preview (S01 Phase 3) may later hide the source.                                          |
| Q6  | Images in the sidebar  | Not listed in S03; the S04 spec decides whether its folder tree shows attachments.                                                                                                            |
| Q7  | Remote images          | Not loaded; a placeholder says the image is remote.                                                                                                                                           |
| Q8  | Spec split             | One spec, two PRs: display first, then adding.                                                                                                                                                |

### Defaults applied without a gate question (override if wrong)

- Every added image is **copied** into `attachments/`, even when the source already lives in the workspace: a pasted or dropped browser `File` carries bytes, not a path, so "link the existing file" cannot be detected reliably.
- Image bytes reach the app only through the browser File API (`paste`, `drop`). The Tauri window gets `dragDropEnabled: false` so HTML5 drops deliver `File` objects; this also unblocks HTML5 drag-and-drop for the S04 sidebar on Windows.
- Images are displayed from bytes read through the workspace port (`readBytes` → `Blob` → object URL), not through Tauri's asset protocol: no new protocol, no new scope, and the memory platform used by Playwright works unchanged.
- The format is decided by the file's **bytes** (magic-number sniffing), not by its MIME type or name; the stored extension is the canonical one for the detected format.
- Links are relative to the note, `/`-separated, with characters that CommonMark or other editors misread percent-encoded (see Link format); alt text is the file name without extension. Wikilinks (`![[…]]`) are neither written nor read (S01 G1).
- Size limit for adding and for displaying an image: 20 MiB (constant, checked before reading).
- Removing a link, or undoing its insertion, never deletes the image file; orphan clean-up is out of scope.
- Clipboard paste with non-empty `text/plain` is a text paste, even if image data is also present (Word, Excel and browsers put an image rendition next to copied text).
- Non-blocking problems while adding (unsupported file, too large, write failed) are reported in a dismissible notice above the editor, built on the existing `Alert` primitive; no toast library is added.

## 📝 Out of scope

- A file picker / "Insert image" command (Q1); pasting files copied in a file manager (the clipboard holds a path list, not image data — such a paste stays a text paste).
- Showing or opening attachments from the sidebar, an image viewer, renaming/moving/deleting attachments (Q6, S04).
- Rewriting links when notes move (S04 uses the functions defined here); a configurable attachment location (later, see Forward compatibility).
- Image resizing syntax (`![alt|300](…)`), captions, galleries, image editing, drawing and whiteboards (D05, Later).
- Remote images (Q7), `data:` URLs, HEIC (Q4), orphan clean-up, deduplication of identical images.

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
| Sync later                | E02                                                                            | Attachments are created once (`createExclusive`) and never rewritten by Basalt; identity is their `WorkspacePath` |

## 📝 Proposed Solution

Two vertical slices on top of the S01 primitives:

1. **Display** — `@basalt/editor` gains an image-preview extension that finds image nodes in the Markdown syntax tree and renders a block widget below each line that contains them. The widget asks an app-provided `resolveImage(url)` callback for either an image `src` or a placeholder label. The app implements it with `@basalt/core`'s `resolveLinkTarget` and a per-session image loader (`stat` → `readBytes` → sniff → `Blob` URL), invalidated by the S01 workspace watcher.
2. **Adding** — the editor intercepts `paste` and `drop` events that carry files and hands them to an app-provided `onFiles` callback, remembering the insertion position and mapping it through edits made while the files are written. The app reads each `File`, and `@basalt/core`'s `addImage` use case sniffs the format, picks a free name in the attachment folder, creates the folder if needed, writes the file exclusively and returns the link text to insert.

Alternatives considered:

- **Tauri asset protocol (`convertFileSrc`).** Streams large files without copying into JS memory, but needs `assetProtocol` enabled with a scope that must be extended at runtime for the picked workspace (Rust `asset_protocol_scope()` or persisted-scope coverage, unverified), adds a protected-surface change, and does not work on the memory platform, so e2e could not show images. Rejected at a 20 MiB limit; revisit if large images become common.
- **Tauri `onDragDropEvent` (native drop with paths).** Gives paths instead of bytes, but dropped paths are outside the fs scope, so reading them needs scope widening; it also blocks HTML5 drag-and-drop inside the app on Windows. Rejected in favor of `dragDropEnabled: false`.
- **Clipboard via `@tauri-apps/plugin-clipboard-manager` (`readImage`).** Returns raw RGBA that must be re-encoded and loses the original format. Kept only as the fallback if the webview's `paste` event does not expose images on a platform (Risks, spike).
- **Attachments next to each note / per-note folders.** Rejected by the owner for now (Q2); kept possible through `AttachmentLocation`.
- **Content-hash file names.** Dedupe and sync-friendly, but unreadable for the owner; rejected (Q3).
- **Parsing links with a regular expression in `core`.** Fragile around code blocks, escapes and angle-bracket destinations. Display uses the editor's Lezer tree; `core` only resolves and builds link destinations. Parsing whole files for link rewriting is S04's decision.

## 📝 Architecture

```text
basalt-app/
├── src-tauri/            tauri.conf.json: main window dragDropEnabled: false (only change)
└── packages/
    ├── core/             file kinds, image format sniffing, link resolve/build, attachment location, addImage; ports gain readBytes, mkdir, byte content in createExclusive (+ ./testing, contract suite)
    ├── editor/           image-preview extension, file paste/drop handling, refreshImages() on the handle
    ├── ui/               unchanged (Alert reused for the notice)
    └── app/              features/attachments/: image loader, add-images action, notice; editor wiring; i18n texts; e2e
```

Dependency rules from the S01 spec are unchanged: `editor` stays a leaf (CodeMirror/Lezer only), `core` stays free of browser globals except the standard `Uint8Array`/`TextDecoder`. `File` → bytes conversion and `Blob`/object URLs live in `app`.

### `@basalt/core` additions

1. **File kinds (registry, S01 Q7).** A readonly, ordered list `FILE_KINDS` of `{ id, extensions }` with `fileKindOf(path): FileKindId | null`. S03 registers `markdown` (`.md`) and `image` (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.svg`), all case-insensitive. `isMarkdownPath` from S01 becomes `fileKindOf(path) === "markdown"`; listing and watcher filtering use the registry. Order matters so that a future, more specific kind (for example draw.io's `.drawio.svg`, D04) can be registered before `image`. No plugin mechanism: adding a kind is a code change in `core`.
2. **Image format sniffing.** `detectImageFormat(bytes): ImageFormat | null` with `ImageFormat = "png" | "jpeg" | "gif" | "webp" | "avif" | "svg"`, using magic numbers (PNG signature, JPEG `FF D8 FF`, `GIF87a`/`GIF89a`, `RIFF….WEBP`, ISO-BMFF `ftyp` with `avif`/`avis` brand) and, for SVG, a UTF-8 text check for an `<svg` root after an optional BOM, XML declaration, comments and doctype. `IMAGE_FORMATS` maps each format to its MIME type and canonical extension (`jpeg` → `.jpg`).
3. **Link resolution.** `resolveLinkTarget(notePath, rawDestination): LinkTarget`:
   - `LinkTarget = { kind: "workspace"; path: WorkspacePath } | { kind: "remote" } | { kind: "unsupported-scheme" } | { kind: "invalid" }`.
   - Strips CommonMark angle brackets (`<…>`), then `#fragment` and `?query`. A scheme (`^[A-Za-z][A-Za-z0-9+.-]*:`) yields `remote` for `http`/`https` and `unsupported-scheme` otherwise (`data:`, `file:`, `obsidian:`). This also catches Windows drive letters (`C:`).
   - A leading `/` or `\`, any `\`, an invalid percent-escape or an empty destination yields `invalid`. Root-relative links are deliberately not supported because editors disagree on what `/` means.
   - Each segment is percent-decoded, joined to the note's directory, `.` and `..` are resolved, and a path that escapes the workspace root yields `invalid`. The result goes through `toWorkspacePath` (the single place for path safety).
4. **Link building.** `buildRelativeLink(notePath, targetPath): string` returns the shortest relative destination (`attachments/x.png`, `../attachments/x.png`), each segment encoded with `encodeLinkSegment`. `formatImageLink(alt, destination)` escapes `\`, `[` and `]` in the alt text. `resolveLinkTarget(n, buildRelativeLink(n, p))` returns `p` for every valid pair (property test).
5. **Attachment location.** `AttachmentLocation` is a discriminated union with one variant today: `{ kind: "workspace-folder"; folder: WorkspacePath }`, and `DEFAULT_ATTACHMENT_LOCATION = { kind: "workspace-folder", folder: "attachments" }`. `attachmentFolderFor(notePath, location): WorkspacePath | null` (`null` = workspace root, for a future "root" option). Callers never compute the folder themselves.
6. **File names.** `sanitizeFileName(name): string` makes an untrusted name valid under the same rules as S01's `validateNoteName` (which it shares a rule table with): forbidden characters (`/ \ : * ? " < > |`, control characters) become `-`, trailing dots and spaces are trimmed, Windows reserved names get a `_` suffix, the stem is shortened so the whole name fits in 255 UTF-8 bytes, an empty result becomes the fallback base. `pastedImageBaseName(now: Date)` returns `Pasted image YYYYMMDDHHmmss` in local time. `nextFreeName(base, ext, existingKeys)` yields `base.ext`, `base 1.ext`, `base 2.ext`… compared with `pathKey`.
7. **`addImage` use case** (`createAttachments({ fs })` returns `addImage`):

   ```ts
   addImage(input: {
       notePath: WorkspacePath;
       bytes: Uint8Array;
       originalName: string | null; // null for unnamed clipboard data
       now: Date;
       location?: AttachmentLocation; // default DEFAULT_ATTACHMENT_LOCATION
   }): Promise<Result<{ path: WorkspacePath; linkText: string }>>;
   ```

   Sequence: size ≤ 20 MiB else `too-large`; `detectImageFormat` else `unsupported`; resolve the folder; `stat` it: missing → `mkdir`, a file or symlink → `invalid-path`; base name = sanitized stem of `originalName` (or `pastedImageBaseName(now)` when null or empty); extension = canonical extension of the detected format, except that an original `.jpeg` is kept for JPEG; list the folder (non-recursive keys via `pathKey`) and pick `nextFreeName`; `createExclusive`; on `already-exists` (race with another program or device) retry with the next name, at most 5 times, then `already-exists`. Returns the new path and `formatImageLink(stem, buildRelativeLink(notePath, path))`.

8. **`AppError` codes.** Adds `unsupported` (format not recognised). All other failures reuse S01 codes.

### `@basalt/editor` additions

`createMarkdownEditor(parent, options)` gains two optional groups; existing options and handle methods are unchanged.

```ts
interface ImageOptions {
  resolve(destination: string): Promise<ImageSource>; // raw destination from the syntax tree
}
type ImageSource =
  | { kind: "image"; src: string; alt: string }
  | { kind: "placeholder"; label: string }; // text already translated by the app

interface FileInputOptions {
  onFiles(
    files: readonly File[],
    source: "paste" | "drop",
  ): Promise<string | null>; // text to insert, or null
}

interface MarkdownEditor {
  // existing: getText, setText, focus, destroy
  refreshImages(destinations?: readonly string[]): void; // re-resolve all or only the given destinations
}
```

- **Image preview.** A `StateField` derives block widget decorations from the Lezer Markdown tree (`Image` nodes and their `URL` child): one widget per image, placed after the end of the line that contains it, in document order. Block decorations must come from a state field, not a view plugin (CodeMirror rule). A widget's equality is its destination plus a refresh generation, so typing elsewhere does not reload images; `refreshImages` bumps the generation through a state effect. The widget renders a fixed-height loading box, then an `<img>` (max-width 100%, `alt` set, `loading="lazy"`, `draggable=false`) or a placeholder box with the label. `<img>` decoding errors fall back to the placeholder label given by a `brokenLabel` option. The widget never changes the document; the editor text remains the exact Markdown source (S01 rule).
- **File input.** DOM handlers for `paste` and `drop`: handled only when the event's `DataTransfer` contains files and, for paste, `text/plain` is empty; otherwise CodeMirror's default behavior runs. The insertion position is the selection (paste, replacing it) or `posAtCoords` of the drop point. While `onFiles` runs, the position is tracked in a state field and mapped through every transaction, so typing during a slow write does not misplace the link. A `null` or rejected result inserts nothing; if the editor was destroyed or `setText` replaced the document in the meantime, the result is dropped. The inserted text is one undoable transaction. Drag-over shows a drop caret; internal text drags are untouched.
- Live preview (S01 Phase 3) can later hide the `![…](…)` source on inactive lines without changing this API.

### `@basalt/app` additions (`features/attachments/`)

- **Image loader** (`createImageLoader({ fs, notePath, labels })`), one per open note session: `resolve(destination)` → `resolveLinkTarget` → for `workspace`: `stat` (missing → `missing`; directory or symlink → `unreadable`; > 20 MiB → `too-large`), `readBytes`, `detectImageFormat` (null → `unsupported`), `new Blob([bytes], { type })`, `URL.createObjectURL`. Results, including failures, are cached by `pathKey`; concurrent requests for the same path share one promise. `invalidate(paths)` revokes and drops the matching entries; `dispose()` revokes everything on note switch, workspace change and close.
- **Watcher wiring.** The S01 workspace watcher already emits changed `WorkspacePath`s. The container passes image-kind paths to `loader.invalidate` and calls `editor.refreshImages()` for the affected destinations, so an image replaced on disk updates, and a placeholder turns into the image when the missing file appears. In focus-fallback mode the loader is invalidated entirely on window focus.
- **Add-images action** (`addImagesFromFiles({ files, notePath, attachments, now })`): ignores files whose `size` exceeds the limit before reading them (`too-large`), reads the rest with `file.arrayBuffer()` one by one, calls `addImage` for each, joins the returned link texts with `\n`, and returns them to the editor. Failures are collected into one notice: the number of skipped files and the reason of the first one (`errors.<code>`).
- **Notice.** A dismissible `Alert` above the editor (`role="status"`), separate from the S01 persistent save banner; it never pauses autosave.
- **i18n.** New namespace `attachments` in `locales/en.json`: placeholder labels (`missing`, `unreadable`, `unsupported`, `tooLarge`, `remote`, `invalid`, `broken`, `loading`), notice texts with counts, and `errors.unsupported`. The "every `AppError` code has a translation" test covers the new code.

### Forward compatibility

| Later work                                  | What this spec prepares                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S04: move/rename a note**                 | Rewriting the moved note's links is `buildRelativeLink(newNotePath, resolveLinkTarget(oldNotePath, d).path)` for every relative destination `d`; links that resolve to `remote`/`invalid`/`unsupported-scheme` are left byte-for-byte unchanged. S04 chooses how to find destinations in a closed file (most likely `@lezer/markdown`, which the editor already uses) and owns the multi-file write. `mkdir` already exists in the port. |
| **S04: move/rename a folder or attachment** | Same functions, applied to every note whose links resolve into the moved path; `pathKey` is the comparison. Whether attachments appear in the tree is S04's decision (Q6).                                                                                                                                                                                                                                                               |
| **Configurable attachment location** (Q2)   | New `AttachmentLocation` variants, matching Obsidian's options: `{ kind: "same-folder" }`, `{ kind: "subfolder"; name }`, `{ kind: "workspace-folder"; folder }`, root. Only `attachmentFolderFor` changes. The setting is workspace-wide and should sync, so it belongs in `.basalt/` (S01 Q9) — its own spec creates that file. Changing the setting never moves existing files.                                                       |
| **E02 sync and E2EE**                       | Attachments are ordinary workspace files identified by `WorkspacePath`, created once with `createExclusive` and never rewritten by Basalt, so sync can treat them as immutable blobs; two devices creating the same name is a create/create conflict the sync spec resolves by renaming (links are only in the note that created them). Nothing here is device-specific.                                                                 |
| **E03: PDF, whiteboards**                   | New `FILE_KINDS` entries; the paste/drop pipeline dispatches by kind, so PDFs can later be added as attachments with a `[name](…)` link using the same location, naming and link functions. `.drawio.svg` files would already display as images.                                                                                                                                                                                         |
| **Live preview (S01 Phase 3)**              | The image widget is a separate extension; Phase 3 adds source hiding around it.                                                                                                                                                                                                                                                                                                                                                          |
| **Android (later)**                         | Paste and drop go through the WebView's File API; no desktop-only path handling in `core`.                                                                                                                                                                                                                                                                                                                                               |

## 📝 Data Model

- **Workspace on disk:** images are regular files in `attachments/` (created on first use, never pre-created). Notes reference them with standard CommonMark image links relative to the note. Nothing else is written: no sidecars, no image metadata, no index. This matches `BACKWARD_COMPATIBILITY.md` ("notes plus attachments"); the S01 rule "nothing but notes" becomes "nothing but notes and the attachments the owner added".
- **`basalt.json`:** unchanged. The future attachment-location setting is workspace-wide, not per-device, so it does not go here.
- **In memory:** `FileKindId`, `ImageFormat`, `LinkTarget`, `AttachmentLocation`, `ImageSource` (types above); loader cache entries `{ key: pathKey, result: ImageSource, objectUrl? }`. No persisted entities change, so no data-model graph is produced.

### Link format

- `![<stem>](<destination>)`; `<stem>` is the file name without extension, with `\`, `[`, `]` backslash-escaped.
- `<destination>` is relative to the note's directory, `/`-separated, never starting with `/` or `./`. In each segment, `encodeLinkSegment` percent-encodes ASCII control characters, space, `"`, `#`, `%`, `(`, `)`, `<`, `>`, `?`, `[`, `\`, `]`, `^`, `` ` ``, `{`, `|`, `}`. Non-ASCII letters are kept as-is (CommonMark allows them, and they stay readable).
- Example: note `Projects/Plan.md`, image `attachments/Pasted image 20261025143012.png` → `![Pasted image 20261025143012](../attachments/Pasted%20image%2020261025143012.png)`.
- Reading accepts any CommonMark image destination, including `<…>` and unencoded forms other editors write.

## 📝 API Contracts

```ts
interface WorkspaceFileSystem {
  // S01: list, stat, readText, writeTextAtomic, watch
  createExclusive(
    path: WorkspacePath,
    content: string | Uint8Array,
  ): Promise<Result<void>>; // widened: bytes written as-is
  readBytes(path: WorkspacePath): Promise<Result<Uint8Array>>; // not-found; callers stat first and reject symlinks (S01 rule)
  mkdir(path: WorkspacePath): Promise<Result<void>>; // creates missing parents; ok if it already exists as a directory; already-exists if a file is in the way
}
```

- Contract suite additions (memory and Tauri adapters): bytes round-trip exactly (including `0x00` and invalid UTF-8), `createExclusive` with bytes refuses overwrite, `readBytes` on a missing path → `not-found`, `mkdir` is idempotent, creates parents, fails with `already-exists` over a file and `permission-denied` in a read-only workspace, all writes emit watch events.
- Tauri adapter: `readBytes` → plugin-fs `readFile`; `createExclusive` bytes → `writeFile` with `createNew: true`; `mkdir` → plugin-fs `mkdir` with `recursive: true`. Capabilities: `fs:allow-mkdir` (already planned in S01, now also used inside the runtime workspace scope); no new permission.
- Memory platform: `__basaltTestFs` gains `readBytes(path)` for assertions; existing `externalWrite`/`externalDelete` accept bytes.
- `tauri.conf.json`: the main window gets `"dragDropEnabled": false`. Protected surface (Tauri host configuration); justified here, called out in the PR body. CSP stays `null`; if a CSP is introduced later it must allow `img-src 'self' blob:`.

## 📝 UI/UX

All user-facing text comes from `locales/en.json`.

- **Paste:** with the editor focused, Ctrl/Cmd+V of image data (screenshot tool, "Copy image" in a browser) copies the image to `attachments/` and inserts the link at the cursor, replacing the selection. The image appears below the line as soon as the link is inserted. Text pastes are unchanged.
- **Drop:** dragging one or more image files from the file manager onto the editor shows a drop caret; dropping inserts one link per file (one per line) at the drop point. Dropping anywhere outside the editor does nothing (no navigation, no file opened in the webview).
- **Several files with failures:** successful images are inserted; one notice lists how many files were skipped and why (for example "2 files were not added: format not supported").
- **Display:** every image link in the note gets a widget below its line, scaled to the editor width, keeping its aspect ratio. While loading, a box of fixed height prevents layout jumps. Placeholders are a bordered box with an icon and a short text: "Image not found: attachments/x.png", "Image could not be read", "Format not supported", "Image is larger than 20 MB", "Remote images are not loaded", "Invalid image link". The note text is never changed by a placeholder (AC3).
- **No open note:** paste and drop have no target; nothing happens.
- **Accessibility:** `<img>` gets the link's alt text; placeholders are text, readable by screen readers; the notice uses `role="status"`; widgets are not focusable and do not trap the cursor (arrow keys move over them as over a line break).
- Prototype: none.

## 📝 Edge Cases & Failure Scenarios

| Scenario                                                                                          | Behavior                                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Read-only workspace                                                                               | `mkdir`/`createExclusive` → `permission-denied`; nothing inserted; notice; note text and autosave state unchanged.                           |
| `attachments` exists as a file or symlink                                                         | `invalid-path`; notice; nothing written.                                                                                                     |
| Name already taken (case-only or Unicode-form-only too)                                           | Next free suffix via `pathKey`; an existing file is never overwritten.                                                                       |
| Another program creates the same name between list and write                                      | `createExclusive` → `already-exists` → retry with the next name (max 5).                                                                     |
| File too large (> 20 MiB)                                                                         | Rejected from `File.size` before reading; notice. On display: placeholder decided by `stat`, file not read.                                  |
| Not an image, or HEIC, or a renamed non-image `.png`                                              | Sniffing fails → `unsupported`; adding: notice, nothing written; display: placeholder.                                                       |
| File extension does not match the bytes (a JPEG named `.png`)                                     | Adding: stored with `.jpg`. Display of an existing file: shown with the sniffed MIME type.                                                   |
| Unsafe original name (`../x.png`, `con.png`, `a:b.png`, 300-byte name)                            | `sanitizeFileName`; the file always lands inside the attachment folder.                                                                      |
| Unnamed clipboard image, or browser-provided generic name `image.png`                             | Unnamed: `Pasted image <timestamp>`. Generic names are kept as given (`image.png`, `image 1.png`).                                           |
| Two pastes within the same second                                                                 | `Pasted image <ts>.png`, then `Pasted image <ts> 1.png`.                                                                                     |
| Clipboard has text and an image (Word, Excel, web page selection)                                 | Text paste (default rule).                                                                                                                   |
| File copied in a file manager, then pasted                                                        | The clipboard holds a path or URI list, not image data → ordinary text paste (out of scope; drop works).                                     |
| Typing while a large image is being written                                                       | Link inserted at the mapped original position; no keystrokes lost.                                                                           |
| Note switched, workspace changed or window closed during the write                                | The file may be written; the link is not inserted (orphan, documented). The S01 flush rules run as usual.                                    |
| Undo after adding                                                                                 | Removes the link; the file stays.                                                                                                            |
| Note has an unresolved conflict or deleted-file banner                                            | Adding still works; the link is part of the local text that the banner protects.                                                             |
| Image link to a missing file (AC3)                                                                | "Image not found" placeholder; when the file appears later, the watcher turns it into the image.                                             |
| Image replaced or deleted on disk while shown                                                     | Watcher → loader invalidation → widget re-resolves (new image or placeholder).                                                               |
| Link points outside the workspace (`../../x.png` from the root), absolute path, `file:` or `C:\…` | `invalid` / `unsupported-scheme` placeholder; nothing is read outside the workspace.                                                         |
| Link to a symlink or a directory                                                                  | "Image could not be read" placeholder (symlinks are never followed, S01 rule).                                                               |
| `https://` image                                                                                  | "Remote images are not loaded" placeholder; no request (Q7).                                                                                 |
| Image link inside a fenced code block or inline code                                              | Not an `Image` node in the syntax tree → no widget.                                                                                          |
| Link with `<…>` destination, `%20`, title (`![a](x.png "t")`) or a `#fragment`                    | Resolved per the rules above; title ignored.                                                                                                 |
| Corrupt image with a valid header                                                                 | `<img>` fails to decode → "broken" placeholder.                                                                                              |
| SVG with scripts or external references                                                           | Rendered through `<img>` from a `Blob` URL: scripts do not run and external resources are not fetched.                                       |
| Many large images in one note                                                                     | Bytes are read lazily as widgets render; the 20 MiB per-image cap and per-session cache bound memory; everything is released on note switch. |
| Watcher in focus-fallback mode                                                                    | Cache invalidated on window focus.                                                                                                           |

## 📝 Risks & Impact Review

- **Hard to reverse:** the link format and the `attachments/` layout end up in the owner's notes and in other editors. Mitigated by using plain CommonMark with relative destinations (readable everywhere) and by never moving existing files when the location policy changes later.
- **Unverified platform assumptions** (Phase 2, step 1 spike, Linux WebKitGTK and Windows WebView2): with `dragDropEnabled: false`, HTML5 `drop` delivers `File` objects from the system file manager; `paste` exposes image data in `clipboardData.files` for screenshots and "Copy image" from a browser; `Blob` URLs render in `<img>` with `csp: null`. Fallbacks: for paste, `@tauri-apps/plugin-clipboard-manager` `readImage()` re-encoded to PNG (new plugin and capability → amend this spec); for drop, the native drag-drop event plus a scope extension (needs its own spec). Results are recorded as a lesson.
- **`dragDropEnabled: false` is global for the window.** Accepted: the app has no use for native drop paths, and S04's internal drag-and-drop needs HTML5 events anyway.
- **Memory.** Bytes pass through JS memory three times briefly (`arrayBuffer`, `Uint8Array`, IPC). Acceptable at 20 MiB; the asset protocol is the escape hatch if not.
- **Orphaned files** from undo, deleted links or interrupted inserts accumulate in `attachments/`. Accepted for the MVP; a clean-up command needs its own story.
- **Link rewriting is S04's work.** Until S04 ships, notes cannot be moved inside Basalt, so links cannot break through Basalt; external moves break relative links the same way they do in any editor.
- **Standards drift.** The registry replaces `isMarkdownPath`; the S01 spec's "registry with E01-S03" decision is fulfilled. README's workspace section and the standards spec are updated in Phase 2.
- **What tests can and cannot prove.** Playwright on the memory platform proves app behavior, paste/drop handling with synthetic events and the exact bytes written; it cannot prove real clipboard and OS drag-and-drop behavior, which the spike and the manual smoke test on built Linux and Windows apps cover (documented in the Phase 2 PR).
- **Market check (general knowledge, not freshly verified).** Obsidian: paste/drop copy into a configurable location (vault root, a folder, same folder as the note, subfolder), `Pasted image YYYYMMDDHHmmss.png` names, wikilinks by default with an option for Markdown links and relative paths; links are updated on rename/move. Typora: copies into `./assets` or a custom folder, relative Markdown links. Logseq: one `assets/` folder at the graph root. We take Obsidian's naming and configurability direction with Logseq's single-folder default and Markdown links (AC2).

## 📝 Decisions in play

- **D05** (images in notes are in the MVP) — implemented here.
- **D02** (built for the owner first) — justifies paste/drop only, no picker, no clean-up, English only.
- **N03** (no tags, backlinks, graph, themes) — respected; link resolution is not a backlinks feature.
- **N01** (no iOS/web in the MVP) — respected.
- S01 **Q7** (registry introduced with E01-S03) — fulfilled. S01 **G2** ("nothing but notes written into the workspace") — extended to user-added attachments, consistent with `BACKWARD_COMPATIBILITY.md`.
- Nothing proposed supersedes an active entry.

## 📋 Phasing

Prerequisite: S01 Phase 2b (issue #8 closed). Live preview (S01 Phase 3) is not a prerequisite.

1. **Phase 1 — Display images (PR 1).** File-kind registry, `readBytes`, sniffing, link resolution, editor image preview, loader with watcher invalidation, placeholders. Notes written in other editors show their images. AC2 (read side) and AC3.
2. **Phase 2 — Add images by paste and drop (PR 2).** `mkdir`, byte `createExclusive`, naming, link building, attachment location, `addImage`, editor file input, window config, notice, docs. AC1 and AC2 (write side). Closes #10.

Phases are sequential; each leaves the app working.

## 📋 Implementation Plan

Vitest next to code, Playwright in `basalt-app/e2e/` against the memory platform.

### Phase 1 — Display images (PR 1)

1. `FILE_KINDS`, `fileKindOf`; replace `isMarkdownPath` usages (listing, watcher filter). Tests: every extension case-insensitively, unknown → `null`, ordering rule (a more specific entry wins), listing still returns only notes.
2. `detectImageFormat` and `IMAGE_FORMATS`. Tests with tiny fixture files per format, truncated headers, a text file named `.png`, SVG with BOM/XML declaration/comments, an HTML file, empty input.
3. `resolveLinkTarget` and `encodeLinkSegment`/decoding. Tests: note in root and in sub-folders, `..` within and beyond the root, `<…>` destinations, `%20` and invalid escapes, `#`/`?` stripping, `http`/`https`/`data`/`file`/`C:` schemes, leading `/`, `\`, empty, NFD names preserved.
4. `readBytes` in the port, memory FS and contract suite; Tauri adapter with mocked IPC. Tests: exact byte round-trip (including `0x00` and invalid UTF-8), `not-found`.
5. `@basalt/editor` image preview (`ImageOptions`, `refreshImages`, `brokenLabel`). Tests (jsdom): one widget per image node in order, none inside code blocks, typing elsewhere does not call `resolve` again, `refreshImages` re-resolves only given destinations, placeholder rendering, `getText` unchanged by widgets.
6. App image loader, cache, invalidation, disposal; watcher and focus-fallback wiring; i18n `attachments` namespace and `errors.unsupported`. Tests with fake ports: each placeholder kind, shared in-flight promise, invalidation re-reads, object URLs revoked on dispose (spy on `URL.revokeObjectURL`).
7. Playwright: a note with an existing image link shows the image (`naturalWidth > 0`); `externalDelete` of the image shows "Image not found" and the note bytes are unchanged (AC3); `externalWrite` of the missing file shows the image; a remote link shows the remote placeholder and no request is made (`page.on("request")`); an unsupported file shows its placeholder.

### Phase 2 — Add images by paste and drop (PR 2)

1. Spike: `dragDropEnabled: false` in `tauri.conf.json`; verify paste (screenshot tool, browser "Copy image", Word text+image) and drop (file manager, several files, non-image) on Linux and Windows; record results in a lesson. Apply a fallback from Risks only with a spec amendment.
2. `mkdir` and byte `createExclusive` in the port, memory FS, contract suite and Tauri adapter. Tests per the contract additions, including read-only workspace.
3. `sanitizeFileName` (shared rule table with `validateNoteName`), `pastedImageBaseName`, `nextFreeName`, `buildRelativeLink`, `formatImageLink`, `AttachmentLocation`/`attachmentFolderFor`. Tests: unsafe names, reserved names, 255-byte limit with multi-byte characters, suffix sequence with case-only and NFC/NFD collisions, timestamp format, alt escaping, and the round-trip property `resolveLinkTarget(n, buildRelativeLink(n, p)).path === p` over generated note and target paths; a CommonMark parse of the generated link (`@lezer/markdown`, test-only in `core`) yields the same destination.
4. `addImage` use case. Tests: folder created on first use, existing folder reused, folder is a file/symlink → `invalid-path`, `too-large`, `unsupported`, extension from sniffing (`.jpeg` kept), retry on `already-exists` race, gives up after 5, read-only → `permission-denied` and nothing created, link text for a note in a sub-folder.
5. `@basalt/editor` file input (`FileInputOptions`). Tests: paste with files and empty text → `onFiles`; paste with text → default; drop position from coordinates; position mapped through edits during a pending promise; `null`/rejection inserts nothing; destroy or `setText` during the promise drops the result; insertion is a single undo step.
6. App wiring: `addImagesFromFiles`, size pre-check, sequential reads, aggregated notice, `now` from the container. Tests with fake ports: multiple files with mixed outcomes, notice counts, no `arrayBuffer` call for oversize files, autosave marks the note dirty after insertion.
7. Playwright: paste an image (synthetic `ClipboardEvent` with a `DataTransfer` file) → link text in the editor, file bytes in `attachments/` via `__basaltTestFs.readBytes`, image visible, note saved with the exact link (AC1, AC2); a second paste in the same second gets the ` 1` suffix; drop two images and one PDF → two links, one notice; paste into a note in a sub-folder writes `../attachments/…`; read-only workspace → notice and nothing inserted; text paste unchanged.
8. Docs: README workspace section (`attachments/`, link format, paste/drop), standards spec note on the file-kind registry, lesson(s), run log, manual smoke test on built Linux and Windows apps (paste screenshot, drop file, open the workspace in Obsidian and see the image — AC2). Move this spec to `implemented/`.

### Acceptance criteria traceability (issue #10)

| Criterion                                                                           | Verified by                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Open note + owner adds an image → note references it and the image is displayed     | Phase 2 steps 4–6 unit tests; step 7 e2e (paste and drop); manual smoke on built apps                   |
| Opened in another editor → normal Markdown image link, file in the workspace        | Phase 2 step 3 CommonMark parse and round-trip tests; step 7 e2e byte assertions; manual Obsidian check |
| (proposed, negative) Missing or unreadable image → placeholder, note text unchanged | Phase 1 steps 5–6 unit tests; step 7 e2e (`externalDelete`, note bytes unchanged)                       |
