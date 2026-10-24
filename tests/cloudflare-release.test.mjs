import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareCloudflareRelease } from '../scripts/prepare-cloudflare-release.mjs';

const ids = { accountId: '123456789abcdef0123456789abcdef0', databaseId: '12345678-1234-4234-8234-123456789abc' };
async function fixture() {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'fatima-cloudflare-'));
  for (const folder of ['dist/server', 'dist/client', 'dist/.openai/drizzle', 'dist/server/.wrangler']) await mkdir(path.join(projectRoot, folder), { recursive: true });
  const configuration = { name: 'original-sites-name', main: 'index.js', compatibility_date: '2026-05-15', compatibility_flags: ['nodejs_compat'], no_bundle: true, rules: [{ type: 'ESModule', globs: ['**/*.js'] }], assets: { directory: '../client' }, vars: { UNEXPECTED_SETTING: 'excluded' }, d1_databases: [{ binding: 'DB', database_name: 'site-creator-d1', database_id: '00000000-0000-4000-8000-000000000000' }], kv_namespaces: [], durable_objects: { bindings: [] } };
  for (const [file, contents] of Object.entries({ 'dist/server/wrangler.json': JSON.stringify(configuration), 'dist/server/index.js': 'export default {};', 'dist/client/index.html': '<html>Fatima</html>', 'dist/.openai/drizzle/0000.sql': 'CREATE TABLE portal_state (id TEXT PRIMARY KEY);', 'dist/server/.dev.vars': 'PRIVATE=not-for-deployment', 'dist/server/.wrangler/state': 'local-state' })) await writeFile(path.join(projectRoot, file), contents);
  return { projectRoot, configuration, ...ids };
}

test('stages a separate release without changing Sites input or including local credentials/state', async () => {
  const input = await fixture();
  const original = await readFile(path.join(input.projectRoot, 'dist/server/wrangler.json'), 'utf8');
  const result = await prepareCloudflareRelease(input);
  assert.equal(await readFile(path.join(input.projectRoot, 'dist/server/wrangler.json'), 'utf8'), original);
  const output = JSON.parse(await readFile(result.configuration, 'utf8'));
  assert.equal(output.account_id, ids.accountId);
  assert.equal(output.name, 'fatima-agro');
  assert.equal(output.workers_dev, true);
  assert.equal(output.preview_urls, false);
  assert.deepEqual(output.vars, { FATIMA_LOCAL_DEMO: 'false' });
  assert.deepEqual(output.d1_databases, [{ binding: 'DB', database_name: 'fatima-agro', database_id: ids.databaseId, migrations_dir: '../.openai/drizzle' }]);
  assert.equal(await readFile(path.join(result.output, 'client/index.html'), 'utf8'), '<html>Fatima</html>');
  assert.equal(await readFile(path.join(result.output, '.openai/drizzle/0000.sql'), 'utf8'), 'CREATE TABLE portal_state (id TEXT PRIMARY KEY);');
  assert.deepEqual((await readdir(path.join(result.output, 'server'))).sort(), ['index.js', 'wrangler.json']);
  assert.equal(result.deployed, false);
  assert.equal(result.secretsIncluded, false);
});

test('rejects placeholder and malformed provider identities before creating output', async () => {
  const input = await fixture();
  for (const changed of [{ accountId: 'not-an-account' }, { accountId: '0'.repeat(32) }, { databaseId: '00000000-0000-4000-8000-000000000000' }, { databaseId: 'not-a-uuid' }, { name: '../escape' }]) await assert.rejects(prepareCloudflareRelease({ ...input, ...changed }));
  await assert.rejects(readdir(path.join(input.projectRoot, 'work')), { code: 'ENOENT' });
});

test('refuses source, build, ancestor and nonempty outputs without overwriting them', async () => {
  const input = await fixture();
  for (const output of ['.', '..', 'dist', 'dist/server/staged', 'scripts/staged', 'public/staged', 'work']) await assert.rejects(prepareCloudflareRelease({ ...input, output }), /Output/);
  const output = path.join(input.projectRoot, 'work/existing');
  await mkdir(output, { recursive: true }); await writeFile(path.join(output, 'keep.txt'), 'preserve me');
  await assert.rejects(prepareCloudflareRelease({ ...input, output }), /not an empty directory/);
  assert.equal(await readFile(path.join(output, 'keep.txt'), 'utf8'), 'preserve me');
});

test('fails closed when additional runtime bindings would be dropped', async () => {
  const input = await fixture();
  await writeFile(path.join(input.projectRoot, 'dist/server/wrangler.json'), JSON.stringify({ ...input.configuration, kv_namespaces: [{ binding: 'OTHER_DATA', id: 'some-id' }] }));
  await assert.rejects(prepareCloudflareRelease(input), /runtime bindings.*kv_namespaces/);
  await assert.rejects(readdir(path.join(input.projectRoot, 'work')), { code: 'ENOENT' });
});

test('requires packaged migration files and rejects an escaping Worker entry', async () => {
  const missing = await fixture();
  await writeFile(path.join(missing.projectRoot, 'dist/server/wrangler.json'), JSON.stringify({ ...missing.configuration, main: '../../scripts/source.js' }));
  await assert.rejects(prepareCloudflareRelease(missing), /entry must remain/);
  const empty = await fixture();
  await mkdir(path.join(empty.projectRoot, 'dist/.openai/empty'), { recursive: true });
  const { rename } = await import('node:fs/promises');
  await rename(path.join(empty.projectRoot, 'dist/.openai/drizzle/0000.sql'), path.join(empty.projectRoot, 'dist/.openai/empty/0000.sql'));
  await assert.rejects(prepareCloudflareRelease(empty), /no packaged D1 migration/);
});
