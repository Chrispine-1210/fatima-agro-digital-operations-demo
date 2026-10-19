import { existsSync } from 'node:fs';
import { delimiter, dirname, resolve } from 'node:path';

/** Optional portable Windows runtime support; no DLLs or credentials enter build output. */
export function localRuntimeEnvironment() {
  const environment = { ...process.env, WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_CF_FETCH_ENABLED: process.env.CLOUDFLARE_CF_FETCH_ENABLED ?? 'false' };
  if (process.platform === 'win32') {
    const runtime = resolve(dirname(process.execPath), '..', 'vc-runtime');
    if (existsSync(runtime)) {
      const pathKey = Object.keys(environment).find(key => key.toLowerCase() === 'path') ?? 'PATH';
      environment[pathKey] = `${runtime}${delimiter}${environment[pathKey] ?? ''}`;
    }
  }
  return environment;
}
