# Tracing Configuration — Reading Queue CLI

## Applicability

No distributed tracing is configured. Distributed tracing (X-Ray, W3C Trace
Context) exists to follow a request across service boundaries; this tool is a
single short-lived process with no network calls and no downstream services, so
there is no trace to propagate.

## Single-process execution path

A single command's path is entirely in-process and synchronous:

```
bin/reading-queue.ts → cli/index.ts (parse + validate)
  → core/queue.ts (operation)
  → persistence/store.ts (load/atomic save)
```

Any failure surfaces immediately as a non-zero exit code and a stderr message —
no cross-service correlation is needed to locate it.

## If this becomes a service

Enable tracing at the entry point, instrument custom subsegments for the core
and persistence layers, and propagate trace context to any downstream calls, per
`observability-patterns.md`.
