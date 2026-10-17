# Backward compatibility

Basalt is pre-1.0 (`0.1.0`) and currently has no released users or published API, but the surfaces below are the ones that will become contracts. Review skills check changes against this file; implementation skills warn when a change violates it.

## Protected surfaces

### Workspace on disk

Notes are plain Markdown (`.md`) files plus attachments in a user-chosen directory (default `~/Basalt`); there is no custom file format or database.

- **Breaking:** changing how notes are stored so existing workspaces are no longer readable, renaming or moving user files implicitly, adding mandatory metadata files that older workspaces lack, or deleting/rewriting user content without consent.
- **Required path:** ship a migration that is idempotent and non-destructive, covered by tests, and described in the PR body; keep reading the old layout until the migration has run.

### End-to-end encryption and sync format (planned)

Encrypted blobs, key derivation, and sync metadata exchanged with the sync backend (`@basalt/api`).

- **Breaking:** any change that makes data encrypted by a previous version undecryptable, changes key derivation parameters without a re-key path, or changes the wire format the server stores.
- **Required path:** version the format, support reading the previous version, document a key-rotation or migration plan in a spec under `.ai/specs/`, and test decrypting fixtures from the previous version. Treat these changes as high-risk and require a second reviewer.

### Public exports of workspace packages

`@basalt/core`, `@basalt/ui`, and `@basalt/api` export through their `src/index.ts`.

- **Breaking:** removing or renaming an export, or changing a signature or type incompatibly.
- **Required path:** update all consumers in the same PR (the packages are private to this monorepo, so no deprecation window is needed), and keep typecheck green across workspaces.

### Tauri host configuration

`basalt-app/src-tauri/tauri.conf.json` and `capabilities/default.json` define the app identifier, permissions, and plugin set.

- **Breaking:** changing the app identifier (moves user data directories), or widening plugin permissions beyond what a spec justifies.
- **Required path:** document the reason in a spec, and call out any data-location or permission change in the PR body.

### Contributor tooling contracts

The npm scripts in `basalt-app/package.json` and `.github/workflows/ci.yml` are what `.ai/agentic.config.json` and CI invoke.

- **Breaking:** renaming or removing a script used by the validation gate.
- **Required path:** update `.ai/agentic.config.json`, `SDLC.md`, and CI in the same PR.
