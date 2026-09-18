# SLO / SLI Configuration — Reading Queue CLI

## Applicability

No SLOs or error budgets are defined. SLOs are the reliability contract for a
service with users hitting it over time; a local single-user CLI has no uptime,
availability, or latency SLO to track and no window over which to measure one.

## Correctness stand-in

The nearest meaningful "objective" for this tool is functional correctness,
which is enforced at build time rather than observed in production:

- **Correctness**: the 53-test suite must pass (Build and Test) before any
  install — every FR has an asserting test.
- **Data safety**: atomic writes (FR1.9) guarantee the prior valid data file
  survives an interrupted write; verified by `persistence/store.test.ts`.

These are verified pre-release gates, not runtime SLIs, which is appropriate for
software with no live service surface.

## If this becomes a service

Define availability/latency SLIs measured at the entry point, set SLO targets
below the observed baseline, and add error-budget burn-rate alerting per
`slo-sli-patterns.md`.
