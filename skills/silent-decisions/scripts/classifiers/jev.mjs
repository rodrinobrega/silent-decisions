#!/usr/bin/env node
// Jev (TypeSafe AI) adapter, via OpenRouter by default. Reads JSONL requests on stdin,
// writes JSONL answers on stdout.
//
//   OPENROUTER_API_KEY   (default route)    endpoint https://openrouter.ai/api/v1/systemone, model jev-1.13
//   TYPESAFE_API_KEY     (direct route)     endpoint https://api.typesafe.ai/v1/systemone,  model jev-latest
//   SD_JEV_URL / SD_JEV_MODEL               overrides
//   SD_CLASSIFIER_CONCURRENCY               parallel requests (default 8)
//
// One systemone call per request: the `state` is the pair, the single question is the
// task. Each task maps to a Jev question type: decides -> choice(a,b,neither),
// realises/census -> noul, type -> choice. Confidence comes back from the model.
const direct = !process.env.OPENROUTER_API_KEY && process.env.TYPESAFE_API_KEY;
const url = process.env.SD_JEV_URL || (direct ? 'https://api.typesafe.ai/v1/systemone' : 'https://openrouter.ai/api/v1/systemone');
const key = process.env.OPENROUTER_API_KEY || process.env.TYPESAFE_API_KEY;
const model = process.env.SD_JEV_MODEL || (direct ? 'jev-latest' : 'jev-1.13');
if (!key) { process.stderr.write('set OPENROUTER_API_KEY (or TYPESAFE_API_KEY)\n'); process.exit(2); }
const concurrency = Number(process.env.SD_CLASSIFIER_CONCURRENCY || 8);

function build(req) {
  if (req.task === 'decides') {
    return {
      state: { plan_sentence: req.statement, situation: { given: req.given, when: req.when }, outcome_a: req.outcome_a, outcome_b: req.outcome_b },
      questions: { q: { type: 'choice', instructions: 'Read plan_sentence literally, as a contract. Which outcome does it REQUIRE in this situation?',
        criteria: { a: 'a system producing outcome_b would violate the sentence', b: 'a system producing outcome_a would violate the sentence', neither: 'a system producing either outcome would satisfy the sentence, or the sentence is not about this situation' } } },
    };
  }
  if (req.task === 'realises') {
    return {
      state: { plan_sentence: req.statement, test: { given: req.given, when: req.when, then: req.outcome } },
      questions: { q: { type: 'noul', instructions: 'Is this test an instance of what plan_sentence describes, so that the sentence would be at least partly untrue of a system that failed the test? It does not matter whether the sentence settles every detail of the outcome.' } },
    };
  }
  if (req.task === 'census') {
    return {
      state: { plan_sentence: req.statement, code_decision: { kind: req.kind, code: req.code, location: req.location } },
      questions: { q: { type: 'noul', instructions: 'code_decision is a place in the source where the implementer chose a value, threshold, default, rounding, ordering, or rejection rule. Does plan_sentence explicitly decide that choice, so that a different choice would contradict the sentence?' } },
    };
  }
  if (req.task === 'type') {
    return {
      state: { plan_sentence: req.statement },
      questions: { q: { type: 'choice', instructions: 'Classify this sentence from a software plan.',
        criteria: { behavioural: 'describes something the running system does that a user or caller could observe', structural: 'technology, architecture, dependencies, code organisation', process: 'scope notes, ways of working, out-of-scope lists, non-goals' } } },
    };
  }
  return null;
}

function parse(req, json) {
  const a = json && json.answers && json.answers.q;
  if (!a) return null;
  if (a.type === 'noul') {
    const p = Number(a.noul);
    return { label: p >= 0.5 ? 'yes' : 'no', confidence: p >= 0.5 ? p : 1 - p, raw: a };
  }
  return { label: String(a.choice).toLowerCase(), confidence: Number(a.confidence ?? (a.probabilities && a.probabilities[a.choice]) ?? 0), raw: a };
}

async function call(body, attempt = 0) {
  const res = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ model, ...body }) });
  if ((res.status === 429 || res.status === 529) && attempt < 6) {
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    return call(body, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', async () => {
  const reqs = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  let i = 0, cost = 0, tokens = 0;
  const worker = async () => {
    while (i < reqs.length) {
      const req = reqs[i++];
      const body = build(req);
      if (!body) continue;
      try {
        const json = await call(body);
        const out = parse(req, json);
        if (json.usage) { tokens += Number(json.usage.input_tokens || 0); cost += Number(json.usage.cost || 0); }
        if (out) process.stdout.write(JSON.stringify({ id: req.id, label: out.label, confidence: out.confidence, model: json.model || model }) + '\n');
      } catch (e) { process.stderr.write(`${req.id}: ${e.message}\n`); }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  process.stderr.write(`jev: ${reqs.length} requests, ${tokens} input tokens${cost ? `, $${cost.toFixed(4)}` : ''}\n`);
});
