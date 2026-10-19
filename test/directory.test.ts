import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access, readdir, symlink, open, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DesktopService } from '../src/desktop.js';
import { executeMission } from '../src/engine.js';
import { fingerprint, createMission } from '../src/workspace.js';
import { directoryManifest, directoryChanges } from '../src/directory.js';
import { Store } from '../src/store.js';
import type { Agent } from '../src/types.js';

const approve = JSON.stringify({verdict:'approve',summary:'Verified against the acceptance criteria',findings:[]});
async function fixture(t: {after(fn:()=>Promise<void>):void}) {
  const root=await mkdtemp(join(tmpdir(),'harbor-directory-')), folder=join(root,'ordinary-folder'),home=join(root,'state');
  t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(folder);await writeFile(join(folder,'answer.txt'),'before\n');
  return {root,folder,home,service:new DesktopService(home)};
}
const check={file:process.execPath,args:['-e',"if(require('fs').readFileSync('answer.txt','utf8').trim()!=='done')process.exit(1)"]};

test('ordinary folder works without Git on PATH: isolated copy, real checks, rework, restored evidence and change list', async t=>{
  const f=await fixture(t),empty=join(f.root,'empty-bin');await mkdir(empty);
  await mkdir(join(f.folder,'node_modules'));await writeFile(join(f.folder,'node_modules','ignored'),'dependency');
  await writeFile(join(f.folder,'remove.txt'),'delete in task');
  const oldPath=process.env.PATH;process.env.PATH=empty;
  try {
    const project=await f.service.addProject(f.folder);assert.equal(project.kind,'directory');
    const meeting=await f.service.create({projectId:project.id,goal:'Update the ordinary folder',acceptance:['answer.txt is done'],builder:'codex',reviewer:'claude',checks:[check]});
    const mission=await f.service.missions.get(meeting.missionId);assert.equal(mission.workspaceKind,'directory-copy');
    await assert.rejects(access(join(mission.workspace,'.git')));await assert.rejects(access(join(mission.workspace,'node_modules')));
    let reviews=0;
    const builder:Agent={id:'codex',async run(r){assert.equal(r.workspaceKind,'directory-copy');await writeFile(join(r.workspace,'answer.txt'),'done\n');await writeFile(join(r.workspace,'added.txt'),'new');await rm(join(r.workspace,'remove.txt'),{force:true});return 'implemented';}};
    const reviewer:Agent={id:'claude',async run(){return ++reviews===1?JSON.stringify({verdict:'rework',summary:'Add rationale',findings:['Explain the change']}):approve;}};
    const result=await executeMission(mission.id,{store:f.service.missions,builder,reviewer});
    assert.equal(result.phase,'completed');assert.equal(result.round,2);assert.equal(result.review?.fingerprint,result.evidence.at(-1)?.fingerprint);
    assert.equal(await fingerprint(result.workspace,result.workspaceKind),result.review?.fingerprint);
    assert.equal(await readFile(join(f.folder,'answer.txt'),'utf8'),'before\n');await access(join(f.folder,'remove.txt'));await assert.rejects(access(join(f.folder,'added.txt')));await assert.rejects(access(join(f.folder,'.git')));
    const restored=new DesktopService(f.home),state=await restored.snapshot();assert.equal(state.projects[0]!.kind,'directory');assert.equal(state.missions[0]!.phase,'completed');
    const changes=await restored.changes(meeting.id);assert.match(changes,/新增 "added.txt"/);assert.match(changes,/修改 "answer.txt"/);assert.match(changes,/删除 "remove.txt"/);
  } finally {if(oldPath===undefined)delete process.env.PATH;else process.env.PATH=oldPath;}
});

test('ordinary-folder verification rejects a real command that changes its verified source',async t=>{
  const f=await fixture(t),store=new Store(f.home);
  const m=await createMission({repository:f.folder,goal:'Verify source',acceptance:['source remains verified'],builder:'codex',reviewer:'claude',checks:[{file:process.execPath,args:['-e',"require('fs').writeFileSync('answer.txt','mutated by check')"]}]},store);
  let reviewed=false;
  const result=await executeMission(m.id,{store,builder:{id:'codex',async run(){return 'done';}},reviewer:{id:'claude',async run(){reviewed=true;return approve;}}});
  assert.equal(result.phase,'blocked');assert.equal(reviewed,false);assert.match(result.events.at(-1)!.message,/changed during verification/);
});

test('ordinary-folder approval cannot survive reviewer source changes',async t=>{
  const f=await fixture(t),store=new Store(f.home);
  const m=await createMission({repository:f.folder,goal:'Make answer done',acceptance:['answer is done'],builder:'codex',reviewer:'claude',checks:[check]},store);
  const result=await executeMission(m.id,{store,builder:{id:'codex',async run(r){await writeFile(join(r.workspace,'answer.txt'),'done');return 'done';}},reviewer:{id:'claude',async run(r){await writeFile(join(r.workspace,'extra.txt'),'unverified');return approve;}}});
  assert.equal(result.phase,'blocked');assert.match(result.events.at(-1)!.message,/changed during review/);
});

test('ordinary folder does not include app state recursively and requires a directory',async t=>{
  const f=await fixture(t),store=new Store(f.home),input={repository:f.folder,goal:'Work',acceptance:['done'],builder:'codex' as const,reviewer:'claude' as const,checks:[check]};
  await assert.rejects(createMission(input,new Store(join(f.folder,'task-state'))),/AgentHarbor/);
  await assert.rejects(f.service.addProject(join(f.folder,'answer.txt')),/文件夹/);
});

test('ordinary folder refuses source symlinks rather than copying links back to original data', {skip:process.platform==='win32'}, async t=>{
  const f=await fixture(t);await symlink(join(f.folder,'answer.txt'),join(f.folder,'shortcut'));
  await assert.rejects(directoryManifest(f.folder),/符号链接/);
  await assert.rejects(createMission({repository:f.folder,goal:'Work',acceptance:['done'],builder:'codex',reviewer:'claude',checks:[check]},new Store(f.home)),/符号链接/);
  assert.deepEqual(await readdir(join(f.home,'workspaces')),[]);
});

test('ordinary-folder change inspection reports no changes immediately after copy',async t=>{
  const f=await fixture(t),store=new Store(f.home);
  const m=await createMission({repository:f.folder,goal:'Inspect',acceptance:['inspected'],builder:'codex',reviewer:'claude',checks:[check]},store);
  assert.equal(await directoryChanges(f.home,m.id,m.workspace),'任务副本暂时没有改动');
});

test('ordinary-folder checks may create excluded build outputs without invalidating source evidence',async t=>{
  const f=await fixture(t),store=new Store(f.home);
  const m=await createMission({repository:f.folder,goal:'Inspect source',acceptance:['answer.txt is present'],builder:'codex',reviewer:'claude',checks:[{file:process.execPath,args:['-e',"const fs=require('fs');fs.mkdirSync('dist');fs.writeFileSync('dist/generated.js','build output');if(!fs.existsSync('answer.txt'))process.exit(1)"]}]},store);
  const result=await executeMission(m.id,{store,builder:{id:'codex',async run(){return 'ready';}},reviewer:{id:'claude',async run(){return approve;}}});
  assert.equal(result.phase,'completed');assert.equal(result.review?.fingerprint,result.evidence[0]?.fingerprint);
});


test('ordinary-folder copies and fingerprints files beyond the old individual and total size caps',async t=>{
  const f=await fixture(t),store=new Store(f.home),size=257*1024*1024+1;
  const file=await open(join(f.folder,'large.bin'),'wx');
  try {await file.truncate(size);await file.write(Buffer.from('A'),0,1,size-1);} finally {await file.close();}
  const m=await createMission({repository:f.folder,goal:'Inspect large files',acceptance:['all source bytes preserved'],builder:'codex',reviewer:'claude',checks:[check]},store);
  assert.equal((await stat(join(m.workspace,'large.bin'))).size,size);
  const copied=await open(join(m.workspace,'large.bin'),'r+');
  try {const tail=Buffer.alloc(1);await copied.read(tail,0,1,size-1);assert.equal(tail.toString(),'A');await copied.write(Buffer.from('B'),0,1,size-1);} finally {await copied.close();}
  assert.match(await directoryChanges(f.home,m.id,m.workspace),/修改 "large.bin"/);
  const original=await open(join(f.folder,'large.bin'),'r');
  try {const tail=Buffer.alloc(1);await original.read(tail,0,1,size-1);assert.equal(tail.toString(),'A');} finally {await original.close();}
});
