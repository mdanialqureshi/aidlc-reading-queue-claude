import { createItem, type Item, type Status } from '../domain/item.js';
import type { QueueData } from '../persistence/store.js';

/**
 * Raised for expected, user-facing failures (missing title, malformed URL,
 * unknown ID). The CLI maps these to an actionable message and a non-zero exit.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface AddInput {
  title: string;
  url: string;
  tags?: string[];
}

export interface ListFilter {
  status?: Status;
  tag?: string;
}

/**
 * Adds a new `unread` item and advances `nextId`. Mutates `data` in place and
 * returns the created item. Duplicate URLs are allowed silently (FR2.5).
 */
export function add(data: QueueData, input: AddInput, now: Date = new Date()): Item {
  const title = input.title.trim();
  if (title === '') {
    throw new ValidationError(
      'A title is required. Usage: reading-queue add <title> --url <url> [--tag <tag>].',
    );
  }

  const url = normalizeUrl(input.url);
  const tags = (input.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag !== '');

  const item = createItem({ id: data.nextId, title, url, tags }, now);
  data.items.push(item);
  data.nextId += 1;
  return item;
}

/** Returns items matching the filters, sorted newest-first by creation time (FR3.1). */
export function list(data: QueueData, filter: ListFilter = {}): Item[] {
  let items = data.items;

  if (filter.status !== undefined) {
    const status = filter.status;
    items = items.filter((item) => item.status === status);
  }
  if (filter.tag !== undefined) {
    const tag = filter.tag;
    items = items.filter((item) => item.tags.includes(tag));
  }

  return [...items].sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? 1 : -1;
    }
    // Stable, deterministic tiebreak for items created in the same instant.
    return b.id - a.id;
  });
}

/** Sets the item to `reading` and updates its timestamp (FR4.1). */
export function start(data: QueueData, id: number, now: Date = new Date()): Item {
  return transition(data, id, 'reading', now);
}

/** Sets the item to `done` and updates its timestamp (FR4.2). */
export function complete(data: QueueData, id: number, now: Date = new Date()): Item {
  return transition(data, id, 'done', now);
}

/** Removes the item with the given ID (FR5.1). `nextId` is untouched, so the ID is never reused. */
export function remove(data: QueueData, id: number): Item {
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw unknownIdError(id);
  }
  const [removed] = data.items.splice(index, 1);
  return removed;
}

/**
 * Returns the oldest `unread` item (earliest creation time), optionally
 * restricted to a tag. Read-only: never mutates status (FR6.2). Returns
 * `undefined` when nothing matches.
 */
export function next(data: QueueData, filter: { tag?: string } = {}): Item | undefined {
  const candidates = data.items.filter((item) => {
    if (item.status !== 'unread') {
      return false;
    }
    if (filter.tag !== undefined && !item.tags.includes(filter.tag)) {
      return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    return undefined;
  }

  return [...candidates].sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? -1 : 1;
    }
    return a.id - b.id;
  })[0];
}

function transition(data: QueueData, id: number, status: Status, now: Date): Item {
  const item = data.items.find((candidate) => candidate.id === id);
  if (item === undefined) {
    throw unknownIdError(id);
  }
  item.status = status;
  item.updatedAt = now.toISOString();
  return item;
}

function normalizeUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (value === '') {
    throw new ValidationError('A URL is required. Provide one with --url <url>.');
  }
  try {
    return new URL(value).toString();
  } catch {
    throw new ValidationError(
      `"${rawUrl}" is not a valid URL. Provide an absolute URL, e.g. https://example.com/article.`,
    );
  }
}

function unknownIdError(id: number): ValidationError {
  return new ValidationError(
    `No item with ID ${id}. Run "reading-queue list" to see the current items and their IDs.`,
  );
}
