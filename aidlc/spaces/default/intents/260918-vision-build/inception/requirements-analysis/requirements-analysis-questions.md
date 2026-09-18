# Requirements Analysis — Clarifying Questions

The vision at `vision.md` is very complete. These questions cover the few
build decisions it leaves open. Options are lettered; answer with the letter,
or use `X` to say something else.

---

## Q1. Where should the data file live?

The vision says data is stored in a human-readable JSON file on the local
machine, but not where. This affects whether the tool is usable from any
directory.

- A. A fixed path in the user's home dir (e.g. `~/.reading-queue/queue.json`), overridable via an env var like `READING_QUEUE_FILE`
- B. A file in the current working directory (e.g. `./reading-queue.json`)
- C. Home-dir path only, no override
- D. Configurable only via a `--file` flag on each command
- X. Other (please specify)

[Answer]: A

---

## Q2. What ID scheme should each item get?

The vision requires a "stable unique ID" but not its form. This is what the
user types for `start`, `complete`, and `remove`.

- A. Short human-friendly IDs (e.g. incrementing integers `1`, `2`, `3`), never reused after removal
- B. Short random slugs (e.g. `k3f9`), collision-checked
- C. Full UUIDs
- X. Other (please specify)

[Answer]: A

---

## Q3. When `next` picks an item, should it also change that item's status?

The vision says `next` returns the oldest unread item matching the optional
tag. It does not say whether `next` is read-only or also starts the item.

- A. Read-only — just print the item; the user runs `start <id>` separately
- B. Print the item and automatically move it to `reading`
- X. Other (please specify)

[Answer]: A

---

## Q4. How should duplicate URLs be handled on `add`?

Not addressed in the vision. Two people saving the same link twice is common.

- A. Allow duplicates silently (each `add` is a new item)
- B. Warn but still add
- C. Reject a URL that already exists in the queue with a non-zero exit
- X. Other (please specify)

[Answer]: A

---

## Consolidated Summary Confirmation

Summary of decisions to fold into requirements:

- Data file lives at a fixed home-dir path (`~/.reading-queue/queue.json`), overridable via `READING_QUEUE_FILE`; usable from any directory.
- Item IDs are incrementing integers (1, 2, 3, …), never reused after removal.
- `next` is read-only — it prints the oldest matching unread item without changing its status.
- Duplicate URLs are allowed silently; each `add` creates a new item.
- Everything else follows `vision.md` verbatim: the six commands, the stored fields, unread default, newest-first `list`, atomic JSON writes, error/exit-code behavior, TypeScript + strict types, small dependency footprint, layered structure, unit + integration tests, npm scripts, README.

Does this all look correct before I generate the requirements artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
