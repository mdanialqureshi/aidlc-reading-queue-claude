# Performance Test Instructions — Reading Queue CLI

## Applicability under the active strategy

The active Test Strategy is **Minimal** (`express` scope), and the requirements
carry **no NFR performance targets** (no latency, throughput, or concurrency
thresholds — see `requirements.md` NFR1–NFR8). No performance suite is generated.

## Rationale

The tool is a synchronous, single-user, local CLI operating on one small JSON
file. There is no server, no concurrency requirement, and no measurable
performance SLO to validate. Interactive command latency is dominated by Node
process startup, which is outside the application's control.

## If the scope changes

If performance targets are later introduced (e.g. a target for large queues),
add benchmarks here — for example a soak/scale test that populates N thousand
items and asserts `list`/`next` stay within a stated bound — and record results
in the Target Verification Matrix.
