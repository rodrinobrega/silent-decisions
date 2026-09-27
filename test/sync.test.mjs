import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('generated skill and agent files match their sources (run `npm run sync`)', async () => {
  process.chdir(root);
  const { build } = await import('../tools/sync-extractor.mjs');
  for (const [p, text] of Object.entries(build())) assert.equal(fs.readFileSync(p, 'utf8'), text, p);
});

test('the extractor prompt never mentions a plan, spec or requirements', () => {
  const files = ['skills/silent-decisions/references/extractor-prompt.md', 'skills/silent-decisions/references/roles/sd-extractor.md'];
  for (const f of files) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    assert.doesNotMatch(text, /\b(plan|spec|specification|requirement|ticket)s?\b/i, f);
  }
});
