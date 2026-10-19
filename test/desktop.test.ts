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
