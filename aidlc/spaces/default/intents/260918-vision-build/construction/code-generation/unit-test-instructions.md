# Unit Test Instructions — Reading Queue CLI

## Framework and configuration

- Test runner: **Vitest** (dev dependency), configured in `vitest.config.ts`.
- TypeScript strict mode; tests are `*.test.ts` colocated with the code they cover.
- No external services or network; all tests run offline.

## Exact command to run these tests

```
npx vitest run
```

This is the unit-scoped command for this single-unit project (it runs the whole
suite, which is this unit's suite). It must be runnable after Step 2 bootstraps
the runner, before any test-after cycle executes.

## Coverage target

Minimal strategy: one verifiable test per requirement at the narrowest effective
level, plus at least one happy-path test per component. No numeric line-coverage
floor applies at `express` scope; every FR must have at least one asserting test.

## Test data management

- Persistence and CLI tests use a **temporary data file** per test (e.g. via
  `os.tmpdir()` + a unique name, or Vitest's tmp helpers), passed through the
  `READING_QUEUE_FILE` environment variable. Never touch the real
  `~/.reading-queue/queue.json`.
- Each test creates and cleans up its own temp file; tests do not share state.

## Mocking / stubbing guidance

- Prefer real filesystem writes to a temp path over mocking `fs` — persistence
  atomicity (FR1.9) is part of what must be verified.
- Timestamps: assert on ordering and presence/ISO-shape, not exact `Date.now()`
  values, to keep tests deterministic.
- CLI integration tests invoke the CLI entry function directly with an `argv`
  array and capture stdout/stderr and the returned exit code, rather than
  spawning a subprocess, so assertions stay fast and deterministic.

## Required test scenarios (from requirements + Success Criteria)

- Domain: factory defaults status `unread`, stamps `createdAt`/`updatedAt`, item shape.
- Persistence: missing file loads as empty; atomic save/load round-trip; `READING_QUEUE_FILE` override honored; removed IDs are not reused (`nextId` monotonic).
- Core: add rejects missing title and malformed URL; duplicate URLs allowed; `list` newest-first; `--status` and `--tag` filters (and combined); `start`→reading; `complete`→done; `remove` deletes; `next` returns oldest unread (optionally tag-filtered) and does NOT change status; `next` no-match message.
- CLI: each of the six commands end-to-end against a temp file; unknown command, missing ID, missing title, malformed URL → non-zero exit with actionable message; valid commands → exit 0.
