# Code Summary — Reading Queue CLI

## Overview

Implemented the `reading-queue` TypeScript CLI at the workspace root as a
single zero-Unit deliverable. The code follows the approved layered
architecture (domain / persistence / core / cli / bin) with zero runtime
dependencies — only Node.js built-ins (`node:fs`, `node:path`, `node:os`,
`node:crypto`, and the WHATWG `URL`).

Methodology: **test-after** (Minimal strategy). Each layer was implemented and
then covered with its tests; the full suite was run and is green.

## Files created

### Configuration
- `package.json` — name `reading-queue`, `bin` entry, `type: module`, scripts
  `build`, `typecheck`, `test`, `lint`, `format`, `format:check`; dev deps only.
- `tsconfig.json` — `strict: true`, `module`/`moduleResolution` `NodeNext`,
  target ES2022; includes tests for typecheck.
- `tsconfig.build.json` — extends the base, excludes `*.test.ts`, emits to `dist/`.
- `vitest.config.ts` — Vitest runner, node environment, `src/**/*.test.ts`.
- `eslint.config.js` — flat config (@eslint/js + typescript-eslint), scoped to
  app code (ignores `dist`, `coverage`, `node_modules`, `.claude`, `aidlc`).
- `.prettierrc.json`, `.prettierignore` — formatting config.
- `README.md` — install, data-file location/override, usage of all six commands,
  exit codes, and development commands.

### Source (`src/`)
- `domain/item.ts` — `Status` type, `Item` interface, `STATUSES`, `isStatus`
  type guard, and `createItem` factory (defaults status `unread`, stamps
  `createdAt`/`updatedAt` as ISO 8601 UTC, copies tags).
- `persistence/store.ts` — `QueueData` shape, `DataFileError`, path resolution
  (`READING_QUEUE_FILE` override else `~/.reading-queue/queue.json`),
  ENOENT→empty load, structural validation, atomic save (temp file in the same
  directory + rename), monotonic `nextId`.
- `core/queue.ts` — `ValidationError` and the six operations `add`, `list`,
  `start`, `complete`, `remove`, `next`. Input validation (title, URL) lives at
  this boundary; `next` is read-only.
- `cli/index.ts` — `run(argv, io?)` entry function returning an exit code,
  argument parser, per-command handlers, option/positional/status/ID validation,
  and error→exit-code mapping. `CliIO` is injectable so tests capture output
  without spawning a subprocess.
- `bin/reading-queue.ts` — shebang wrapper that calls `run(process.argv.slice(2))`
  and `process.exit(code)`.

### Tests
- `domain/item.test.ts` (6), `persistence/store.test.ts` (9),
  `core/queue.test.ts` (18), `cli/cli.test.ts` (20) — 53 tests total.

## Key implementation decisions

- **Injectable CLI I/O.** `run(argv, io?)` keeps the required `run(argv)`
  signature (the `io` param defaults to console/`process.env`) while letting
  integration tests capture stdout/stderr and the exit code deterministically
  and point at a temp `READING_QUEUE_FILE`.
- **Exit-code taxonomy.** `0` success, `1` user/input error (`ValidationError`),
  `2` fatal (`DataFileError` or unexpected). Distinguishing them satisfies the
  construction guardrail on recoverable vs fatal errors while meeting the
  "non-zero on failure" requirement.
- **Atomic writes.** Save serializes to a uniquely-named temp file in the target
  directory (pid + random suffix), then renames over the target; on failure it
  best-effort removes the temp file and rethrows a `DataFileError` with context.
- **Deterministic ordering.** `list` (newest-first) and `next` (oldest-first)
  tie-break on `id` when `createdAt` collides, so ordering is stable even for
  items created within the same millisecond.
- **Boundary validation only.** Title/URL/tag sanitisation happens once in
  `core` (URL via the WHATWG `URL` parser, requiring an absolute URL); the
  domain factory trusts its inputs.
- **Zero runtime dependencies.** Node built-ins cover everything, satisfying NFR3.

## Verification results (all green)

- `npm run build` → exit 0
- `npm run typecheck` (`tsc --noEmit`, strict) → exit 0
- `npm run lint` (ESLint) → exit 0
- `npx vitest run` → 53 passed (4 files), exit 0
- `npm run format:check` → exit 0
- Manual smoke test of the built binary from an arbitrary cwd with a temp
  `READING_QUEUE_FILE`: `add`, `next`, `list` exit 0; unknown command exits 1.

## Deviations from the plan

- **Added `tsconfig.build.json`** (not named in the plan) so the production
  build excludes `*.test.ts` while `typecheck` still covers tests. Minor, keeps
  `dist/` free of test artifacts.
- **Added Prettier config + `format`/`format:check` scripts.** The plan listed
  Prettier as a dev dependency; wiring the scripts and scoping them (plus the
  ESLint ignore of `.claude`/`aidlc`) keeps tooling from scanning framework
  files. No behavioral impact.
- Installed dev dependencies from the public npm registry via a one-time
  `--registry` flag because the machine's CodeArtifact auth token was expired;
  no `.npmrc` or global config was changed.

## Notes for downstream (Build and Test / quality)

- Run order: `npm install` → `npm run build` → `npm run typecheck` →
  `npm run lint` → `npx vitest run`.
- If the environment's default npm registry (CodeArtifact) auth is expired,
  install with `--registry https://registry.npmjs.org/` or refresh the token.
