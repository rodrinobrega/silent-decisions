// Build the clean room: a copy of the source with comments blanked out and
// tests, docs, the plan and version-control history left behind.
// Comments are replaced by spaces, newlines kept, so line numbers match the original.
import fs from 'node:fs';
import path from 'node:path';
import { loadTypescript, globToRegExp, walk, rel, sha256 } from './util.mjs';

export function stripComments(ts, fileName, text) {
  const kind = /\.tsx$/.test(fileName) ? ts.ScriptKind.TSX
    : /\.jsx$/.test(fileName) ? ts.ScriptKind.JSX
    : /\.[cm]?js$/.test(fileName) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  const ranges = new Map();
  const add = (r) => { if (r) for (const c of r) ranges.set(c.pos, c.end); };

  // Visit every token (getChildren includes punctuation and EndOfFileToken), so
  // comments before a closing brace or at end of file are found too.
  const visit = (node) => {
    // JSX text is not trivia; do not scan inside it.
    if (node.kind !== ts.SyntaxKind.JsxText) {
      add(ts.getLeadingCommentRanges(text, node.getFullStart()));
      add(ts.getTrailingCommentRanges(text, node.getEnd()));
    }
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);

  // A shebang is not a comment to TypeScript; leave it.
  let out = text;
  const sorted = [...ranges.entries()].sort((a, b) => b[0] - a[0]);
  for (const [pos, end] of sorted) {
    // Guard: a "comment" that starts inside a string or template would be a scanner artefact.
    const tok = ts.getTokenAtPosition ? ts.getTokenAtPosition(sf, pos) : null;
    if (tok && (ts.isStringLiteralLike(tok) || tok.kind === ts.SyntaxKind.TemplateHead
      || tok.kind === ts.SyntaxKind.TemplateMiddle || tok.kind === ts.SyntaxKind.TemplateTail
      || tok.kind === ts.SyntaxKind.RegularExpressionLiteral)
      && pos > tok.getStart(sf) && pos < tok.getEnd()) continue;
    const blank = out.slice(pos, end).replace(/[^\n\r]/g, ' ');
    out = out.slice(0, pos) + blank + out.slice(end);
  }
  return { text: out, count: ranges.size };
}

export function buildCleanroom({ proj, roomRoot, include, exclude }) {
  const ts = loadTypescript(proj);
  const inc = include.map(globToRegExp);
  const exc = exclude.map(globToRegExp);
  const dest = path.join(roomRoot, 'cleanroom');
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  const files = [];
  let stripped = 0;
  for (const abs of walk(proj)) {
    const r = rel(proj, abs);
    if (!inc.some((re) => re.test(r))) continue;
    if (exc.some((re) => re.test(r))) continue;
    const text = fs.readFileSync(abs, 'utf8');
    const res = stripComments(ts, r, text);
    stripped += res.count;
    const out = path.join(dest, r);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, res.text);
    files.push({ path: r, sha256: sha256(text), comments_stripped: res.count });
  }
  if (files.length === 0) {
    process.stderr.write(`sd: warning: no source files matched ${include.join(', ')}. Pass --include.\n`);
  }
  return { cleanroom_dir: dest, files, comments_stripped: stripped };
}
