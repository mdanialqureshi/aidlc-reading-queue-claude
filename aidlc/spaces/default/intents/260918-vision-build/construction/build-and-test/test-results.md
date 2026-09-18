# Test Results — Reading Queue CLI

## Build status

| Command | Result |
| --- | --- |
| `npm run build` (`tsc -p tsconfig.build.json`) | Success (exit 0) |
| `npm run typecheck` (`tsc --noEmit`, strict) | Success (exit 0) |
| `npm run lint` (`eslint .`) | Success (exit 0), no findings |
| `npm run format:check` (Prettier) | Success — all files match style |

## Test execution

Command run once (single-unit project, unit-scoped whole suite):

```
npx vitest run
```

| Metric | Value |
| --- | --- |
| Test files | 4 passed / 4 |
| Tests | 53 passed / 53 |
| Failed | 0 |
| Skipped | 0 |
| Duration | ~0.42s |

Per file: `domain/item.test.ts` 6, `persistence/store.test.ts` 9,
`core/queue.test.ts` 18, `cli/cli.test.ts` 20.

## Failure details

None — all commands and tests passed.

## Coverage

Minimal strategy: no numeric line-coverage floor at `express` scope. Coverage is
requirement-driven — every FR (FR1–FR7) has at least one asserting test, and
each component (domain, persistence, core, cli) has happy-path plus error/edge
tests. Verified against `traceability.json` in Step 10.

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| NFR2 | requirements.md NFR2 | Strict TS, no type errors | 0 type errors | `npm run typecheck` exit 0 | build-and-test | Met |
| NFR6 | requirements.md NFR6 | Unit + command-level integration tests, all required commands exercised | 53 tests pass, all 6 commands covered | `npx vitest run` | build-and-test | Met |
| NFR7 | requirements.md NFR7 | build/test/lint/typecheck scripts all pass | all pass | build/typecheck/lint/format all exit 0 | build-and-test | Met |
| REQ-COVERAGE | unit-test-instructions.md | Every FR has ≥1 asserting test | FR1–FR7 covered | `cross-unit-traceability.md` | build-and-test | Met |

No `Pending` verdicts remain. NFR1/NFR3/NFR4/NFR5/NFR8 are design/structure
targets verified at Code Generation (`traceability.json`), not re-executed here.
