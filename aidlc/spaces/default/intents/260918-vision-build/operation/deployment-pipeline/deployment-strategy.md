# Deployment Strategy — Reading Queue CLI

## Chosen strategy: recreate (replace the global install)

For a single-user local binary there is no traffic to shift, so the standard
service strategies do not apply:

| Strategy | Applies? | Why |
| --- | --- | --- |
| Blue/Green | No | No two environments; one machine, one install. |
| Canary | No | No traffic to split; single user. |
| Rolling | No | No fleet of instances. |
| Recreate | **Yes** | `npm install -g .` replaces the prior global binary in place. |

The "recreate" step is atomic enough for a CLI: npm replaces the linked binary,
and the next invocation runs the new version.

## Promotion and approval

There are no dev → staging → prod tiers. The single gate is the release gate in
`cd-config.md` (all checks green) followed by the operator's own decision to run
`npm install -g .`. No separate production approval workflow is needed for a
personal local tool.

## Feature flags

Not used. Trunk-based development with feature flags is unnecessary at this size;
incomplete work simply is not released. If the tool later grows a risky feature,
a simple environment-variable flag would be the lightest option — no AppConfig or
Evidently infrastructure is warranted for a local CLI.

## Health check

Post-install health is the smoke test in `cd-config.md`: exercising
`add`/`next`/`list` against a temporary `READING_QUEUE_FILE`. A non-zero exit or
missing output is the abort signal that triggers `rollback-runbook.md`.

## Data compatibility

The data file (`~/.reading-queue/queue.json`) is independent of the binary and
uses a stable, additive JSON shape. A new install reads a file written by an
older one, and vice versa, so an install or rollback never migrates or risks
user data.
