import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { initialState, localPersonas } from "../../lib/server/seed";
import { applyAction, snapshot } from "../../lib/server/domain";
import type { ModuleId, SessionUser } from "../../lib/portal-types";

// Only local authentication is real. Every business API call is an isolated fixture.
async function fixture(page: Page, context: BrowserContext, baseURL: string, persona = "finance") {
  const signedIn = await context.request.post(`${baseURL}/api/session`, { headers: { Origin: baseURL }, data: { persona } });
  expect(signedIn.ok(), await signedIn.text()).toBeTruthy();
  let state = initialState(); state.users = Object.values(localPersonas);
  const customer = localPersonas["customer-a"], finance = localPersonas.finance;
  const act = (user: SessionUser, action: string, data: Record<string, unknown>) => { const result = applyAction(state, user, action, data); state = result.state; return result; };
  act(customer, "customer.register", { name: "Synthetic receipt customer", phone: "000-TEST", marketingConsent: false });
  act(customer, "cart.set", { productId: "demo-maize", quantity: 1 });
  const order = act(customer, "checkout", { idempotencyKey: "fixture-order", method: "collection", name: customer.name, phone: "000-TEST" }).result as { id: string; invoiceId: string };
  act(finance, "finance.payment", { kind: "customer", referenceId: order.invoiceId, amount: 1000, method: "Synthetic cash", evidence: "TEST-ONLY", idempotencyKey: "fixture-payment" });
  const user = localPersonas[persona], posted: { action: string; data: Record<string, unknown> }[] = [];
  await page.route(/\/api\/session(?:\?.*)?$/, route => route.fulfill({ json: { user, localDemo: true, signInUrl: "/account", signOutUrl: "/account", mode: "captured demonstration" } }));
  await page.route(/\/api\/portal(?:\?.*)?$/, async route => {
    if (route.request().method() === "GET") { const module = new URL(route.request().url()).searchParams.get("module") as ModuleId; return route.fulfill({ json: snapshot(state, module === "public" ? null : user, module) }); }
    const body = route.request().postDataJSON(); posted.push(body);
    try { const result = act(user, body.action, body.data); await route.fulfill({ json: { message: result.message, result: result.result, revision: state.revision } }); }
    catch (cause) { await route.fulfill({ status: 400, json: { error: cause instanceof Error ? cause.message : "Fixture action failed" } }); }
  });
  return { receipt: state.receipts[0], order, posted, getState: () => state };
}

test("thermal receipt previews isolate printing and never create a payment", async ({ page, context, baseURL }) => {
  const f = await fixture(page, context, baseURL!);
  await page.addInitScript(() => { (window as unknown as { printCalls: number }).printCalls = 0; window.print = () => { (window as unknown as { printCalls: number }).printCalls++; }; });
  await page.goto("/hq/finance");
  await expect(page.getByRole("heading", { name: "Receipts and document capture" })).toBeVisible();
  await page.getByRole("textbox", { name: "Find a receipt or invoice reference", exact: true }).fill(f.receipt.id);
  await page.getByRole("textbox", { name: "Find a receipt or invoice reference", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Preview / print receipt" }).click();
  const dialog = page.getByRole("dialog", { name: `Receipt ${f.receipt.id}` });
  await expect(dialog).toContainText("Synthetic receipt customer");
  await expect(dialog).toContainText("DEMONSTRATION");
  await expect(dialog.locator("svg rect").first()).toBeVisible();
  await mkdir("work/management-evidence", { recursive: true });
  for (const paper of ["58", "80", "A4"]) {
    await page.getByLabel("Paper width").selectOption(paper);
    await expect(dialog.locator(".receipt-sheet")).toHaveClass(new RegExp(`receipt-paper-${paper}`));
    await page.getByRole("button", { name: "Open print dialog" }).click();
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".ip-shell")).toBeHidden();
    await expect(dialog.locator(".receipt-sheet")).toBeVisible();
    expect((await dialog.locator(".dt-barcode-canvas svg").boundingBox())!.width).toBeGreaterThan(100);
    await page.screenshot({ path: `work/management-evidence/receipt-${paper}.png`, fullPage: true });
    await page.pdf({ path: `work/management-evidence/receipt-${paper}.pdf`, width: paper === "A4" ? "210mm" : `${paper}mm`, height: "297mm", printBackground: true });
    await page.emulateMedia({ media: "screen" });
  }
  expect(await page.evaluate(() => (window as unknown as { printCalls: number }).printCalls)).toBe(3);
  await page.getByRole("button", { name: "Close preview" }).click();
  expect(f.posted).toHaveLength(0);
  expect(f.getState().receipts).toHaveLength(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test("receipt image OCR runs locally and saves only explicitly reviewed metadata", async ({ page, context, baseURL }) => {
  const f = await fixture(page, context, baseURL!);
  const external: string[] = [];
  page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== baseURL) external.push(request.url()); });
  await page.goto("/hq/finance");
  await page.getByLabel("Choose receipt file", { exact: true }).setInputFiles("tests/fixtures/receipt-ocr.png");
  await expect(page.getByText("File selected and fingerprinted on this device.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Extract receipt text locally" }).click();
  const extracted = page.getByLabel("Extracted text - review and edit before using", { exact: true });
  await expect(extracted).toHaveValue(/FA-TEST-001/, { timeout: 120000 });
  expect(f.posted).toHaveLength(0);
  await page.getByRole("region", { name: "Receipt evidence capture", exact: true }).getByLabel("Evidence reference", { exact: true }).fill("FA-TEST-001");
  await page.getByLabel("Reviewed note (optional)", { exact: true }).fill("Checked against synthetic original.");
  await page.getByRole("button", { name: "Save evidence metadata" }).click();
  await expect(page.getByText("Evidence metadata saved.", { exact: false })).toBeVisible();
  expect(f.posted).toHaveLength(1);
  expect(f.posted[0].action).toBe("finance.receiptCapture");
  expect(f.posted[0].data.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(f.posted[0].data.reference).toBe("FA-TEST-001");
  expect(f.posted[0].data.note).toBe("Checked against synthetic original.");
  expect(Object.keys(f.posted[0].data).sort()).toEqual(["targetType", "targetId", "source", "fileName", "mimeType", "byteLength", "sha256", "reference", "note", "idempotencyKey"].sort());
  expect(external).toEqual([]);
  expect(f.getState().receipts).toHaveLength(1);
  await page.screenshot({ path: "work/management-evidence/receipt-capture.png", fullPage: true });
});

test("camera denial keeps manual receipt lookup available", async ({ page, context, baseURL }) => {
  const f = await fixture(page, context, baseURL!);
  await page.addInitScript(() => { Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async () => { throw new DOMException("Denied for test", "NotAllowedError"); } }); });
  await page.goto("/hq/finance");
  await page.getByRole("button", { name: "Use phone or laptop camera" }).click();
  await expect(page.getByRole("alert")).toContainText("Camera permission was not granted");
  await page.getByRole("textbox", { name: "Find a receipt or invoice reference", exact: true }).fill(f.receipt.id);
  await page.getByRole("button", { name: "Find code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Preview / print receipt" })).toBeVisible();
  expect(f.posted).toHaveLength(0);
});

test("customer can print their own joined receipt after direct navigation and refresh", async ({ page, context, baseURL }) => {
  const f = await fixture(page, context, baseURL!, "customer-a");
  await page.goto(`/account/orders/${f.order.id}`);
  await page.reload();
  await page.getByRole("button", { name: "Preview / print receipt" }).click();
  await expect(page.getByRole("dialog")).toContainText(f.receipt.id);
  await expect(page.getByRole("dialog")).toContainText("Synthetic cash");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(f.posted).toHaveLength(0);
});
