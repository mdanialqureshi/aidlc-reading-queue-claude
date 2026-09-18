# Anomaly Detection Configuration — Reading Queue CLI

## Applicability

No anomaly detection is configured. Anomaly detection establishes an ML baseline
over a metric time series and alerts on deviation; a local single-user CLI emits
no continuous metric stream, so there is no baseline to learn or drift to detect.

## Why none is needed

The tool's behavior is deterministic and synchronous: the same input produces the
same output and exit code, verified by the test suite. There is no traffic
pattern, latency distribution, or error rate that varies over time and could
"drift".

## If this becomes a service

Enable CloudWatch Anomaly Detection on latency and error-rate metrics once a
stable pattern exists, pairing it with static thresholds (anomaly detection for
gradual drift, static thresholds for acute failures), per
`observability-patterns.md`.
