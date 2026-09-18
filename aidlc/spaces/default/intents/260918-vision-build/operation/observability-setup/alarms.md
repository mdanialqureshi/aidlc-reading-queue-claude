# Alarms — Reading Queue CLI

## Applicability

No alarms are configured. There is no always-on process to alarm on and no
metric stream (no CloudWatch, no SNS). Alerting infrastructure would have
nothing to observe for a single-user local CLI.

## Failure signals for the user

The tool surfaces failure synchronously and locally, which is the right model
for a CLI:

| Signal | Meaning | User action |
| --- | --- | --- |
| Exit code `0` | Success | — |
| Exit code `1` | User/input error (bad args, missing ID, malformed URL) | Read the stderr message; correct the input |
| Exit code `2` | Fatal (data file unreadable/unwritable) | Check the data file / `READING_QUEUE_FILE`; see rollback runbook |
| stderr message | Names what was wrong and how to fix it (FR7.3) | Follow the message |

## If this becomes a service

Add symptom-based alarms here (error rate, latency p99) with severity tiers and
notification routing, per `observability-patterns.md`.
