#!/usr/bin/env node
import { run } from '../cli/index.js';

run(process.argv.slice(2))
  .then((code) => {
    process.exit(code);
  })
  .catch((err: unknown) => {
    // Safety net: run() is designed never to throw, but if it does we must not
    // exit 0 on a failure.
    console.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  });
