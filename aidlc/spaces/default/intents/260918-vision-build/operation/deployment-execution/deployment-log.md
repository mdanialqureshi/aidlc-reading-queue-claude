# Deployment Log — Reading Queue CLI

## Mode

Verify-only (per Q1). The build was verified and the CLI was smoke-tested by
invoking the built binary directly; **no global install was performed** and the
machine's global npm environment was not modified.

## Steps executed

| Step | Command | Result |
| --- | --- | --- |
| Build | `npm run build` | Success (exit 0), `dist/` current |
| Smoke test | `node dist/bin/reading-queue.js <cmd>` against a temp `READING_QUEUE_FILE` | All pass — see `smoke-test-results.md` |

The real user data file (`~/.reading-queue/queue.json`) was never touched; the
smoke test used a `mktemp` data file that was removed afterward.

## Install command left for the operator

To install the CLI globally when ready (this is the "local install" release):

```
npm ci
npm run build
npm install -g .        # or `npm link` for a live-linked dev install
```

Then verify: `reading-queue add "..." --url https://... && reading-queue list`.

Rollback, if needed, is in `../deployment-pipeline/rollback-runbook.md`.

## Notes

- No database migrations (the tool has no database; it uses a local JSON file).
- No dependent services (local-only, no network).
