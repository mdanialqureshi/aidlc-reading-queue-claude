# Reading Queue CLI

## Problem

People save articles and books in scattered notes and browser tabs. They need a
small local tool that records what they want to read and helps them choose the
next item without requiring an account or cloud service.

## Product

Build a command-line application named `reading-queue` using TypeScript. It
stores its data in a human-readable JSON file on the local machine.

## Required Commands

```text
reading-queue add <title> --url <url> [--tag <tag>...]
reading-queue list [--status unread|reading|done] [--tag <tag>]
reading-queue start <id>
reading-queue complete <id>
reading-queue remove <id>
reading-queue next [--tag <tag>]
```

## Required Behavior

- Assign each item a stable unique ID.
- Store title, URL, tags, status, creation time, and last-updated time.
- Default new items to `unread`.
- Sort list output by creation time, newest first.
- Have `next` return the oldest unread item matching the optional tag.
- Reject malformed URLs and missing titles with actionable error messages.
- Return a non-zero exit code for invalid commands or missing item IDs.
- Write JSON updates atomically so an interrupted write does not corrupt data.
- Keep all data local.

## Technical Constraints

- Use a currently supported Node.js LTS release.
- Use TypeScript with strict type checking.
- Prefer a small dependency footprint.
- Separate command parsing, domain logic, and persistence.
- Include unit and command-level integration tests.
- Provide `npm` scripts for build, test, lint, and type checking.
- Document installation and usage in the repository README.

## Success Criteria

- Every required command works against a temporary data file in automated
  tests.
- Tests verify status transitions, filtering, `next`, invalid input, missing
  IDs, and atomic persistence.
- Tests, linting, type checking, and the production build pass.

## Out of Scope

- A graphical interface.
- Multi-user synchronization.
- Authentication or cloud infrastructure.
- Browser extensions or third-party bookmark imports.

