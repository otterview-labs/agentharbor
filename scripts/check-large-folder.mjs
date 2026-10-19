// Reproducible integration smoke for the removed file/entry ceilings. No models run.
import { mkdtemp, mkdir, writeFile, rm, opendir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMission } from '../dist/src/workspace.js';
import { Store } from '../dist/src/store.js';
const root = await mkdtemp(join(tmpdir(), 'harbor-large-folder-'));
const source = join(root, 'source'), home = join(root, 'state'), files = 20_001;
try {
  await mkdir(source);
  for (let start = 0; start < files; start += 64) {
    await Promise.all(Array.from({ length: Math.min(64, files - start) }, (_, offset) => writeFile(join(source, `file-${start + offset}.txt`), 'sample\n')));
  }
  const mission = await createMission({repository:source,goal:'Verify a large file count can be copied',acceptance:['Every input file is present in the task workspace'],builder:'codex',reviewer:'claude',checks:[{file:process.execPath,args:['--version']}]},new Store(home));
  let copied = 0; for await (const entry of await opendir(mission.workspace)) if (entry.isFile()) copied++;
  if (copied !== files) throw new Error('Task copy dropped files');
  let gitCreated = false; try { await access(join(source, '.git')); gitCreated = true; } catch {}
  if (gitCreated) throw new Error('Unexpected Git metadata');
  const report = {date:'2026-10-19',platform:process.platform,arch:process.arch,files,filesCopied:copied,taskCreated:true,workspaceKind:mission.workspaceKind,gitMetadataCreated:gitCreated,modelsInvoked:false};
  await writeFile('docs/large-folder-smoke-20261019.json', JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
} finally { await rm(root, {recursive:true,force:true}); }
