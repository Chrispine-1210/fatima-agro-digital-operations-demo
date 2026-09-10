import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css, layout] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
]);

test("provides the accessible application shell and release identity", () => {
  assert.match(page, /Skip to main content/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /htmlFor="demo-role"/);
  assert.match(page, /id="demo-role"/);
  assert.match(page, /v1\.0\.0-demo/);
  assert.match(layout, /codex-preview.*development/);
});

test("provides keyboard focus and responsive layouts", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("marks synthetic and future-only surfaces explicitly", () => {
  assert.match(page, /SYNTHETIC SHIFT/);
  assert.match(page, /Future expansion capability/);
  assert.match(page, /No price, payment term, negotiated option or client commitment/);
  assert.match(page, /Public details pending client verification/);
});
