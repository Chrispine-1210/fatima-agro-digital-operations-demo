import { readFile } from "node:fs/promises";
import ts from "typescript";

// The presentation domain uses normal bundler imports. Transpile only these pure modules
// in memory so Node's native test runner executes their actual implementation.
const cache = new Map();
export async function loadTypescript(file) {
  const url = file instanceof URL ? file : new URL(file, import.meta.url);
  if (cache.has(url.href)) return cache.get(url.href);
  const source = await readFile(url, "utf8");
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const matches = [...code.matchAll(/from\s+["'](\.\.?\/[^"']+)["']/g)];
  for (const match of matches) {
    const dependency = new URL(`${match[1]}.ts`, url);
    const dependencyUrl = await moduleUrl(dependency);
    code = code.replace(match[0], `from ${JSON.stringify(dependencyUrl)}`);
  }
  const encoded = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  cache.set(url.href, encoded);
  return encoded;
}
async function moduleUrl(url) { return loadTypescript(url); }
