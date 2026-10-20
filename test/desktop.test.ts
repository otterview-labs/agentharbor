import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { git } from '../src/workspace.js';
import { DesktopService } from '../src/desktop.js';

test('desktop registry serializes concurrent meeting writes and restores real mission state', async t => {
  const dir=await mkdtemp(join(tmpdir(),'harbor-desktop-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  await git(['init','--quiet'],dir);await git(['config','user.name','Fixture'],dir);await git(['config','user.email','fixture@example.invalid'],dir);
  await writeFile(join(dir,'answer.txt'),'before');await git(['add','.'],dir);await git(['commit','--quiet','-m','fixture'],dir);
  const home=join(dir,'.git','desktop-home'),service=new DesktopService(home);
  const projects=await Promise.all([service.addProject(dir),service.addProject(dir)]);
  assert.equal(projects[0]!.id,projects[1]!.id);
  const meeting=await service.create({projectId:projects[0]!.id,goal:'Fix answer',acceptance:['answer works'],builder:'codex',reviewer:'claude',checks:[{file:process.execPath,args:['--version']}]});
  await Promise.all(Array.from({length:12},(_,i)=>service.append(meeting.id,i%2?'host':'user','message '+i)));
  const restored=await new DesktopService(home).snapshot();
  assert.equal(restored.projects.length,1);assert.equal(restored.meetings.length,1);assert.equal(restored.meetings[0]!.messages.length,14);
  assert.equal(restored.missions[0]!.phase,'ready');assert.notEqual(restored.missions[0]!.workspace,dir);
  assert.equal(new Set(restored.meetings[0]!.messages.map(x=>x.id)).size,14);
  await assert.rejects(service.append(meeting.id,'user',' '));await assert.rejects(service.meeting('unknown'));
});

test('quick creation resolves defaults from the goal and registered project checks before real verification',async t=>{
  const {mkdir,readFile}=await import('node:fs/promises');
  const {executeMission}=await import('../src/engine.js');
  const {execFile}=await import('node:child_process'),{promisify}=await import('node:util');const exec=promisify(execFile);
  const dir=await mkdtemp(join(tmpdir(),'harbor-quick-defaults-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const source=join(dir,'source');await mkdir(source);await writeFile(join(source,'answer.txt'),'before');
  await writeFile(join(source,'answer.test.cjs'),"const t=require('node:test'),a=require('node:assert/strict'),f=require('node:fs');t('goal',()=>a.equal(f.readFileSync('answer.txt','utf8'),'done'));\n");
  const service=new DesktopService(join(dir,'state')),project=await service.addProject(source),goal='Make answer.txt contain done';
  const meeting=await service.create({projectId:project.id,goal,context:'Keep the original folder unchanged.'});
  const m=await service.missions.get(meeting.missionId);assert.deepEqual(m.acceptance,[goal]);assert.deepEqual(m.checks,project.checks);assert.equal(m.builder,'codex');assert.equal(m.reviewer,'claude');
  assert.equal(meeting.messages[1]!.text,'Keep the original folder unchanged.');
  const result=await executeMission(m.id,{store:service.missions,runner:async(c,o)=>{const env={...process.env};delete env.NODE_TEST_CONTEXT;const r=await exec(c.file,c.args,{cwd:o.cwd,timeout:o.timeoutMs,env});return{code:0,stdout:r.stdout,stderr:r.stderr};},builder:{id:'codex',async run(r){await writeFile(join(r.workspace,'answer.txt'),'done');return 'implemented';}},reviewer:{id:'claude',async run(){return JSON.stringify({verdict:'approve',summary:'Goal and checks verified',findings:[]});}}});
  assert.equal(result.phase,'completed');assert.equal(result.evidence[0]!.code,0);assert.match(result.evidence[0]!.output,/pass 1/);assert.equal(result.review?.fingerprint,result.evidence[0]!.fingerprint);
  assert.equal(await readFile(join(source,'answer.txt'),'utf8'),'before');
});

test('quick defaults preserve explicit advanced options and reject invalid acceptance/checks',async t=>{
  const {mkdir}=await import('node:fs/promises');const dir=await mkdtemp(join(tmpdir(),'harbor-quick-options-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const source=join(dir,'source');await mkdir(source);const service=new DesktopService(join(dir,'state')),project=await service.addProject(source),goal='Inspect files';
  const checks=[{file:process.execPath,args:['--version']}],acceptance=['Report the outcome explicitly'];
  const meeting=await service.create({projectId:project.id,goal,builder:'claude',acceptance,checks});const m=await service.missions.get(meeting.missionId);
  assert.equal(m.reviewer,'codex');assert.deepEqual(m.acceptance,acceptance);assert.deepEqual(m.checks,checks);
  await assert.rejects(service.create({projectId:project.id,goal,acceptance:[]}),/acceptance/);
  await assert.rejects(service.create({projectId:project.id,goal,checks:[]}),/verification/);
  await assert.rejects(service.create({projectId:project.id,goal,context:'x'.repeat(32001)}),/32000/);
  assert.equal((await service.snapshot()).meetings.length,1);
});
