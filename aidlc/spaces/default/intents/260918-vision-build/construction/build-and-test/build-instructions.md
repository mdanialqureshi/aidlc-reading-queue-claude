# Build Instructions — Reading Queue CLI

## Prerequisites

- Node.js LTS (>= 18), `npm` on PATH.
- No external services, network, or cloud resources — the tool is local-only.

## Dependency installation

```
npm install
```

Dev dependencies only (TypeScript, Vitest, ESLint, Prettier); the package has
zero runtime dependencies. If the default registry's auth is expired (e.g. a
CodeArtifact token), install from the public registry:

```
npm install --registry https://registry.npmjs.org/
```

## Build commands

```
npm run build       # tsc -p tsconfig.build.json → dist/ (excludes *.test.ts)
npm run typecheck   # tsc -p tsconfig.json --noEmit (strict)
npm run lint        # eslint .
npm run format:check
```

## Build verification

A clean build produces `dist/` with the compiled CLI and no emitted test files.
`npx reading-queue --help` (or `node dist/bin/reading-queue.js`) should run from
any working directory.

## Troubleshooting

- **Type errors under strict mode**: run `npm run typecheck` for the full list;
  the build config (`tsconfig.build.json`) extends the base and only differs by
  excluding tests and emitting to `dist/`.
- **Registry auth failures**: use the public-registry install command above; no
  `.npmrc` or global config change is required.
