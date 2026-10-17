---
date: 2026-10-17
slug: engineering-standards-package-structure
type: spec
status: implemented
approval: approved
current: true
tags: [architecture, engineering-standards, packages, tauri, ci]
---

# Basalt Engineering Standards & Package Structure

## Status

**Current and implemented.** This is the authoritative engineering standards specification for Basalt. Package quality scripts and CI workflows are implemented. Linux CI runs in an Alpine container; Windows and macOS Tauri builds use native runners. CI checks are advisory workflow results; repository branch protection and required status checks are not part of this project's workflow.

## Goal

Define a maintainable engineering baseline for the Basalt application so that contributors can add functionality without creating unnecessary coupling between the React application, shared TypeScript packages, and the Tauri/Rust host.

All repository documentation and specification content is written in English. User-facing application text follows the product's localization requirements.

The specification is concerned with code organization and development practice. Markdown-first storage is an existing product constraint and informs the package boundaries, but detailed note behavior, synchronization, encryption, and product roadmap are out of scope.

## Context and constraints

- Basalt is a Tauri 2 application using React and TypeScript, with Rust for native functionality.
- The JavaScript workspace is managed with npm workspaces under `basalt-app/packages/`.
- The current package layout is `app`, `core`, `ui`, and `api`.
- Markdown files in a user-selected workspace are the intended source of truth for note content. They must remain ordinary user-readable files rather than becoming dependent on a proprietary database format.
- Desktop and Android are current targets. Platform-specific behavior must be isolated rather than leaking into shared domain logic.
- E2EE, synchronization protocol, server implementation, and collaboration behavior are explicitly out of scope for this specification.

## Proposed package structure

```text
basalt-app/
├── src-tauri/                  # Tauri host, Rust commands, capabilities, native integrations
├── packages/
│   ├── app/                    # Composition root: routes, screens, app state, platform adapters
│   ├── core/                   # Framework-independent domain types and use cases
│   ├── ui/                     # Reusable presentation components and design tokens
│   └── api/                    # Typed HTTP transport/client for remote services
├── package.json                # npm workspace root and repo-level scripts
└── package-lock.json
```

Keep this layout small until a real need justifies another package. A new package must have a distinct responsibility, a documented public entry point, and a clear dependency direction; do not create packages solely to mirror folders or anticipated features.

### Package responsibilities

#### `@basalt/app`

- Owns application composition: routing, screens, layout, application-level state, and user workflows.
- Connects UI interactions to `@basalt/core` use cases and platform adapters.
- Owns Tauri frontend integration and maps IPC/platform details to application-facing interfaces.
- May depend on `@basalt/core`, `@basalt/ui`, `@basalt/api`, and Tauri frontend APIs.
- Must not become the home for reusable domain rules or generic UI primitives.

#### `@basalt/core`

- Owns framework-agnostic domain types, validation, pure transformations, and use cases that can be tested without a WebView or Tauri runtime.
- Must not import React, UI packages, Tauri APIs, browser globals, or concrete HTTP clients.
- Defines ports/interfaces where domain operations need filesystem, clock, ID generation, or other external capabilities.
- Treats Markdown content as portable data; it must not require application-only metadata to read or preserve ordinary Markdown files.
- Prefer pure functions and explicit input/output types. Side effects belong behind injected ports/adapters.

#### `@basalt/ui`

- Owns reusable, accessible visual components, design tokens, and presentation-only helpers.
- May depend on React and presentation libraries, but not on `@basalt/app`, `@basalt/api`, Tauri APIs, or domain workflows.
- Receives data and callbacks through typed props; it must not perform filesystem, network, or domain side effects.
- Should expose components through a deliberate package entry point instead of having consumers import internal file paths.

#### `@basalt/api`

- Owns typed remote HTTP transport concerns: request/response serialization, endpoint clients, and transport-level error mapping.
- May depend on shared contract types from `@basalt/core` only when those types are genuinely transport-independent.
- Must not import React, UI, or Tauri APIs.
- Does not define sync semantics, cryptographic formats, or server behavior in this specification.

#### `src-tauri/`

- Owns native application startup, Rust commands, plugin registration, and platform-specific operations.
- Exposes a narrow, typed IPC surface. Commands validate inputs and return explicit serializable results/errors.
- Keeps Rust command handlers small; move reusable behavior into Rust modules/services when that behavior is native-only and warrants isolation.
- Does not expose arbitrary filesystem or shell access to the WebView.
- Capability and permission configuration follows least privilege and is scoped to the windows and operations that require it.

## Dependency direction

Allowed dependency graph:

```text
app ───────► core
 │  ├──────► ui
 │  └──────► api ───────► core (shared transport-independent contracts only)
 └─────────► Tauri frontend APIs / app-owned adapters

ui ────────► React and presentation dependencies only
core ──────► platform-independent dependencies only
Rust host ─► Rust/Tauri implementation; frontend communicates through explicit IPC
```

Rules:

1. Dependencies point inward to stable, lower-level responsibilities; `core` and `ui` never depend on `app`.
2. No circular dependencies between workspaces. If two packages need each other, move the shared contract to the correct lower-level package or reconsider the boundary.
3. Package internals are private by default. Consumers use package exports/public entry points, not deep imports into another package's `src` tree.
4. Do not duplicate domain types across packages. Place shared domain contracts in `core`; keep UI view models and API wire models local unless there is a demonstrated need to share them.
5. Keep platform checks in app-owned adapters or Rust platform modules, not in portable domain rules.
6. Do not introduce a global service locator. Dependencies for side-effecting operations should be explicit at construction/call boundaries.

## Engineering standards

### Code design principles

These principles should guide engineering decisions and maintenance, not encourage abstractions for their own sake. Apply them in proportion to the problem's scale.

#### YAGNI — implement current requirements

- Implement behavior required by the accepted task, not hypothetical future needs.
- Do not add extensibility points, configuration, adapter layers, or generic frameworks unless they solve a current problem.
- This does not mean neglecting clear architecture or refactoring. Keep code easy to change, but do not include unused capabilities.
- Extract shared abstractions when a real second use case appears and concrete examples demonstrate the common need.

#### DRY — one source of truth for shared knowledge

- Do not duplicate the same domain rule, validation, or mapping in multiple places. Keep it in the layer that owns that knowledge.
- Share types and functions when they represent the same contract or rule, not merely because two code fragments look similar.
- Do not force a shared abstraction onto code that happens to look similar but represents independent behavior. False abstractions increase coupling and make independent changes harder.
- In React, keep state minimal and derive values from props/state instead of maintaining multiple copies of the same information.

#### SRP — one responsibility and one reason to change

- Each module, function, and component should have a clear responsibility.
- A presentational component renders UI and emits user intent; a container or integration hook connects the view to state and actions; domain logic belongs in `@basalt/core`; platform effects belong in app adapters or Rust/Tauri.
- Separate code when parts have independent reasons to change, require different tests, or become harder to understand when combined.
- Do not split a small, cohesive component into multiple files just to satisfy an arbitrary size rule.

#### Simplicity and readability

- Prefer the simplest solution that meets the requirement and fits the existing architectural boundaries.
- Readability for the next person matters more than terseness, clever types, or minimizing line count.
- Avoid deeply nested conditions and overly long functions when steps can be named and extracted into focused functions.
- Do not introduce a design pattern, library, or layer just because it is popular. Justify it with a concrete need.

#### Explicitness and type safety

- Dependencies, inputs, side effects, and possible errors should be visible in a function or module's interface.
- Prefer types that describe valid states and values, such as discriminated unions for operation states, over loose strings or multiple conflicting flags.
- Do not use `any`, type assertions, or the `!` operator to silence the compiler without a justified, local, verified guarantee. Validate external data at runtime.
- Use TypeScript inference when a type is obvious; add annotations where they improve public contracts, readability, or diagnostics.
- Functions should have clear inputs and outputs; prefer small functions with as few side effects as practical.

#### Dependencies and data flow

- Maintain unidirectional dependencies in accordance with the package diagram; compose features in the `app` layer.
- Pass dependencies explicitly to functions and components rather than reading them from hidden global context, except when the framework provides an appropriate mechanism (for example, a React provider).
- Do not import private files from another feature. Move shared elements to the appropriate layer only when a real shared need exists.
- Isolate side effects at system boundaries. Pure logic should be testable without Tauri, network access, or the real filesystem.

### TypeScript and JavaScript

- Use TypeScript for application and package source. JavaScript is permitted for tooling and configuration that do not reasonably support TypeScript.
- Keep strict type checking enabled. Do not use `any` to bypass type boundaries; prefer `unknown` with validation or a precise type.
- Validate untrusted data at system boundaries: IPC payloads, file contents, and HTTP responses. TypeScript annotations do not validate runtime data.
- Handle asynchronous operations explicitly and expected errors in a controlled way. Do not ignore errors or return success-shaped values after a failed operation.
- Use named, descriptive exports and stable package entry points.
- Avoid premature generic frameworks and abstractions. Add an abstraction when it clarifies a current responsibility, creates a needed test seam, or prevents a concrete boundary violation.
- Use TypeScript inference for local variables when the type is obvious. Annotate function inputs, public contracts, and non-obvious return types when it improves clarity.
- Prefer `interface` for extendable object contracts and `type` for unions, intersections, and other type compositions. Clarity and consistency take precedence over this heuristic.
- Avoid unsafe type assertions and the `!` operator. If they are necessary at a validated boundary, keep them narrow and provide a test or clear justification for the runtime guarantee.
- Use `import type` when it clarifies a type-only dependency or prevents an unnecessary runtime import.
- Update application state immutably. Do not mutate objects or arrays held in shared state.
- Keep state minimal and derive values such as filtered lists, counts, and flags from source data rather than storing copies.

### Rust and Tauri

- Keep command inputs and outputs serializable, bounded, and explicit. Return structured errors suitable for safe display/logging; do not leak secrets or full sensitive note contents into logs.
- Treat frontend/WebView code as a separate trust domain. Expose only the commands and plugin permissions required by the current feature.
- Do not grant broad filesystem scopes as a convenience. Workspace access must be tied to a user-selected/authorized workspace and constrained to that root, including protection against path traversal and unsafe symlink resolution.
- Prefer Rust filesystem operations or a narrowly scoped command boundary for workspace operations when frontend plugin scopes cannot safely express the required authorization. If the filesystem plugin is used, define explicit capabilities and scopes and test them on target platforms.
- Keep platform-specific differences isolated and document any unavoidable differences in behavior.

### Markdown and workspace data

- Preserve user-authored Markdown and attachments as ordinary files in the workspace.
- Separate portable Markdown/domain behavior from filesystem access: core logic should be testable against in-memory inputs or injected ports.
- File writes that replace existing user content must avoid partial/corrupt writes where practical (for example, write temporary content and replace atomically when supported); report failures to the user-facing layer.
- Filesystem paths crossing an IPC boundary are untrusted input. Normalize and validate paths against the authorized workspace root before use.
- Do not store credentials, encryption keys, or note contents in logs, test snapshots, or CI output.

### React component and presentation pattern

React code should separate **presentational components** from the container/hook layer that reads application state and coordinates actions. The component that renders a view should be distinct from the layer that connects it to application behavior.

#### Presentational component

- Renders UI from explicit, typed props. Its inputs should make the rendered state and available actions clear.
- Does not read Zustand stores, call Tauri commands, access the filesystem/network, or own application workflows.
- Emits user intent through callback props such as `onOpen`, `onSave`, or `onDismiss`; it does not decide which service/store action implements that intent.
- May own small, transient interaction state that is purely local to the visual control (for example, whether a tooltip is open). State that coordinates screens or application operations belongs outside it.
- Handles visual states explicitly through props (for example, loading, empty, disabled, and error presentation) rather than reaching into a store to discover them.
- Should normally be a small, focused component. Split a component when it contains distinct reusable UI or when the split clarifies ownership, not merely to reduce line count.

#### Container / feature boundary

- A container is the integration boundary between presentation and application behavior. It selects only the required state, connects callbacks to application actions, and passes data/state/actions to the presentational component.
- Containers may use Zustand selectors, app-owned hooks, and app adapters. They must not move domain rules out of `core` or duplicate them in React.
- Keep store subscriptions narrow: select the specific state fields needed by the container rather than subscribing to an entire store when that would cause unrelated re-renders.
- Keep event handlers named for the user intent (`handleSave`, `handleOpenNote`). If an action needs asynchronous work, error mapping, or multiple coordinated effects, delegate it to an app-level action/service/hook rather than expanding the JSX container into a workflow implementation.
- Use a container only when a component needs application state or behavior. A purely presentational component does not need a wrapper just to conform mechanically to the pattern.
- Keep a component focused on one UI responsibility. Extract a child component when it has an independent purpose, meaningful reuse, or a separate state/interaction boundary—not simply because the parent has reached an arbitrary line count.

#### Pages and composition

- Pages compose feature containers and layout components; they should not become a second service layer.
- Put routes and top-level providers in the app composition layer. Keep a component's feature-specific dependencies close to that feature.
- Shared visual primitives belong in `@basalt/ui`; app-specific feature components and containers belong in `@basalt/app`.
- Avoid importing app feature components into `@basalt/ui` or making reusable UI components depend on application stores.

#### React state and rendering

- Use local React state for transient state owned by one component. Use the shared store only for state genuinely shared across screens or application workflows.
- Keep domain rules in `@basalt/core`, not in JSX, render callbacks, or Zustand selectors.
- Keep state as the minimal source of truth. Derive filtered/sorted/display values during render or in selectors; do not store duplicated derived values that can become inconsistent.
- Avoid mutating objects or arrays from props or shared state. Create new values when updating application state.
- Compute simple display values directly. Use `useMemo` and `useCallback` only when there is a measured/rendering reason, stable identity is required by a consumer, or the computation is meaningfully expensive; do not add memoization by default.
- Effects are for synchronizing with external systems. Do not use effects to derive values that can be calculated during render, and ensure subscriptions/listeners are cleaned up.
- Components must provide accessible names, keyboard interaction, focus behavior, and semantic structure appropriate to their function.

#### Feature folder and file layout

Group a feature's related components, tests, and styles together. Use PascalCase names for React component files and component folders (for example, `Button.tsx` and `Button/`), and keep test/style files adjacent to the implementation. Non-component modules should use the naming convention already established by their package; do not force component casing onto utilities, hooks, or configuration files.

```text
packages/app/src/
├── components/
│   └── WorkspaceStatus/
│       ├── WorkspaceStatus.tsx                 # Presentational component
│       ├── WorkspaceStatusContainer.tsx         # Store/action integration, when needed
│       ├── WorkspaceStatus.module.css           # Local styles, when needed
│       └── WorkspaceStatus.test.tsx             # Component behavior tests
├── pages/
│   └── WorkspacePage.tsx                        # Page-level composition
└── features/
    └── workspace/
        ├── hooks/
        ├── actions/
        └── types.ts
```

Do not create empty subfolders or all possible file types pre-emptively. Use the existing styling approach in the package; styles should be local to a component/feature unless they are design tokens or genuinely global styles.

#### Example

```tsx
// WorkspaceStatus.tsx
export interface WorkspaceStatusProps {
  name: string;
  isAvailable: boolean;
  onOpen: () => void;
}

export function WorkspaceStatus({
  name,
  isAvailable,
  onOpen,
}: WorkspaceStatusProps) {
  return (
    <button type="button" onClick={onOpen} disabled={!isAvailable}>
      {isAvailable ? `Open ${name}` : `${name} is unavailable`}
    </button>
  );
}
```

```tsx
// WorkspaceStatusContainer.tsx
import { useWorkspaceStore } from "../../store/workspaceStore";
import { WorkspaceStatus } from "./WorkspaceStatus";

export function WorkspaceStatusContainer() {
  const name = useWorkspaceStore((state) => state.activeWorkspaceName);
  const isAvailable = useWorkspaceStore((state) => state.isWorkspaceAvailable);
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace);

  return (
    <WorkspaceStatus
      name={name}
      isAvailable={isAvailable}
      onOpen={openWorkspace}
    />
  );
}
```

The example illustrates the boundary, not a requirement to use a store as the action implementation. In production, the action should be connected to the app's appropriate use case/adapter and the component should include the project's chosen localization and UI primitives.

#### Naming and exports

- Use PascalCase for React component names and component files/folders (for example, `Button.tsx`, `WorkspaceStatus.tsx`, and `WorkspaceStatus/`). Use camelCase for functions, props, hooks, and variables; non-component files follow their package's established naming convention.
- Name custom hooks with the `use` prefix and keep them in a feature-local `hooks/` folder unless broadly shared.
- Prefer named exports for new React components and hooks so imports are explicit and refactoring is easier. Follow neighboring code during incremental migration rather than changing unrelated exports.
- Use `ComponentNameProps` for component prop types. Keep the public prop API minimal and avoid passing entire stores/services into presentational components.
- Prefer explicit event callback names (`onSave`, `onSelect`) over generic names (`onChangeAction`, `callback`).

#### React testing

- Test presentational components by rendering them with representative props and asserting visible output and user interactions.
- Test containers for correct integration: state selection, action invocation, and loading/error/empty state mapping. Mock the boundary, not internal implementation details.
- Keep tests adjacent to the component/feature and name them `*.test.tsx`.
- Prefer user-observable queries and interactions; avoid assertions about hook call counts or private component state.

### Errors and logging

- Distinguish expected operational errors (missing file, permission denied, network unavailable) from programming errors.
- Map lower-level errors to stable, user-actionable outcomes at application boundaries while retaining safe diagnostic context for developers.
- Logs must be useful but privacy-preserving. Never log note body text, tokens, passwords, cryptographic keys, or authorization headers.
- Do not use unhandled promise rejections as control flow.

### Dependencies

- Add a dependency only when it solves a concrete need that cannot be handled cleanly with existing platform/framework capabilities.
- Prefer established, maintained dependencies with compatible licenses and active security maintenance.
- Keep runtime dependencies in the package that uses them; do not rely on accidental hoisting from the workspace root.
- Commit `package-lock.json` changes with dependency changes. Keep Rust dependency/lockfile changes in the same PR when applicable.
- Review permissions, native code, install scripts, transitive footprint, and license before adding security-sensitive or native dependencies.

## Testing strategy

Tests should follow the same dependency boundaries as production code:

- **Core unit tests:** domain rules, validation, transformations, parsing/serialization behavior, and error cases; no filesystem/network/Tauri runtime required.
- **UI tests:** observable rendering and interactions, including accessibility-relevant behavior; avoid tests coupled to implementation details.
- **App integration tests:** critical workflows wired through adapters, with external effects mocked or provided by controlled test fixtures.
- **Rust tests:** native/domain helpers, path validation, command input validation, and error mapping.
- **Cross-platform smoke checks:** Tauri build/startup and workspace access on supported release platforms, especially where filesystem permissions differ.
- **Regression tests:** every bug fix should add a test at the lowest practical layer that reproduces the failure.

Tests must be deterministic, isolated, and must not access a developer's real workspace or credentials. Temporary test data must be uniquely created and reliably cleaned up.

## Pull request standards

### PR requirements

Every PR must:

1. State the user/developer problem and the intended change.
2. Identify affected packages/platforms and any user-data, security, dependency, or migration impact.
3. Include tests for changed behavior and regression coverage for bug fixes, or explain why automated coverage is not appropriate.
4. Pass all required CI checks before merge.
5. Include screenshots or a short recording for visible UI changes where practical.
6. Update relevant documentation/specifications when the architecture, package boundary, security behavior, or developer workflow changes.
7. Keep the change focused. Large refactors and unrelated formatting should be separate unless inseparable from the change.
8. Never include secrets, credentials, real user notes, or generated build output unless intentionally required and reviewed.

### Review expectations

- At least one review from a maintainer or designated reviewer is required before merge; the author should not self-approve.
- Reviewers check correctness, package ownership/dependency direction, tests, user-data safety, Tauri permissions, and compatibility with desktop/Android targets as relevant.
- Changes that broaden filesystem, network, shell, or other native permissions require explicit security review and a justification in the PR.
- Architecture boundary exceptions must be documented in the PR and approved before merging; recurring exceptions should trigger a spec update.
- Resolve or explicitly record all requested changes and CI failures before merge. Do not bypass required checks without maintainer approval and a documented reason.

### Suggested PR description

```markdown
## Summary

- What changed and why

## Affected areas

- Packages/platforms:
- Data/security impact:

## Verification

- [ ] Tests
- [ ] Typecheck/build
- [ ] Lint/format checks
- [ ] Desktop/Android check as applicable

## UI evidence

<!-- Screenshots/recording, or N/A -->
```

## CI standards

### Required checks for every pull request

The CI workflow should run on every PR and on changes to the default branch. Required checks should include:

1. **Install:** reproducible dependency installation using the committed lockfile (`npm ci`).
2. **Formatting:** formatter check on changed/relevant source; CI must report drift rather than rewriting files silently.
3. **Lint:** static lint checks for TypeScript/React and Rust where configured.
4. **Typecheck:** TypeScript checks for all affected workspaces (and preferably all workspaces while the repository is small).
5. **Tests:** all unit and integration tests available for the affected code.
6. **Frontend build:** production TypeScript/Vite build for the app.
7. **Rust checks:** `cargo fmt --check`, `cargo clippy` with warnings treated as failures where practical, and `cargo test` for the Tauri Rust package.
8. **Tauri validation:** validate Tauri configuration/capability files and build at least one representative desktop target. Platform matrix builds should run on relevant branches/releases where runner availability permits.

CI reports check results for pull requests and default-branch changes. Merge enforcement through repository branch protection or required status checks is intentionally not used by this project.

### CI behavior

- Use locked dependency installation; do not update dependencies as part of CI verification.
- Cache package downloads/build artifacts only where cache keys include the relevant lockfiles and toolchain inputs.
- Pin or constrain CI toolchain versions consistently with local development documentation.
- Keep jobs parallel where independent, but make the final required status unambiguous.
- CI failures must show actionable logs without printing secrets or note contents.
- PRs are mergeable only when all required checks pass and required review is complete.
- Flaky tests must be tracked and fixed or quarantined with an owner and issue; do not normalize rerunning a failing job as a substitute for diagnosis.
- Release signing, publishing, and secret-bearing deployment jobs must not run for untrusted fork PRs.

### CI implementation note

The GitHub Actions workflow runs frontend formatting, lint, typecheck, tests, and build in a Node.js Alpine container; Rust formatting/lint/tests and the Linux Tauri build run in Alpine containers with the required native toolchain packages. Windows and macOS Tauri builds run on native hosted runners. These jobs provide feedback but are not configured as repository-enforced merge requirements.

## Definition of done

A change is ready to merge when:

- The code lives in the package/module that owns the responsibility.
- Dependency direction remains acyclic and follows the approved graph.
- Inputs are validated at trust boundaries and failures are handled explicitly.
- User Markdown/workspace data is preserved and filesystem access is constrained appropriately.
- Relevant tests pass locally and in CI; regression coverage exists for bug fixes.
- Typecheck, lint/format, frontend build, and relevant Rust checks pass.
- Documentation and PR description explain material architectural/security decisions.
- Required review is complete and no required CI checks are failing or bypassed.

## References

These references inform the guidelines above; Basalt's requirements are the rules in this document, not a mandate to adopt another project's complete architecture.

- React, Thinking in React: <https://react.dev/learn/thinking-in-react>
- Bulletproof React, project structure: <https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md>
- TypeScript Handbook, Everyday Types: <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html>
- Google TypeScript Style Guide: <https://google.github.io/styleguide/tsguide.html>
- Redux Style Guide, state minimalism, feature organization, selectors and side effects: <https://redux.js.org/style-guide/>
- Martin Fowler, YAGNI: <https://martinfowler.com/bliki/Yagni.html>
- Tauri 2 security model: <https://v2.tauri.app/security/>
- Tauri 2 filesystem plugin security, permissions, and scopes: <https://v2.tauri.app/plugin/file-system/>
- GitHub Actions, running jobs in a container: <https://docs.github.com/en/actions/using-jobs/running-jobs-in-a-container>
- Tauri prerequisites for Alpine Linux (musl/static-library considerations): <https://v2.tauri.app/start/prerequisites/>
- Official Node.js Alpine image and musl compatibility notes: <https://hub.docker.com/_/node>
