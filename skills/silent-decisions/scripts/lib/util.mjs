// Shared helpers. No dependencies beyond Node >= 18.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const STATE_DIR = '.silent-decisions';

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function normalizeWs(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

/** Lowercase alphanumeric word list, used for shingle comparison. */
export function words(s) {
  return String(s).toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

export function shingles(text, n) {
  const w = words(text);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(' '));
  return set;
}

export function fail(msg, code = 1) {
  process.stderr.write(`sd: ${msg}\n`);
  process.exit(code);
}

export function projectDir(args) {
  return path.resolve(args.project || process.cwd());
}

/** Load the current run (or the one named by --run). */
export function loadRun(args) {
  const proj = projectDir(args);
  const state = path.join(proj, STATE_DIR);
  let runDir;
  if (args.run) runDir = path.join(state, 'runs', String(args.run));
  else {
    const cur = path.join(state, 'current.json');
    if (!fs.existsSync(cur)) fail('no current run. Run `sd init --plan <file>` first.');
    runDir = readJson(cur).run_dir;
  }
  const meta = readJson(path.join(runDir, 'run.json'));
  return { proj, state, runDir, meta };
}

/** Resolve the `typescript` package: target project first, then this skill, then the plugin root. */
export function loadTypescript(proj) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const bases = [proj, here, path.resolve(here, '../../../..')];
  for (const base of bases) {
    try {
      const req = createRequire(path.join(base, 'noop.js'));
      return req('typescript');
    } catch { /* try next */ }
  }
  fail('cannot find the `typescript` package. Install it in the target project (npm i -D typescript) or run `npm install` in the silent-decisions folder.');
}

/** Minimal glob: supports **, *, and {a,b}. Paths use forward slashes. */
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') { re += '(?:.*/)?'; i++; } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end === -1) { re += '\\{'; continue; }
      re += '(?:' + glob.slice(i + 1, end).split(',').map(escapeRe).join('|') + ')';
      i = end;
    } else if (c === '?') re += '[^/]';
    else re += escapeRe(c);
  }
  return new RegExp('^' + re + '$');
}

/** Split a comma-separated glob list without breaking {a,b} groups. */
export function splitGlobs(list) {
  const out = [];
  let depth = 0, cur = '';
  for (const c of String(list)) {
    if (c === '{') depth++;
    if (c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function walk(dir, skipDirs = new Set(['node_modules', '.git', STATE_DIR, 'dist', 'build', 'coverage'])) {
  const out = [];
  const rec = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isSymbolicLink()) continue; // never follow or copy symlinks
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!skipDirs.has(e.name)) rec(p); }
      else if (e.isFile()) out.push(p);
    }
  };
  rec(dir);
  return out;
}

export function rel(from, p) {
  return path.relative(from, p).split(path.sep).join('/');
}

export function isInside(root, candidate) {
  const r = path.relative(root, candidate);
  return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
}

export function realpathSafe(p) {
  // Resolve the deepest existing ancestor so not-yet-created files still get a real path.
  let cur = path.resolve(p);
  const tail = [];
  while (!fs.existsSync(cur)) {
    tail.unshift(path.basename(cur));
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  let real = cur;
  try { real = fs.realpathSync(cur); } catch { /* keep */ }
  return path.join(real, ...tail);
}
