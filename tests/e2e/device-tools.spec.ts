import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { initialState, localPersonas } from "../../lib/server/seed";
import { snapshot } from "../../lib/server/domain";
import type { ModuleId } from "../../lib/portal-types";

/** Only local rehearsal authentication uses the local API. Business data is an
 * isolated snapshot fixture; barcode images and video frames are synthetic. */
async function fixture(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const response = await page.context().request.post(`${origin}/api/session`, { headers: { Origin: origin }, data: { persona: "storekeeper" } });
  expect(response.ok(), await response.text()).toBeTruthy();
  const state = initialState(), user = localPersonas.storekeeper;
  state.users = Object.values(localPersonas);
  const posted: unknown[] = [];
  await page.route(/\/api\/(?:session|portal)(?:\?.*)?$/, async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/api/session") return route.fulfill({ json: { user, localDemo: true, signInUrl: "/account", signOutUrl: "/account", mode: "captured demonstration" } });
    if (request.method() === "GET") return route.fulfill({ json: snapshot(state, user, url.searchParams.get("module") as ModuleId) });
    posted.push(request.postDataJSON());
    return route.fulfill({ status: 400, json: { error: "This read-only device fixture does not permit business mutations." } });
  });
  return { product: state.products[0], posted, state, origin };
}

test("generated Code 128 label round-trips through local ZXing barcode-image decoding", async ({ page, baseURL }) => {
  const f = await fixture(page, baseURL!);
  const external: string[] = [];
  page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== f.origin) external.push(request.url()); });
  // Prove the software fallback rather than relying on the host's native support.
  await page.addInitScript(() => Object.defineProperty(window, "BarcodeDetector", { configurable: true, value: undefined }));
  await page.goto("/hq/procurement");
  const input = page.getByRole("textbox", { name: "Scan or enter a product SKU / barcode", exact: true });
  await input.fill(f.product.sku); await input.press("Enter");
  const barcode = page.getByRole("img", { name: `Code 128 barcode for ${f.product.barcode}`, exact: true });
  await expect.poll(() => barcode.locator("rect").count()).toBeGreaterThan(10);
  await expect.poll(async () => (await barcode.boundingBox())?.width ?? 0).toBeGreaterThan(150);
  const image = await barcode.screenshot({ animations: "disabled", scale: "css" });
  await input.fill("UNKNOWN-CODE-BEFORE-IMAGE"); await input.press("Enter");
  await expect(page.locator(".it-product-summary")).toHaveCount(0);
  await page.getByLabel("Choose barcode image", { exact: true }).setInputFiles({ name: "synthetic-fatima-code128.png", mimeType: "image/png", buffer: image });
  await expect(page.locator(".it-product-summary h3")).toHaveText(f.product.name);
  await expect(input).toHaveValue(f.product.barcode);
  await expect(page.locator(".dt-scanner [role=status]")).toContainText(`Barcode read: ${f.product.barcode}`);
  expect(f.posted).toHaveLength(0);
  expect(external).toEqual([]);
  await mkdir("work/management-evidence", { recursive: true });
  await page.screenshot({ path: "work/management-evidence/barcode-image-roundtrip.png", fullPage: true });
});

test("explicit native-camera scan stops its synthetic media track after a match", async ({ page, baseURL }) => {
  const f = await fixture(page, baseURL!);
  await page.addInitScript(({ barcode }) => {
    const counters = { cameraRequests: 0, detectorCalls: 0, streams: [] as MediaStream[] };
    Object.defineProperty(window, "deviceTest", { value: counters });
    Object.defineProperty(window, "BarcodeDetector", { configurable: true, value: class {
      static async getSupportedFormats() { return ["code_128", "qr_code"]; }
      async detect() { counters.detectorCalls++; return [{ rawValue: barcode }]; }
    } });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: async () => {
      counters.cameraRequests++;
      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
      const context = canvas.getContext("2d")!; context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
      const stream = canvas.captureStream(10); counters.streams.push(stream); return stream;
    } });
  }, { barcode: f.product.barcode });
  await page.goto("/hq/procurement");
  expect(await page.evaluate(() => (window as unknown as { deviceTest: { cameraRequests: number } }).deviceTest.cameraRequests)).toBe(0);
  await page.getByRole("button", { name: "Use phone or laptop camera", exact: true }).click();
  await expect(page.locator(".it-product-summary h3")).toHaveText(f.product.name);
  await expect(page.getByRole("button", { name: "Stop scan", exact: true })).toHaveCount(0);
  const result = await page.evaluate(() => {
    const counters = (window as unknown as { deviceTest: { cameraRequests: number; detectorCalls: number; streams: MediaStream[] } }).deviceTest;
    return { cameraRequests: counters.cameraRequests, detectorCalls: counters.detectorCalls, states: counters.streams.flatMap(stream => stream.getTracks().map(track => track.readyState)) };
  });
  expect(result.cameraRequests).toBe(1); expect(result.detectorCalls).toBeGreaterThan(0); expect(result.states).toEqual(["ended"]);
  expect(f.posted).toHaveLength(0);
});
