import { describe, expect, it } from 'vitest';
import { emptyQueue, type QueueData } from '../persistence/store.js';
import { add, complete, list, next, remove, start, ValidationError } from './queue.js';

function seed(): QueueData {
  return emptyQueue();
}

/** Adds an item at a controlled creation instant so ordering is deterministic. */
function addAt(data: QueueData, title: string, url: string, isoTime: string, tags?: string[]) {
  return add(data, { title, url, tags }, new Date(isoTime));
}

describe('add', () => {
  it('creates an unread item, assigns the next ID and advances nextId', () => {
    const data = seed();
    const item = add(data, { title: 'Deep Work', url: 'https://example.com/a', tags: ['focus'] });

    expect(item.id).toBe(1);
    expect(item.status).toBe('unread');
    expect(item.tags).toEqual(['focus']);
    expect(data.nextId).toBe(2);
    expect(data.items).toHaveLength(1);
  });

  it('rejects a missing or whitespace-only title', () => {
    const data = seed();
    expect(() => add(data, { title: '   ', url: 'https://example.com/a' })).toThrow(
      ValidationError,
    );
    expect(() => add(data, { title: '', url: 'https://example.com/a' })).toThrow(
      /title is required/i,
    );
    expect(data.items).toHaveLength(0);
  });

  it('rejects a malformed URL', () => {
    const data = seed();
    expect(() => add(data, { title: 'A', url: 'not-a-url' })).toThrow(ValidationError);
    expect(() => add(data, { title: 'A', url: 'not-a-url' })).toThrow(/not a valid URL/i);
    expect(data.items).toHaveLength(0);
  });

  it('allows duplicate URLs, creating a distinct item each time', () => {
    const data = seed();
    const first = add(data, { title: 'First', url: 'https://example.com/same' });
    const second = add(data, { title: 'Second', url: 'https://example.com/same' });

    expect(first.id).not.toBe(second.id);
    expect(data.items).toHaveLength(2);
  });

  it('trims tags and drops empty ones', () => {
    const data = seed();
    const item = add(data, { title: 'A', url: 'https://example.com/a', tags: ['  x ', '', 'y'] });
    expect(item.tags).toEqual(['x', 'y']);
  });
});

describe('list', () => {
  it('sorts by creation time, newest first', () => {
    const data = seed();
    addAt(data, 'oldest', 'https://example.com/1', '2026-01-01T00:00:00.000Z');
    addAt(data, 'middle', 'https://example.com/2', '2026-01-02T00:00:00.000Z');
    addAt(data, 'newest', 'https://example.com/3', '2026-01-03T00:00:00.000Z');

    expect(list(data).map((it) => it.title)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('filters by status', () => {
    const data = seed();
    addAt(data, 'a', 'https://example.com/1', '2026-01-01T00:00:00.000Z');
    const b = addAt(data, 'b', 'https://example.com/2', '2026-01-02T00:00:00.000Z');
    start(data, b.id);

    expect(list(data, { status: 'reading' }).map((it) => it.title)).toEqual(['b']);
    expect(list(data, { status: 'unread' }).map((it) => it.title)).toEqual(['a']);
  });

  it('filters by tag and combines status + tag with AND', () => {
    const data = seed();
    addAt(data, 'a', 'https://example.com/1', '2026-01-01T00:00:00.000Z', ['tech']);
    const b = addAt(data, 'b', 'https://example.com/2', '2026-01-02T00:00:00.000Z', ['tech']);
    addAt(data, 'c', 'https://example.com/3', '2026-01-03T00:00:00.000Z', ['life']);
    complete(data, b.id);

    expect(list(data, { tag: 'tech' }).map((it) => it.title)).toEqual(['b', 'a']);
    expect(list(data, { status: 'unread', tag: 'tech' }).map((it) => it.title)).toEqual(['a']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(list(seed())).toEqual([]);
  });
});

describe('start / complete', () => {
  it('start sets status to reading and bumps updatedAt', () => {
    const data = seed();
    const item = addAt(data, 'a', 'https://example.com/1', '2026-01-01T00:00:00.000Z');
    const updated = start(data, item.id, new Date('2026-02-01T00:00:00.000Z'));

    expect(updated.status).toBe('reading');
    expect(updated.updatedAt).toBe('2026-02-01T00:00:00.000Z');
    expect(updated.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('complete sets status to done from any prior status', () => {
    const data = seed();
    const item = add(data, { title: 'a', url: 'https://example.com/1' });
    expect(complete(data, item.id).status).toBe('done');
  });

  it('throws ValidationError for an unknown ID', () => {
    expect(() => start(seed(), 999)).toThrow(/No item with ID 999/);
    expect(() => complete(seed(), 999)).toThrow(ValidationError);
  });
});

describe('remove', () => {
  it('deletes the item and does not reuse its ID', () => {
    const data = seed();
    add(data, { title: 'a', url: 'https://example.com/1' });
    const b = add(data, { title: 'b', url: 'https://example.com/2' });
    remove(data, b.id);

    expect(data.items.map((it) => it.id)).toEqual([1]);
    const c = add(data, { title: 'c', url: 'https://example.com/3' });
    expect(c.id).toBe(3);
  });

  it('throws ValidationError for an unknown ID', () => {
    expect(() => remove(seed(), 5)).toThrow(ValidationError);
  });
});

describe('next', () => {
  it('returns the oldest unread item without changing its status', () => {
    const data = seed();
    const oldest = addAt(data, 'oldest', 'https://example.com/1', '2026-01-01T00:00:00.000Z');
    addAt(data, 'newer', 'https://example.com/2', '2026-01-02T00:00:00.000Z');

    const picked = next(data);
    expect(picked?.title).toBe('oldest');
    expect(data.items.find((it) => it.id === oldest.id)?.status).toBe('unread');
  });

  it('skips items that are not unread', () => {
    const data = seed();
    const first = addAt(data, 'first', 'https://example.com/1', '2026-01-01T00:00:00.000Z');
    const second = addAt(data, 'second', 'https://example.com/2', '2026-01-02T00:00:00.000Z');
    start(data, first.id);

    expect(next(data)?.id).toBe(second.id);
  });

  it('restricts to a tag when provided', () => {
    const data = seed();
    addAt(data, 'a', 'https://example.com/1', '2026-01-01T00:00:00.000Z', ['life']);
    addAt(data, 'b', 'https://example.com/2', '2026-01-02T00:00:00.000Z', ['tech']);

    expect(next(data, { tag: 'tech' })?.title).toBe('b');
  });

  it('returns undefined when no unread item matches', () => {
    const data = seed();
    const item = add(data, { title: 'a', url: 'https://example.com/1' });
    complete(data, item.id);

    expect(next(data)).toBeUndefined();
    expect(next(data, { tag: 'missing' })).toBeUndefined();
  });
});
