import { test, expect, _electron as electron } from '@playwright/test';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

async function fixture() {
  const root=await mkdtemp(join(tmpdir(),'harbor-e2e-')),repo=join(root,'project'),home=join(root,'state');
  const {mkdir}=await import('node:fs/promises');await mkdir(repo);
  const git=(...args:string[])=>execFileSync('git',args,{cwd:repo,stdio:'ignore'});
  git('init','--quiet');git('config','user.name','Desktop Fixture');git('config','user.email','fixture@example.invalid');
  await writeFile(join(repo,'answer.txt'),'before\n');git('add','.');git('commit','--quiet','-m','fixture');
  return {root,repo,home};
}
test('native desktop creates, runs, verifies and restores a meeting through real IPC and worker', async () => {
  const f=await fixture(),env={...process.env,AGENTHARBOR_HOME:f.home,AGENTHARBOR_E2E:'1'};delete env.ELECTRON_RUN_AS_NODE;
  let app=await electron.launch({args:[resolve('dist-electron/main.cjs')],env});
  try {
    await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},f.repo);
    let page=await app.firstWindow();await page.getByRole('button',{name:'添加本地项目',exact:true}).click();
    await expect(page.getByRole('combobox').first()).toHaveValue(/.+/);
    await page.getByRole('button',{name:'新建会议',exact:true}).click();
    await page.getByLabel('这次要解决什么').fill('完成 answer.txt 的修改');await page.getByLabel('怎样才算完成').fill('answer.txt 内容为 done');
    await page.getByText('验证方式',{exact:true}).click();await page.getByLabel('指定验证程序').check();
    await page.getByLabel('程序',{exact:true}).fill(process.execPath);
    await page.getByLabel('参数（JSON 数组）').fill(JSON.stringify(['-e',"if(require('fs').readFileSync('answer.txt','utf8').trim()!=='done')process.exit(1)"]));
    await page.getByRole('button',{name:'创建会议',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.getByRole('button',{name:'启动任务',exact:true}).click();
    await expect(page.getByLabel('当前任务').locator('.status').filter({hasText:'已完成'})).toBeVisible({timeout:30000});
    await page.getByText('改动与测试',{exact:true}).click();await expect(page.getByText('第 1 轮 · 检查通过')).toBeVisible();
    await expect(page.getByText('独立审核：任务验收条件已满足，验证结果通过。')).toBeVisible();
    await page.getByRole('button',{name:'查看代码改动',exact:true}).click();await expect(page.locator('.diff')).toContainText('answer.txt');
    await page.getByRole('textbox',{name:'会议消息'}).fill('保留这条项目说明');await page.getByRole('button',{name:'发送',exact:true}).click();
    await expect(page.getByText('保留这条项目说明',{exact:true})).toBeVisible();
    expect(await readFile(join(f.repo,'answer.txt'),'utf8')).toBe('before\n');
    await app.close();app=await electron.launch({args:[resolve('dist-electron/main.cjs')],env});page=await app.firstWindow();
    await expect(page.getByRole('heading',{name:'完成 answer.txt 的修改',exact:true}).first()).toBeVisible();await expect(page.getByText('保留这条项目说明',{exact:true})).toBeVisible();
    const prefs=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0]!;return w.webContents.getLastWebPreferences();});
    expect(prefs.contextIsolation).toBe(true);expect(prefs.nodeIntegration).toBe(false);expect(prefs.sandbox).toBe(true);
  } finally {await app.close();await rm(f.root,{recursive:true,force:true});}
});

test('native desktop pauses and resumes the task without losing messages or worktree', async () => {
  const f=await fixture(),env={...process.env,AGENTHARBOR_HOME:f.home,AGENTHARBOR_E2E:'1'};delete env.ELECTRON_RUN_AS_NODE;
  const app=await electron.launch({args:[resolve('dist-electron/main.cjs')],env});
  try {
    await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},f.repo);
    const page=await app.firstWindow();
    await page.evaluate(async node=>{
      const b=(window as any).harbor;const p=await b.addProject();const m=await b.createMeeting({projectId:p.id,goal:'Pause and resume fixture',acceptance:['answer.txt is done'],builder:'codex',reviewer:'claude',checks:[{file:node,args:['-e',"if(require('fs').readFileSync('answer.txt','utf8').trim()!=='done')process.exit(1)"]}]});await b.start(m.id);
    },process.execPath);
    await page.getByRole('button',{name:'暂停任务',exact:true}).click();
    await expect(page.getByLabel('当前任务').locator('.status')).toHaveText('已暂停');
    await expect(page.getByRole('button',{name:'继续任务',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'继续任务',exact:true}).click();
    await expect(page.getByLabel('当前任务').locator('.status')).toHaveText('已完成',{timeout:30000});
    const phases=await page.evaluate(async()=>{const s=await (window as any).harbor.snapshot();return s.missions[0].events.map((e:any)=>e.phase);});
    expect(phases).toContain('paused');expect(phases.at(-1)).toBe('completed');
  } finally {await app.close();await rm(f.root,{recursive:true,force:true});}
});
