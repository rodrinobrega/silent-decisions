#!/usr/bin/env node
// Test adapter: answers from a fixture file, SD_CLASSIFIER_FIXTURE, keyed by request id
// (or by "pair|<behaviour>|<statement>" for both orderings; the swap is applied here).
// Unknown ids get "neither" with confidence 1 (or no answer when SD_FIXTURE_STRICT=1).
import fs from 'node:fs';
const fx = JSON.parse(fs.readFileSync(process.env.SD_CLASSIFIER_FIXTURE, 'utf8'));
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  for (const line of raw.split('\n').filter(Boolean)) {
    const req = JSON.parse(line);
    let a = fx[req.id];
    if (!a && req.id.startsWith('pair|')) {
      // pair|<b>|<s>|<order> or pair|<b>|<s>|c<k>|<order> (extra contraries); the fixture key drops the order.
      const parts = req.id.split('|');
      const order = parts.pop();
      const base = fx[parts.join('|')];
      if (base) {
        // base.label is "code" | "contrary" | "neither"; translate to a/b for this ordering.
        const label = base.label === 'neither' ? 'neither' : (base.label === 'code') === (order === 'ab') ? 'a' : 'b';
        a = { label, confidence: base.confidence ?? 1 };
        if (base.flaky && order === 'ba') a = { label: label === 'a' ? 'b' : 'a', confidence: a.confidence };
      }
    }
    if (!a) { if (process.env.SD_FIXTURE_STRICT) continue; a = { label: req.task === 'type' ? 'behavioural' : (req.task === 'realises' || req.task === 'census') ? 'no' : 'neither', confidence: 1 }; }
    process.stdout.write(JSON.stringify({ id: req.id, ...a }) + '\n');
  }
});
