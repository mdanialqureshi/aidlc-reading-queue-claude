# Log Queries — Reading Queue CLI

## Applicability

No log aggregation is configured (no CloudWatch Logs, no log shipping). The CLI
is synchronous and local; it does not run as a daemon and produces no persistent
log stream to query.

## Local diagnosis

Diagnostic output goes to the terminal at invocation time:

- **stdout** — command results (`Added item N`, the `list`/`next` output).
- **stderr** — actionable error messages with a non-zero exit code (FR7.3).
- **Data file** — `~/.reading-queue/queue.json` (or `READING_QUEUE_FILE`) is
  human-readable JSON; inspect it directly to diagnose data-shape issues.

To capture a session for a bug report:

```
reading-queue <cmd> > out.log 2> err.log; echo "exit=$?"
```

## If this becomes a service

Adopt structured JSON logging with correlation IDs and route to a log store,
then add saved queries here (error rate over time, slowest requests) per
`observability-patterns.md`.
