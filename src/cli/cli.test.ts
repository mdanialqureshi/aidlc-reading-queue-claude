import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { run, type CliIO } from './index.js';

let tempDir: string;
let dataFile: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reading-queue-cli-'));
  dataFile = path.join(tempDir, 'queue.json');
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

interface Captured {
  code: number;
  out: string[];
  err: string[];
}

async function cli(...argv: string[]): Promise<Captured> {
  const out: string[] = [];
  const err: string[] = [];
  const io: CliIO = {
    out: (line) => out.push(line),
    err: (line) => err.push(line),
    env: { READING_QUEUE_FILE: dataFile },
  };
  const code = await run(argv, io);
  return { code, out, err };
}

describe('add command', () => {
  it('creates an item, prints the ID and exits 0', async () => {
    const result = await cli(
      'add',
      'Deep Work',
      '--url',
      'https://example.com/a',
      '--tag',
      'focus',
    );

    expect(result.code).toBe(0);
    expect(result.out.join('\n')).toContain('Added item 1');

    const onDisk = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    expect(onDisk.items).toHaveLength(1);
    expect(onDisk.items[0]).toMatchObject({
      id: 1,
      title: 'Deep Work',
      tags: ['focus'],
      status: 'unread',
    });
    expect(onDisk.nextId).toBe(2);
  });

  it('supports repeated --tag options', async () => {
    await cli('add', 'A', '--url', 'https://example.com/a', '--tag', 'x', '--tag', 'y');
    const onDisk = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    expect(onDisk.items[0].tags).toEqual(['x', 'y']);
  });

  it('rejects a missing title with a non-zero exit and actionable message', async () => {
    const result = await cli('add', '--url', 'https://example.com/a');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/title is required/i);
  });

  it('rejects a malformed URL with a non-zero exit', async () => {
    const result = await cli('add', 'A', '--url', 'not-a-url');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/not a valid URL/i);
  });

  it('rejects a missing --url value', async () => {
    const result = await cli('add', 'A', '--url');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/requires a value/i);
  });
});

describe('list command', () => {
  beforeEach(async () => {
    await cli('add', 'first', '--url', 'https://example.com/1', '--tag', 'tech');
    await cli('add', 'second', '--url', 'https://example.com/2', '--tag', 'life');
  });

  it('lists items newest-first and exits 0', async () => {
    const result = await cli('list');
    expect(result.code).toBe(0);
    expect(result.out).toHaveLength(2);
    expect(result.out[0]).toContain('second');
    expect(result.out[1]).toContain('first');
  });

  it('filters by tag', async () => {
    const result = await cli('list', '--tag', 'tech');
    expect(result.out).toHaveLength(1);
    expect(result.out[0]).toContain('first');
  });

  it('prints a clear message and exits 0 when nothing matches', async () => {
    const result = await cli('list', '--status', 'done');
    expect(result.code).toBe(0);
    expect(result.out.join('\n')).toMatch(/no items match/i);
  });

  it('rejects an invalid --status value', async () => {
    const result = await cli('list', '--status', 'archived');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/not a valid status/i);
  });
});

describe('start / complete / remove commands', () => {
  beforeEach(async () => {
    await cli('add', 'A', '--url', 'https://example.com/a');
  });

  it('start marks the item as reading', async () => {
    const result = await cli('start', '1');
    expect(result.code).toBe(0);
    expect(result.out.join('\n')).toMatch(/now reading/);
    const onDisk = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    expect(onDisk.items[0].status).toBe('reading');
  });

  it('complete marks the item as done', async () => {
    await cli('complete', '1');
    const onDisk = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    expect(onDisk.items[0].status).toBe('done');
  });

  it('remove deletes the item and does not reuse its ID', async () => {
    await cli('remove', '1');
    let onDisk = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    expect(onDisk.items).toHaveLength(0);

    await cli('add', 'B', '--url', 'https://example.com/b');
    onDisk = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    expect(onDisk.items[0].id).toBe(2);
  });

  it('rejects a missing ID with a non-zero exit', async () => {
    const result = await cli('start', '999');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/No item with ID 999/);
  });

  it('rejects a non-numeric ID', async () => {
    const result = await cli('remove', 'abc');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/not a valid item ID/i);
  });
});

describe('next command', () => {
  it('prints the oldest unread item without changing its status and exits 0', async () => {
    await cli('add', 'oldest', '--url', 'https://example.com/1', '--tag', 'tech');
    await cli('add', 'newest', '--url', 'https://example.com/2');

    const result = await cli('next');
    expect(result.code).toBe(0);
    expect(result.out.join('\n')).toContain('oldest');

    const onDisk = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    expect(onDisk.items.find((it: { title: string }) => it.title === 'oldest').status).toBe(
      'unread',
    );
  });

  it('restricts to a tag', async () => {
    await cli('add', 'a', '--url', 'https://example.com/1', '--tag', 'life');
    await cli('add', 'b', '--url', 'https://example.com/2', '--tag', 'tech');

    const result = await cli('next', '--tag', 'tech');
    expect(result.out.join('\n')).toContain('b');
  });

  it('prints a clear message and exits 0 when no unread item matches', async () => {
    const result = await cli('next');
    expect(result.code).toBe(0);
    expect(result.out.join('\n')).toMatch(/no unread items/i);
  });
});

describe('CLI-level errors', () => {
  it('rejects an unknown command with a non-zero exit', async () => {
    const result = await cli('frobnicate');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/unknown command/i);
  });

  it('rejects no command at all with usage and a non-zero exit', async () => {
    const result = await cli();
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/Usage:/);
  });

  it('reports a corrupt data file as a fatal error', async () => {
    await fs.writeFile(dataFile, 'not json at all', 'utf8');
    const result = await cli('list');
    expect(result.code).not.toBe(0);
    expect(result.err.join('\n')).toMatch(/not valid JSON/i);
  });
});
