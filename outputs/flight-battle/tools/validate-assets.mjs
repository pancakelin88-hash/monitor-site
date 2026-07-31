import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const manifestPath = resolve(root, 'assets/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];

for (const entry of manifest.assets ?? []) {
  if (/^https?:\/\//.test(entry.file)) continue;
  const file = resolve(root, 'assets', entry.file);
  try {
    await access(file);
  } catch {
    if (!String(entry.fallback ?? '').startsWith('procedural:')) failures.push(`${entry.id}: missing ${entry.file}`);
    continue;
  }
  if (entry.sha256) {
    const digest = createHash('sha256').update(await readFile(file)).digest('hex');
    if (digest !== entry.sha256) failures.push(`${entry.id}: sha256 mismatch`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`LinYH asset check passed · ${manifest.assets?.length ?? 0} indexed entries · v${manifest.version}`);
}
