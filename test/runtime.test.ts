import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/store.js';
import { createMission, fingerprint, git, validateInput } from '../src/workspace.js';
import { executeMission, parseReview } from '../src/engine.js';
import { runProcess } from '../src/process.js';
import type { Agent, AgentRequest, HarnessId, Runner } from '../src/types.js';

async function fixture(t: { after(fn: () => Promise<void>): void }) {
  const dir = await mkdtemp(join(tmpdir(), 'harbor-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await git(['init', '--quiet'], dir);
  await git(['config', 'user.email', 'test@example.invalid'], dir);
  await git(['config', 'user.name', 'AgentHarbor Test'], dir);
  await writeFile(join(dir, 'answer.txt'), 'unfinished\n');
  await git(['add', '.'], dir); await git(['commit', '--quiet', '-m', 'fixture'], dir);
  const store = new Store(join(dir, '.git', 'harbor-test'));
  const mission = await createMission({ repository: dir, goal: 'Make answer.txt say done', acceptance: ['answer.txt contains done'],
    builder: 'codex', reviewer: 'claude', checks: [{ file: process.execPath, args: ['-e', "if(require('fs').readFileSync('answer.txt','utf8').trim()!=='done') process.exit(1)"] }], maxRounds: 3 }, store);
  return { dir, store, mission };
}
const agent = (id: HarnessId, fn: (request: AgentRequest) => Promise<string>): Agent => ({ id, run: fn });
const approve = JSON.stringify({ verdict: 'approve', summary: 'Acceptance verified', findings: [] });

test('verification, rejection, automatic rework and independent approval use the same source fingerprint', async t => {
  const { store, mission, dir } = await fixture(t);
  let builds = 0, reviews = 0;
  const result = await executeMission(mission.id, { store,
    builder: agent('codex', async request => { builds++; await writeFile(join(request.workspace, 'answer.txt'), 'done\n'); return 'implemented'; }),
    reviewer: agent('claude', async () => { reviews++; return reviews === 1 ? JSON.stringify({ verdict: 'rework', summary: 'Add rationale', findings: ['Document why it is done'] }) : approve; }) });
  assert.equal(result.phase, 'completed'); assert.equal(builds, 2); assert.equal(reviews, 2);
  assert.equal(result.review?.fingerprint, result.evidence.at(-1)?.fingerprint);
  assert.equal((await store.get(mission.id)).phase, 'completed');
  assert.equal(await readFile(join(dir, 'answer.txt'), 'utf8'), 'unfinished\n');
  assert.equal(result.events.some(x => x.phase === 'rework'), true);
});

test('failed checks return to builder without asking reviewer; exhaustion never completes', async t => {
  const { store, mission } = await fixture(t); let reviews = 0;
  const result = await executeMission(mission.id, { store, builder: agent('codex', async () => 'done'), reviewer: agent('claude', async () => { reviews++; return approve; }) });
  assert.equal(result.phase, 'blocked'); assert.equal(result.round, 3); assert.equal(reviews, 0);
  assert.equal(result.evidence.every(x => x.code !== 0), true);
});

test('invalid review output fails closed', async t => {
  const { store, mission } = await fixture(t);
  const result = await executeMission(mission.id, { store,
    builder: agent('codex', async r => { await writeFile(join(r.workspace, 'answer.txt'), 'done'); return 'done'; }),
    reviewer: agent('claude', async () => 'Looks good, approved!') });
  assert.equal(result.phase, 'blocked'); assert.match(result.events.at(-1)!.message, /valid JSON/);
});

test('review cannot approve files it changed after verification', async t => {
  const { store, mission } = await fixture(t);
  const result = await executeMission(mission.id, { store,
    builder: agent('codex', async r => { await writeFile(join(r.workspace, 'answer.txt'), 'done'); return 'done'; }),
    reviewer: agent('claude', async r => { await writeFile(join(r.workspace, 'answer.txt'), 'tampered'); return approve; }) });
  assert.equal(result.phase, 'blocked'); assert.match(result.events.at(-1)!.message, /changed during review/);
});

test('verification that mutates tracked source invalidates evidence', async t => {
  const { store, mission } = await fixture(t);
  const runner: Runner = async () => { await writeFile(join(mission.workspace, 'answer.txt'), 'mutated'); return { code: 0, stdout: 'pass', stderr: '' }; };
  const result = await executeMission(mission.id, { store, runner, builder: agent('codex', async () => 'done'), reviewer: agent('claude', async () => approve) });
  assert.equal(result.phase, 'blocked'); assert.match(result.events.at(-1)!.message, /changed during verification/);
});

test('pause persists progress and resumes through a new Store instance', async t => {
  const { store, mission } = await fixture(t), abort = new AbortController();
  const paused = await executeMission(mission.id, { store, signal: abort.signal,
    builder: agent('codex', async () => { abort.abort(); throw new Error('paused'); }), reviewer: agent('claude', async () => approve) });
  assert.equal(paused.phase, 'paused');
  const resumed = await executeMission(mission.id, { store: new Store(store.root),
    builder: agent('codex', async r => { await writeFile(join(r.workspace, 'answer.txt'), 'done'); return 'done'; }), reviewer: agent('claude', async () => approve) });
  assert.equal(resumed.phase, 'completed'); assert.equal(resumed.round, 2);
});

test('running lock rejects another executor and is released after failure', async t => {
  const { store, mission } = await fixture(t); const release = await store.lock(mission.id);
  await assert.rejects(store.lock(mission.id), /already running/);
  await release(); const again = await store.lock(mission.id); await again();
});

test('fingerprint detects untracked additions', async t => {
  const { mission } = await fixture(t); const first = await fingerprint(mission.workspace);
  await writeFile(join(mission.workspace, 'extra.txt'), 'extra');
  assert.notEqual(await fingerprint(mission.workspace), first);
});

test('structured review rejects contradictory verdicts and accepts a JSON fence', () => {
  assert.throws(() => parseReview('{"verdict":"approve","summary":"yes","findings":["broken"]}'), /Inconsistent/);
  assert.throws(() => parseReview('{"verdict":"rework","summary":"no","findings":[]}'), /Inconsistent/);
  assert.equal(parseReview('```json\n' + approve + '\n```').verdict, 'approve');
});

test('input rejects missing acceptance, missing checks, identical roles and invalid budgets', () => {
  const input = { repository: '/tmp', goal: 'fix', acceptance: ['works'], builder: 'codex' as const, reviewer: 'claude' as const, checks: [{ file: 'node', args: ['--version'] }] };
  assert.throws(() => validateInput({ ...input, acceptance: [] }));
  assert.throws(() => validateInput({ ...input, checks: [] }));
  assert.throws(() => validateInput({ ...input, reviewer: 'codex' }));
  assert.throws(() => validateInput({ ...input, maxRounds: NaN }));
});

test('runner keeps shell metacharacters literal and enforces timeout and abort', async () => {
  const payload = '$(echo SECRET); & `echo SECRET`';
  const result = await runProcess({ file: process.execPath, args: ['-e', 'process.stdout.write(process.argv[1])', payload] }, { cwd: tmpdir(), timeoutMs: 3000 });
  assert.equal(result.stdout, payload);
  await assert.rejects(runProcess({ file: process.execPath, args: ['-e', 'setTimeout(()=>{}, 60000)'] }, { cwd: tmpdir(), timeoutMs: 50 }), /timed out/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(runProcess({ file: process.execPath, args: ['--version'] }, { cwd: tmpdir(), timeoutMs: 3000, signal: abort.signal }));
});
