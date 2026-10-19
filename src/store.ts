import { mkdir, readFile, rename, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Mission } from './types.js';

/** Single mission snapshot, atomically replaced; the execution lock is per mission. */
export class Store {
  constructor(readonly root: string) {}
  private id(id: string) { if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid mission ID'); return id; }
  async init() { await mkdir(join(this.root, 'missions'), { recursive: true, mode: 0o700 }); }
  async save(mission: Mission) {
    await this.init();
    const target = join(this.root, 'missions', this.id(mission.id) + '.json');
    const temporary = target + '.' + randomUUID() + '.tmp';
    await writeFile(temporary, JSON.stringify(mission, null, 2), { mode: 0o600, flag: 'wx' });
    await rename(temporary, target);
  }
  async get(id: string): Promise<Mission> {
    const mission: Mission = JSON.parse(await readFile(join(this.root, 'missions', this.id(id) + '.json'), 'utf8'));
    if (mission.schemaVersion !== 1 || mission.id !== id) throw new Error('Unsupported or damaged mission snapshot');
    return mission;
  }
  async list(): Promise<Mission[]> {
    await this.init();
    const names = (await readdir(join(this.root, 'missions'))).filter(x => x.endsWith('.json'));
    return await Promise.all(names.map(x => this.get(x.slice(0, -5))));
  }
  async lock(id: string): Promise<() => Promise<void>> {
    await this.init();
    const path = join(this.root, 'missions', this.id(id) + '.lock');
    {
      try {
        await writeFile(path, String(process.pid), { flag: 'wx', mode: 0o600 });
        return async () => { await unlink(path); };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        const owner = Number(await readFile(path, 'utf8'));
        if (!Number.isSafeInteger(owner) || owner <= 0) throw new Error('Damaged mission lock; inspect it before retrying');
        try { process.kill(owner, 0); } catch (probe) {
          if ((probe as NodeJS.ErrnoException).code === 'ESRCH') throw new Error(`Interrupted mission lock (${owner}). Confirm no process is running, then remove ${path} and resume`);
        }
        throw new Error('Mission is already running');
      }
    }
  }
}
