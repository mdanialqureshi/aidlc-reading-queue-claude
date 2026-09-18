# Smoke Test Results — Reading Queue CLI

## Environment

- Invocation: `node dist/bin/reading-queue.js <cmd>` (built binary, no global install)
- Data file: a throwaway `READING_QUEUE_FILE` under `mktemp -d`, removed after the run
- Real user data (`~/.reading-queue/queue.json`) untouched

## Results

| # | Command | Expected | Actual | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `add "Smoke test article" --url https://example.com/read --tag tech` | exit 0, item created with ID | `Added item 1`, exit 0 | Pass |
| 2 | `add "Second item" --url https://example.com/two` | exit 0, next ID | `Added item 2`, exit 0 | Pass |
| 3 | `next` | oldest unread, read-only, exit 0 | `#1 [unread] Smoke test article …`, exit 0 | Pass |
| 4 | `list` | newest-first, exit 0 | `#2` then `#1`, exit 0 | Pass |
| 5 | `frobnicate` (unknown command) | actionable error, non-zero exit | `Error: Unknown command "frobnicate"…`, exit 1 | Pass |
| 6 | `add --url https://example.com/x` (missing title) | actionable error, non-zero exit | `Error: A title is required…`, exit 1 | Pass |

## Data file verification

After the run the temp file was well-formed, pretty-printed JSON:
`version: 1`, `nextId: 3`, two items with correct `id`, `title`, `url`, `tags`,
`status: unread`, and ISO 8601 UTC `createdAt`/`updatedAt`. Ordering behavior
(`list` newest-first, `next` oldest-first, read-only) confirmed.

## Overall

All six smoke scenarios passed. The built CLI works end-to-end from an arbitrary
working directory against a relocatable data file.
