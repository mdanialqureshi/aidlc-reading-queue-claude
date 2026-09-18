# Security Test Instructions — Reading Queue CLI

## Applicability under the active strategy

The active Test Strategy is **Minimal** (`express` scope) with no NFR security
targets. No SAST/DAST suite is generated. This section records the security
review the security engineer performed inline and the checks that already run.

## Threat surface (STRIDE, scoped to a local CLI)

- No network, server, authentication, or authorization — Spoofing, Elevation of
  Privilege, and DoS have no remote surface. All data stays on the local machine
  (FR1.10).
- **Tampering / data integrity**: atomic write (temp file + rename, FR1.9) means
  an interrupted write cannot corrupt the existing file; covered by
  `src/persistence/store.test.ts`.
- **Injection**: input is parsed as CLI args and validated at the core boundary;
  URLs go through the WHATWG `URL` parser (A3). No shell, SQL, or `eval` paths.
- **Information disclosure**: no secrets, credentials, or PII are handled or
  logged; the data file holds only user-entered titles/URLs/tags.

## Checks that run every build

- `npm run lint` (ESLint) — no findings.
- `npm run typecheck` (strict) — no unsafe `any` escapes at boundaries.
- Zero runtime dependencies (NFR3) means no third-party CVE surface; dev
  dependencies are not shipped.

## If the scope changes

Add dependency scanning (`npm audit` / Snyk) as a gate and input-fuzzing tests
here if runtime dependencies or a network surface are ever introduced.
