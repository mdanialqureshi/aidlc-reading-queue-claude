import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createItem } from '../domain/item.js';
import {
  CURRENT_VERSION,
  DataFileError,
  emptyQueue,
  load,
  resolveDataFilePath,
  save,
} from './store.js';

let tempDir: string;
let dataFile: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reading-queue-store-'));
  dataFile = path.join(tempDir, 'queue.json');
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('resolveDataFilePath', () => {
  it('honors a non-empty READING_QUEUE_FILE override', () => {
    expect(resolveDataFilePath({ READING_QUEUE_FILE: '/tmp/custom.json' })).toBe(
      '/tmp/custom.json',
    );
  });

  it('falls back to ~/.reading-queue/queue.json when the override is unset or blank', () => {
    const expected = path.join(os.homedir(), '.reading-queue', 'queue.json');
    expect(resolveDataFilePath({})).toBe(expected);
    expect(resolveDataFilePath({ READING_QUEUE_FILE: '   ' })).toBe(expected);
  });
});

describe('load', () => {
  it('returns an empty queue when the file does not exist', async () => {
    const data = await load(path.join(tempDir, 'missing.json'));
    expect(data).toEqual(emptyQueue());
    expect(data.nextId).toBe(1);
    expect(data.items).toEqual([]);
  });

  it('throws DataFileError on invalid JSON', async () => {
    await fs.writeFile(dataFile, '{ not valid json', 'utf8');
    await expect(load(dataFile)).rejects.toBeInstanceOf(DataFileError);
  });

  it('throws DataFileError when the structure is malformed', async () => {
    await fs.writeFile(dataFile, JSON.stringify({ items: 'nope', nextId: 1 }), 'utf8');
    await expect(load(dataFile)).rejects.toThrow(/items/);
  });
});

describe('save + load round-trip', () => {
  it('persists and reloads the queue as pretty-printed JSON', async () => {
    const item = createItem({ id: 1, title: 'A', url: 'https://example.com/a' });
    const data = { version: CURRENT_VERSION, nextId: 2, items: [item] };

    await save(dataFile, data);

    const onDisk = await fs.readFile(dataFile, 'utf8');
    expect(onDisk).toContain('\n  "nextId": 2');
    expect(onDisk.endsWith('\n')).toBe(true);

    const reloaded = await load(dataFile);
    expect(reloaded).toEqual(data);
  });

  it('creates the parent directory on first use', async () => {
    const nested = path.join(tempDir, 'deep', 'nested', 'queue.json');
    await save(nested, emptyQueue());
    await expect(fs.stat(nested)).resolves.toBeDefined();
  });

  it('leaves no temp files behind after a successful write', async () => {
    await save(dataFile, emptyQueue());
    const entries = await fs.readdir(tempDir);
    expect(entries.filter((e) => e.endsWith('.tmp'))).toEqual([]);
    expect(entries).toContain('queue.json');
  });
});

describe('nextId monotonicity across removals', () => {
  it('never reuses an ID even after items are removed', async () => {
    // Simulate adding three items then removing the middle one.
    const items = [
      createItem({ id: 1, title: 'A', url: 'https://example.com/a' }),
      createItem({ id: 2, title: 'B', url: 'https://example.com/b' }),
      createItem({ id: 3, title: 'C', url: 'https://example.com/c' }),
    ];
    await save(dataFile, { version: CURRENT_VERSION, nextId: 4, items });

    // Remove id 2; nextId stays at 4.
    const afterRemoval = await load(dataFile);
    afterRemoval.items = afterRemoval.items.filter((it) => it.id !== 2);
    await save(dataFile, afterRemoval);

    const reloaded = await load(dataFile);
    expect(reloaded.nextId).toBe(4);
    expect(reloaded.items.map((it) => it.id)).toEqual([1, 3]);
  });
});
