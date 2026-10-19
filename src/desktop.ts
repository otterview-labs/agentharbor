import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from './store.js';
import { createMission, git } from './workspace.js';
import { discover } from './discovery.js';
import type { DiscoveredTool } from './discovery.js';
import type { DesktopState, Meeting, MeetingInput, Project, ChatMessage } from './desktop-types.js';

interface Registry { schemaVersion: 1; projects: Project[]; meetings: Meeting[] }
export class DesktopService {
  readonly missions: Store;
  private queue: Promise<unknown> = Promise.resolve();
  private tools: DiscoveredTool[] = [];
  constructor(readonly home: string, private readonly changed: () => void = () => {}) { this.missions = new Store(home); }
  private async read(): Promise<Registry> {
    try { const v: Registry = JSON.parse(await readFile(join(this.home, 'desktop.json'), 'utf8')); if (v.schemaVersion !== 1) throw new Error('Unsupported desktop registry'); return v; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { schemaVersion: 1, projects: [], meetings: [] }; throw error; }
  }
  private async write(value: Registry) {
      await mkdir(this.home, { recursive: true, mode: 0o700 });
      const target = join(this.home, 'desktop.json'), temp = target + '.' + randomUUID() + '.tmp';
      await writeFile(temp, JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 }); await rename(temp, target); this.changed();
  }
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation); this.queue = result.catch(() => {}); return result;
  }
  async refreshTools() { this.tools = await discover(); this.changed(); }
  async snapshot(running: string[] = []): Promise<DesktopState> {
    await this.queue; const registry = await this.read();
    return { ...registry, missions: await this.missions.list(), running, tools: this.tools, home: this.home, demo: false };
  }
  async addProject(path: string): Promise<Project> {
    return this.serial(async () => {
    const root = await git(['rev-parse', '--show-toplevel'], path);
    const registry = await this.read(), existing = registry.projects.find(x => x.path === root);
    if (existing) return existing;
    const checks: Project['checks'] = [];
    try { const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')); if (typeof pkg.scripts?.test === 'string') checks.push({ file: 'npm', args: ['test'] }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('无法读取项目 package.json，请检查格式'); }
    if (!checks.length) checks.push({ file: 'node', args: ['--test'] });
    const project: Project = { id: randomUUID(), name: basename(root), path: root, checks };
    registry.projects.push(project); await this.write(registry); return project;
    });
  }
  async create(input: MeetingInput): Promise<Meeting> {
    return this.serial(async () => {
    const registry = await this.read(), project = registry.projects.find(x => x.id === input.projectId);
    if (!project) throw new Error('请先选择本地项目');
    const mission = await createMission({ repository: project.path, goal: input.goal, acceptance: input.acceptance,
      builder: input.builder, reviewer: input.reviewer, checks: input.checks, maxRounds: 5 }, this.missions);
    const now = new Date().toISOString();
    const meeting: Meeting = { id: randomUUID(), projectId: project.id, title: input.goal.split('\n')[0]!.slice(0, 44), missionId: mission.id, createdAt: now,
      messages: [{ id: randomUUID(), author: 'user', text: input.goal, at: now }, { id: randomUUID(), author: 'host', text: '目标和验收标准已记录。启动任务后，将由执行助手修改，验证通过后交给独立助手审核。', at: now }] };
    registry.meetings.unshift(meeting); await this.write(registry); return meeting;
    });
  }
  async meeting(id: string) { const m = (await this.read()).meetings.find(x => x.id === id); if (!m) throw new Error('会议不存在'); return m; }
  async append(id: string, author: ChatMessage['author'], text: string) {
    if (typeof text !== 'string' || !text.trim() || text.length > 32_000) throw new Error('消息需要为 1–32000 个字符');
    // Serialize the entire read-modify-write operation, including writes triggered by a worker.
    await this.serial(async () => {
      const registry = await this.read(), meeting = registry.meetings.find(x => x.id === id);
      if (!meeting) throw new Error('会议不存在');
      meeting.messages.push({ id: randomUUID(), author, text, at: new Date().toISOString() });
      const target = join(this.home, 'desktop.json'), temp = target + '.' + randomUUID() + '.tmp';
      await writeFile(temp, JSON.stringify(registry, null, 2), { flag: 'wx', mode: 0o600 }); await rename(temp, target); this.changed();
    });
  }
  async changes(id: string) {
    const meeting = await this.meeting(id), mission = await this.missions.get(meeting.missionId);
    const status = await git(['status', '--short'], mission.workspace);
    const diff = await git(['--no-pager', 'diff', '--no-ext-diff', '--no-textconv', 'HEAD', '--'], mission.workspace);
    return (status + '\n\n' + diff).slice(0, 200_000) || '工作区暂时没有改动';
  }
}
