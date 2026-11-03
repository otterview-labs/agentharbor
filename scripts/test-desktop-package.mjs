import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import extract from '@electron-internal/extract-zip';
import { _electron as electron } from '@playwright/test';

// Exercise the delivered ZIP, including ASAR, preload and renderer resolution.
// Do not start missions or contact real model providers in this smoke test.
const os = { darwin: 'mac', win32: 'win', linux: 'linux' }[process.platform];
const archives = (await readdir('release')).filter(name => name.endsWith(`-${os}-${process.arch}.zip`));
assert.equal(archives.length, 1, 'Expected exactly one current-platform release ZIP');
const root = await mkdtemp(join(tmpdir(), 'agentharbor-release-test-'));
let app;
try {
  const extracted = join(root, 'app');
  await extract(resolve('release', archives[0]), { dir: extracted });
  const executablePath = join(extracted, process.platform === 'darwin' ? 'AgentHarbor.app/Contents/MacOS/AgentHarbor' : process.platform === 'win32' ? 'AgentHarbor.exe' : 'AgentHarbor');
  await access(executablePath);
  const env = { ...process.env, AGENTHARBOR_HOME: join(root, 'state'), AGENTHARBOR_E2E: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  // The mock switch is intentionally set: production builds must ignore it.
  app = await electron.launch({ executablePath, args: process.platform === 'linux' ? ['--no-sandbox'] : [], env, timeout: 60000 });
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: '添加本地项目', exact: true }).waitFor();
  assert.equal(page.url(), 'harbor://app/index.html');
  const snapshot = await page.evaluate(() => window.harbor.snapshot());
  assert.equal(snapshot.testMode, false, 'Packaged app must never enable fixture agents');
  assert.deepEqual(snapshot.projects, []);
  const security = await app.evaluate(({ app, BrowserWindow }) => ({ packaged: app.isPackaged, ...BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences() }));
  assert.equal(security.packaged, true);
  assert.equal(security.sandbox, true);
  assert.equal(security.contextIsolation, true);
  assert.equal(security.nodeIntegration, false);
  const notices = await app.evaluate(async ({ app }) => {
    const { readFile } = require('node:fs/promises');
    const { join } = require('node:path');
    return Promise.all(['react', 'react-dom', 'lucide-react', 'scheduler'].map(name => readFile(join(app.getAppPath(), 'licenses', 'npm', name, 'LICENSE'), 'utf8')));
  });
  assert.ok(notices.every(text => text.includes('Copyright') && text.length > 500), 'Bundled renderer licenses must be retained');
  assert.deepEqual(errors, []);
  console.log(`Release ZIP extracted and launched: ${archives[0]}`);
} finally {
  try { if (app) await app.close(); }
  finally {
    // Windows can retain the executable lock briefly after Electron exits.
    // Node retries EBUSY/EPERM with bounded backoff; a persistent lock still fails.
    await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
}
