import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LooperEngine } from '../src/looper.js';
import { findExecutable } from '../src/discovery.js';
import type { Command, Runner } from '../src/types.js';

test('discovery ignores non-executable files', { skip: process.platform === 'win32' }, async t => {
  const dir=await mkdtemp(join(tmpdir(),'harbor-discovery-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  await writeFile(join(dir,'harbor-tool'),'#!/bin/sh\nexit 0');
  assert.equal(await findExecutable('harbor-tool',dir),undefined);
  await chmod(join(dir,'harbor-tool'),0o755);
  assert.ok(await findExecutable('harbor-tool',dir));
});

test('Looper adapter uses explicit config, structured argv, JSON and upstream work/review flags', async t => {
  const dir=await mkdtemp(join(tmpdir(),'harbor-looper-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const binary=join(dir,process.platform==='win32'?'looper.exe':'looper');
  await writeFile(binary,'not executed');if(process.platform!=='win32')await chmod(binary,0o755);
  const previous=process.env.PATH;process.env.PATH=dir;
  t.after(()=>{process.env.PATH=previous;});
  const commands:Command[]=[];
  const runner:Runner=async c=>{commands.push(c);return {code:0,stdout:'{"state":"accepted"}',stderr:''};};
  const config=join(dir,'private config.toml'),engine=new LooperEngine(config,runner);
  assert.deepEqual(await engine.work('project_1',42,dir),{state:'accepted'});
  await engine.review('owner/repo#42','project_1',dir);
  assert.deepEqual(commands[0]?.args,['--config',config,'--json','work','--project','project_1','--issue','42']);
  assert.deepEqual(commands[1]?.args,['--config',config,'--json','review','owner/repo#42','--project','project_1','--loop']);
  assert.throws(()=>engine.work('--force',0,dir));
});
