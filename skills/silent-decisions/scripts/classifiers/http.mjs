#!/usr/bin/env node
// Generic HTTP classifier adapter. Reads JSONL requests on stdin, POSTs each to
// SD_CLASSIFIER_URL, writes JSONL answers on stdout.
//
// Fill in `toBody` and `fromResponse` for your provider (Jev, or any decision model with a
// fixed label set). The defaults send {question, options} and expect {label, confidence}.
//
//   SD_CLASSIFIER_URL   endpoint (required)
//   SD_CLASSIFIER_KEY   bearer token (optional)
//   SD_CLASSIFIER_CONCURRENCY   parallel requests (default 8)
import { question } from './question.mjs';

const url = process.env.SD_CLASSIFIER_URL;
if (!url) { process.stderr.write('SD_CLASSIFIER_URL is not set\n'); process.exit(2); }
const headers = { 'content-type': 'application/json', ...(process.env.SD_CLASSIFIER_KEY ? { authorization: `Bearer ${process.env.SD_CLASSIFIER_KEY}` } : {}) };
const concurrency = Number(process.env.SD_CLASSIFIER_CONCURRENCY || 8);

// --- provider-specific -------------------------------------------------------
function toBody(req) {
  return { question: question(req), options: req.labels };
}
function fromResponse(json) {
  return { label: json.label ?? json.answer ?? json.choice, confidence: json.confidence ?? json.probability ?? 1 };
}
// -----------------------------------------------------------------------------

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', async () => {
  const reqs = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  let i = 0;
  const worker = async () => {
    while (i < reqs.length) {
      const req = reqs[i++];
      try {
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(toBody(req)) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const out = fromResponse(await res.json());
        process.stdout.write(JSON.stringify({ id: req.id, label: String(out.label).toLowerCase(), confidence: Number(out.confidence) }) + '\n');
      } catch (e) {
        process.stderr.write(`${req.id}: ${e.message}\n`);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
});
