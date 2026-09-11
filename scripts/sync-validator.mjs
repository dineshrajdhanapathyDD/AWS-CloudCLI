// Copies the single source-of-truth validator into the backend Lambda bundle,
// prepending a "generated copy" header. Run: npm run sync:validator
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'shared', 'commandValidator.js');
const dest = join(root, 'backend', 'src', 'lib', 'commandValidator.js');

const header = `/**
 * !!! GENERATED COPY — DO NOT EDIT DIRECTLY !!!
 * Source of truth: /shared/commandValidator.js
 * Sync with: npm run sync:validator  (from repo root)
 */
`;

const original = readFileSync(src, 'utf8');
writeFileSync(dest, header + '\n' + original);
console.log(`Synced validator → ${dest}`);
