# Software delivery process

## Purpose

This file documents how work flows from ticket to merged PR in this repository. The agent skills configured in `.ai/agentic.config.json` enforce the process; humans read it here. PRs target `master`; issues and PRs live in GitHub, with every tracker operation the skills run defined in `.ai/trackers/github.md` (edit that file to extend or override tracker behavior).

Work enters through two paths: a free-form task brief handed to an agent, or a filed ticket. Both converge on the same review loop, the same validation gate, and the same merge gates.

Before intake, the work is shaped: `om-brainstorm` turns a single idea or question into a routing decision and a brief, and the spec skills (`om-spec-writing`, `om-auto-write-spec`) turn a feature into a design document in `.ai/specs/` before anything is built. Those steps feed the table below; they are not the ticket flow itself. Repository-wide conventions for specs, run logs, and lessons live in `AGENTS.md`.

Pipeline labels are disabled in this repository (`labels.enabled: false`): skills skip every label operation and say so in their PR summaries. The QA gate is advisory (`qaGate: false`).

## Roles

- **Author** — the human or agent who writes the change. Owns the ticket from claim to a merge-ready PR.
- **Reviewer** — reads the diff and approves or requests changes. May be a human or the `om-auto-review-pr` skill; the `om-code-review` checklist and `CODE_REVIEW.md` apply either way.
- **Designer** — owns the flow and its states before the code exists. May be a human, `om-ux-shape` for the shaping, `om-ux-review-pr` for the pass over a PR's screens.
- **Maintainer** — owns branch protection, the config, this document, and the installed skills with their repo-local overrides under `.ai/skills/`; arbitrates when gates conflict. Acts as the release manager unless the team names one.

## Ticket lifecycle

| Stage | What happens | Driven by | Done when |
|---|---|---|---|
| Discovery | An idea, question, or itch is talked through before any artifact exists: the problem is questioned, alternatives (including building nothing) are weighed, and the conversation ends in a routing decision — an answer, a filed ticket, a brief for a spec, or a direct change. | `om-brainstorm` or a human | Conversation routed; a brief written when the work continues |
| Intake | A ticket or task brief is filed in GitHub with enough detail to act on: what is wrong or wanted, for whom, and what done looks like. | Anyone, `om-prepare-issue` | Ticket exists |
| Triage | Confirm the issue is real, still unfixed on `master`, and not already claimed or covered by an open PR. Read-only; stops the chain cleanly when there is nothing to do. | `om-verify-in-repo` or a human | Confirmed actionable, or closed as no-action |
| Claim | The author claims the ticket so concurrent agents back off. See the claim protocol below. | `om-fix` / `om-auto-create-pr`, or a human | Claim visible on the ticket |
| Design | For a user-facing change, the flow and its states are settled before the code exists: empty, loading, error, and the deliberate non-goals. A ticket that touches no UI skips this stage. | `om-ux-shape`, or a human designer | The flow and its states are decided, or the ticket is not user-facing |
| Implement | Locate the minimal change surface (`om-root-cause`, read-only), then implement the change with unit tests (and Playwright tests for user-facing features) and run the validation gate. Task briefs without a ticket go through `om-auto-create-pr`, which plans, implements phase by phase in an isolated worktree, and runs the same gate. Non-trivial features get a spec in `.ai/specs/` first. | `om-root-cause` + `om-fix`, `om-auto-create-pr`, or a human author | Change complete, validation gate green |
| PR | Commit, push, and open a PR against `master`. On a hand-worked branch, `om-check-and-commit` runs the gate, fixes obvious drift, and pushes when green. | `om-open-pr`, `om-auto-create-pr`, or `om-check-and-commit` | Open PR |
| Review loop | The reviewer reads the diff against the `om-code-review` checklist and `CODE_REVIEW.md` and approves or requests changes. Requested changes are addressed (`om-auto-continue-pr` resumes agent PRs) and the PR is re-reviewed until approved. A user-facing change may also get an advisory design pass from `om-ux-review-pr`. | `om-auto-review-pr`, `om-review-prs`, `om-ux-review-pr`, or a human | Approving review submitted |
| QA | User-facing changes are exercised in a real browser (`om-prepare-test-env`, `om-auto-qa-pr`); a flow worth keeping becomes Playwright coverage in `basalt-app/e2e/` (`om-integration-tests`). Advisory — it does not hold the merge. | Reviewer, `om-auto-qa-pr`, `om-integration-tests` | Evidence attached to the PR |
| Merge | `om-merge-buddy` reports, read-only, which PRs can merge now. `om-approve-merge-pr` re-checks every gate, approves, and squash-merges. | `om-merge-buddy` + `om-approve-merge-pr`, or a human | PR squash-merged into `master` |
| Post-merge housekeeping | Close issues the merged PR fixes; turn leftover asks or review comments into tracked follow-up issues. | `om-close-fixed-issues`, `om-followup-issue-from-pr` | Tracker reconciled, follow-ups filed |

After merge, this process stops. Deployment, monitoring, and rollback belong to the repository's release process: the Maintainer drafts the changelog with `om-auto-update-changelog` and reconciles the tracker with `om-close-fixed-issues`.

## The claim protocol

Before mutating an issue or PR, an agent claims it by assigning itself and posting a claim comment saying what it is doing. Any agent that finds an existing claim backs off instead of colliding. Because labels are disabled, no `in-progress` label is applied; the assignee and claim comment are the signals. The claim is released when the work finishes — on success and on failure alike. A stale claim with no recent activity may be cleared by the maintainer.

Agents post reviews and comments as soon as their work is done, without waiting for CI. The wait for the CI outcome is bounded by `ci.maxWaitMinutes` (40): when it expires with checks still running, the agent runs the local validation gate as its own evidence, says no further follow-up is coming, and finishes. Required checks still gate every merge.

## The automation contract

The `om-auto-*` skills run this process unattended and are chainable: each accepts the artifact the previous one produced (an issue id, a spec path, or a PR number from the `PR: #<number> (link: <url>)` reference line) and detects work already started rather than opening a duplicate. A completed autonomous run leaves a ready (non-draft) PR with a run-summary comment and, for user-facing changes, screenshots from the working app. Autonomous runs also write a run log to `.ai/runs/` and record lessons per `AGENTS.md`.

## Validation gate

Every PR passes the full validation gate before review sign-off, in this order:

- `cd basalt-app && npm run format:check`
- `cd basalt-app && npm run lint`
- `cd basalt-app && npm run typecheck`
- `cd basalt-app && npm test`
- `cd basalt-app && npm run build`
- `cd basalt-app && npm run test:e2e`
- `cd basalt-app && npm run rust:fmt`
- `cd basalt-app && npm run rust:lint`

Any non-zero exit fails the gate and blocks the PR. The command list lives in `.ai/agentic.config.json`; when it changes, update it there and in this section together.

## Amending this process

This document and `.ai/agentic.config.json` describe the same process: change them together, and re-run the `om-setup-agent-pipeline` skill when the toolchain changes. Per-skill deviations belong in a repo-local skill of the same name at `.ai/skills/<skill-name>/SKILL.md`, which takes precedence over the installed skill; a repo-local skill cannot grant what the installed skill's safety rules forbid.
