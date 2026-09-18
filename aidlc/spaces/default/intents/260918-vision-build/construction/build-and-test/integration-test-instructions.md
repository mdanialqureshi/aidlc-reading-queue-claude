# Integration Test Instructions — Reading Queue CLI

## Applicability under the active strategy

The active Test Strategy is **Minimal** (`express` scope). Under Minimal, no
separate integration suite is generated: unit tests are the requirement-driven
floor and are owned per-unit by Code Generation.

## Coverage already provided

For this single-unit, zero-dependency local CLI the command-level tests in
`src/cli/cli.test.ts` (20 tests) already exercise the full stack end-to-end —
CLI argument parsing → core operations → persistence to a temporary
`READING_QUEUE_FILE` — which is the only integration boundary in the system.
There are no service-to-service, database, or network boundaries to cover, so a
dedicated integration suite would duplicate the CLI tests without adding signal.

## If the scope changes

Should this graduate to Standard/Comprehensive, add cross-boundary tests here
(e.g. concurrent-process file contention, large-file behavior) and wire an
`integration` Vitest project scoped to those files.
