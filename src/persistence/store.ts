import { promises as fs } from 'node:fs';
import { randomBytes } from 'node:crypto';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Item } from '../domain/item.js';

export const CURRENT_VERSION = 1;

export interface QueueData {
  version: number;
  /** Monotonic counter; IDs are never reused, so this only ever increases. */
  nextId: number;
  items: Item[];
}

/**
 * Raised when the on-disk data file exists but cannot be read or parsed. This is
 * a fatal condition (the CLI aborts) as opposed to recoverable user-input errors.
 */
export class DataFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataFileError';
  }
}

export function emptyQueue(): QueueData {
  return { version: CURRENT_VERSION, nextId: 1, items: [] };
}

/**
 * Resolves the data file path: `READING_QUEUE_FILE` if set and non-empty,
 * otherwise `~/.reading-queue/queue.json`. Independent of the working directory.
 */
export function resolveDataFilePath(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.READING_QUEUE_FILE;
  if (override !== undefined && override.trim() !== '') {
    return override;
  }
  return path.join(os.homedir(), '.reading-queue', 'queue.json');
}

export async function load(filePath: string): Promise<QueueData> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptyQueue();
    }
    throw new DataFileError(
      `Could not read the data file at ${filePath}: ${(err as Error).message}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new DataFileError(
      `The data file at ${filePath} is not valid JSON: ${(err as Error).message}. ` +
        'Fix or remove the file and try again.',
    );
  }

  return normalize(parsed, filePath);
}

/**
 * Atomically persists the queue: write to a temp file in the same directory,
 * fsync-free rename over the target. An interrupted write leaves the prior file
 * intact because the rename is the only mutation of the target path (FR1.9).
 */
export async function save(filePath: string, data: QueueData): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  const tempPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`,
  );

  try {
    await fs.writeFile(tempPath, serialized, 'utf8');
    await fs.rename(tempPath, filePath);
  } catch (err) {
    // Best-effort cleanup of the temp file; the original write error is what matters.
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
    throw new DataFileError(
      `Could not write the data file at ${filePath}: ${(err as Error).message}`,
    );
  }
}

function normalize(parsed: unknown, filePath: string): QueueData {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new DataFileError(`The data file at ${filePath} does not contain a queue object.`);
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.items)) {
    throw new DataFileError(`The data file at ${filePath} is missing an "items" array.`);
  }

  const nextId = obj.nextId;
  if (typeof nextId !== 'number' || !Number.isInteger(nextId) || nextId < 1) {
    throw new DataFileError(
      `The data file at ${filePath} has an invalid "nextId" (expected a positive integer).`,
    );
  }

  return {
    version: typeof obj.version === 'number' ? obj.version : CURRENT_VERSION,
    nextId,
    items: obj.items as Item[],
  };
}
