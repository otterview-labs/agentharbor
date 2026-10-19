import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from '../../../src/desktop-types.js';
async function invoke(name: string, ...args: unknown[]) {
  const result = await ipcRenderer.invoke('harbor:' + name, ...args);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
const bridge: DesktopBridge = {
  snapshot: () => invoke('snapshot'), addProject: () => invoke('addProject'),
  createMeeting: input => invoke('createMeeting', input), sendMessage: (id, text) => invoke('sendMessage', id, text),
  start: id => invoke('start', id), pause: id => invoke('pause', id), changes: id => invoke('changes', id),
  openWorkspace: id => invoke('openWorkspace', id), attach: () => invoke('attach'), openData: () => invoke('openData'),
  windowAction: action => ipcRenderer.send('harbor:window', action),
  onChange: listener => { const handler = () => listener(); ipcRenderer.on('harbor:changed', handler); return () => ipcRenderer.removeListener('harbor:changed', handler); },
};
contextBridge.exposeInMainWorld('harbor', bridge);
contextBridge.exposeInMainWorld('harborPlatform', process.platform);
