// Generated files must match their sources byte for byte. Run after editing anything
// under skills/silent-decisions/references/:  npm run sync
//  - skills/sd-extract/SKILL.md  = frontmatter + references/extractor-prompt.md
//  - agents/<role>.md            = frontmatter + references/roles/<role>.md
import fs from 'node:fs';

const ref = 'skills/silent-decisions/references';
const front = `---
name: sd-extract
description: Internal step of silent-decisions. Runs the blind behaviour extractor in an isolated subagent. Invoked by the silent-decisions skill with the room path as its argument; not meant to be called directly.
context: fork
agent: sd-extractor
user-invocable: false
---

`;
export function build() {
  const out = { 'skills/sd-extract/SKILL.md': front + fs.readFileSync(`${ref}/extractor-prompt.md`, 'utf8') };
  const fm = JSON.parse(fs.readFileSync('tools/agent-frontmatter.json', 'utf8'));
  for (const [name, head] of Object.entries(fm)) {
    out[`agents/${name}.md`] = `---\n${head}\n---\n\n` + fs.readFileSync(`${ref}/roles/${name}.md`, 'utf8');
  }
  return out;
}
if (process.argv[1] && process.argv[1].endsWith('sync-extractor.mjs')) {
  for (const [p, text] of Object.entries(build())) { fs.writeFileSync(p, text); console.log('synced', p); }
}
