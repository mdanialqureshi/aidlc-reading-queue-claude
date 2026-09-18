# CD Configuration — Reading Queue CLI (local install)

## Scope

`reading-queue` is a local, single-user CLI with no server or cloud target
(requirements C1). "Deployment" means building the package and installing its
`bin` on the local machine. There is no registry publish, no environment tiers,
and no running service to shift traffic between.

## Release procedure

Run from the repo root on a clean checkout of the release commit/tag:

```
npm ci                 # reproducible dependency install from package-lock.json
npm run build          # tsc -p tsconfig.build.json → dist/
npm run typecheck      # strict, must be 0 errors
npm run lint           # must be clean
npm run format:check   # must be clean
npx vitest run         # all tests must pass
npm install -g .       # install the reading-queue bin globally
```

For a live-linked development install, substitute `npm link` for the final step.

## Release gate

Every command above must exit 0 before `npm install -g .` runs. A failing
build, typecheck, lint, format, or test check blocks the install — the gate is
the same green bar Build and Test enforces. Weakening a check to force an install
is not permitted.

## Post-install smoke test

Verify the installed binary works from an arbitrary directory against a
throwaway data file (never the real `~/.reading-queue/queue.json`):

```
export READING_QUEUE_FILE="$(mktemp -d)/queue.json"
reading-queue add "Smoke test" --url https://example.com
reading-queue next
reading-queue list
unset READING_QUEUE_FILE
```

Expected: `add`/`next`/`list` exit 0; an unknown command exits non-zero. If the
smoke test fails, follow `rollback-runbook.md`.

## Versioning

Version is the `package.json` `version` field plus a matching git tag
(`vMAJOR.MINOR.PATCH`, semver). Tag the release commit before installing so the
exact source is recoverable for rollback.
