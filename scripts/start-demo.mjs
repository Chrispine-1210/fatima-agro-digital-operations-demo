import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { localRuntimeEnvironment } from './local-runtime.mjs';

const config = resolve('dist/server/wrangler.json');
const localEnvironment = resolve(process.env.FATIMA_DEMO_ENV_FILE || '.dev.vars');
if (!existsSync(config) || !existsSync(localEnvironment)) {
  console.error('Run npm run build and npm run setup:demo before starting the local rehearsal.');
  process.exit(1);
}
const preview = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', config, '--env-file', localEnvironment, '--persist-to', resolve(process.env.FATIMA_DEMO_STATE_DIRECTORY || '.wrangler/state'), '--ip', '127.0.0.1', '--port', process.env.PORT || '5173'], { stdio: 'inherit', env: localRuntimeEnvironment() });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => preview.kill(signal));
preview.on('error', (error) => { console.error(`Local rehearsal could not start: ${error.message}`); process.exitCode = 1; });
preview.on('exit', (code) => { process.exitCode = code ?? 1; });
