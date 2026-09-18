# Observability Setup — Questions

## Context

`reading-queue` is a local, single-user CLI (no server, no cloud, no network —
requirements C1/FR1.10). There is no running service, so the standard
observability decisions (golden signals, SLOs, dashboard layouts, log retention,
distributed tracing) have no live surface to attach to.

## Clarifying questions

None required. The observable surface is fully derivable from the approved
requirements and the deployment evidence: a CLI's operational signals are its
**exit codes** (0 success / 1 user error / 2 fatal — FR7) and its **stderr
messages** (actionable errors — FR7.3), plus the integrity of the local JSON
data file. No SLO, retention, or escalation decision needs human input for a
personal local tool.

[Answer]: N/A — no clarifying questions required for a local single-user CLI.
