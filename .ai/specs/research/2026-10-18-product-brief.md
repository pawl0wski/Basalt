---
date: 2026-10-18
slug: product-brief
type: spec
status: draft
tags: [product-brief, research, discovery]
---

# Basalt — Product Brief

> Status: final · Source: prioritization workshop (October 18, 2026)

## 1. Summary

Basalt is a Markdown-based note-taking app designed as an open, more affordable and more private alternative to Obsidian. It stands out with sync through a self-hosted server with end-to-end encryption, native support for handwritten notes and whiteboards (including stylus input on Android), and AI features that don't require sending user data to third parties.

## 2. Problem

Users of Obsidian-style note-taking apps keep running into the same barriers:

- **Cost and a closed ecosystem** — paid sync, no fully open-source option.
- **Data control** — no way to host sync themselves; reluctance to send notes to external AI services.
- **Limited visual and handwritten work** — weak support for styluses, diagrams, boards and icons.
- **Scattered materials** — PDF documents and notes live in separate places.

## 3. Target users

| #   | Persona                      | Core need                                                                          |
| --- | ---------------------------- | ---------------------------------------------------------------------------------- |
| 1   | Obsidian alternative seekers | A familiar workflow (Markdown, local files) without the current tool's limitations |
| 2   | Open-source advocates        | A fully open-source solution                                                       |
| 3   | Self-hosters                 | Sync they can run on their own server                                              |
| 4   | Price-sensitive users        | An app like Obsidian, but cheaper                                                  |
| 5   | Privacy-conscious AI users   | LLM power in their notes without sending data out into the world                   |
| 6   | Handwritten note-takers      | An Obsidian-like tool for handwritten notes                                        |
| 7   | Visual thinkers              | Diagrams, boards, sticky notes, icons                                              |
| 8   | PDF-heavy users              | Annotations, key PDFs in one place, linking to notes                               |
| 9   | Flexible AI users            | LLMs both locally and through providers such as OpenRouter                         |

## 4. Feature scope

### Must have (MVP)

1. **Markdown notes** — creating and editing Markdown-based notes.
2. **Whiteboards** — boards with stylus support, including on Android.
3. **Self-hosted server sync** — users control where their data goes.
4. **Client-side E2EE** — the server never sees content in plaintext.
5. **Images in Markdown notes** — adding pictures to notes.

### Should have

1. **Note file icons** — assigning icons, including custom ones uploaded as SVG.
2. **Command palette** — searching for and running actions from the keyboard.
3. **Meeting recording** — capturing audio from the microphone or from the computer.
4. **Real-time collaborative editing** — multiple users editing the same note at the same time.
5. **Note sharing via link** — generating a special link that lets other users access and co-edit a note.

### Nice to have

1. **Small local LLM** — e.g. for proofreading text, without sending data externally.
2. **Recording-to-note transcription** — extracting text from a recording and turning it into a note.
3. **AI chatbot** — asking questions about the content of your own notes.
4. **Obsidian compatibility** — opening existing Obsidian vaults and migrating from Obsidian.

## 5. Persona-to-feature mapping

| Persona                                   | Features that serve it                               |
| ----------------------------------------- | ---------------------------------------------------- |
| Obsidian alternative / cheaper option     | Markdown, command palette, icons, free self-hosting  |
| Open source / self-hosters                | Self-hosted sync, E2EE                               |
| Privacy-conscious AI users                | Local LLM, AI chatbot                                |
| Handwritten note-takers / visual thinkers | Whiteboards with stylus, images, SVG icons           |
| PDF-heavy users                           | _no feature in current scope_                        |
| Flexible AI users                         | Local LLM (_no integration with external providers_) |

## 6. Key differentiators

- **Privacy by design**: self-hosting + E2EE in the MVP, not as an add-on.
- **Typed and handwritten notes in one place**, with full stylus support on Android.
- **AI on the user's terms**: local by default.
- **Openness**: Markdown format, no vendor lock-in.

## 7. Platforms

The MVP ships on **Android** and **desktop** (built with Tauri). iOS and web are out of scope for the MVP.

## 8. Business model

The app and the sync server are open source and free to self-host. Revenue comes from cloud hosting: users who don't want to run their own server can pay for storage in **Basalt Cloud**, protected by the same end-to-end encryption.

## 9. Open questions

1. **PDF** — the PDF-heavy persona has no matching feature. Should PDF annotations and linking to notes be added (e.g. as a Should have)?
2. **External LLM providers** — this persona also wants OpenRouter, but the scope only covers a local model. Should a configurable LLM provider be added?
3. **Whiteboard format** — what format should boards be stored in so they stay open and portable?
4. **Sharing under E2EE** — how do shared links and real-time collaboration work without the server seeing plaintext (e.g. a decryption key in the URL fragment)? Do they work on both self-hosted servers and Basalt Cloud?

## 10. Success metrics

- Active users and 30-day retention.
- Share of users with self-hosted sync enabled.
- Share of users paying for Basalt Cloud.
- Number of users switching from Obsidian (self-reported, e.g. in onboarding).
- Open-source community activity (contributors, issues, stars).
