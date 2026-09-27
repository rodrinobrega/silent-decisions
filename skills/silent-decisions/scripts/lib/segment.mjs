// Deterministic plan segmentation: numbered statements with line ranges.
// Headings, code fences, tables rules and blank lines are skipped. Typing
// (behavioural / structural / process) is a judgement and is left to the tracer.
import { normalizeWs } from './util.mjs';

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9("'\[*_`])/;

function splitSentences(text) {
  return text.split(SENTENCE_SPLIT).map((s) => s.trim()).filter((s) => words(s) >= 3);
}
function words(s) { return (s.match(/\S+/g) || []).length; }

function segment(text, prefix) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let inFence = false;
  let block = null; // { start, end, parts: [] }
  let n = 0;

  const flush = () => {
    if (!block) return;
    const joined = normalizeWs(block.parts.join(' '));
    for (const s of splitSentences(joined)) {
      n++;
      out.push({
        id: `${prefix}-${String(n).padStart(3, '0')}`,
        text: s,
        line_start: block.start,
        line_end: block.end,
        heading: block.heading,
      });
    }
    block = null;
  };

  let heading = '';
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) { flush(); inFence = !inFence; continue; }
    if (inFence) continue;
    if (line === '' || /^(-{3,}|\*{3,}|_{3,})$/.test(line) || /^\|?[\s:|-]+\|[\s:|-]*$/.test(line)) { flush(); continue; }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) { flush(); heading = h[1].trim(); continue; }
    const item = line.match(/^(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(.*)$/);
    if (item) {
      flush();
      block = { start: i + 1, end: i + 1, parts: [item[1]], heading };
      continue;
    }
    const content = line.replace(/^>\s?/, '');
    if (block) { block.parts.push(content); block.end = i + 1; }
    else block = { start: i + 1, end: i + 1, parts: [content], heading };
  }
  flush();
  return out;
}

/** Plan statements are P-nnn. Ledger decisions (already approved by a human) are D-nnn and quotable too. */
export function segmentPlan(planText, ledgerText = '') {
  const plan = segment(planText, 'P').map((s) => ({ ...s, source: 'plan', type: null }));
  const ledger = [];
  if (ledgerText) {
    const re = /^##\s+(D-\d+)\b.*$/gm;
    const heads = [...ledgerText.matchAll(re)];
    heads.forEach((m, i) => {
      const bodyStart = m.index + m[0].length;
      const bodyEnd = i + 1 < heads.length ? heads[i + 1].index : ledgerText.length;
      const body = ledgerText.slice(bodyStart, bodyEnd);
      const scenario = body.match(/^- scenario:\s*(.*)$/m);
      const decision = body.match(/^- decision:\s*(.*)$/m);
      if (!scenario) return;
      const lineStart = ledgerText.slice(0, m.index).split('\n').length;
      ledger.push({
        id: m[1],
        text: normalizeWs(scenario[1]),
        decision: decision ? normalizeWs(decision[1]) : '',
        line_start: lineStart,
        line_end: lineStart + body.split('\n').length - 1,
        heading: 'decisions ledger',
        source: 'ledger',
        type: 'behavioural',
      });
    });
  }
  return plan.concat(ledger);
}
