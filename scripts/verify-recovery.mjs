import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { localRuntimeEnvironment } from './local-runtime.mjs';

// This rehearsal always reads the current local database and restores to a new,
// isolated work directory. It cannot target a hosted database or overwrite the source.
const sourceDirectory = resolve('.wrangler/state');
const configuration = resolve('work/local-d1-config.json');
// Wrangler 4.92's local export does not accept --persist-to. Its default state
// directory is relative to its configuration file, so export needs a temporary
// root-level configuration to read this checkout's existing .wrangler/state.
const exportConfiguration = resolve(`.fatima-local-export-${randomUUID()}.json`);
const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
// Keep Windows SQLite's generated hash-file path below native path limits.
const runDirectory = resolve('work', `recovery-${randomUUID().slice(0, 8)}`);
const restoredDirectory = resolve(runDirectory, 'r');
const backup = resolve(runDirectory, 'local-backup.sql');
const evidence = resolve('aothothe-pack/evidence/recovery-2026-10-19.txt');
const insideWork = relative(resolve('work'), runDirectory);
if (!insideWork || insideWork.startsWith('..') || isAbsolute(insideWork) || restoredDirectory === sourceDirectory || existsSync(restoredDirectory)) throw new Error('The recovery destination must be a new isolated work directory.');
if (!existsSync(configuration) || !existsSync(wrangler)) throw new Error('Complete dependency installation, build and setup:demo before verifying local recovery.');
mkdirSync(runDirectory, { recursive: true });
mkdirSync(dirname(evidence), { recursive: true });

let stage = 'source inspection';
const started = performance.now();
function run(arguments_, persistence) {
  const exporting = arguments_[0] === 'export';
  if (exporting && persistence !== sourceDirectory) throw new Error('Local export must use the original read-only source.');
  const persistenceArguments = exporting ? [] : ['--persist-to', persistence];
  const response = spawnSync(process.execPath, [wrangler, 'd1', ...arguments_, '--local', '--config', exporting ? exportConfiguration : configuration, ...persistenceArguments], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 60_000, env: localRuntimeEnvironment() });
  if (response.status !== 0) {
    // Wrangler errors can repeat SQL. Retain diagnostic details only beside the raw,
    // ignored backup; the user-facing evidence contains no payload, SQL or credentials.
    writeFileSync(resolve(runDirectory, `private-${stage.replace(/\s+/g, '-')}-diagnostic.txt`), `${response.stdout ?? ''}\n${response.stderr ?? ''}`);
    throw new Error(`Local recovery failed during ${stage}; diagnostics are retained only in the ignored work directory.`);
  }
  return response.stdout;
}
function readSnapshot(persistence) {
  const batches = JSON.parse(run(['execute', 'DB', '--command', "SELECT revision, payload FROM portal_state WHERE id = 'presentation-v2';", '--json'], persistence));
  if (!batches.every(batch => batch.success)) throw new Error('Local state query did not succeed.');
  const rows = batches.flatMap(batch => batch.results ?? []);
  if (rows.length !== 1 || typeof rows[0].payload !== 'string') throw new Error('Create synthetic rehearsal records before verifying recovery.');
  const state = JSON.parse(rows[0].payload);
  const names = ['users', 'profiles', 'orders', 'invoices', 'bills', 'payments', 'receipts', 'expenses', 'creditNotes', 'journals', 'employees', 'leaveRequests', 'payrollPreparations', 'purchaseRequests', 'purchaseOrders', 'goodsReceipts', 'stockMovements', 'notifications', 'campaigns', 'capturedMessages', 'audit'];
  const counts = Object.fromEntries(names.map(name => [name, Array.isArray(state[name]) ? state[name].length : 0]));
  const lines = state.journals.flatMap(journal => journal.lines);
  const debits = lines.reduce((sum, line) => sum + line.debit, 0);
  const credits = lines.reduce((sum, line) => sum + line.credit, 0);
  const balance = account => lines.filter(line => line.account === account).reduce((sum, line) => sum + line.debit - line.credit, 0);
  const ledger = { debits, credits, balanced: debits === credits && state.journals.every(journal => journal.lines.reduce((sum, line) => sum + line.debit - line.credit, 0) === 0), receivables: balance('Accounts receivable'), payables: -balance('Accounts payable'), cash: balance('Demo cash and bank'), revenue: -balance('Sales revenue') - balance('Sales returns'), expenses: balance('Operating expenses') };
  return { revision: rows[0].revision, payloadSha256: createHash('sha256').update(rows[0].payload, 'utf8').digest('hex'), counts, ledger };
}

try {
  const before = readSnapshot(sourceDirectory);
  stage = 'local export';
  const exportStarted = performance.now();
  writeFileSync(exportConfiguration, readFileSync(configuration), { flag: 'wx' });
  run(['export', 'DB', '--output', backup], sourceDirectory);
  const exportMilliseconds = Math.round(performance.now() - exportStarted);
  stage = 'local import';
  const importStarted = performance.now();
  mkdirSync(restoredDirectory);
  run(['execute', 'DB', '--file', backup], restoredDirectory);
  const importMilliseconds = Math.round(performance.now() - importStarted);
  stage = 'restored state comparison';
  const restored = readSnapshot(restoredDirectory);
  stage = 'source preservation check';
  const after = readSnapshot(sourceDirectory);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('The source changed during verification. Repeat while the local rehearsal is idle.');
  if (JSON.stringify(before) !== JSON.stringify(restored)) throw new Error('Restored state did not exactly match the source.');
  if (!restored.ledger.balanced) throw new Error('The restored demonstration ledger does not balance.');
  const text = [
    'Fatima Agro local backup and recovery verification',
    `Verified at: ${new Date().toISOString()}`,
    'Scope: local synthetic rehearsal database only; this is not a hosted recovery SLA.',
    'Result: PASS',
    'Export imported into a new isolated local persistence directory.',
    'Original local presentation state unchanged: true',
    'Exact payload SHA-256, revision, record counts and ledger totals match: true',
    `Revision: ${restored.revision}`,
    `Payload SHA-256: ${restored.payloadSha256}`,
    `Record counts: ${JSON.stringify(restored.counts)}`,
    `Ledger totals (integer MWK): ${JSON.stringify(restored.ledger)}`,
    `Export duration: ${exportMilliseconds} ms`,
    `Import duration: ${importMilliseconds} ms`,
    `Total verification duration: ${Math.round(performance.now() - started)} ms`,
    `Raw backup and isolated restored state retained under ignored ${relative(process.cwd(), runDirectory)}.`,
    'Raw SQL, record payloads, customer details and session credentials are excluded from this evidence summary.',
    '',
  ].join('\n');
  writeFileSync(evidence, text);
  process.stdout.write(text);
} catch (error) {
  writeFileSync(resolve(runDirectory, 'private-verification-error.txt'), error instanceof Error ? error.stack ?? error.message : 'Recovery verification did not complete.');
  const text = `Fatima Agro local backup and recovery verification\nVerified at: ${new Date().toISOString()}\nResult: FAIL\nStage: ${stage}\nReview diagnostic details only in the ignored work directory.\nOriginal local database was never a restore target.\n`;
  writeFileSync(evidence, text);
  process.stderr.write(text);
  process.exitCode = 1;
} finally {
  if (existsSync(exportConfiguration)) unlinkSync(exportConfiguration);
}
