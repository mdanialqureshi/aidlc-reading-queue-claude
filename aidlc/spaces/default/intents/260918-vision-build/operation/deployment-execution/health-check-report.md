# Health Check Report — Reading Queue CLI

## Health definition

For a local CLI, "healthy" means: the binary runs from any working directory,
the six commands behave per spec, exit codes are correct, and the data file is
read/written safely. There is no running service, endpoint, or uptime SLO to
monitor.

## Checks performed (verify-only)

| Check | Method | Result |
| --- | --- | --- |
| Binary starts and dispatches | `node dist/bin/reading-queue.js <cmd>` | Healthy |
| Happy-path commands | add / next / list against temp file | Healthy (exit 0) |
| Error handling | unknown command, missing title | Healthy (exit 1, actionable messages) |
| Data persistence | inspected temp JSON after writes | Healthy (well-formed, correct shape) |
| Data isolation | used `READING_QUEUE_FILE` override | Healthy (real data untouched) |

## Readiness assessment

- **Build-ready**: Yes.
- **Install-ready**: Yes — `npm install -g .` will place the `reading-queue`
  binary; the operator runs it when ready (documented in `deployment-log.md`).
- **Operational**: N/A for a local tool — no service to keep running, no
  alerting surface. Observability Setup will document the (minimal) operational
  posture.

## Abort / rollback trigger

If a post-install invocation fails the same smoke scenarios above, follow
`../deployment-pipeline/rollback-runbook.md` (reinstall the prior tag). No
automated rollback applies to a single-user local binary.
