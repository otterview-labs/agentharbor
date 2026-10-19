import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell, utilityProcess } from 'electron';
import type { UtilityProcess } from 'electron';
import { join, resolve, sep, extname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { execFile } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { DesktopService } from '../../../src/desktop.js';
import type { MeetingInput } from '../../../src/desktop-types.js';

protocol.registerSchemesAsPrivileged([{ scheme: 'harbor', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
const stateHome = resolve(process.env.AGENTHARBOR_HOME || join(homedir(), '.agentharbor'));
mkdirSync(join(stateHome, 'electron'), { recursive: true, mode: 0o700 });
app.setName('AgentHarbor');
app.setPath('userData', join(stateHome, 'electron'));
const active = new Map<string, UtilityProcess>();
const starting = new Set<string>();
let window: BrowserWindow | undefined, service: DesktopService;
let quitting = false;
const fixtures = !app.isPackaged && process.env.AGENTHARBOR_E2E === '1';
const phaseText: Record<string, string> = {
  executing: '执行助手正在处理任务。', verifying: '修改已提交验证，正在运行项目检查。', reviewing: '验证通过，正在交给独立审核助手。',
  rework: '发现需要修改的问题，已交回执行助手。', completed: '验证与独立审核通过，任务完成。', paused: '任务已暂停，进度和工作区已保留。', blocked: '任务尚未完成，请查看右侧原因与执行历史。',
};
function notify() { if (window && !window.isDestroyed()) window.webContents.send('harbor:changed'); }
async function hydratePath() {
  if (process.platform === 'win32') return;
  await new Promise<void>(done => {
    execFile(process.env.SHELL || '/bin/zsh', ['-ilc', 'printf "\\0AGENTHARBOR_PATH\\0%s" "$PATH"'], { timeout: 5000, maxBuffer: 64 * 1024 }, (error, output) => {
      if (!error) { const marker = '\0AGENTHARBOR_PATH\0', i = output.lastIndexOf(marker); if (i >= 0) process.env.PATH = output.slice(i + marker.length).trim(); }
      done();
    });
  });
}
function register(name: string, handler: (...args: any[]) => unknown) {
  ipcMain.handle('harbor:' + name, async (event, ...args) => {
    if (event.sender !== window?.webContents || event.senderFrame?.url !== 'harbor://app/index.html') throw new Error('Untrusted IPC sender');
    try { return { ok: true, value: await handler(...args) }; }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  });
}
async function start(id: string) {
  if (active.has(id) || starting.has(id)) throw new Error('该任务正在启动或运行');
  starting.add(id);
  try {
  const meeting = await service.meeting(id), mission = await service.missions.get(meeting.missionId);
  if (mission.phase === 'completed') throw new Error('任务已完成，请新建任务处理其他目标');
  if (mission.round >= mission.maxRounds) throw new Error('本任务已达到轮次上限，请根据审核意见调整目标后新建任务');
  const child = utilityProcess.fork(join(__dirname, 'worker.cjs'), [], { serviceName: 'AgentHarbor task' });
  active.set(id, child); notify();
  child.on('message', (message: any) => {
    if (active.get(id) !== child) return;
    if (message.type === 'phase') {
      void service.append(id, 'host', message.body.phase === 'blocked' ? `${phaseText.blocked}\n${message.body.message}` : phaseText[message.body.phase] || message.body.message).catch(() => {});
    } else if (message.type === 'message') void service.append(id, message.body.role, message.body.text).catch(() => {});
    else if (message.type === 'error') void service.append(id, 'host', message.body.message).catch(() => {});
    notify();
    // The worker exits after releasing its mission lock. Keep it active until
    // then, so a fast resume cannot race the old process's exit callback.
  });
  child.on('exit', () => { if (active.get(id) === child) { active.delete(id); notify(); } });
  child.postMessage({ type: 'start', home: service.home, missionId: mission.id, meetingId: id, fixture: fixtures });
  } finally { starting.delete(id); }
}
async function bootstrap() {
  await hydratePath();
  const home = stateHome;
  service = new DesktopService(home, notify);
  const renderer = resolve(__dirname, '../dist-desktop');
  protocol.handle('harbor', request => {
    const url = new URL(request.url);
    if (url.host !== 'app') return new Response('Not found', { status: 404 });
    const target = resolve(renderer, '.' + decodeURIComponent(url.pathname));
    if (!target.startsWith(renderer + sep)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(target).toString());
  });
  register('snapshot', async () => ({ ...await service.snapshot([...active.keys()]), testMode: fixtures }));
  register('addProject', async () => {
    const result = await dialog.showOpenDialog(window!, { title: '选择本地文件夹或 Git 项目', properties: ['openDirectory'] });
    return result.canceled || !result.filePaths[0] ? null : await service.addProject(result.filePaths[0]);
  });
  register('createMeeting', (input: MeetingInput) => service.create(input));
  register('sendMessage', async (id: string, text: string) => {
    await service.meeting(id); await service.append(id, 'user', text);
    await service.append(id, 'host', active.has(id) ? '补充要求已记录，将在下一轮执行或审核时一并提供给助手。' : '补充要求已记录；启动任务后将一并提供给助手。');
  });
  register('start', start);
  register('pause', async (id: string) => { if (!active.has(id)) throw new Error('任务当前没有运行'); active.get(id)!.postMessage({ type: 'pause' }); });
  register('changes', (id: string) => service.changes(id));
  register('openWorkspace', async (id: string) => { const m = await service.meeting(id); const mission = await service.missions.get(m.missionId); const error = await shell.openPath(mission.workspace); if (error) throw new Error(error); });
  register('openData', async () => { const error = await shell.openPath(service.home); if (error) throw new Error(error); });
  register('attach', async () => {
    const result = await dialog.showOpenDialog(window!, { title: '添加文本上下文', properties: ['openFile'], filters: [{ name: '文本文件', extensions: ['txt','md','log','json','ts','js','py','go','rs','yaml','yml'] }] });
    const path = result.filePaths[0]; if (result.canceled || !path) return null;
    if ((await stat(path)).size > 12_000) throw new Error('请选择小于 12 KB 的文本文件');
    if (!/\.(txt|md|log|json|ts|js|py|go|rs|yaml|yml)$/i.test(extname(path))) throw new Error('首版仅支持文本附件');
    return { name: basename(path), text: await readFile(path, 'utf8') };
  });
  ipcMain.on('harbor:window', (event, action: string) => {
    if (event.sender !== window?.webContents || event.senderFrame?.url !== 'harbor://app/index.html') return;
    if (action === 'minimize') window.minimize(); else if (action === 'maximize') window.isMaximized() ? window.unmaximize() : window.maximize(); else if (action === 'close') window.close();
  });
  window = new BrowserWindow({ width: 1440, height: 960, minWidth: 880, minHeight: 620, backgroundColor: '#000000',
    title: 'AgentHarbor', titleBarStyle: 'hidden', trafficLightPosition: { x: 14, y: 15 },
    webPreferences: { preload: join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  await window.loadURL('harbor://app/index.html');
  void service.refreshTools();
}
if (!app.requestSingleInstanceLock()) app.quit();
else { void app.whenReady().then(bootstrap); app.on('second-instance', () => { window?.show(); window?.focus(); }); }
app.on('window-all-closed', () => app.quit());
app.on('before-quit', event => {
  if (quitting || !active.size) return;
  event.preventDefault(); quitting = true;
  for (const child of active.values()) child.postMessage({ type: 'pause' });
  const deadline = Date.now() + 5000;
  const timer = setInterval(() => { if (!active.size || Date.now() > deadline) { clearInterval(timer); for (const child of active.values()) child.kill(); void service.snapshot().finally(() => app.quit()); } }, 100);
});
