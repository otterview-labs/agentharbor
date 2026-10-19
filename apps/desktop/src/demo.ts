import type { DesktopBridge, DesktopState } from '../../../src/desktop-types.js';
const at = (time: string) => `2026-10-19T${time}:00+08:00`;
export function demoState(): DesktopState {
  const mission = { schemaVersion: 1 as const, id: 'demo-mission', goal: '补充并发重试用例', acceptance: ['会话过期后正确刷新', '并发重试不重复提交', '回归验证与独立审核通过'],
    repository: '', workspace: '', baseCommit: '', builder: 'codex' as const, reviewer: 'claude' as const, checks: [{ file: 'node', args: ['--test'] }],
    maxRounds: 5, timeoutMs: 1800000, phase: 'rework' as const, round: 2, createdAt: at('14:25'), updatedAt: at('14:41'), events: [],
    evidence: [{ round: 1, command: { file: 'node', args: ['--test'] }, code: 0, output: '现有 8 项回归测试通过。并发重试尚未验证。', fingerprint: 'demo' }],
    feedback: '并发重试尚未验证' };
  return { projects: [{ id: 'demo-project', name: 'harbor-web', path: '演示项目', checks: mission.checks }],
    meetings: [{ id: 'demo-meeting', projectId: 'demo-project', title: '登录重试修复', missionId: mission.id, createdAt: at('14:25'), messages: [
      { id: 'one', author: 'host', text: '先修复登录过期后的重试问题，验证后由 Claude Code 审核。', at: at('14:25') },
      { id: 'two', author: 'builder', text: '刷新逻辑已修复，现有 8 项回归测试通过。', at: at('14:32') },
      { id: 'three', author: 'reviewer', text: '还缺少并发重试用例，暂不通过。', at: at('14:38') },
      { id: 'four', author: 'host', text: '已交回 Codex 补测，完成后自动再次审核。', at: at('14:41') },
    ] }], missions: [mission], running: [], tools: [], home: '演示模式，不访问本机文件', demo: true };
}
const desktopOnly = async (): Promise<never> => { throw new Error('此处为设计演示。请在桌面应用中操作真实项目。'); };
export const previewBridge: DesktopBridge = {
  snapshot: async () => demoState(), addProject: desktopOnly, createMeeting: desktopOnly, sendMessage: desktopOnly,
  start: desktopOnly, pause: desktopOnly, changes: async () => '演示改动：补充登录刷新与重试逻辑。',
  openWorkspace: desktopOnly, attach: desktopOnly, openData: desktopOnly, windowAction: () => {}, onChange: () => () => {},
};
