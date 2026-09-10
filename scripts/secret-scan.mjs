import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["OpenAI-style key", /sk-[A-Za-z0-9]{20,}/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["assigned credential", /(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\s*[:=]\s*["'][^"']{12,}/i],
];
const textExtensions = new Set([".cjs", ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
const skip = new Set(["scripts/secret-scan.mjs", "package-lock.json"]);

function repositoryFiles() {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
  return output.split(/\r?\n/).filter(Boolean).filter((file) => textExtensions.has(path.extname(file)) && !skip.has(file));
}

function scan(label, content, findings) {
  for (const [kind, pattern] of patterns) if (pattern.test(content)) findings.push(`${label}: ${kind}`);
}

const findings = [];
for (const file of repositoryFiles()) scan(file, readFileSync(file, "utf8"), findings);

let commits = [];
try {
  commits = execFileSync("git", ["rev-list", "--all"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
} catch {
  commits = [];
}
for (const commit of commits) {
  const names = execFileSync("git", ["ls-tree", "-r", "--name-only", commit], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  for (const file of names) {
    if (!textExtensions.has(path.extname(file)) || skip.has(file)) continue;
    try { scan(`${commit.slice(0, 12)}:${file}`, execFileSync("git", ["show", `${commit}:${file}`], { encoding: "utf8", maxBuffer: 10_000_000 }), findings); } catch { /* unavailable object */ }
  }
}

if (findings.length) {
  console.error("Potential secrets detected:\n" + findings.join("\n"));
  process.exit(1);
}
console.log(`Secret scan passed: ${repositoryFiles().length} working-tree files and ${commits.length} commits checked.`);
