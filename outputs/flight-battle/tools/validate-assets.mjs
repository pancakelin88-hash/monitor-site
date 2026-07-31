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
const required = ['id', 'version', 'license', 'source', 'sha256', 'preview', 'loadGroup', 'fallback', 'mobileVariant'];
const ids = new Set();

const isRemote = value => /^https?:\/\//.test(String(value ?? ''));
const checkLocalPath = (entry, field, value) => {
  if (value == null || isRemote(value)) return;
  const path = resolve(root, 'assets', value);
  return access(path).catch(() => {
    failures.push(`${entry.id}: missing ${field} ${value}`);
  });
};

for (const entry of manifest.assets ?? []) {
  for (const key of required) {
    if (!(key in entry)) failures.push(`${entry.id ?? '<unknown>'}: missing manifest field ${key}`);
  }
  if (!entry.id || ids.has(entry.id)) failures.push(`${entry.id ?? '<unknown>'}: duplicate or empty id`);
  ids.add(entry.id);
  if (entry.sha256 !== null && !/^[a-f0-9]{64}$/i.test(String(entry.sha256 ?? ''))) {
    failures.push(`${entry.id}: sha256 must be 64 hex characters or null`);
  }
  if (typeof entry.fallback !== 'string' || entry.fallback.length === 0) {
    failures.push(`${entry.id}: fallback must be a non-empty string`);
  }
  await checkLocalPath(entry, 'preview', entry.preview);
  await checkLocalPath(entry, 'mobileVariant', entry.mobileVariant);
  if (isRemote(entry.file)) continue;
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
