# reading-queue

A local, dependency-light command-line tool for keeping a personal reading
backlog. It records articles and books you intend to read and helps you pick the
next one. There is no account, server, or cloud — everything is stored in a
single human-readable JSON file on your machine.

## Requirements

- Node.js 18 or newer (a currently supported LTS release).

## Install

Clone the repository and build it, then link the CLI globally:

```bash
npm install
npm run build
npm link          # exposes the `reading-queue` command on your PATH
```

You can also run the built entry point directly without linking:

```bash
node dist/bin/reading-queue.js <command> [options]
```

## Data file

Items are stored as pretty-printed JSON. By default the file lives at
`~/.reading-queue/queue.json`; its parent directory and the file itself are
created on first use. Set the `READING_QUEUE_FILE` environment variable to use a
different location:

```bash
export READING_QUEUE_FILE=/path/to/my-queue.json
```

The tool works from any working directory. Writes are atomic (write to a temp
file, then rename), so an interrupted write cannot corrupt existing data.

## Commands

### `add` — add an item

```bash
reading-queue add <title> --url <url> [--tag <tag>]...
```

- Creates a new item with status `unread`.
- `--url` is required and must be a valid absolute URL (e.g. `https://…`).
- `--tag` may be repeated to attach several tags.
- Duplicate URLs are allowed; each `add` creates a new item.
- Prints the new item's ID on success.

```bash
reading-queue add "Deep Work" --url https://example.com/deep-work --tag focus --tag productivity
```

### `list` — list items

```bash
reading-queue list [--status unread|reading|done] [--tag <tag>]
```

- Lists items sorted by creation time, newest first.
- `--status` filters by status; `--tag` filters by tag; combining them is a
  logical AND.
- Prints a clear message and exits 0 when nothing matches.

### `start` / `complete` — change status

```bash
reading-queue start <id>      # sets status to "reading"
reading-queue complete <id>   # sets status to "done"
```

Both update the item's last-updated timestamp and may be run from any current
status.

### `remove` — delete an item

```bash
reading-queue remove <id>
```

Removed IDs are never reused by later `add` calls.

### `next` — pick what to read next

```bash
reading-queue next [--tag <tag>]
```

Prints the oldest `unread` item, optionally restricted to a tag. This command is
read-only: it does not change the item's status. Prints a clear message and
exits 0 when nothing matches.

## Exit codes

- `0` — the command completed successfully.
- `1` — invalid input (missing/empty title, malformed URL, unknown command,
  unknown or non-numeric ID, invalid option or status).
- `2` — a fatal error such as an unreadable or corrupt data file.

## Development

```bash
npm run build       # compile TypeScript to dist/
npm run typecheck   # type-check without emitting
npm run lint        # ESLint
npm test            # run the Vitest suite
npm run format      # apply Prettier formatting
```

The code is organized into independently testable layers under `src/`:

- `domain/` — the item model, status type, and item factory.
- `persistence/` — data-file path resolution and atomic JSON load/save.
- `core/` — queue business logic (add, list, start, complete, remove, next).
- `cli/` — argument parsing, command dispatch, and exit-code mapping.
- `bin/` — the executable entry point.
