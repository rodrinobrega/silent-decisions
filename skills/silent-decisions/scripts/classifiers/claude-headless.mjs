#!/usr/bin/env node
// Reference adapter: uses `claude -p --bare` as a decision-only model, one call per request,
// forced to answer with a single label and a confidence. Slow and not cheap; it exists so the
// pairwise mode can be exercised without a dedicated classifier, and as a comparison arm.
//   SD_CLAUDE_MODEL   optional model name passed with --model
//   SD_CLASSIFIER_CONCURRENCY   parallel calls (default 4)
import { spawn } from 'node:child_process';
import { question } from './question.mjs';

const concurrency = Number(process.env.SD_CLASSIFIER_CONCURRENCY || 4);
const model = process.env.SD_CLAUDE_MODEL ? ['--model', process.env.SD_CLAUDE_MODEL] : [];

function ask(req) {
  const prompt = `${question(req)}\n\nAnswer with exactly one line of JSON and nothing else: {"label": <one of ${JSON.stringify(req.labels)}>, "confidence": <0 to 1>}`;
  return new Promise((resolve) => {
    const p = spawn('claude', ['-p', '--bare', '--output-format', 'text', ...model], { stdio: ['pipe', 'pipe', 'ignore'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.on('close', () => {
      const m = out.match(/\{[^{}]*\}/);
      try { const j = JSON.parse(m[0]); resolve({ id: req.id, label: String(j.label).toLowerCase(), confidence: Number(j.confidence) }); }
      catch { resolve(null); }
    });
    p.stdin.end(prompt);
  });
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', async () => {
  const reqs = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  let i = 0;
  const worker = async () => {
    while (i < reqs.length) { const a = await ask(reqs[i++]); if (a) process.stdout.write(JSON.stringify(a) + '\n'); }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
});
