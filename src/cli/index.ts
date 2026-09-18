import type { Item } from '../domain/item.js';
import { isStatus, type Status } from '../domain/item.js';
import { add, complete, list, next, remove, start, ValidationError } from '../core/queue.js';
import {
  DataFileError,
  load,
  resolveDataFilePath,
  save,
  type QueueData,
} from '../persistence/store.js';

/** Injectable I/O so commands stay testable without spawning a subprocess. */
export interface CliIO {
  out: (line: string) => void;
  err: (line: string) => void;
  env: NodeJS.ProcessEnv;
}

const EXIT_OK = 0;
const EXIT_USER_ERROR = 1;
const EXIT_FATAL = 2;

const USAGE = [
  'Usage: reading-queue <command> [options]',
  '',
  'Commands:',
  '  add <title> --url <url> [--tag <tag>]...   Add a new item (status: unread)',
  '  list [--status <s>] [--tag <tag>]          List items, newest first',
  '  start <id>                                 Mark an item as reading',
  '  complete <id>                              Mark an item as done',
  '  remove <id>                                Delete an item',
  '  next [--tag <tag>]                         Show the oldest unread item (read-only)',
].join('\n');

interface ParsedArgs {
  positionals: string[];
  options: Record<string, string[]>;
}

function defaultIO(): CliIO {
  return {
    out: (line) => console.log(line),
    err: (line) => console.error(line),
    env: process.env,
  };
}

/**
 * CLI entry point. Parses `argv` (the arguments after the script name), executes
 * the command, and resolves to a process exit code. Never throws.
 */
export async function run(argv: string[], io: CliIO = defaultIO()): Promise<number> {
  try {
    const [command, ...rest] = argv;
    if (command === undefined || command === '') {
      io.err(USAGE);
      throw new ValidationError('No command given.');
    }

    const parsed = parseArgs(rest);
    const filePath = resolveDataFilePath(io.env);

    switch (command) {
      case 'add':
        return await handleAdd(parsed, filePath, io);
      case 'list':
        return await handleList(parsed, filePath, io);
      case 'start':
        return await handleTransition(parsed, filePath, io, 'start', start);
      case 'complete':
        return await handleTransition(parsed, filePath, io, 'complete', complete);
      case 'remove':
        return await handleRemove(parsed, filePath, io);
      case 'next':
        return await handleNext(parsed, filePath, io);
      default:
        throw new ValidationError(
          `Unknown command "${command}". Valid commands: add, list, start, complete, remove, next.`,
        );
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      io.err(`Error: ${err.message}`);
      return EXIT_USER_ERROR;
    }
    if (err instanceof DataFileError) {
      io.err(`Error: ${err.message}`);
      return EXIT_FATAL;
    }
    io.err(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    return EXIT_FATAL;
  }
}

async function handleAdd(parsed: ParsedArgs, filePath: string, io: CliIO): Promise<number> {
  ensureKnownOptions(parsed, ['url', 'tag']);
  ensurePositionalCount(parsed, 1, 'add <title> --url <url> [--tag <tag>]');

  const title = parsed.positionals[0] ?? '';
  const url = singleOption(parsed, 'url');
  if (url === undefined) {
    throw new ValidationError(
      'A URL is required. Usage: reading-queue add <title> --url <url> [--tag <tag>].',
    );
  }
  const tags = parsed.options.tag ?? [];

  const data = await load(filePath);
  const item = add(data, { title, url, tags });
  await save(filePath, data);

  io.out(`Added item ${item.id}: ${item.title}`);
  return EXIT_OK;
}

async function handleList(parsed: ParsedArgs, filePath: string, io: CliIO): Promise<number> {
  ensureKnownOptions(parsed, ['status', 'tag']);
  ensurePositionalCount(parsed, 0, 'list [--status <s>] [--tag <tag>]');

  const status = parseStatusFilter(singleOption(parsed, 'status'));
  const tag = singleOption(parsed, 'tag');

  const data = await load(filePath);
  const items = list(data, { status, tag });

  if (items.length === 0) {
    io.out('No items match.');
    return EXIT_OK;
  }
  for (const item of items) {
    io.out(formatItem(item));
  }
  return EXIT_OK;
}

async function handleTransition(
  parsed: ParsedArgs,
  filePath: string,
  io: CliIO,
  commandName: string,
  transition: (data: QueueData, id: number) => Item,
): Promise<number> {
  ensureKnownOptions(parsed, []);
  ensurePositionalCount(parsed, 1, `${commandName} <id>`);

  const id = parseId(parsed.positionals[0]);
  const data = await load(filePath);
  const item = transition(data, id);
  await save(filePath, data);

  io.out(`Item ${item.id} is now ${item.status}.`);
  return EXIT_OK;
}

async function handleRemove(parsed: ParsedArgs, filePath: string, io: CliIO): Promise<number> {
  ensureKnownOptions(parsed, []);
  ensurePositionalCount(parsed, 1, 'remove <id>');

  const id = parseId(parsed.positionals[0]);
  const data = await load(filePath);
  const item = remove(data, id);
  await save(filePath, data);

  io.out(`Removed item ${item.id}: ${item.title}`);
  return EXIT_OK;
}

async function handleNext(parsed: ParsedArgs, filePath: string, io: CliIO): Promise<number> {
  ensureKnownOptions(parsed, ['tag']);
  ensurePositionalCount(parsed, 0, 'next [--tag <tag>]');

  const tag = singleOption(parsed, 'tag');
  const data = await load(filePath);
  const item = next(data, { tag });

  if (item === undefined) {
    io.out(tag !== undefined ? `No unread items with tag "${tag}".` : 'No unread items.');
    return EXIT_OK;
  }
  io.out(formatItem(item));
  return EXIT_OK;
}

function parseArgs(tokens: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options: Record<string, string[]> = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const name = token.slice(2);
      if (name === '') {
        throw new ValidationError(`Malformed option "${token}".`);
      }
      const value = tokens[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new ValidationError(`Option "--${name}" requires a value.`);
      }
      (options[name] ??= []).push(value);
      i++;
    } else {
      positionals.push(token);
    }
  }

  return { positionals, options };
}

function ensureKnownOptions(parsed: ParsedArgs, allowed: string[]): void {
  for (const name of Object.keys(parsed.options)) {
    if (!allowed.includes(name)) {
      throw new ValidationError(
        `Unknown option "--${name}". Allowed options: ${
          allowed.length > 0 ? allowed.map((a) => `--${a}`).join(', ') : '(none)'
        }.`,
      );
    }
  }
}

function ensurePositionalCount(parsed: ParsedArgs, expected: number, usage: string): void {
  if (parsed.positionals.length > expected) {
    throw new ValidationError(`Too many arguments. Usage: reading-queue ${usage}.`);
  }
}

function singleOption(parsed: ParsedArgs, name: string): string | undefined {
  const values = parsed.options[name];
  if (values === undefined) {
    return undefined;
  }
  if (values.length > 1) {
    throw new ValidationError(`Option "--${name}" may only be given once.`);
  }
  return values[0];
}

function parseStatusFilter(raw: string | undefined): Status | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!isStatus(raw)) {
    throw new ValidationError(`"${raw}" is not a valid status. Use one of: unread, reading, done.`);
  }
  return raw;
}

function parseId(raw: string | undefined): number {
  if (raw === undefined) {
    throw new ValidationError('An item ID is required. Usage: reading-queue <command> <id>.');
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError(`"${raw}" is not a valid item ID. IDs are positive integers.`);
  }
  return id;
}

function formatItem(item: Item): string {
  const tags = item.tags.length > 0 ? ` (tags: ${item.tags.join(', ')})` : '';
  return `#${item.id} [${item.status}] ${item.title} — ${item.url}${tags}`;
}
