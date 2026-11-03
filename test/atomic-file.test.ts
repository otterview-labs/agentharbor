import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeAtomicFile } from '../src/atomic-file.js';

test('transient replacement locks preserve the old snapshot until the new snapshot is ready', async t => {
  const root = await mkdtemp(join(tmpdir(), 'harbor-atomic-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, 'state.json');
  await writeFile(target, '{"value":"old"}');
  const codes = ['EPERM', 'EACCES', 'EBUSY']; let attempts = 0;
  await writeAtomicFile(target, '{"value":"new"}', async (source, destination) => {
    assert.equal(JSON.parse(await readFile(target, 'utf8')).value, 'old');
    const code = codes[attempts++];
    if (code) throw Object.assign(new Error('File temporarily locked'), { code });
    await rename(source, destination);
  });
  assert.equal(attempts, 4);
  assert.equal(JSON.parse(await readFile(target, 'utf8')).value, 'new');
  assert.deepEqual(await readdir(root), ['state.json']);
});

test('persistent replacement errors are bounded, retain the snapshot and remove the temporary file', async t => {
  const root = await mkdtemp(join(tmpdir(), 'harbor-atomic-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, 'state.json');
  await writeFile(target, 'old'); let attempts = 0;
  const error = Object.assign(new Error('Access denied'), { code: 'EPERM' });
  await assert.rejects(writeAtomicFile(target, 'new', async () => { attempts++; throw error; }), e => e === error);
  assert.equal(attempts, 7);
  assert.equal(await readFile(target, 'utf8'), 'old');
  assert.deepEqual(await readdir(root), ['state.json']);
});

test('unrelated filesystem errors propagate immediately without damaging a snapshot', async t => {
  const root = await mkdtemp(join(tmpdir(), 'harbor-atomic-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, 'state.json');
  await writeFile(target, 'old'); let attempts = 0;
  const error = Object.assign(new Error('No space left'), { code: 'ENOSPC' });
  await assert.rejects(writeAtomicFile(target, 'new', async () => { attempts++; throw error; }), e => e === error);
  assert.equal(attempts, 1);
  assert.equal(await readFile(target, 'utf8'), 'old');
  assert.deepEqual(await readdir(root), ['state.json']);
});
