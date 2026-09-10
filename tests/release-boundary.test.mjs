import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const gitignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

test("excludes the confidential and duplicated project surfaces", () => {
  for (const ignored of ["/client-pack/", "/fatima-agro-operations-demo/", "*.docx", "*.pdf", ".env*"]) {
    assert.ok(gitignore.includes(ignored), `Missing ignore rule: ${ignored}`);
  }
  assert.ok(gitignore.includes("!.env.example"));
});

test("publishes an evaluation notice without an automatic open-source licence", () => {
  assert.match(readme, /evaluation only/i);
  assert.match(readme, /does not grant commercial reuse/i);
  assert.doesNotMatch(readme, /MIT License|Apache License|GPL License/i);
});

test("documents that the public demo requires no secrets", () => {
  assert.match(envExample, /requires no runtime secrets/i);
  assert.doesNotMatch(envExample, /(password|secret|token|api_key)\s*=\s*\S+/i);
});
