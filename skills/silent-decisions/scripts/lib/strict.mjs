// sd extract-strict: run the extractor as its own headless session, in a copy of the
// room outside the repository. Nothing that has seen the plan writes any of its input:
// the prompt is a static file and the working directory contains stripped source only.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fail, loadRun } from './util.mjs';

// Override for other agents, e.g. SD_EXTRACTOR_CMD='codex exec -' . The prompt arrives on stdin, cwd is the room.
// --bare gives the cleanest isolation but needs ANTHROPIC_API_KEY; a subscription login needs plain -p.
const DEFAULT_CMD = `claude -p${process.env.ANTHROPIC_API_KEY ? ' --bare' : ''} --allowedTools Read,Glob,Grep,Write --permission-mode acceptEdits`;

export function extractStrict(args) {
  const { meta } = loadRun(args);
  const here = path.dirname(fileURLToPath(import.meta.url));
  const promptPath = path.resolve(here, '../../references/extractor-prompt.md');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-room-'));
  fs.cpSync(meta.room_root, tmp, { recursive: true });

  const prompt = fs.readFileSync(promptPath, 'utf8').replaceAll('$ARGUMENTS', tmp);
  const cmd = process.env.SD_EXTRACTOR_CMD || DEFAULT_CMD;
  if (args['dry-run']) {
    process.stdout.write(JSON.stringify({ cwd: tmp, cmd, prompt_file: promptPath }, null, 2) + '\n');
    return;
  }
  const res = spawnSync(cmd, { cwd: tmp, shell: true, input: prompt, encoding: 'utf8', maxBuffer: 1 << 26, timeout: Number(args.timeout || 1800) * 1000 });
  fs.writeFileSync(path.join(meta.room_root, 'extractor.log'), `$ ${cmd}\n--- stdout\n${res.stdout || ''}\n--- stderr\n${res.stderr || ''}\n`);
  if (res.status !== 0) {
    const tail = `${res.stdout || ''}\n${res.stderr || ''}`.trim().split('\n').slice(-15).join('\n');
    fail(`extractor command exited with ${res.status} (${res.error ? res.error.message : 'see below'}).\nCommand: ${cmd}\nRoom copy left at: ${tmp}\nFull log: ${path.join(meta.room_root, 'extractor.log')}\n${tail}`);
  }
  const produced = path.join(tmp, 'out', 'behaviours.json');
  if (!fs.existsSync(produced)) fail(`the extractor did not write ${produced}`);
  fs.mkdirSync(path.join(meta.room_root, 'out'), { recursive: true });
  fs.copyFileSync(produced, path.join(meta.room_root, 'out', 'behaviours.json'));
  fs.rmSync(tmp, { recursive: true, force: true });
  process.stdout.write(JSON.stringify({ wrote: path.join(meta.room_root, 'out', 'behaviours.json'), mode: 'strict' }, null, 2) + '\n');
}
