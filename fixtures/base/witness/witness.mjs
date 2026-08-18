// STUB for tests — records which modules the gate was pointed at, returns clean.
// The log is the assertion surface: the module-discovery filter is only provably right if we can
// see exactly which files it handed to the gate, and in what order.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
const LOG = join(dirname(fileURLToPath(import.meta.url)), 'log.txt');
export function runMutations(src, opts) {
  appendFileSync(LOG, basename(String(src)) + '\n');
  return { clean: true, score: /extra/.test(String(src)) ? 0.6 : 0.9, survived: [], killed: 3, total: 3 };
}
