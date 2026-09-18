# Dashboards — Reading Queue CLI

## Applicability

No dashboards are configured. A local single-user CLI has no running process,
metrics emitter, or CloudWatch namespace to build a dashboard on. Standard
service dashboards (golden signals, dependency health) do not apply.

## Local operational view

The equivalent of a "dashboard" for this tool is the user directly inspecting
state on demand:

- `reading-queue list` — the current queue and item statuses.
- `reading-queue list --status reading` — what is in progress.
- The data file itself (`~/.reading-queue/queue.json`, or `READING_QUEUE_FILE`)
  is human-readable JSON and can be opened directly.

If this ever becomes a hosted or multi-user service, add a service dashboard
here per the four golden signals (latency, traffic, errors, saturation).
