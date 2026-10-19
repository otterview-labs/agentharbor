import type { Mission, Command, HarnessId } from './types.js';
import type { DiscoveredTool } from './discovery.js';

export interface Project { id: string; name: string; path: string; kind?: 'git' | 'directory'; checks: Command[] }
export interface ChatMessage { id: string; author: 'user' | 'host' | 'builder' | 'reviewer'; text: string; at: string }
export interface Meeting { id: string; projectId: string; title: string; missionId: string; messages: ChatMessage[]; createdAt: string }
export interface DesktopState { projects: Project[]; meetings: Meeting[]; missions: Mission[]; running: string[]; tools: DiscoveredTool[]; home: string; demo: boolean; testMode?: boolean }
export interface MeetingInput { projectId: string; goal: string; acceptance: string[]; builder: HarnessId; reviewer: HarnessId; checks: Command[] }
export interface Attachment { name: string; text: string }
export interface DesktopBridge {
  snapshot(): Promise<DesktopState>;
  addProject(): Promise<Project | null>;
  createMeeting(input: MeetingInput): Promise<Meeting>;
  sendMessage(meetingId: string, text: string): Promise<void>;
  start(meetingId: string): Promise<void>;
  pause(meetingId: string): Promise<void>;
  changes(meetingId: string): Promise<string>;
  openWorkspace(meetingId: string): Promise<void>;
  attach(): Promise<Attachment | null>;
  openData(): Promise<void>;
  windowAction(action: 'minimize' | 'maximize' | 'close'): void;
  onChange(listener: () => void): () => void;
}
