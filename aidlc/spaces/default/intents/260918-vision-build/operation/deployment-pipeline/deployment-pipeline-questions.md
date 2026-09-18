# Deployment Pipeline — Questions

## Q1 — Release / distribution approach

`reading-queue` is a local-only, single-user CLI (no server, no cloud). The
"deployment" is npm package distribution. Which release approach do you want?

- A. Local install only — build then `npm install -g .` (or `npm link`); no registry publish. Rollback = reinstall the prior build/commit. (Recommended for a personal tool)
- B. Publish to the public npm registry — `npm publish` with semver tags; rollback = `npm install reading-queue@<prev>`.
- C. Git-based install — users install via `npm install <git-url>#<tag>`; releases are git tags.
- D. Internal registry (e.g. CodeArtifact) publish.
- X. Other (please specify)

[Answer]: A. Local install only

## Consolidated Summary Confirmation

Based on your answer, I'll write three artifacts describing a **local-install
release** for the `reading-queue` CLI:

- **cd-config.md** — the release procedure: `npm ci` → `npm run build` →
  full verification (typecheck/lint/format/tests) → `npm install -g .` (or
  `npm link` for a live-linked dev install). No registry publish, no cloud
  target. Gate: all checks green before install.
- **deployment-strategy.md** — strategy is "recreate/replace the global install"
  (blue/green, canary, rolling are N/A for a single-user local binary);
  versioning by git tag + `package.json` semver; the health check is a
  post-install smoke test (`reading-queue add`/`next`/`list` against a temp
  `READING_QUEUE_FILE`).
- **rollback-runbook.md** — rollback = check out the prior tag/commit, rebuild,
  and reinstall; or `npm uninstall -g reading-queue`. Data safety: the JSON data
  file is independent of the binary, so a rollback never touches user data.

Does this all look correct before I generate the artifacts?

- Looks correct
- Request changes

[Answer]: Looks correct
