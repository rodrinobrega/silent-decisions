// Deterministic checks on model output: census coverage, quote verification and
// verdict rules, leave-one-out control, leak check.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readJson, writeJson, fail, loadRun, rel, normalizeWs, shingles, walk } from './util.mjs';

// ---------- census coverage -------------------------------------------------

/** Every census item must be claimed by a verified behaviour or waived with a reason. */
export function censusCoverage(args) {
  const { proj, runDir } = loadRun(args);
  const census = readJson(path.join(runDir, 'census.json'));
  const beh = readJson(path.join(runDir, 'behaviours.json'));
  const results = readJson(path.join(runDir, 'results.json')).results;
  const verified = new Set(results.filter((r) => r.status === 'verified').map((r) => r.id));
  const known = new Set(census.map((c) => c.id));

  const coveredBy = new Map();
  const unknownRefs = [];
  for (const b of beh.behaviours || []) {
    for (const c of b.covers || []) {
      if (!known.has(c)) { unknownRefs.push({ behaviour: b.id, census_id: c }); continue; }
      if (!verified.has(b.id)) continue; // a refuted or vacuous scenario covers nothing
      if (!coveredBy.has(c)) coveredBy.set(c, []);
      coveredBy.get(c).push(b.id);
    }
  }
  const waived = new Map();
  for (const w of beh.immaterial || []) {
    if (known.has(w.census_id) && normalizeWs(w.reason || '').length >= 8) waived.set(w.census_id, w.reason);
  }
  const uncovered = census.filter((c) => !coveredBy.has(c.id) && !waived.has(c.id));
  const out = {
    total: census.length,
    covered: coveredBy.size,
    waived: waived.size,
    uncovered: uncovered.length,
    // "declared": the extractor claims the link; v0.1 does not yet confirm it with line coverage.
    basis: 'declared',
    uncovered_items: uncovered,
    waived_items: [...waived].map(([census_id, reason]) => ({ census_id, reason })),
    unknown_refs: unknownRefs,
  };
  writeJson(path.join(runDir, 'census.coverage.json'), out);
  // Feed the gaps back to the extractor through the room (code-derived only).
  const meta = readJson(path.join(runDir, 'run.json'));
  writeJson(path.join(meta.room_root, 'census.uncovered.json'), uncovered);
  process.stdout.write(JSON.stringify({ wrote: rel(proj, path.join(runDir, 'census.coverage.json')), total: out.total, covered: out.covered, waived: out.waived, uncovered: out.uncovered }, null, 2) + '\n');
}

// ---------- quote verification and verdict rules -----------------------------

// A plan section that lists what is NOT being built. Its lines are typed by where they sit, not by the
// classifier: run 004 typed "Persistence, authentication, exchange-rate lookup." as behavioural in all
// three repetitions, and it sourced a real silent decision each time.
export const OUT_OF_SCOPE_HEADING = /\b(out of scope|not in scope|non-goals?|excluded|won'?t do)\b/i;

/** Statements that cannot source (id -> type): typed structural/process, or under an out-of-scope heading. */
export function nonSourcingStatements(trace, statements = []) {
  const m = new Map((trace.statements || []).filter((s) => s.type === 'structural' || s.type === 'process').map((s) => [s.id, s.type]));
  for (const s of statements) if (s.source === 'plan' && OUT_OF_SCOPE_HEADING.test(s.heading || '')) m.set(s.id, 'out-of-scope');
  return m;
}

function quoteIndex(statements, hiddenIds = new Set()) {
  return statements.filter((s) => !hiddenIds.has(s.id)).map((s) => ({ id: s.id, text: normalizeWs(s.text).toLowerCase() }));
}

function findQuote(index, quote) {
  const q = normalizeWs(quote || '').toLowerCase().replace(/^["'“”]+|["'“”.]+$/g, '');
  if (q.split(' ').length < 3) return null; // too short to pin anything down
  return index.find((s) => s.text.includes(q)) || null;
}

/**
 * Apply the mechanical rules to a tracer output:
 *  - every quote must appear verbatim in a plan or ledger statement, else it is dropped;
 *  - `stated` needs at least one surviving quote;
 *  - `entailed` needs at least two surviving quotes from different statements;
 *  - a quote from a statement typed `structural` or `process` is dropped: such a statement cannot decide
 *    a behaviour (runs 001 and 002: "Persistence, currencies, authentication." sourced the open()
 *    no-op, which hid a silent decision);
 *  - an adversary finding that the contrary also satisfies the quotes flips the verdict;
 *  - anything that fails a rule becomes `unsourced` (default to unsourced).
 */
export function applyRules(forward, index, adversary = [], nonSourcing = new Map()) {
  const adv = new Map(adversary.map((a) => [a.behaviour_id, a]));
  return forward.map((f) => {
    const notes = [];
    const quotes = [];
    for (const q of f.quotes || []) {
      const hit = findQuote(index, q.text);
      if (!hit) { notes.push(`quote not found in plan: "${normalizeWs(q.text).slice(0, 80)}"`); continue; }
      if (nonSourcing.has(hit.id)) { notes.push(`${hit.id} is typed ${nonSourcing.get(hit.id)}; only behavioural statements can source`); continue; }
      if (q.statement_id && q.statement_id !== hit.id) notes.push(`quote attributed to ${q.statement_id}, found in ${hit.id}`);
      quotes.push({ statement_id: hit.id, text: normalizeWs(q.text) });
    }
    let verdict = ['stated', 'entailed', 'unsourced'].includes(f.verdict) ? f.verdict : 'unsourced';
    if (verdict === 'stated' && quotes.length < 1) { verdict = 'unsourced'; notes.push('stated without a verifiable quote'); }
    if (verdict === 'entailed') {
      const distinct = new Set(quotes.map((q) => q.statement_id));
      if (distinct.size < 2) { verdict = 'unsourced'; notes.push('entailed needs verifiable quotes from two or more statements'); }
      else if (normalizeWs(f.reasoning || '').length < 20) { verdict = 'unsourced'; notes.push('entailed without reasoning'); }
    }
    const a = adv.get(f.behaviour_id);
    if (a && verdict !== 'unsourced' && a.contrary_satisfies_quotes === true) {
      verdict = 'unsourced';
      notes.push('flip test: the contrary behaviour also satisfies the quoted text');
    }
    return {
      behaviour_id: f.behaviour_id,
      verdict,
      tracer_verdict: f.verdict,
      quotes,
      reasoning: f.reasoning || '',
      contrary: (a && a.contrary_then) || (f.contrary && f.contrary.then) || '',
      contrary_argument: (a && a.argument) || (f.contrary && f.contrary.argument) || '',
      cluster: f.cluster || 'unclustered',
      ...(f.contradicted_by ? { contradicted_by: f.contradicted_by } : {}),
      notes,
    };
  });
}

export function checkTrace(args) {
  const { proj, runDir } = loadRun(args);
  const statements = readJson(path.join(runDir, 'plan.statements.json'));
  const tracePath = path.join(runDir, 'trace.json');
  if (!fs.existsSync(tracePath)) fail(`missing ${rel(proj, tracePath)}`);
  const trace = readJson(tracePath);
  const advPath = path.join(runDir, 'adversary.json');
  const adversary = fs.existsSync(advPath) ? (readJson(advPath).findings || []) : [];
  const results = readJson(path.join(runDir, 'results.json')).results;
  const traceable = new Set(results.filter((r) => r.status === 'verified' && r.on_base !== 'preexisting').map((r) => r.id));

  const forward = applyRules((trace.forward || []).filter((f) => traceable.has(f.behaviour_id)), quoteIndex(statements), adversary, nonSourcingStatements(trace, statements));
  const missing = [...traceable].filter((id) => !forward.some((f) => f.behaviour_id === id));
  for (const id of missing) {
    forward.push({ behaviour_id: id, verdict: 'unsourced', tracer_verdict: null, quotes: [], reasoning: '', contrary: '', contrary_argument: '', cluster: 'unclustered', notes: ['tracer returned no verdict'] });
  }

  // Reverse direction. Only behavioural plan statements count; a statement is realised
  // if a verified quote cites it or the tracer links it to a verified behaviour.
  const types = new Map((trace.statements || []).map((s) => [s.id, s.type]));
  for (const s of statements) if (s.source === 'plan' && OUT_OF_SCOPE_HEADING.test(s.heading || '')) types.set(s.id, 'out-of-scope');
  // A quote that exists but fails the flip test still shows the statement is exercised
  // (the code does let customers withdraw; it is the overdraft policy that is unsourced).
  const cited = new Set(forward.flatMap((f) => f.quotes.map((q) => q.statement_id)));
  const linked = new Map((trace.reverse || []).map((r) => [r.statement_id, (r.realised_by || []).filter((b) => traceable.has(b) || results.some((x) => x.id === b && x.status === 'verified'))]));
  // A verified behaviour whose outcome the statement appears to forbid (pairwise mode: the statement
  // required one of the behaviour's contraries). That is a lead on a dropped requirement, never a verdict.
  const contradicted = new Map((trace.reverse || []).filter((r) => (r.contradicted_by || []).length).map((r) => [r.statement_id, r.contradicted_by]));
  const reverse = statements.filter((s) => s.source === 'plan').map((s) => {
    const type = types.get(s.id) || 'untyped';
    let status = 'not_behavioural';
    if (type === 'behavioural' || type === 'untyped') {
      if (contradicted.has(s.id)) status = 'contradicted';
      else status = cited.has(s.id) || (linked.get(s.id) || []).length ? 'realised' : 'candidate_unrealised';
    }
    return { statement_id: s.id, type, status, realised_by: linked.get(s.id) || [], ...(contradicted.has(s.id) ? { contradicted_by: contradicted.get(s.id) } : {}) };
  });
  // Which statements get a reverse probe. "all" (default since run 002): every behavioural statement,
  // because in run 001 the trace marked a dropped requirement "realised" on the strength of two
  // unrelated scenarios and nothing executed it. "candidates": only unrealised or contradicted ones.
  const probeScope = String(args['probe-scope'] || process.env.SD_PROBE_SCOPE || 'all');
  const probeTargets = reverse.filter((r) => r.status !== 'not_behavioural' && (probeScope === 'all' || r.status !== 'realised')).map((r) => r.statement_id);

  const out = { mode: trace.mode || 'llm-tracer', ...(trace.classifier ? { classifier: trace.classifier } : {}), forward, reverse, probe_scope: probeScope, probe_targets: probeTargets };
  writeJson(path.join(runDir, 'trace.checked.json'), out);
  const n = (v) => forward.filter((f) => f.verdict === v).length;
  process.stdout.write(JSON.stringify({
    wrote: rel(proj, path.join(runDir, 'trace.checked.json')),
    stated: n('stated'), entailed: n('entailed'), unsourced: n('unsourced'),
    downgraded_by_rules: forward.filter((f) => f.tracer_verdict && f.tracer_verdict !== f.verdict).length,
    candidate_unrealised: reverse.filter((r) => r.status === 'candidate_unrealised').map((r) => r.statement_id),
    contradicted: reverse.filter((r) => r.status === 'contradicted').map((r) => r.statement_id),
    probe_scope: probeScope,
    probe_targets: probeTargets,
  }, null, 2) + '\n');
}

// ---------- leave-one-out control --------------------------------------------

export function looPrepare(args) {
  const { proj, runDir } = loadRun(args);
  const k = Number(args.k || 3);
  const statements = readJson(path.join(runDir, 'plan.statements.json'));
  const checked = readJson(path.join(runDir, 'trace.checked.json'));
  const behaviours = readJson(path.join(runDir, 'behaviours.json')).behaviours;

  // Statements that are the sole cited source of at least one `stated` behaviour.
  const sole = new Map();
  for (const f of checked.forward) {
    if (f.verdict !== 'stated') continue;
    const ids = [...new Set(f.quotes.map((q) => q.statement_id))];
    if (ids.length !== 1 || !ids[0].startsWith('P-')) continue;
    if (!sole.has(ids[0])) sole.set(ids[0], []);
    sole.get(ids[0]).push(f.behaviour_id);
  }
  const hidden = [...sole.keys()].sort().slice(0, k);
  const looDir = path.join(runDir, 'loo');
  fs.rmSync(looDir, { recursive: true, force: true });
  fs.mkdirSync(looDir, { recursive: true });
  if (hidden.length === 0) {
    writeJson(path.join(looDir, 'control.json'), { status: 'not_applicable', reason: 'no behaviour is stated by a single plan statement', hidden: [] });
    process.stdout.write(JSON.stringify({ status: 'not_applicable' }, null, 2) + '\n');
    return;
  }

  // Redact by blanking the lines of the hidden statements, keeping line numbers stable.
  const lines = fs.readFileSync(path.join(runDir, 'plan.md'), 'utf8').split('\n');
  const hiddenSet = new Set(hidden);
  for (const s of statements) {
    if (!hiddenSet.has(s.id)) continue;
    for (let i = s.line_start - 1; i < s.line_end; i++) lines[i] = '';
  }
  // Blanking a whole block can remove neighbours that share its lines; hide those too so scoring is fair.
  const collateral = statements.filter((s) => s.source === 'plan' && !hiddenSet.has(s.id)
    && hidden.some((h) => { const hs = statements.find((x) => x.id === h); return s.line_start <= hs.line_end && s.line_end >= hs.line_start; })).map((s) => s.id);

  fs.writeFileSync(path.join(looDir, 'plan.redacted.md'), lines.join('\n'));
  const gone = new Set([...hidden, ...collateral]);
  writeJson(path.join(looDir, 'plan.statements.redacted.json'), statements.filter((s) => !gone.has(s.id)));
  const subsetIds = new Set(hidden.flatMap((h) => sole.get(h)));
  const subset = behaviours.filter((b) => subsetIds.has(b.id)).map(({ test, covers, ...keep }) => keep);
  writeJson(path.join(looDir, 'behaviours.subset.json'), { behaviours: subset });
  writeJson(path.join(looDir, 'control.json'), { status: 'prepared', hidden, collateral, behaviours: [...subsetIds] });
  process.stdout.write(JSON.stringify({
    status: 'prepared', hidden_count: hidden.length, behaviours: subset.length,
    tracer_inputs: { plan: rel(proj, path.join(looDir, 'plan.redacted.md')), statements: rel(proj, path.join(looDir, 'plan.statements.redacted.json')), behaviours: rel(proj, path.join(looDir, 'behaviours.subset.json')) },
    tracer_output: rel(proj, path.join(looDir, 'trace.json')),
  }, null, 2) + '\n');
}

export function looScore(args) {
  const { proj, runDir } = loadRun(args);
  const looDir = path.join(runDir, 'loo');
  const control = readJson(path.join(looDir, 'control.json'));
  if (control.status === 'not_applicable') { process.stdout.write(JSON.stringify(control, null, 2) + '\n'); return; }
  const tracePath = path.join(looDir, 'trace.json');
  if (!fs.existsSync(tracePath)) fail(`missing ${rel(proj, tracePath)}: re-run the tracer on the redacted plan first`);
  const statements = readJson(path.join(runDir, 'plan.statements.json'));
  const hidden = new Set([...control.hidden, ...(control.collateral || [])]);
  const visible = quoteIndex(statements, hidden);
  const hiddenIdx = quoteIndex(statements.filter((s) => hidden.has(s.id)));
  const raw = readJson(tracePath).forward || [];
  // Same typing as the main pass, so the control measures the same rules.
  const mainTrace = path.join(runDir, 'trace.json');
  const nonSourcing = nonSourcingStatements(fs.existsSync(mainTrace) ? readJson(mainTrace) : {}, statements);

  const rows = control.behaviours.map((id) => {
    const f = raw.find((x) => x.behaviour_id === id);
    if (!f) return { behaviour_id: id, outcome: 'flipped', note: 'no verdict returned, counted as unsourced' };
    // Quoting text that was removed means the tracer saw the full plan or made the quote up.
    const citedHidden = (f.quotes || []).some((q) => findQuote(hiddenIdx, q.text) && !findQuote(visible, q.text));
    const [ruled] = applyRules([f], visible, [], nonSourcing);
    if (citedHidden) return { behaviour_id: id, outcome: 'cited_hidden', quotes: f.quotes };
    if (ruled.verdict === 'unsourced') return { behaviour_id: id, outcome: 'flipped' };
    // Still sourced from another passage: redundancy in the plan, or over-matching. A person decides.
    return { behaviour_id: id, outcome: 'resourced', verdict: ruled.verdict, quotes: ruled.quotes };
  });
  const c = (o) => rows.filter((r) => r.outcome === o).length;
  const status = c('cited_hidden') > 0 ? 'failed' : c('resourced') > 0 ? 'review' : 'passed';
  const out = { ...control, status, flipped: c('flipped'), resourced: c('resourced'), cited_hidden: c('cited_hidden'), rows };
  writeJson(path.join(looDir, 'control.json'), out);
  process.stdout.write(JSON.stringify({ status, flipped: out.flipped, resourced: out.resourced, cited_hidden: out.cited_hidden }, null, 2) + '\n');
}

// ---------- leak check -------------------------------------------------------

/** Did plan text reach the extractor? Compares extractor prose with the plan, ignoring anything also present in the code. */
// ---------- extractor transcript audit ---------------------------------------

/**
 * Reconstruct the extractor's tool calls from its Claude Code session transcript, for runs without the
 * confinement hook. Claude Code stores each session under ~/.claude/projects/<cwd with every
 * non-alphanumeric character replaced by '-'>/<session>.jsonl. Run 002's leak check was "suspect" on a
 * phrase the prompt itself invites; clearing it took a manual read of this file.
 * Flags any tool input that names the plan file or reaches outside the room.
 */
export function auditTranscript(session, { planName = 'plan.md', projectsDir = process.env.SD_TRANSCRIPTS_DIR || path.join(os.homedir(), '.claude', 'projects') } = {}) {
  const dir = path.join(projectsDir, session.cwd.replace(/[^a-zA-Z0-9]/g, '-'));
  if (!fs.existsSync(dir)) return { source: 'transcript', found: false, looked_in: dir };
  const started = Date.parse(session.started || 0) || 0;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(dir, f));
  const rooms = [session.cwd, session.cwd_as_created].filter(Boolean);
  const calls = [];
  const results = new Map();
  let planMentions = 0;
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    planMentions += raw.split(planName).length - 1;
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let ev;
      try { ev = JSON.parse(line); } catch { continue; }
      if (ev.timestamp && Date.parse(ev.timestamp) < started - 60000) continue;
      for (const c of (Array.isArray(ev.message?.content) ? ev.message.content : [])) {
        if (c.type === 'tool_use') calls.push({ id: c.id, tool: c.name, input: JSON.stringify(c.input || {}) });
        if (c.type === 'tool_result') results.set(c.tool_use_id, JSON.stringify(c.content || '') + (c.is_error ? ' [error]' : ''));
      }
    }
  }
  // Only what the call can reach counts: a path argument, or the text of a shell command. The content a
  // Write puts into a file is data (run 004: a generator script containing "../census.json" was read as
  // an escape). Relative "../" paths are resolved against the command's working directory (its leading
  // `cd`, else the room), so `cd <room>/out && require('../census.json')` stays inside the room.
  const inRoom = (p) => rooms.some((r) => p === r || p.startsWith(r + '/'));
  const outside = (tool, input) => {
    let obj = {};
    try { obj = JSON.parse(input); } catch { /* keep {} */ }
    const text = tool === 'Bash' ? String(obj.command || '') : [obj.file_path, obj.path, obj.pattern, obj.notebook_path].filter(Boolean).join(' ');
    const cd = text.match(/(?:^|[;&|]\s*)cd\s+("[^"]+"|'[^']+'|[^\s;&|]+)/);
    const base = cd ? path.resolve(session.cwd, cd[1].replace(/^["']|["']$/g, '')) : session.cwd;
    const abs = text.match(/(?:\/(?:Users|home|private|var|tmp|etc|opt)\/[^\s"'`;|&)]+)/g) || [];
    const rel = (text.match(/(?:^|[\s"'`(=])((?:\.\.\/)+[^\s"'`;|&)]*)/g) || []).map((m) => m.replace(/^[\s"'`(=]/, ''));
    return abs.some((p) => !inRoom(p)) || !inRoom(base) && Boolean(cd) || rel.some((p) => !inRoom(path.resolve(base, p))) || /(^|[\s"'])~\//.test(text);
  };
  const denied = (c) => /requires approval|permission (?:was |has been )?denied/i.test(results.get(c.id) || '');
  const rows = calls.map((c) => ({ tool: c.tool, input: c.input.slice(0, 300), outside_room: outside(c.tool, c.input), mentions_plan: c.input.includes(planName), denied: denied(c) }));
  return {
    source: 'transcript',
    found: true,
    sessions: files.map((f) => path.basename(f)),
    calls: rows.length,
    by_tool: rows.reduce((m, r) => ({ ...m, [r.tool]: (m[r.tool] || 0) + 1 }), {}),
    plan_mentions: planMentions,
    outside_room: rows.filter((r) => r.outside_room && !r.denied),
    denied: rows.filter((r) => r.denied).length,
    tool_calls: rows,
  };
}

export function leakCheck(args) {
  const { proj, runDir, meta } = loadRun(args);
  const n = Number(args.n || 6);
  const plan = fs.readFileSync(path.join(runDir, 'plan.md'), 'utf8');
  const behPath = path.join(runDir, 'behaviours.json');
  const rawBeh = fs.readFileSync(behPath, 'utf8');
  const beh = JSON.parse(rawBeh);
  const prose = (beh.behaviours || []).map((b) => [b.title, b.given, b.when, b.then].join(' . ')).join(' . ');
  const code = walk(path.join(meta.room_root, 'cleanroom'), new Set()).map((f) => fs.readFileSync(f, 'utf8')).join('\n');

  const planSh = shingles(plan, n);
  const codeSh = shingles(code, n);
  const hits = [...shingles(prose, n)].filter((s) => planSh.has(s) && !codeSh.has(s));
  const nonceSeen = rawBeh.includes(meta.nonce);

  // Audit log written by the confinement hook, when the plugin is installed.
  const auditPath = path.join(runDir, 'audit.jsonl');
  let audit = null;
  if (fs.existsSync(auditPath)) {
    const rows = fs.readFileSync(auditPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    audit = { calls: rows.length, denied: rows.filter((r) => r.decision === 'deny').length, denied_targets: rows.filter((r) => r.decision === 'deny').map((r) => r.target).slice(0, 20) };
  }
  // Without the hook, fall back to the session transcript of a strict-mode extractor.
  const sessionPath = path.join(runDir, 'extractor.session.json');
  if (!audit && fs.existsSync(sessionPath)) audit = auditTranscript(readJson(sessionPath), { planName: path.basename(meta.plan_path || 'plan.md') });
  // The transcript can convict (the extractor named the plan or read outside its room) and it can
  // explain a phrase overlap (it only read the room), but it never turns "suspect" into "clean":
  // the overlapping phrases stay listed for a person to judge.
  const transcriptLeak = audit && audit.source === 'transcript' && audit.found && (audit.plan_mentions > 0 || audit.outside_room.length > 0);
  const status = nonceSeen || transcriptLeak ? 'contaminated' : hits.length ? 'suspect' : 'clean';
  const review = hits.length && !nonceSeen && audit && audit.source === 'transcript' && audit.found && !transcriptLeak
    ? 'transcript shows no access outside the room and no mention of the plan: the overlap is phrasing, not a leak'
    : undefined;
  const out = { status, ...(review ? { review } : {}), shingle_size: n, overlapping_phrases: hits.slice(0, 50), nonce_seen: nonceSeen, extractor_reported_nonce: beh.nonce_seen || [], audit };
  writeJson(path.join(runDir, 'leak.json'), out);
  const auditSummary = audit && (({ tool_calls, ...rest }) => rest)(audit);
  process.stdout.write(JSON.stringify({ wrote: rel(proj, path.join(runDir, 'leak.json')), status, ...(review ? { review } : {}), overlapping_phrases: hits.length, nonce_seen: nonceSeen, audit: auditSummary }, null, 2) + '\n');
}
