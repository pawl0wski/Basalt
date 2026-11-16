# Basalt — product brief

- Date: 2026-10-18
- Mode: own; Owner: Jakub Pawłowski; Pass: full (independent review replaced by inline checks)
- Evidence basis: one account from the brief owner, who is also the only confirmed user; a team workshop brief; owner decisions D01–D05. No data, no interviews with other users. Most consequential untested belief: that people other than the owner share these problems (A02).
- Coverage: 27 claims — 22 sourced (interview 4, data 0, document 18, product 0, benchmark 0), 0 synthetic, 5 assumed; 0 entries on the collection plan
- Synthetic hypotheses outside Coverage: 0
- Definition of Ready signed by: the owner confirmed the scope in session on 2026-10-18; no separate sign-off recorded; ready for: implementation planning of the MVP scope in D05
- Sources: `.ai/specs/research/2026-10-18-product-brief.md`, `.ai/specs/research/interviews/2026-10-18-obsidian-user-brief-owner.md`, `.ai/specs/research/decisions/D01`–`D05`

## Decision summary

The owner decided to implement the MVP (D01, D05). Wider adoption is welcome but is not a goal (D02).

The only confirmed user is the owner, who found Obsidian plugins buggy and Obsidian's own sync costly, and lived with workarounds (see Problems).

MVP: Markdown notes, images, self-hosted sync, client-side E2EE, offline-first. Should have: PDF annotation. Later: whiteboards with stylus (see Scope).

Whether anyone besides the owner needs Basalt is untested (A02). That does not block building, by the owner's decision (D02).

Next: implementation planning, owned by the owner; the whiteboard format (D04, A01) is needed only for the Later work.

## Vision

- Basalt is a Markdown note-taking app that gives its owner Obsidian-like workflow with self-hosted, encrypted sync, and may also help others; this is the team's intended direction, not a demonstrated benefit. `[DOCUMENT]` D02, workshop brief section 1

## Target group and stakeholders

- Customer (pays): none; the owner builds it for their own use. `[DOCUMENT]` D02
- User (uses): the owner, an Obsidian user; no other user is confirmed. `[INTERVIEW]` interviews/2026-10-18-obsidian-user-brief-owner.md
- Stakeholders (decides, blocks, operates): the owner. `[DOCUMENT]` D01
- Decider for scope decisions: Jakub Pawłowski.

## Problems, with evidence

- Obsidian plugins the owner tried were very buggy and did not feel like core features; the owner lived with this and sometimes moved some processes to other apps. `[INTERVIEW]` owner account, 2026-10-18
- Without paid Obsidian Sync, the owner used Google Drive or the Remote Sync plugin, which are not ideal; the official sync is described as the ideal one at "100$ per year". `[INTERVIEW]` owner account, 2026-10-18
- The owner has occasionally wanted to annotate and highlight PDFs such as documentation; no specific case or cost described. `[INTERVIEW]` owner account, 2026-10-18
- Other people share these problems and would use Basalt. `[ASSUMPTION]` team belief, see A02

## Product and how it stands out

- What it is: a Markdown, local-file note app with its own sync server, see Scope. `[DOCUMENT]` workshop brief sections 1, 4
- What makes it different: privacy through self-hosting and E2EE, and affordability versus Obsidian; a team hypothesis, see A02. `[ASSUMPTION]` workshop brief section 6

| reference | what it does well | where it falls short for our users | checked on | link |
| --------- | ----------------- | ---------------------------------- | ---------- | ---- |

Benchmarks deferred: no decision depends on them now.

## Goals and success criteria

- Business goal: none; Basalt is built primarily for its owner. `[DOCUMENT]` D02
- User outcome: the owner uses Basalt and feels good with it. `[DOCUMENT]` D03
- Primary metric, baseline today, threshold, date: none defined. The workshop metrics (retention, Cloud payers, community activity) are optional and become relevant only if the owner pursues adoption or Cloud (D02).
- What must not get worse: not stated.

## Scope

- **Now (MVP):** Markdown notes, images in notes, self-hosted server sync, client-side E2EE, offline-first. `[DOCUMENT]` D05
- **Should have:** PDF annotation and linking to notes; note file icons; command palette; meeting recording; real-time collaborative editing; note sharing via link. `[DOCUMENT]` D05, workshop brief section 4
- **Later:** whiteboards with stylus input (including Android). `[DOCUMENT]` D05
- **Nice to have:** AI features starting with an OpenAI-compatible API integration (placement proposed, Q02); AI chatbot; recording transcription; Obsidian compatibility; small local LLM; Basalt Cloud, far future, application designed with it in mind. `[DOCUMENT]` D03, workshop brief section 4
- **Not doing:** see Non-goals

## Domain glossary

Deferred: no ambiguous term affects the current decision.

## Key flows

Deferred: no flow material exists, and none is invented.

## Business rules

| Id  | Rule | Applies to | Source | Status | Review by | Required path to change | Owner | Supersedes |
| --- | ---- | ---------- | ------ | ------ | --------- | ----------------------- | ----- | ---------- |

No business rules have been confirmed yet.

## Non-goals

| Id  | We are not building                                                            | Why                                     | Owner           | Status   | Review by                             | Required path to change          | Source                                | Supersedes |
| --- | ------------------------------------------------------------------------------ | --------------------------------------- | --------------- | -------- | ------------------------------------- | -------------------------------- | ------------------------------------- | ---------- |
| N01 | iOS and web versions in the MVP                                                | Workshop scope                          | pending         | proposal | unknown                               | owner approves                   | `[DOCUMENT]` workshop brief section 7 | none       |
| N02 | Basalt Cloud work now                                                          | Far future; design only with it in mind | Jakub Pawłowski | active   | when owner decides to host for others | owner approves a superseding row | `[DOCUMENT]` D03                      | none       |
| N03 | README features beyond offline-first (plugins, graph, tags, backlinks, themes) | README is out of date                   | Jakub Pawłowski | active   | unknown                               | owner approves a superseding row | `[DOCUMENT]` D03                      | none       |

## Decisions

| Id  | Date       | Decision                                                                                                                       | Why                                                                            | Owner           | Status            | Review by                           | Required path to change          | Source                     | Supersedes  |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------- | ----------------- | ----------------------------------- | -------------------------------- | -------------------------- | ----------- |
| D01 | 2026-10-18 | Implement the workshop MVP                                                                                                     | Owner wants to build it; no alternative weighed                                | Jakub Pawłowski | superseded by D05 | n/a                                 | n/a                              | `[DOCUMENT]` decisions/D01 | none        |
| D02 | 2026-10-18 | Built primarily for its owner; adoption by others is a bonus                                                                   | Stated by owner                                                                | Jakub Pawłowski | active            | if owner pursues Cloud or promotion | owner approves a superseding row | `[DOCUMENT]` decisions/D02 | none        |
| D03 | 2026-10-18 | README ignored except offline-first; AI via OpenAI-compatible API; Cloud far future; no stop condition; success is owner's use | Stated by owner                                                                | Jakub Pawłowski | active            | unknown                             | owner approves a superseding row | `[DOCUMENT]` decisions/D03 | none        |
| D04 | 2026-10-18 | Whiteboard format candidate: draw.io format                                                                                    | Owner's tentative idea; no alternative weighed                                 | pending         | proposal          | when whiteboard work starts         | owner approves                   | `[DOCUMENT]` decisions/D04 | none        |
| D05 | 2026-10-18 | MVP = notes, images, self-hosted sync, E2EE, offline-first; PDF Should have; whiteboards Later                                 | Format for whiteboards undecided; offline-first agent-proposed, owner accepted | Jakub Pawłowski | active            | unknown                             | owner approves a superseding row | `[DOCUMENT]` decisions/D05 | D01 (scope) |

## Riskiest assumptions

| Id  | Assumption                                                                              | Importance  | Evidence today                     | If false                                         | Smallest test                                                            | Owner           | By when                | Result                  |
| --- | --------------------------------------------------------------------------------------- | ----------- | ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ | --------------- | ---------------------- | ----------------------- |
| A01 | The draw.io format can store freehand stylus strokes `[ASSUMPTION]` owner's idea        | medium      | none checked                       | pick another format for Later whiteboards        | open a sample file with strokes in draw.io                               | Jakub Pawłowski | before whiteboard work | untested                |
| A02 | Other people share the owner's problems and would use Basalt `[ASSUMPTION]` team belief | low for now | one account from the owner         | adoption goals are dropped; MVP unaffected (D02) | conversations with other Obsidian users, only if adoption becomes a goal | Jakub Pawłowski | unknown                | accepted untested (D02) |
| A03 | Obsidian Sync costs 100 USD per year `[ASSUMPTION]` owner's figure                      | low         | not checked against a pricing page | price argument changes                           | check the pricing page and record the date                               | Jakub Pawłowski | unknown                | untested                |

## Kill criteria

None defined; the owner stated no condition for stopping (D03). Lack of outside demand is not a stop condition (D02).

## Hypotheses to test

None; no synthetic walkthrough was run.

## Open questions

| Id  | Question                                                                                            | Blocking                                  | Who can answer | Status |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------- | ------ |
| Q01 | How do sharing links and real-time collaboration work under E2EE, on self-hosted servers and Cloud? | no (Should have)                          | owner          | open   |
| Q02 | Is the OpenAI-compatible API integration Nice to have or Should have?                               | no                                        | owner          | open   |
| Q03 | Whiteboard storage format (D04, A01)                                                                | no for MVP; yes for Later whiteboard work | owner          | open   |

## Definition of Ready addendum (own)

Problems and Target group are supported by one account from the owner, who is the only confirmed user (D02). No evidence covers other people, and none is needed for the owner's decision to build. The Now scope has no open blocking decision. Ready for implementation planning of the MVP in D05. The team (the owner) accepted that the wider-demand assumption stays untested (A02).

## Collection plan

None needed for the current decision.
