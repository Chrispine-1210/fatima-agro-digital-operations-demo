import { mkdir, readFile, copyFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve, dirname, relative } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dependencies = [
  ["tesseract.js", "7.0.0"],
  ["tesseract.js-core", "7.0.0"],
  ["@tesseract.js-data/eng", "1.0.0"],
  ["jsbarcode", "3.12.3"],
  ["@zxing/browser", "0.2.1"],
  ["@zxing/library", "0.23.0"],
];
for (const [name, expected] of dependencies) {
  const metadata = JSON.parse(await readFile(resolve(root, "node_modules", name, "package.json"), "utf8"));
  if (metadata.version !== expected) throw new Error(`OCR asset version mismatch: ${name} ${metadata.version}; expected ${expected}. Run npm ci.`);
}

const generated = resolve(root, "public/vendor/ocr");
const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js", "tesseract.js", "Apache-2.0"],
  ["node_modules/tesseract.js/LICENSE.md", "licenses/tesseract.js-LICENSE", "tesseract.js", "Apache-2.0"],
  ["node_modules/@tesseract.js-data/eng/package.json", "licenses/english-data-package.json", "@tesseract.js-data/eng", "MIT"],
  ["node_modules/tesseract.js-core/LICENSE", "licenses/tesseract.js-core-LICENSE", "tesseract.js-core", "Apache-2.0"],
  ["node_modules/jsbarcode/MIT-LICENSE.txt", "licenses/jsbarcode-LICENSE", "jsbarcode", "MIT"],
  ["node_modules/@zxing/browser/LICENSE", "licenses/zxing-browser-LICENSE", "@zxing/browser", "MIT"],
  ["node_modules/@zxing/library/LICENSE", "licenses/zxing-library-LICENSE", "@zxing/library", "Apache-2.0"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "lang/eng.traineddata.gz", "@tesseract.js-data/eng", "MIT"],
  ...["lstm", "simd-lstm", "relaxedsimd-lstm"].map(flavour => [`node_modules/tesseract.js-core/tesseract-core-${flavour}.wasm.js`, `core/tesseract-core-${flavour}.wasm.js`, "tesseract.js-core", "Apache-2.0"]),
];
const assets = [];
for (const [source, destination, packageName, license] of files) {
  const from = resolve(root, source), to = resolve(generated, destination), metadata = await stat(from);
  if (!metadata.size || metadata.size > 25 * 1024 * 1024) throw new Error(`OCR asset is empty or exceeds the hosting asset limit: ${source}`);
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  const contents = await readFile(to);
  assets.push({ path: `/vendor/ocr/${destination}`, package: packageName, license, bytes: contents.byteLength, sha256: createHash("sha256").update(contents).digest("hex") });
}
const manifest = { generatedBy: "scripts/prepare-ocr-assets.mjs", dependencies: Object.fromEntries(dependencies), model: "English 4.0.0_best_int (LSTM only)", privacy: "Assets load from the Fatima Agro origin; image pixels and full extracted text stay in the browser.", assets };
await mkdir(resolve(root, "docs"), { recursive: true });
await writeFile(resolve(root, "docs/ocr-asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(resolve(generated, "asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${assets.length} self-hosted OCR assets (${assets.reduce((sum, asset) => sum + asset.bytes, 0).toLocaleString("en-GB")} bytes) in ${relative(root, generated)}.`);
