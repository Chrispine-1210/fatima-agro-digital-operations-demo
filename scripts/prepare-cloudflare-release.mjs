/** Stage the compiled application for a separate, developer-owned Cloudflare account. */
import { cp, lstat, mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedBuildKeys = ['main', 'compatibility_date', 'compatibility_flags', 'rules', 'no_bundle', 'find_additional_modules', 'jsx_factory', 'jsx_fragment', 'assets', 'observability'];
const runtimeBindingKeys = ['durable_objects', 'kv_namespaces', 'queues', 'r2_buckets', 'vectorize', 'ai_search_namespaces', 'ai_search', 'hyperdrive', 'workflows', 'secrets_store_secrets', 'artifacts', 'services', 'analytics_engine_datasets', 'unsafe', 'unsafe_hello_world', 'flagship', 'ratelimits', 'worker_loaders', 'dispatch_namespaces', 'logfwdr', 'send_email', 'mtls_certificates', 'pipelines', 'vpc_services', 'vpc_networks', 'ai', 'images', 'browser', 'containers'];
const excludedNames = new Set(['.git', '.wrangler', 'node_modules', 'private']);
const inside = (parent, candidate) => { const relative = path.relative(parent, candidate); return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)); };
const hasContent = value => Array.isArray(value) ? value.length > 0 : value && typeof value === 'object' ? Object.values(value).some(hasContent) : value !== undefined && value !== null && value !== false && value !== '';
async function canonicalDestination(destination) {
  let existing = destination;
  const suffix = [];
  while (true) {
    try { return path.resolve(await realpath(existing), ...suffix.reverse()); }
    catch (error) { if (error.code !== 'ENOENT') throw error; const parent = path.dirname(existing); if (parent === existing) throw error; suffix.push(path.basename(existing)); existing = parent; }
  }
}
async function validateTree(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (excludedNames.has(item.name) || /^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(item.name)) continue;
    const file = path.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error(`Build symlinks are not accepted: ${file}`);
    if (item.isDirectory()) await validateTree(file);
  }
}

export async function prepareCloudflareRelease({ accountId, databaseId, name = 'fatima-agro', output = 'work/cloudflare-release', projectRoot = process.cwd() } = {}) {
  if (!/^[a-f\d]{32}$/i.test(accountId ?? '') || /^0+$/.test(accountId)) throw new Error('Supply an actual 32-hex Cloudflare account ID.');
  if (!/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(databaseId ?? '') || databaseId.toLowerCase() === '00000000-0000-4000-8000-000000000000') throw new Error('Supply an actual D1 database UUID, not the Sites placeholder.');
  if (!/^[a-z][a-z\d-]{0,62}$/.test(name)) throw new Error('Use a lowercase Worker name, beginning with a letter, up to 63 characters.');
  const root = await realpath(path.resolve(projectRoot));
  const source = path.join(root, 'dist');
  const destination = await canonicalDestination(path.resolve(root, output));
  const work = path.join(root, 'work');
  if (inside(destination, root) || inside(source, destination) || (inside(root, destination) && (!inside(work, destination) || destination === work))) throw new Error('Output must be a dedicated work subdirectory or an external directory, outside the source and dist trees.');
  try { const info = await lstat(destination); if (!info.isDirectory() || info.isSymbolicLink() || (await readdir(destination)).length) throw new Error('Output exists and is not an empty directory. Choose a new output; no files were removed.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }

  const inputConfiguration = path.join(source, 'server', 'wrangler.json');
  const build = JSON.parse(await readFile(inputConfiguration, 'utf8'));
  if (!build.main || path.isAbsolute(build.main) || !inside(path.join(source, 'server'), path.resolve(source, 'server', build.main))) throw new Error('The compiled Worker entry must remain inside dist/server.');
  if (!(await stat(path.resolve(source, 'server', build.main))).isFile()) throw new Error('Compiled Worker entry is missing.');
  if (!build.compatibility_date || !/^\d{4}-\d{2}-\d{2}$/.test(build.compatibility_date)) throw new Error('Build compatibility date is missing or invalid.');
  if (!build.assets || path.resolve(source, 'server', build.assets.directory ?? '') !== path.join(source, 'client') || !(await stat(path.join(source, 'client'))).isDirectory()) throw new Error('Build assets must point to the compiled dist/client directory.');
  if (!Array.isArray(build.d1_databases) || build.d1_databases.length !== 1 || build.d1_databases[0].binding !== 'DB') throw new Error('Expected exactly one DB binding; review other bindings before staging.');
  const unexpected = runtimeBindingKeys.filter(key => hasContent(build[key]));
  if (unexpected.length) throw new Error(`Additional runtime bindings require explicit review: ${unexpected.join(', ')}.`);
  const migrations = path.join(source, '.openai', 'drizzle');
  const migrationFiles = (await readdir(migrations)).filter(file => file.endsWith('.sql'));
  if (!migrationFiles.length) throw new Error('The compiled release has no packaged D1 migration files.');
  await validateTree(source);
  const configuration = Object.fromEntries(allowedBuildKeys.filter(key => Object.hasOwn(build, key)).map(key => [key, build[key]]));
  Object.assign(configuration, { account_id: accountId, name, workers_dev: true, preview_urls: false, d1_databases: [{ binding: 'DB', database_name: 'fatima-agro', database_id: databaseId, migrations_dir: '../.openai/drizzle' }], vars: { FATIMA_LOCAL_DEMO: 'false' } });
  const serialized = JSON.stringify(configuration, null, 2) + '\n';
  if (serialized.includes('site-creator-d1') || serialized.includes('00000000-0000-4000-8000-000000000000')) throw new Error('A Sites database placeholder remains in the staged configuration.');
  await mkdir(destination, { recursive: true });
  const filter = file => { const relative = path.relative(source, file); return !relative.split(path.sep).some(part => excludedNames.has(part) || /^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(part)); };
  for (const entry of await readdir(source)) {
    const sourceEntry = path.join(source, entry);
    if (filter(sourceEntry)) await cp(sourceEntry, path.join(destination, entry), { recursive: true, errorOnExist: true, force: false, filter });
  }
  await writeFile(path.join(destination, 'server', 'wrangler.json'), serialized, 'utf8');
  for (const file of migrationFiles) await stat(path.join(destination, '.openai', 'drizzle', file));
  return { prepared: true, output: destination, configuration: path.join(destination, 'server', 'wrangler.json'), migrationFiles: migrationFiles.length, deployed: false, databaseCreated: false, secretsIncluded: false, migrationRequired: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = {};
    const names = { '--account-id': 'accountId', '--database-id': 'databaseId', '--name': 'name', '--output': 'output' };
    for (let i = 2; i < process.argv.length; i += 2) {
      const key = names[process.argv[i]], value = process.argv[i + 1];
      if (!key || !value || value.startsWith('--') || Object.hasOwn(options, key)) throw new Error('Usage: node scripts/prepare-cloudflare-release.mjs --account-id <32-hex> --database-id <UUID> [--name fatima-agro] [--output work/cloudflare-release]');
      options[key] = value;
    }
    console.log(JSON.stringify(await prepareCloudflareRelease(options), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
