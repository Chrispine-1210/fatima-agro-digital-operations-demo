import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('built browser code excludes database state, private identity and server role configuration', async () => {
  let checked = 0;
  async function walk(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) await walk(file);
      else if (/\.(js|html|json)$/.test(item.name)) {
        checked++;
        const source = await readFile(file, 'utf8');
        assert.doesNotMatch(source, /HQ_ADMIN_EMAILS|FATIMA_BOOTSTRAP_CEO_EMAILS|FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS|FATIMA_LOCAL_SESSION_SECRET|oai-authenticated-user-email|Ussi Jawadu|Confidential commercial draft|INSERT OR IGNORE INTO portal_state/, file);
      }
    }
  }
  await walk(fileURLToPath(new URL('../dist/client/', import.meta.url)));
  assert.ok(checked > 0);
});

test('all advertised script and stylesheet preloads exist in the release', async () => {
  const { default: manifest } = await import('../dist/server/__vite_rsc_assets_manifest.js');
  const resources = [...Object.values(manifest.clientReferenceDeps), ...Object.values(manifest.serverResources)];
  const assets = new Set(resources.flatMap(resource => [...(resource.js ?? []), ...(resource.css ?? [])]));
  assert.ok(assets.size > 0);
  for (const asset of assets) {
    assert.ok(asset.startsWith('/assets/'), `Unexpected release resource: ${asset}`);
    await assert.doesNotReject(access(new URL(`../dist/client${asset}`, import.meta.url)), `Missing preload: ${asset}`);
  }
});
