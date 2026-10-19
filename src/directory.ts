import { createReadStream, constants } from 'node:fs';
import { opendir, lstat, mkdir, copyFile, chmod, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

// Keep dependency/cache trees out of task copies and source verification alike.
const excluded = new Set(['.git', 'node_modules', '.venv', 'venv', '__pycache__', '.pytest_cache', '.mypy_cache', '.agentharbor', '.DS_Store', 'dist', 'build', 'coverage', '.next', '.nuxt', '.cache', 'target', '.gradle']);
export interface DirectoryEntry { hash: string; mode: number; size: number }
export type DirectoryManifest = Record<string, DirectoryEntry>;

/** No Git commands: hash copied source files and reject symbolic links explicitly. */
export async function directoryManifest(root: string): Promise<DirectoryManifest> {
  const result: DirectoryManifest = Object.create(null) as DirectoryManifest;
  const walk = async (relative: string): Promise<void> => {
    const directory = await opendir(join(root, relative));
    for await (const entry of directory) {
      const name = entry.name;
      if (excluded.has(name)) continue;
      const file = relative ? relative + '/' + name : name, path = join(root, file), stat = await lstat(path);
      if (stat.isSymbolicLink()) throw new Error(`普通文件夹暂不支持符号链接：${file}。请选择实际文件所在目录`);
      if (stat.isDirectory()) { await walk(file); continue; }
      if (!stat.isFile()) throw new Error(`普通文件夹包含不支持的特殊文件：${file}`);
      const hash = createHash('sha256'); let readBytes = 0;
      for await (const chunk of createReadStream(path)) {
        readBytes += (chunk as Buffer).length;
        if (readBytes > stat.size) throw new Error(`文件在读取时发生变化：${file}`);
        hash.update(chunk as Buffer);
      }
      const after = await lstat(path);
      if (!after.isFile() || after.size !== stat.size || after.mtimeMs !== stat.mtimeMs || after.ctimeMs !== stat.ctimeMs || readBytes !== stat.size) throw new Error(`文件在读取时发生变化：${file}`);
      result[file] = { hash: hash.digest('hex'), mode: stat.mode & 0o777, size: stat.size };
    }
  };
  await walk(''); return result;
}
export function manifestFingerprint(manifest: DirectoryManifest): string {
  return createHash('sha256').update(JSON.stringify(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))).digest('hex');
}
export async function copyDirectory(source: string, target: string, manifest: DirectoryManifest) {
  await mkdir(target, { recursive: false, mode: 0o700 });
  for (const [file, entry] of Object.entries(manifest)) {
    const destination = join(target, file);
    await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
    // COPYFILE_EXCL also prevents accidental overwrite if a destination appeared.
    await copyFile(join(source, file), destination, constants.COPYFILE_EXCL | constants.COPYFILE_FICLONE);
    await chmod(destination, entry.mode);
  }
  if (manifestFingerprint(await directoryManifest(target)) !== manifestFingerprint(manifest)
      || manifestFingerprint(await directoryManifest(source)) !== manifestFingerprint(manifest)) throw new Error('创建任务副本时原文件发生变化，请重试');
}
export async function saveDirectoryBaseline(home: string, id: string, manifest: DirectoryManifest) {
  await mkdir(join(home, 'baselines'), { recursive: true, mode: 0o700 });
  await writeFile(join(home, 'baselines', id + '.json'), JSON.stringify(manifest), { flag: 'wx', mode: 0o600 });
}
export async function directoryChanges(home: string, id: string, workspace: string): Promise<string> {
  const baseline = JSON.parse(await readFile(join(home, 'baselines', id + '.json'), 'utf8')) as DirectoryManifest;
  const current = await directoryManifest(workspace), lines: string[] = [];
  for (const file of [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort()) {
    const before = Object.hasOwn(baseline, file) ? baseline[file] : undefined;
    const after = Object.hasOwn(current, file) ? current[file] : undefined;
    if (!before) lines.push('新增 ' + JSON.stringify(file));
    else if (!after) lines.push('删除 ' + JSON.stringify(file));
    else if (before.hash !== after.hash || before.mode !== after.mode) lines.push('修改 ' + JSON.stringify(file));
  }
  return lines.length ? '普通文件夹任务副本 · 相比创建时的文件快照\n\n' + lines.join('\n') : '任务副本暂时没有改动';
}
