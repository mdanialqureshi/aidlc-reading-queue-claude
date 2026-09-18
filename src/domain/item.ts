export type Status = 'unread' | 'reading' | 'done';

export const STATUSES: readonly Status[] = ['unread', 'reading', 'done'];

export interface Item {
  id: number;
  title: string;
  url: string;
  tags: string[];
  status: Status;
  /** ISO 8601 UTC timestamp of creation. */
  createdAt: string;
  /** ISO 8601 UTC timestamp of the last mutation. */
  updatedAt: string;
}

export interface NewItemFields {
  id: number;
  title: string;
  url: string;
  tags?: string[];
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

/**
 * Builds a new item, defaulting status to `unread` and stamping both timestamps
 * with the same creation instant.
 */
export function createItem(fields: NewItemFields, now: Date = new Date()): Item {
  const timestamp = now.toISOString();
  return {
    id: fields.id,
    title: fields.title,
    url: fields.url,
    tags: fields.tags ? [...fields.tags] : [],
    status: 'unread',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
