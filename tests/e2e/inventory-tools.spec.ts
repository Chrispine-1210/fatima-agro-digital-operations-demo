import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { ActionRequest, ModuleId, SessionResponse } from "../../lib/portal-types";
import { applyAction, snapshot } from "../../lib/server/domain";
import { initialState, localPersonas } from "../../lib/server/seed";

/** Authentication alone uses the local rehearsal API. All browser session reads and
 * business API requests are intercepted; these fixtures never reset or post business
 * records to D1. Camera and physical printer operation are not claimed by these tests. */
async function inventoryFixture(page: Page, baseURL: string, persona = "storekeeper") {
  const origin = new URL(baseURL).origin;
  let current = localPersonas[persona];
  let state = initialState();
  state.users = Object.values(localPersonas);
  state.units.push({ id: "DP-UI-TEST", name: "Synthetic inventory test depot", kind: "Depot", status: "Active", functions: ["Inventory", "Tasks"], evidence: "Browser fixture only; not a physical Fatima depot", createdBy: "system" });
  const actions: ActionRequest[] = [];

  async function signIn(nextPersona: string) {
    const response = await page.context().request.post(`${origin}/api/session`, { headers: { Origin: origin }, data: { persona: nextPersona } });
    expect(response.ok(), await response.text()).toBe(true);
    current = localPersonas[nextPersona];
    expect(current).toBeTruthy();
  }
  await signIn(persona);

  await page.route(/\/api\/(?:session|portal)(?:\?.*)?$/, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/session") {
      expect(request.method()).toBe("GET");
      const session: SessionResponse = { user: current, localDemo: true, signInUrl: "/signin-with-chatgpt?return_to=%2Faccount", signOutUrl: "/signout-with-chatgpt?return_to=%2F", mode: "captured demonstration" };
      return route.fulfill({ json: session });
    }
    if (request.method() === "GET") {
      const module = url.searchParams.get("module") as ModuleId;
      expect(["procurement", "admin", "notifications"]).toContain(module);
      return route.fulfill({ json: snapshot(state, current, module) });
    }
    expect(request.method()).toBe("POST");
    const requestAction = request.postDataJSON() as ActionRequest;
    expect(["inventory.adjustmentRequest", "inventory.adjustmentDecision", "inventory.transferRequest", "inventory.transferDecision", "inventory.identify", "admin.unitLocation"]).toContain(requestAction.action);
    actions.push(requestAction);
    try {
      const changed = applyAction(state, current, requestAction.action, requestAction.data ?? {});
      changed.state.revision = state.revision + 1;
      state = changed.state;
      return route.fulfill({ json: { message: changed.message, result: changed.result, revision: state.revision } });
    } catch (cause) {
      const error = cause as Error & { status?: number; code?: string };
      return route.fulfill({ status: error.status ?? 400, json: { error: error.message, code: error.code } });
    }
  });

  return { actions, signIn, get state() { return state; }, get product() { return state.products[0]; } };
}

async function selectByUsbInput(page: Page, value: string) {
  const input = page.getByRole("textbox", { name: "Scan or enter a product SKU / barcode", exact: true });
  await input.fill(value);
  // Keyboard-wedge USB scanners send the code followed by Enter.
  await input.press("Enter");
}

test("USB-style Enter selects the SKU and generates a downloadable Code 128 label", async ({ page, baseURL }) => {
  const fixture = await inventoryFixture(page, baseURL!);
  await page.goto("/hq/procurement");
  await expect(page.getByRole("heading", { name: "Inventory tools", exact: true })).toBeVisible();
  await selectByUsbInput(page, fixture.product.sku);
  await expect(page.locator(".it-product-summary h3")).toHaveText(fixture.product.name);
  await expect(page.locator(".it-product-summary")).toContainText(fixture.product.sku);
  const barcode = page.getByRole("img", { name: `Code 128 barcode for ${fixture.product.barcode}`, exact: true });
  await expect(barcode).toBeVisible();
  await expect.poll(() => barcode.locator("rect").count()).toBeGreaterThan(10);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe(`${fixture.product.barcode}-barcode.svg`);
  expect(fixture.actions).toHaveLength(0);
  await selectByUsbInput(page, "UNKNOWN-UI-TEST-CODE");
  await expect(page.locator(".it-scan-status")).toContainText("No product matches");
  await expect(page.locator(".it-product-summary")).toHaveCount(0);
});

test("a stock count remains pending until a separate operations reviewer approves it", async ({ page, baseURL }) => {
  const fixture = await inventoryFixture(page, baseURL!);
  const productId = fixture.product.id;
  const original = fixture.state.stockByUnit[`BR-DEMO-01:${productId}`];
  await page.goto("/hq/procurement");
  await selectByUsbInput(page, fixture.product.barcode);
  const countForm = page.getByRole("form", { name: "Request a stock count adjustment", exact: true });
  await countForm.getByRole("combobox", { name: "Operating unit", exact: true }).selectOption("BR-DEMO-01");
  await countForm.getByLabel("Counted available units", { exact: true }).fill(String(original - 3));
  // Simulate another operation changing available stock while the count is open.
  const refreshedBalance = original - 1;
  fixture.state.stockByUnit[`BR-DEMO-01:${productId}`] = refreshedBalance;
  fixture.state.products[0].stock = refreshedBalance;
  fixture.state.revision += 1;
  await page.getByRole("button", { name: "Refresh records", exact: true }).click();
  const clearAndRecount = countForm.getByRole("button", { name: "Recorded balance changed; clear and recount", exact: true });
  await expect(clearAndRecount).toBeVisible();
  await expect(countForm.getByRole("button", { name: "Request count adjustment", exact: true })).toBeDisabled();
  expect(fixture.actions).toHaveLength(0);
  await clearAndRecount.click();
  await expect(countForm.getByLabel("Counted available units", { exact: true })).toHaveValue("");
  await countForm.getByLabel("Counted available units", { exact: true }).fill(String(original - 3));
  await countForm.getByLabel("Reason", { exact: true }).fill("Synthetic browser count discrepancy");
  await countForm.getByLabel("Evidence reference", { exact: true }).fill("UI-COUNT-SHEET-01");
  await countForm.getByRole("button", { name: "Request count adjustment", exact: true }).click();
  await expect.poll(() => fixture.state.stockAdjustments.length).toBe(1);
  const request = fixture.state.stockAdjustments[0];
  expect(request.status).toBe("Pending");
  expect(fixture.state.stockByUnit[`BR-DEMO-01:${productId}`]).toBe(refreshedBalance);
  expect(fixture.state.stockMovements).toHaveLength(0);
  expect(fixture.actions[0]).toMatchObject({ action: "inventory.adjustmentRequest", data: { productId, unitId: "BR-DEMO-01", expectedQuantity: refreshedBalance, countedQuantity: original - 3, reason: "Synthetic browser count discrepancy", evidence: "UI-COUNT-SHEET-01" } });
  expect(fixture.actions[0].data?.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.locator(".it-request").filter({ hasText: request.id })).toContainText("Pending");

  await fixture.signIn("operations-reviewer");
  await page.reload();
  const card = page.locator(".it-request").filter({ hasText: request.id });
  const approve = card.getByRole("button", { name: "Approve", exact: true });
  await expect(approve).toBeDisabled();
  await card.getByRole("checkbox", { name: "I checked the evidence and did not request this change.", exact: true }).check();
  await approve.click();
  await expect(card).toContainText("Approved");
  expect(fixture.state.stockAdjustments[0].decidedBy).toBe(localPersonas["operations-reviewer"].id);
  expect(fixture.state.stockAdjustments[0].requestedBy).toBe(localPersonas.storekeeper.id);
  expect(fixture.state.stockByUnit[`BR-DEMO-01:${productId}`]).toBe(original - 3);
  expect(fixture.state.stockMovements).toHaveLength(1);
  expect(fixture.actions[1]).toMatchObject({ action: "inventory.adjustmentDecision", data: { adjustmentId: request.id, decision: "Approved" } });
  expect(fixture.actions[1].data?.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
});

test("a transfer selects active inventory units and submits a linked request without moving stock", async ({ page, baseURL }) => {
  const fixture = await inventoryFixture(page, baseURL!, "operations-director");
  const productId = fixture.product.id;
  const original = fixture.state.stockByUnit[`BR-DEMO-01:${productId}`];
  await page.goto("/hq/procurement");
  await selectByUsbInput(page, fixture.product.sku);
  const transfer = page.getByRole("form", { name: "Request an inventory transfer", exact: true });
  await expect(transfer.getByRole("combobox", { name: "From unit", exact: true }).locator('option[value="HQ"]')).toHaveCount(0);
  await transfer.getByRole("combobox", { name: "From unit", exact: true }).selectOption("BR-DEMO-01");
  await transfer.getByRole("combobox", { name: "To unit", exact: true }).selectOption("DP-UI-TEST");
  await transfer.getByLabel("Quantity", { exact: true }).fill("4");
  await transfer.getByLabel("Reason", { exact: true }).fill("Synthetic depot allocation");
  await transfer.getByLabel("Handover / evidence reference", { exact: true }).fill("UI-TRANSFER-SHEET-01");
  await transfer.getByRole("button", { name: "Request stock transfer", exact: true }).click();
  await expect.poll(() => fixture.state.stockTransfers.length).toBe(1);
  expect(fixture.state.stockTransfers[0]).toMatchObject({ productId, fromUnitId: "BR-DEMO-01", toUnitId: "DP-UI-TEST", quantity: 4, status: "Pending" });
  expect(fixture.actions[0].data?.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  expect(fixture.state.stockByUnit[`BR-DEMO-01:${productId}`]).toBe(original);
  expect(fixture.state.stockByUnit[`DP-UI-TEST:${productId}`] ?? 0).toBe(0);
  await expect(page.locator(".it-request").filter({ hasText: fixture.state.stockTransfers[0].id })).toContainText("Synthetic inventory test depot");
});

test("branch coordinates require an explicit device-location action and persist with the verified address", async ({ page, context, baseURL }) => {
  const fixture = await inventoryFixture(page, baseURL!, "operations-director");
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -13.9626, longitude: 33.7741, accuracy: 12 });
  await page.goto("/hq/admin");
  const branch = page.locator(".it-unit").filter({ has: page.getByRole("heading", { name: "Demonstration branch", exact: true }) });
  await branch.getByRole("button", { name: "Edit location", exact: true }).click();
  const location = page.getByRole("form", { name: "Location for Demonstration branch", exact: true });
  await expect(location.getByLabel("Latitude (optional)", { exact: true })).toHaveValue("");
  await expect(location.getByLabel("Longitude (optional)", { exact: true })).toHaveValue("");
  expect(fixture.actions).toHaveLength(0);
  await location.getByRole("textbox", { name: "Street, area and collection instructions", exact: true }).fill("Synthetic test address, Kanengo");
  await location.getByLabel("Town / city", { exact: true }).fill("Lilongwe");
  await location.getByLabel("Country", { exact: true }).fill("Malawi");
  await location.getByRole("textbox", { name: "Verification / location note", exact: true }).fill("Synthetic browser position fixture; not verified premises coordinates.");
  await location.getByRole("button", { name: "Use this device’s location", exact: true }).click();
  await expect(location.getByLabel("Latitude (optional)", { exact: true })).toHaveValue("-13.962600");
  await expect(location.getByLabel("Longitude (optional)", { exact: true })).toHaveValue("33.774100");
  expect(fixture.actions).toHaveLength(0);
  await location.getByRole("button", { name: "Save location", exact: true }).click();
  await expect.poll(() => fixture.actions.length).toBe(1);
  expect(fixture.actions[0]).toMatchObject({ action: "admin.unitLocation", data: { unitId: "BR-DEMO-01", address: "Synthetic test address, Kanengo", town: "Lilongwe", country: "Malawi", latitude: -13.9626, longitude: 33.7741 } });
  await expect(branch).toContainText("Synthetic test address, Kanengo");
  await expect(branch.getByRole("link", { name: /Open map/ })).toHaveAttribute("href", /openstreetmap\.org\/\?mlat=-13\.9626&mlon=33\.7741/);
  await page.reload();
  await branch.getByRole("button", { name: "Edit location", exact: true }).click();
  await expect(location.getByLabel("Latitude (optional)", { exact: true })).toHaveValue("-13.9626");
  await expect(location.getByRole("textbox", { name: "Street, area and collection instructions", exact: true })).toHaveValue("Synthetic test address, Kanengo");
});

test("inventory and location tools fit a 390px viewport after direct navigation and refresh", async ({ page, baseURL }) => {
  const fixture = await inventoryFixture(page, baseURL!, "operations-director");
  await page.setViewportSize({ width: 390, height: 844 });
  await mkdir("work/inventory-evidence", { recursive: true });
  for (const path of ["/hq/procurement", "/hq/admin"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    if (path.endsWith("procurement")) {
      await selectByUsbInput(page, fixture.product.sku);
      await expect(page.getByRole("button", { name: "Download SVG", exact: true })).toBeEnabled();
    } else await expect(page.getByRole("heading", { name: "Branch and depot locations", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.locator(".it-tools").first().screenshot({ path: `work/inventory-evidence/${path.endsWith("procurement") ? "inventory" : "locations"}-390.png` });
    await page.reload();
    await expect(page.locator(".it-tools").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
  expect(fixture.actions).toHaveLength(0);
});
