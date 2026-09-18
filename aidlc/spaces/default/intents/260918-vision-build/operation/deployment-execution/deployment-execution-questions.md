# Deployment Execution — Questions

## Q1 — How far should deployment execution go?

The release approach is "local install". Executing it means running
`npm install -g .`, which modifies your machine's global npm environment. How
would you like to proceed?

- A. Do the global install now — run `npm install -g .`, then smoke-test the installed `reading-queue` binary against a temp data file. (Modifies your global environment.)
- B. Verify-only — build and smoke-test via `node dist/bin/reading-queue.js` (no global install); I document the exact install command for you to run yourself. (Recommended — no changes to your global environment.)
- X. Other (please specify)

[Answer]: B. Verify-only

## Consolidated Summary Confirmation

Based on your answer (verify-only), I'll:

1. Build the CLI (`npm run build`) and run a smoke test by invoking the built
   binary directly — `node dist/bin/reading-queue.js <cmd>` — against a
   throwaway `READING_QUEUE_FILE`, exercising `add`, `next`, `list`, and an
   error case. No global install; your environment is unchanged.
2. Write three artifacts: **deployment-log.md** (what ran, the documented
   `npm install -g .` command left for you), **smoke-test-results.md** (the
   actual commands and their output/exit codes), and **health-check-report.md**
   (verify-only readiness assessment).

Does this all look correct before I generate the artifacts?

- Looks correct
- Request changes

[Answer]: Looks correct
