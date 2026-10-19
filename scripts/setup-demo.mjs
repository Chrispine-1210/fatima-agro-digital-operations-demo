import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { localRuntimeEnvironment } from './local-runtime.mjs';

if (!existsSync('dist/server/wrangler.json')) {
  console.error('Run npm run build before setup:demo.');
  process.exit(1);
}
if (!existsSync('.dev.vars')) {
  writeFileSync('.dev.vars', `FATIMA_LOCAL_DEMO="true"\nFATIMA_LOCAL_SESSION_SECRET="${randomBytes(48).toString('base64url')}"\n`, { mode: 0o600 });
  console.log('Created ignored local rehearsal configuration. No key was printed.');
} else console.log('Preserved existing local rehearsal configuration.');

// Build output lives under dist/server; its default relative migration directory is absent.
// Keep a separate ignored, secret-free local config with an absolute source migration path.
const built = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
const database = built.d1_databases?.find((item) => item.binding === 'DB');
if (!database) throw new Error('The presentation build must configure the DB binding.');
mkdirSync('work', { recursive: true });
const configuration = resolve('work/local-d1-config.json');
const persistence = resolve(process.env.FATIMA_DEMO_SETUP_STATE_DIRECTORY || '.wrangler/state');
writeFileSync(configuration, JSON.stringify({ name: built.name, compatibility_date: built.compatibility_date, d1_databases: [{ binding: database.binding, database_name: database.database_name, database_id: database.database_id, migrations_table: 'd1_migrations', migrations_dir: resolve('drizzle') }] }, null, 2));
const common = ['--local', '--config', configuration, '--persist-to', persistence];
const environment = localRuntimeEnvironment();
function execute(command) {
  const response = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB', ...common, '--command', command, '--json'], { encoding: 'utf8', env: environment });
  if (response.status !== 0) throw new Error(`Local database preparation failed. ${response.stderr || response.stdout || 'Wrangler did not complete.'}`);
  const batches = JSON.parse(response.stdout);
  if (!batches.every((batch) => batch.success)) throw new Error('Local database preparation did not succeed.');
  return batches.flatMap((batch) => batch.results ?? []);
}

const tables = execute("SELECT name FROM sqlite_master WHERE type = 'table';").map((row) => row.name);
const baseline = '0000_yellow_zuras.sql';
const recorded = tables.includes('d1_migrations') ? execute('SELECT name FROM d1_migrations;').map((row) => row.name) : [];
if (tables.includes('portal_state') && !recorded.includes(baseline)) {
  // Older rehearsals created only this table directly. Adopt that exact baseline once,
  // without replaying CREATE TABLE or changing any existing presentation records.
  const migration = readFileSync(resolve('drizzle', baseline), 'utf8').replaceAll('`', '').replace(/\s+/g, '');
  const expected = 'CREATE TABLE portal_state (id text PRIMARY KEY NOT NULL, revision integer DEFAULT 0 NOT NULL, payload text NOT NULL, updated_at text NOT NULL);'.replace(/\s+/g, '');
  const columns = execute('PRAGMA table_info(portal_state);');
  const schemaMatches = columns.length === 4 && [['id', 'text', 1], ['revision', 'integer', 0], ['payload', 'text', 0], ['updated_at', 'text', 0]].every(([name, type, primary], index) => columns[index].name === name && columns[index].type.toLowerCase() === type && columns[index].notnull === 1 && columns[index].pk === primary && (name !== 'revision' || String(columns[index].dflt_value) === '0'));
  if (migration !== expected || !schemaMatches) throw new Error('Existing local schema does not match the packaged initial migration. Review the database before adopting its baseline.');
  execute(`CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL); INSERT OR IGNORE INTO d1_migrations (name) VALUES ('${baseline}');`);
  console.log('Recorded the verified existing initial schema in the local migration journal; presentation records were preserved.');
}
const response = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', ...common], { stdio: 'inherit', env: environment });
process.exitCode = response.status ?? 1;
