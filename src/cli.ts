#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { parseArgs } from 'node:util';
import { discover } from './discovery.js';
import { Store } from './store.js';
import { createMission, type MissionInput } from './workspace.js';
import { executeMission } from './engine.js';
import { CliAgent } from './agents.js';
import { LooperEngine } from './looper.js';

const help = `AgentHarbor — local multi-agent missions (alpha)

  agentharbor doctor
  agentharbor create --file /absolute/path/mission.json
  agentharbor run --id <mission-id>
  agentharbor show --id <mission-id>
  agentharbor list
  agentharbor looper-status --config /absolute/path/config.toml
  agentharbor looper-projects --config /absolute/path/config.toml
  agentharbor looper-loops --config /absolute/path/config.toml
  agentharbor looper-work --config <path> --project <id> --issue <number>
  agentharbor looper-review --config <path> --project <id> --pr owner/repo#42

All commands accept --home <absolute-state-directory>. Ctrl+C pauses a running
local mission. Run it again with the same ID to resume within its round budget.
No desktop UI or automatic merge is shipped in this alpha.
`;
async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    home: { type: 'string' }, file: { type: 'string' }, id: { type: 'string' }, config: { type: 'string' },
    project: { type: 'string' }, issue: { type: 'string' }, pr: { type: 'string' }, help: { type: 'boolean' },
  }});
  const command = positionals[0];
  if (values.help || !command) { console.log(help); return; }
  const state = new Store(resolve(values.home ?? process.env.AGENTHARBOR_HOME ?? join(homedir(), '.agentharbor')));
  const required = (name: 'file' | 'id' | 'config' | 'project' | 'issue' | 'pr') => { const value = values[name]; if (!value) throw new Error(`Provide --${name}`); return value; };
  let result: unknown;
  if (command === 'doctor') result = { tools: await discover(), note: 'Installed/version probes only. Authentication is not checked.' };
  else if (command === 'create') result = await createMission(JSON.parse(await readFile(resolve(required('file')), 'utf8')) as MissionInput, state);
  else if (command === 'show') result = await state.get(required('id'));
  else if (command === 'list') result = (await state.list()).map(({ id, goal, phase, round, maxRounds }) => ({ id, goal, phase, round, maxRounds }));
  else if (command === 'run') {
    const id = required('id'), mission = await state.get(id), abort = new AbortController();
    const pause = () => abort.abort();
    process.once('SIGINT', pause); process.once('SIGTERM', pause);
    try {
      const outcome = await executeMission(id, { store: state, builder: new CliAgent(mission.builder), reviewer: new CliAgent(mission.reviewer), signal: abort.signal,
        onEvent: m => console.error(`${m.phase}: ${m.events.at(-1)?.message}`) });
      result = outcome;
      if (outcome.phase !== 'completed') process.exitCode = 2;
    } finally { process.removeListener('SIGINT', pause); process.removeListener('SIGTERM', pause); }
  } else if (command.startsWith('looper-')) {
    const engine = new LooperEngine(resolve(required('config'))), cwd = process.cwd();
    if (command === 'looper-status') result = await engine.status(cwd);
    else if (command === 'looper-projects') result = await engine.projects(cwd);
    else if (command === 'looper-loops') result = await engine.loops(cwd);
    else if (command === 'looper-work') result = await engine.work(required('project'), Number(required('issue')), cwd);
    else if (command === 'looper-review') result = await engine.review(required('pr'), required('project'), cwd);
    else throw new Error(`Unknown command: ${command}`);
  } else throw new Error(`Unknown command: ${command}`);
  console.log(JSON.stringify(result, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
