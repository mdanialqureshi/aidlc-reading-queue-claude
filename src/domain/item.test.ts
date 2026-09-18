import { describe, expect, it } from 'vitest';
import { createItem, isStatus, STATUSES } from './item.js';

const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

describe('createItem', () => {
  it('defaults new items to status "unread"', () => {
    const item = createItem({ id: 1, title: 'Deep Work', url: 'https://example.com/a' });
    expect(item.status).toBe('unread');
  });

  it('stamps createdAt and updatedAt with the same ISO 8601 UTC instant', () => {
    const now = new Date('2026-09-18T10:00:00.000Z');
    const item = createItem({ id: 7, title: 'A', url: 'https://example.com/a' }, now);

    expect(item.createdAt).toBe('2026-09-18T10:00:00.000Z');
    expect(item.updatedAt).toBe('2026-09-18T10:00:00.000Z');
    expect(item.createdAt).toMatch(ISO_8601_UTC);
  });

  it('produces the full item shape with the given id, title, url and tags', () => {
    const item = createItem({
      id: 42,
      title: 'Clean Architecture',
      url: 'https://example.com/ca',
      tags: ['software', 'design'],
    });

    expect(item).toEqual({
      id: 42,
      title: 'Clean Architecture',
      url: 'https://example.com/ca',
      tags: ['software', 'design'],
      status: 'unread',
      createdAt: expect.stringMatching(ISO_8601_UTC),
      updatedAt: expect.stringMatching(ISO_8601_UTC),
    });
  });

  it('defaults tags to an empty array and copies the input array (no aliasing)', () => {
    const noTags = createItem({ id: 1, title: 'A', url: 'https://example.com/a' });
    expect(noTags.tags).toEqual([]);

    const source = ['x'];
    const withTags = createItem({ id: 2, title: 'B', url: 'https://example.com/b', tags: source });
    source.push('mutated');
    expect(withTags.tags).toEqual(['x']);
  });
});

describe('isStatus', () => {
  it('accepts the three valid statuses', () => {
    expect(STATUSES).toEqual(['unread', 'reading', 'done']);
    for (const status of STATUSES) {
      expect(isStatus(status)).toBe(true);
    }
  });

  it('rejects any other value', () => {
    expect(isStatus('archived')).toBe(false);
    expect(isStatus('')).toBe(false);
    expect(isStatus('UNREAD')).toBe(false);
  });
});
