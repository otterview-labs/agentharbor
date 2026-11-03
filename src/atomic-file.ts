import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

/** Replace a snapshot atomically, allowing short-lived Windows file locks to clear. */
export async function writeAtomicFile(target: string, contents: string, move: typeof rename = rename): Promise<void> {
  const temporary = target + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, contents, { flag: 'wx', mode: 0o600 });
    for (let attempt = 0; ; attempt++) {
      try { await move(temporary, target); return; }
      catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        // Never delete the old snapshot to make replacement succeed. Persistent
        // permission errors still propagate after seven attempts (1.26 s total).
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(code ?? '') || attempt >= 6) throw error;
        await delay(20 * 2 ** attempt);
      }
    }
  } catch (error) {
    await unlink(temporary).catch(() => {}); // Best effort; preserve the original failure.
    throw error;
  }
}
