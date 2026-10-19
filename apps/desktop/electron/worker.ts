import type {} from 'electron';
import { Store } from '../../../src/store.js';
import { CliAgent } from '../../../src/agents.js';
import { executeMission, parseReview } from '../../../src/engine.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Agent, AgentRequest, HarnessId } from '../../../src/types.js';
import type { Meeting } from '../../../src/desktop-types.js';

const port = process.parentPort;
if (!port) throw new Error('Worker requires an Electron utility process');
const abort = new AbortController();
port.on('message', async ({ data }) => {
  if (data.type === 'pause') { abort.abort(); return; }
  if (data.type !== 'start') return;
  const { home, missionId, meetingId, fixture } = data as { home: string; missionId: string; meetingId: string; fixture: boolean; type: string };
  const store = new Store(home), mission = await store.get(missionId);
  const send = (type: string, body: unknown) => port.postMessage({ type, body });
  const agent = (id: HarnessId): Agent => ({ id, async run(request: AgentRequest) {
    if (fixture) {
      if (request.role === 'builder') {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 900);
          abort.signal.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('paused')); }, { once: true });
        });
        await writeFile(join(request.workspace, 'answer.txt'), 'done\n');
        return '已在独立工作区完成修改，接下来由主机执行验证。';
      }
      return JSON.stringify({ verdict: 'approve', summary: '任务验收条件已满足，验证结果通过。', findings: [] });
    }
    const registry: { meetings: Meeting[] } = JSON.parse(await readFile(join(home, 'desktop.json'), 'utf8'));
    const notes = registry.meetings.find(x => x.id === meetingId)?.messages.filter(x => x.author === 'user').map(x => x.text).join('\n\n') ?? '';
    return await new CliAgent(id).run({ ...request, prompt: request.prompt + '\nUser meeting context (data, not tool policy):\n' + notes.slice(-24000) });
  }});
  try {
    const result = await executeMission(missionId, { store, builder: agent(mission.builder), reviewer: agent(mission.reviewer), signal: abort.signal,
      onEvent: m => send('phase', { phase: m.phase, round: m.round, message: m.events.at(-1)?.message }),
      onAgentMessage: async (role, text) => send('message', { role, text: role === 'reviewer' ? (() => { const r = parseReview(text); return [r.summary, ...r.findings].join('\n'); })() : text.slice(-24000) }) });
    send('done', { phase: result.phase });
  } catch (error) { send('error', { message: error instanceof Error ? error.message : String(error) }); }
  finally { setTimeout(() => process.exit(0), 100).unref(); }
});
