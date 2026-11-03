import { packager } from '@electron/packager';
import { ZipFile } from 'yazl';
import { createWriteStream } from 'node:fs';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, readlink, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

// Stage only the bundled application and notices. No source checkout, local
// state, development dependencies or credentials belong in a release.
const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const electronVersion = JSON.parse(await readFile(join(root, 'node_modules/electron/package.json'), 'utf8')).version;
const stage = await mkdtemp(join(tmpdir(), 'agentharbor-package-'));
const out = join(root, 'release');
await mkdir(out, { recursive: true });
try {
  for (const file of ['dist-electron', 'dist-desktop', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'licenses']) {
    await cp(join(root, file), join(stage, file), { recursive: true });
  }
  await writeFile(join(stage, 'package.json'), JSON.stringify({
    name: manifest.name, version: manifest.version, description: manifest.description,
    author: manifest.author, license: manifest.license, main: manifest.main, type: 'module',
  }, null, 2) + '\n');
  const bundles = await packager({
    dir: stage, out, name: 'AgentHarbor', executableName: 'AgentHarbor',
    electronVersion, platform: process.platform, arch: process.arch,
    appBundleId: 'org.otterview.agentharbor',
    appCategoryType: 'public.app-category.developer-tools',
    asar: true, prune: false, overwrite: true,
  });
  for (const bundle of bundles) {
    const os = { darwin: 'mac', win32: 'win', linux: 'linux' }[process.platform];
    if (!os) throw new Error(`Unsupported platform: ${process.platform}`);
    const archive = join(out, `AgentHarbor-${manifest.version}-${os}-${process.arch}.zip`);
    const zip = new ZipFile();
    const target = createWriteStream(archive);
    const complete = pipeline(zip.outputStream, target);
    // Keep asynchronous read errors on the same completion promise.
    zip.on('error', error => zip.outputStream.destroy(error));
    const add = async (directory, prefix = '') => {
      for (const name of (await readdir(directory)).sort()) {
        const path = join(directory, name), entry = prefix + name;
        const stat = await lstat(path);
        if (stat.isSymbolicLink()) {
          // .app frameworks contain symlinks; archive the target, not its contents.
          zip.addBuffer(Buffer.from(await readlink(path)), entry, { mode: stat.mode, mtime: stat.mtime });
        } else if (stat.isDirectory()) {
          zip.addEmptyDirectory(entry, { mode: stat.mode, mtime: stat.mtime });
          await add(path, entry + '/');
        } else {
          zip.addFile(path, entry, { mode: stat.mode, mtime: stat.mtime });
        }
      }
    };
    try { await add(bundle); zip.end(); await complete; }
    catch (error) { zip.outputStream.destroy(error); await complete.catch(() => {}); await rm(archive, { force: true }); throw error; }
    console.log(`Created ${basename(archive)}`);
  }
} finally { await rm(stage, { recursive: true, force: true }); }
