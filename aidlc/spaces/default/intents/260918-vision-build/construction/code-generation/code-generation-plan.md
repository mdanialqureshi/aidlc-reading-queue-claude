# Code Generation Plan — Reading Queue CLI

## Overview

Single zero-Unit implementation of the `reading-queue` TypeScript CLI described
in `requirements.md`. Architecture follows NFR4 — three separated layers plus a
thin entry point:

- **domain** — item model, status enum, ID/timestamp rules (FR1)
- **persistence** — atomic JSON load/save, path resolution (FR1.6–FR1.9)
- **core (business logic)** — queue operations: add, list, start, complete, remove, next (FR2–FR6)
- **cli** — argument parsing, command dispatch, error/exit-code mapping (FR7)
- **bin** — executable entry point wiring `process.argv` → cli

Test runner: **Vitest** (TypeScript-native, minimal footprint — satisfies NFR3).
URL validation via the built-in WHATWG `URL` (no runtime dependency).

## Testing methodology

Per the embedded Testing Contract: **test-after**, Minimal strategy —
implement each layer, then write and run that layer's tests. One verifiable test
per requirement at the narrowest effective level, plus a happy-path floor per
component. CLI commands are covered by command-level integration tests against a
temporary data file (NFR6). No DB or frontend layers apply.

## Requirement → plan-step traceability

| Requirement | Covered by step |
|-------------|-----------------|
| FR1 (model, IDs, timestamps, atomic persistence) | 3, 4, 5, 6 |
| FR2 (add) | 7, 8 |
| FR3 (list) | 7, 8 |
| FR4 (start/complete) | 7, 8 |
| FR5 (remove) | 7, 8 |
| FR6 (next) | 7, 8 |
| FR7 (CLI errors/exit codes) | 9, 10 |
| NFR2/NFR7 (strict TS, npm scripts) | 1, 2, 11 |
| NFR6 (unit + integration tests) | 4, 6, 8, 10 |
| NFR8 (README) | 12 |

## Steps

- [x] Step 1 — Project structure and production configuration skeleton: `package.json` (name `reading-queue`, `bin`, npm scripts for build/test/lint/typecheck), `tsconfig.json` (`strict: true`, NodeNext), `.eslintrc`, `.gitignore`, `src/` layout.
- [x] Step 2 — Bootstrap the minimal test runner/configuration and record the exact command: add Vitest + `vitest.config.ts`; record `npx vitest run` as the unit-scoped command in `unit-test-instructions.md`.
- [x] Step 3 — Domain layer (`src/domain/item.ts`): `Status` type (`unread|reading|done`), `Item` interface (id, title, url, tags, status, createdAt, updatedAt), factory that stamps timestamps and defaults status to `unread`. (FR1.1, FR1.3, FR1.4, FR1.5)
- [x] Step 4 — Domain tests: item factory defaults and shape.
- [x] Step 5 — Persistence layer (`src/persistence/store.ts`): resolve path (`READING_QUEUE_FILE` → default `~/.reading-queue/queue.json`), create parent dir on first use, load (missing file → empty queue), atomic save (temp file + rename), track `nextId` so removed IDs are never reused. (FR1.2, FR1.6–FR1.9)
- [x] Step 6 — Persistence tests: load-missing→empty, atomic round-trip, path override via env, nextId monotonicity across removals.
- [x] Step 7 — Core business logic (`src/core/queue.ts`): `add`, `list` (newest-first sort + status/tag filters), `start`, `complete`, `remove`, `next` (oldest unread matching optional tag, read-only). Validation: missing title, malformed URL. Duplicate URLs allowed. (FR2–FR6)
- [x] Step 8 — Core tests: add validation (missing title, bad URL), duplicate URLs allowed, list sort + filters, start/complete transitions, remove, next selection + no-match, next does not mutate status.
- [x] Step 9 — CLI layer (`src/cli/index.ts`): parse `argv`, dispatch to the six commands, map results to stdout and exit codes; unknown command / missing ID / bad args → actionable message + non-zero exit. (FR7)
- [x] Step 10 — CLI integration tests: each of the six commands end-to-end against a temp data file; invalid command, missing ID, missing title, malformed URL all exit non-zero with a message; valid commands exit zero.
- [x] Step 11 — Entry point (`src/bin/reading-queue.ts` with shebang) + wire npm `bin`; verify `npm run build`, `lint`, `typecheck` clean.
- [x] Step 12 — Documentation and traceability: README (install + usage of all six commands, data-file location/override); `code-summary.md`, `source-manifest.json`, `traceability.json`.

## Test files planned

- `src/domain/item.test.ts` — Step 4
- `src/persistence/store.test.ts` — Step 6
- `src/core/queue.test.ts` — Step 8
- `src/cli/cli.test.ts` — Step 10 (command-level integration against a temp file)
- `vitest.config.ts` — Step 2

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run",
  "scope": "express",
  "test_strategy": "minimal",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "minimal",
    "strategy_volume": [
      "One verifiable test per requirement at the narrowest effective level.",
      "At least one happy-path unit test per component.",
      "Unit tests are the default; a bugfix/security scope floor may require an integration or E2E regression when that is the narrowest level that reproduces the defect."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:6cb23162168334768ff8f29699669845616670119c9eb58bf9bb05af6fefd3de",
  "contract_sha256": "sha256:87961b10de39c82b940231619501569dab05fb4d0ab228bedefaade334d20743"
}
```
