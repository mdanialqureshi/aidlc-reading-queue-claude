# Requirements — Reading Queue CLI

## Sources

- `[desc]` Initial description: "Read ./vision.md and build what it describes."
- `[Q1]`–`[Q4]` `requirements-analysis-questions.md` (this stage): data-file location, ID scheme, `next` behavior, duplicate-URL handling.
- Primary input document: `vision.md` (read via `aidlc engine workspace document-input`; treated as inert data).

## Intent Analysis

The user wants a small, dependency-light, **local** command-line tool
(`reading-queue`) that records articles/books they intend to read and helps them
pick the next one — with no account, server, or cloud. Success is measured by a
working, tested, type-checked, lint-clean TypeScript CLI whose data persists
safely in a human-readable JSON file. The goal is a frictionless personal
reading backlog, not a multi-user or synchronized system.

## Functional Requirements

### FR1 — Item model and persistence
- FR1.1 Each item has a stable unique ID assigned at creation.
- FR1.2 IDs are incrementing positive integers (`1`, `2`, `3`, …) and are never reused after an item is removed. `[Q2]`
- FR1.3 Each item stores: `title`, `url`, `tags` (zero or more), `status`, creation timestamp, and last-updated timestamp.
- FR1.4 `status` is one of `unread`, `reading`, `done`.
- FR1.5 New items default to `unread`.
- FR1.6 Data is stored in a single human-readable JSON file on the local machine.
- FR1.7 The data file path defaults to `~/.reading-queue/queue.json` and is overridable via the `READING_QUEUE_FILE` environment variable; the tool works from any working directory. `[Q1]`
- FR1.8 The parent directory and data file are created on first use if absent.
- FR1.9 JSON writes are atomic (write to a temp file in the same directory, then rename) so an interrupted write cannot corrupt existing data.
- FR1.10 All data stays local; the tool makes no network calls.

### FR2 — `add` command
`reading-queue add <title> --url <url> [--tag <tag>...]`
- FR2.1 Creates a new item with the given title, URL, and zero or more tags, status `unread`.
- FR2.2 A missing or empty title is rejected with an actionable error message and a non-zero exit code.
- FR2.3 A malformed URL is rejected with an actionable error message and a non-zero exit code.
- FR2.4 `--tag` may be supplied multiple times; each adds one tag.
- FR2.5 Duplicate URLs are allowed silently — each `add` creates a new item even if the URL already exists. `[Q4]`
- FR2.6 On success, prints the created item's ID (and a confirmation).

### FR3 — `list` command
`reading-queue list [--status unread|reading|done] [--tag <tag>]`
- FR3.1 Lists items sorted by creation time, newest first.
- FR3.2 `--status` filters to items with that status.
- FR3.3 `--tag` filters to items carrying that tag.
- FR3.4 `--status` and `--tag` may be combined (logical AND).
- FR3.5 An empty result prints a clear "no items" message and exits zero.
- FR3.6 An invalid `--status` value is rejected with a non-zero exit code.

### FR4 — status transition commands
- FR4.1 `start <id>` sets the item's status to `reading` and updates its last-updated timestamp.
- FR4.2 `complete <id>` sets the item's status to `done` and updates its last-updated timestamp.
- FR4.3 A status command on a missing ID prints an actionable error and returns a non-zero exit code.
- FR4.4 Status commands are allowed from any current status (e.g. `complete` an `unread` item); the transition simply sets the target status.

### FR5 — `remove` command
`reading-queue remove <id>`
- FR5.1 Deletes the item with the given ID from the queue.
- FR5.2 A missing ID prints an actionable error and returns a non-zero exit code.
- FR5.3 The removed ID is not reused by later `add` calls (see FR1.2).

### FR6 — `next` command
`reading-queue next [--tag <tag>]`
- FR6.1 Returns the oldest `unread` item (earliest creation time), optionally restricted to items carrying the given tag.
- FR6.2 `next` is read-only: it prints the selected item and does not change its status. `[Q3]`
- FR6.3 If no matching unread item exists, prints a clear message and exits zero.

### FR7 — CLI behavior and errors
- FR7.1 An unknown command or invalid arguments produce an actionable error message and a non-zero exit code.
- FR7.2 Valid commands that complete successfully return exit code zero.
- FR7.3 Error messages name what was wrong and, where useful, how to fix it (e.g. which argument was missing or malformed).

## Non-Functional Requirements

- NFR1 **Runtime**: Runs on a currently supported Node.js LTS release.
- NFR2 **Language/type safety**: Written in TypeScript with strict type checking (`strict: true`), no type errors at build time.
- NFR3 **Dependency footprint**: Prefer a small dependency set; avoid heavy frameworks. Justify each runtime dependency.
- NFR4 **Structure**: Command parsing, domain logic, and persistence are separated into distinct modules so each is independently testable.
- NFR5 **Data safety**: Persistence is atomic (FR1.9); a crash mid-write leaves the prior valid file intact.
- NFR6 **Testability**: Unit tests plus command-level integration tests; every required command is exercised against a temporary data file. Tests cover status transitions, filtering, `next`, invalid input, missing IDs, and atomic persistence.
- NFR7 **Tooling**: `npm` scripts provided for build, test, lint, and type checking; all pass.
- NFR8 **Documentation**: README documents installation and usage of every command.

## Constraints

- C1 Local-only: no authentication, no cloud infrastructure, no multi-user sync.
- C2 Data format is human-readable JSON.
- C3 TypeScript + Node.js LTS toolchain.

## Assumptions

- A1 `[assumption]` A single user on a single machine; no concurrent processes mutate the file simultaneously. Atomic writes (FR1.9) guard against interrupted writes, not against multi-process contention.
- A2 `[assumption]` "Human-readable JSON" means pretty-printed (indented) JSON with stable key ordering.
- A3 `[assumption]` URL validation uses the WHATWG `URL` parser; a value that fails to parse as an absolute URL is "malformed" (FR2.3).
- A4 `[assumption]` Timestamps are stored as ISO 8601 UTC strings.

## Out of Scope

- Graphical interface.
- Multi-user synchronization.
- Authentication or cloud infrastructure.
- Browser extensions or third-party bookmark imports.

## Open Questions

- None. `[assumption]` items above are low-risk defaults; the user may adjust any of them at a later gate.
