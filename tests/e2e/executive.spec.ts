import { expect, test, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import type { ActionRequest, ExecutiveSnapshot, ModuleId, SessionResponse } from "../../lib/portal-types";
import { applyAction, snapshot } from "../../lib/server/domain";
import { initialState, localPersonas } from "../../lib/server/seed";

/** Business data lives only in this test closure. The local API is used solely to
 * establish the signed rehearsal cookie required by the server-rendered role gate.
 * Every browser portal GET and POST, including query-string variants, is intercepted.
 * These tests never reset D1 or write transactions to the application database. */
async function executiveFixture(page: Page, baseURL: string, persona = "ceo", options: { failInitialRead?: boolean } = {}) {
  const origin = new URL(baseURL).origin;
  let current = localPersonas[persona];
  let state = initialState();
  state.users = Object.values(localPersonas);
  const at = new Date().toISOString();
  const old = new Date(Date.now() - 45 * 86_400_000).toISOString();
  state.profiles.push({ id: "PRIVATE-CUSTOMER", name: "Private customer fixture", email: "private-customer@example.test", phone: "PRIVATE-PHONE", address: "PRIVATE-HOME-ADDRESS", marketingConsent: true, unsubscribed: false, createdAt: old });
  state.invoices.push({ id: "INV-EXEC-UI", customerId: "PRIVATE-CUSTOMER", orderId: "ORDER-EXEC-UI", unitId: "BR-DEMO-01", total: 90000, tax: 0, credited: 0, paid: 30000, status: "Part paid", createdAt: old, dueDate: old.slice(0, 10), note: "Fixture invoice" });
  state.orders.push({ id: "ORDER-EXEC-UI", customerId: "PRIVATE-CUSTOMER", unitId: "BR-DEMO-01", lines: [], subtotal: 90000, tax: 0, deliveryFee: 0, total: 90000, fulfilment: "pickup", deliveryAddress: "PRIVATE-HOME-ADDRESS", contact: "PRIVATE-PHONE", status: "Confirmed", createdAt: old, events: [], invoiceId: "INV-EXEC-UI" });
  state.payments.push({ id: "PAY-EXEC-UI", kind: "customer", referenceId: "INV-EXEC-UI", amount: 30000, method: "Synthetic fixture", evidence: "PRIVATE-BANK-REFERENCE", createdAt: at, actorId: localPersonas.finance.id, reconciled: false });
  state.bills.push({ id: "BILL-EXEC-UI", supplierId: "SUPPLIER-PRIVATE", purchaseOrderId: "", goodsReceiptId: "", unitId: "BR-DEMO-01", total: 15000, paid: 0, status: "Unpaid", createdAt: old, note: "Fixture bill without a contractual due date" });
  state.expenses.push({ id: "EXP-EXEC-UI", category: "Transport", description: "PRIVATE-EXPENSE-DESCRIPTION", amount: 10000, evidence: "PRIVATE-EXPENSE-REFERENCE", createdAt: at, actorId: localPersonas.finance.id, unitId: "BR-DEMO-01" });
  state.journals.push(
    { id: "JNL-INVOICE-UI", reference: "INV-EXEC-UI", description: "Fixture invoice", at: old, lines: [{ account: "Accounts receivable", debit: 90000, credit: 0 }, { account: "Sales revenue", debit: 0, credit: 90000 }] },
    { id: "JNL-PAYMENT-UI", reference: "PAY-EXEC-UI", description: "Fixture collection", at, lines: [{ account: "Demo cash and bank", debit: 30000, credit: 0 }, { account: "Accounts receivable", debit: 0, credit: 30000 }] },
    { id: "JNL-EXPENSE-UI", reference: "EXP-EXEC-UI", description: "Fixture expense", at, lines: [{ account: "Operating expenses", debit: 10000, credit: 0 }, { account: "Demo cash and bank", debit: 0, credit: 10000 }] },
    { id: "JNL-BILL-UI", reference: "BILL-EXEC-UI", description: "Fixture payable", at: old, lines: [{ account: "Inventory purchases", debit: 15000, credit: 0 }, { account: "Accounts payable", debit: 0, credit: 15000 }] },
  );
  state.employees.push({ id: "EMP-PRIVATE", name: "Private employee fixture", roleTitle: "PRIVATE-ROLE", unitId: "BR-DEMO-01", workEmail: "private-employee@example.test", startDate: old.slice(0, 10), status: "Onboarding", salary: 9876543, onboarding: [], createdAt: old });
  state.leaveRequests.push({ id: "LEAVE-EXEC-UI", employeeId: "EMP-PRIVATE", from: at.slice(0, 10), to: at.slice(0, 10), reason: "PRIVATE-LEAVE-REASON", status: "Pending", requestedBy: localPersonas.hr.id, createdAt: at });
  state.purchaseRequests.push({ id: "PR-EXEC-UI", productId: "demo-urea", quantity: 5, unitId: "BR-DEMO-01", neededBy: at.slice(0, 10), evidence: "UI-PURCHASE-REFERENCE", requestedBy: localPersonas.procurement.id, status: "Pending", createdAt: at });
  state.tasks.push({ id: "TASK-EXEC-UI", unitId: "BR-DEMO-01", title: "Overdue synthetic branch task", owner: "Operations", due: old.slice(0, 10), evidence: "", status: "Open", createdBy: localPersonas["operations-director"].id });
  state.units.push(
    { id: "DP-EXEC-UI", name: "Synthetic executive test depot", kind: "Depot", status: "Active", functions: ["Inventory", "Tasks"], evidence: "Test fixture only", createdBy: "system" },
    { id: "DP-PENDING-UI", name: "Proposed synthetic depot", kind: "Depot", status: "Setup", functions: ["Inventory", "Tasks"], evidence: "UI-DEPOT-APPROVAL-EVIDENCE", createdBy: localPersonas["operations-director"].id },
    { id: "DP-SELF-UI", name: "Executive-created proposal", kind: "Depot", status: "Setup", functions: ["Inventory"], evidence: "UI-SELF-APPROVAL-MUST-BLOCK", createdBy: localPersonas.ceo.id },
  );
  state.stockByUnit["DP-EXEC-UI:demo-maize"] = 2;
  state.products.find(item => item.id === "demo-maize")!.stock += 2;
  state.roleRequests.push(
    { id: "ACCESS-EXEC-UI", userId: localPersonas.finance.id, email: localPersonas.finance.email, role: "finance-director", unitId: "HQ", reason: "UI independent director appointment", requestedBy: localPersonas.administrator.id, status: "Pending director approval", approverRole: "ceo", createdAt: at },
    { id: "ACCESS-SELF-UI", userId: localPersonas.finance.id, email: localPersonas.finance.email, role: "finance-director", unitId: "HQ", reason: "UI executive-requested access must not self approve", requestedBy: localPersonas.ceo.id, status: "Pending director approval", approverRole: "ceo", createdAt: at },
  );
  const actions: ActionRequest[] = [];
  let failedInitialRead = false;

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
    try {
      if (request.method() === "GET") {
        const module = url.searchParams.get("module") as ModuleId;
        expect(["executive", "notifications", "admin", "public", "customer"]).toContain(module);
        if (module === "executive" && options.failInitialRead && !failedInitialRead) {
          failedInitialRead = true;
          return route.fulfill({ status: 503, json: { error: "The executive snapshot is temporarily unavailable." } });
        }
        return route.fulfill({ json: snapshot(state, current, module) });
      }
      expect(request.method()).toBe("POST");
      const requestAction = request.postDataJSON() as ActionRequest;
      expect(["executive.decisionCreate", "executive.decisionProgress", "executive.decisionClose", "admin.roleDecision", "admin.activateUnit"]).toContain(requestAction.action);
      actions.push(requestAction);
      const changed = applyAction(state, current, requestAction.action, requestAction.data ?? {});
      changed.state.revision = state.revision + 1;
      state = changed.state;
      return route.fulfill({ json: { message: changed.message, result: changed.result, revision: state.revision } });
    } catch (cause) {
      const error = cause as Error & { status?: number; code?: string };
      return route.fulfill({ status: error.status ?? 400, json: { error: error.message, code: error.code } });
    }
  });
  function remoteAction(action: string, data: Record<string, unknown>) {
    const changed = applyAction(state, current, action, data);
    changed.state.revision = state.revision + 1;
    state = changed.state;
  }
  function emptyRecords() {
    const next = initialState();
    next.users = state.users;
    next.revision = state.revision + 1;
    next.products = [];
    next.stockByUnit = {};
    state = next;
  }
  return { actions, signIn, remoteAction, emptyRecords, get state() { return state; }, get executive() { return snapshot(state, current, "executive").executive as ExecutiveSnapshot; } };
}

const decisionForm = (page: Page) => page.getByRole("form", { name: "Create management decision", exact: true });
async function createDecision(page: Page) {
  const form = decisionForm(page);
  await form.getByLabel("Decision title", { exact: true }).fill("Resolve replenishment evidence");
  await form.getByLabel("Rationale", { exact: true }).fill("Review the stock exceptions with operations before the next supplier commitment.");
  await form.getByRole("combobox", { name: "Department", exact: true }).selectOption("operations");
  await form.getByRole("combobox", { name: "Operating unit", exact: true }).selectOption("BR-DEMO-01");
  await form.getByLabel("Due date", { exact: true }).fill("2030-01-10");
  await form.getByRole("combobox", { name: "Priority", exact: true }).selectOption("High");
  await form.getByRole("button", { name: "Create decision", exact: true }).click();
}

test("the CEO opens a responsive executive overview directly and after refresh", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!);
  await mkdir("work/executive-evidence", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const response = await page.goto("/hq/executive");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Executive overview", exact: true })).toBeVisible();
    await expect(decisionForm(page)).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `work/executive-evidence/executive-${width === 390 ? "mobile" : "desktop"}.png`, fullPage: false });
    await page.screenshot({ path: `work/executive-evidence/executive-full-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Executive overview", exact: true })).toBeVisible();
    await expect(decisionForm(page)).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
  expect(fixture.actions).toHaveLength(0);
  await page.goto("/hq");
  await expect(page).toHaveURL(/\/hq\/executive$/);
});

test("financial totals, department attention and unit inventory risks come from the same records", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!);
  await page.goto("/hq/executive");
  await expect(page.getByTestId("executive-metric-revenue")).toContainText("90,000");
  await expect(page.getByTestId("executive-metric-expenses")).toContainText("10,000");
  await expect(page.getByTestId("executive-metric-cash")).toContainText("20,000");
  await expect(page.getByTestId("executive-metric-receivables")).toContainText("60,000");
  await expect(page.getByTestId("executive-metric-payables")).toContainText("15,000");
  await expect(page.getByTestId("executive-department-hr")).toContainText("1");
  await expect(page.getByTestId("executive-department-operations")).toContainText("1");
  await expect(page.getByRole("table", { name: "Monthly financial movement", exact: true }).locator("tbody tr")).toHaveCount(6);
  const risks = page.getByTestId("executive-risk-register");
  await expect(risks).toContainText("Synthetic executive test depot");
  await page.getByRole("combobox", { name: "Inventory unit", exact: true }).selectOption("DP-EXEC-UI");
  await expect(risks).toContainText("Maize seed");
  await expect(risks).not.toContainText("Demonstration branch");
  const summary = fixture.executive;
  expect(summary.finance.receivables).toMatchObject({ outstanding: 60000, overdue: 60000, overdueCount: 1 });
  expect(summary.finance.payables).toMatchObject({ outstanding: 15000, aged30Days: 15000, dueDateUnavailableCount: 1 });
  expect(summary.finance.allTime.balanced).toBe(true);
  for (const privateValue of ["private-customer@example.test", "PRIVATE-HOME-ADDRESS", "PRIVATE-PHONE", "private-employee@example.test", "PRIVATE-LEAVE-REASON", "PRIVATE-BANK-REFERENCE", "9876543"]) {
    await expect(page.locator("main")).not.toContainText(privateValue);
    expect(JSON.stringify(summary)).not.toContain(privateValue);
  }
  expect(fixture.actions).toHaveLength(0);
});

test("a CEO decision validates inputs, records follow-up and closes with evidence across refresh", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!);
  await page.goto("/hq/executive");
  await decisionForm(page).getByRole("button", { name: "Create decision", exact: true }).click();
  await expect(decisionForm(page).getByLabel("Decision title", { exact: true })).toBeFocused();
  expect(fixture.actions).toHaveLength(0);
  await createDecision(page);
  await expect.poll(() => fixture.state.executiveDecisions.length).toBe(1);
  const decision = fixture.state.executiveDecisions[0];
  expect(decision).toMatchObject({ status: "Open", version: 1, department: "operations", priority: "High", createdBy: localPersonas.ceo.id });
  const card = page.getByTestId(`executive-decision-${decision.id}`);
  await card.locator("summary").click();
  const progress = card.getByRole("form", { name: `Progress decision ${decision.id}`, exact: true });
  await progress.getByRole("combobox", { name: "Progress status", exact: true }).selectOption("Blocked");
  await progress.getByLabel("Progress note", { exact: true }).fill("Supplier confirmation is pending review by the operations team.");
  await progress.getByLabel("Evidence reference", { exact: true }).fill("UI-BOARD-FOLLOWUP-01");
  await progress.getByRole("button", { name: "Record progress", exact: true }).click();
  await expect.poll(() => fixture.state.executiveDecisions[0].status).toBe("Blocked");
  expect(fixture.state.executiveDecisions[0].version).toBe(2);
  await page.reload();
  await card.locator("summary").click();
  await expect(card).toContainText("UI-BOARD-FOLLOWUP-01");
  const close = card.getByRole("form", { name: `Close decision ${decision.id}`, exact: true });
  await close.getByRole("combobox", { name: "Outcome", exact: true }).selectOption("Completed");
  await close.getByLabel("Closure note", { exact: true }).fill("Operations supplied the reviewed count reference and procurement follow-up.");
  await close.getByRole("button", { name: "Close decision", exact: true }).click();
  expect(fixture.state.executiveDecisions[0].status).toBe("Blocked");
  await expect(close.getByLabel("Closure evidence", { exact: true })).toBeFocused();
  await close.getByLabel("Closure evidence", { exact: true }).fill("UI-BOARD-CLOSURE-01");
  await close.getByRole("button", { name: "Close decision", exact: true }).click();
  await expect.poll(() => fixture.state.executiveDecisions[0].status).toBe("Completed");
  expect(fixture.state.executiveDecisions[0]).toMatchObject({ version: 3, closedBy: localPersonas.ceo.id });
  expect(fixture.state.executiveDecisions[0].progress.at(-1)).toMatchObject({ evidence: "UI-BOARD-CLOSURE-01", status: "Completed" });
  expect(fixture.actions.map(item => item.action)).toEqual(["executive.decisionCreate", "executive.decisionProgress", "executive.decisionClose"]);
  for (const action of fixture.actions) expect(action.data?.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  expect(fixture.actions[1].data?.expectedVersion).toBe(1);
  expect(fixture.actions[2].data?.expectedVersion).toBe(2);
  await page.reload();
  await expect(card).toContainText("Completed");
});

test("executive approval cards use existing independent access and unit controls", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!);
  await page.goto("/hq/executive");
  const access = page.getByRole("form", { name: "Access request ACCESS-EXEC-UI", exact: true });
  await expect(access.locator("xpath=../..")).toContainText("Sample Finance Officer");
  await expect(page.getByRole("form", { name: "Access request ACCESS-SELF-UI", exact: true })).toHaveCount(0);
  await expect(page.getByRole("form", { name: "Activate operating unit DP-SELF-UI", exact: true })).toHaveCount(0);
  await access.getByRole("button", { name: "Approve access", exact: true }).click();
  await expect.poll(() => fixture.state.roleRequests.find(item => item.id === "ACCESS-EXEC-UI")?.status).toBe("Approved");
  expect(fixture.state.users.find(item => item.id === localPersonas.finance.id)?.role).toBe("finance");
  await expect(access).toHaveCount(0);
  const unit = page.getByRole("form", { name: "Activate operating unit DP-PENDING-UI", exact: true });
  await unit.getByRole("button", { name: "Activate unit", exact: true }).click();
  await expect.poll(() => fixture.state.units.find(item => item.id === "DP-PENDING-UI")?.status).toBe("Active");
  for (const [action, data] of [["admin.roleDecision", { requestId: "ACCESS-SELF-UI", decision: "Approved" }], ["admin.activateUnit", { unitId: "DP-SELF-UI" }]] as const) {
    const response = await page.evaluate(async body => {
      const result = await fetch("/api/portal?module=executive", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      return { status: result.status, body: await result.json() };
    }, { action, data });
    expect(response.status).toBe(403);
  }
  expect(fixture.state.roleRequests.find(item => item.id === "ACCESS-SELF-UI")?.status).toBe("Pending director approval");
  expect(fixture.state.units.find(item => item.id === "DP-SELF-UI")?.status).toBe("Setup");
});

test("a stale executive decision update preserves the newer record and printing opens a browser dialog", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!);
  await page.addInitScript(() => { Object.defineProperty(window, "print", { value: () => { document.documentElement.dataset.executivePrintRequested = "yes"; } }); });
  await page.goto("/hq/executive");
  await createDecision(page);
  await expect.poll(() => fixture.state.executiveDecisions.length).toBe(1);
  const decision = fixture.state.executiveDecisions[0];
  const card = page.getByTestId(`executive-decision-${decision.id}`);
  await card.locator("summary").click();
  const progress = card.getByRole("form", { name: `Progress decision ${decision.id}`, exact: true });
  await progress.getByRole("combobox", { name: "Progress status", exact: true }).selectOption("Blocked");
  await progress.getByLabel("Progress note", { exact: true }).fill("Stale local entry must not overwrite the newer executive record.");
  fixture.remoteAction("executive.decisionProgress", { decisionId: decision.id, expectedVersion: 1, status: "In progress", note: "Newer update recorded in a separate executive session.", evidence: "UI-CONCURRENT-01", idempotencyKey: "exec-browser-remote-progress" });
  const conflict = page.waitForResponse(response => response.url().includes("/api/portal") && response.request().method() === "POST");
  await progress.getByRole("button", { name: "Record progress", exact: true }).click();
  expect((await conflict).status()).toBe(409);
  expect(fixture.state.executiveDecisions[0]).toMatchObject({ status: "In progress", version: 2 });
  expect(fixture.state.executiveDecisions[0].progress.at(-1)?.evidence).toBe("UI-CONCURRENT-01");
  await page.reload();
  await card.locator("summary").click();
  await expect(card).toContainText("UI-CONCURRENT-01");
  await page.getByRole("button", { name: "Print board brief", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-executive-print-requested", "yes");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Executive overview", exact: true })).toBeVisible();
  await expect(decisionForm(page)).toBeHidden();
});

test("other staff and customer roles cannot open the executive route or API", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!, "finance");
  const origin = new URL(baseURL!).origin;
  for (const persona of ["finance", "administrator", "operations-director", "customer-a"]) {
    await fixture.signIn(persona);
    const response = await page.context().request.get(`${origin}/api/portal?module=executive`);
    expect(response.status()).toBe(403);
    await page.goto("/hq/executive");
    await expect(page).toHaveURL(persona === "customer-a" ? /\/account$/ : /\/hq\?denied=1$/);
    await expect(page.getByRole("heading", { name: "Executive overview", exact: true })).toHaveCount(0);
  }
  await page.context().clearCookies();
  const anonymous = await page.context().request.get(`${origin}/api/portal?module=executive`);
  expect(anonymous.status()).toBe(401);
});

test("the exported board summary preserves financial values, escapes spreadsheet formula text and excludes private records", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!);
  fixture.remoteAction("executive.decisionCreate", { title: '=HYPERLINK("https://example.test","Review")', rationale: "Untrusted plain text used only to verify safe spreadsheet export.", department: "finance", unitId: "HQ", dueDate: "2030-01-10", priority: "Normal", idempotencyKey: "exec-browser-csv-create" });
  fixture.state.units.find(unit => unit.id === "DP-EXEC-UI")!.name = "+FORMULA-UNIT-FIXTURE";
  await page.goto("/hq/executive");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export summary CSV", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^fatima-executive-brief-\d{4}-\d{2}-\d{2}-r\d+\.csv$/);
  const path = await download.path();
  expect(path).toBeTruthy();
  const csv = await readFile(path!, "utf8");
  expect(csv).toContain("Fatima Agro executive board brief");
  expect(csv).toContain('"revenue",90000');
  expect(csv).toContain('"cash",20000');
  expect(csv).toContain('"\'=HYPERLINK(""https://example.test"",""Review"")"');
  expect(csv).toContain('"\'+FORMULA-UNIT-FIXTURE"');
  for (const privateValue of ["private-customer@example.test", "PRIVATE-HOME-ADDRESS", "PRIVATE-PHONE", "private-employee@example.test", "PRIVATE-LEAVE-REASON", "PRIVATE-BANK-REFERENCE", "9876543"]) expect(csv).not.toContain(privateValue);
  expect(fixture.actions).toHaveLength(0);
});

test("a failed snapshot load recovers on refresh and empty records have honest zero and empty states", async ({ page, baseURL }) => {
  const fixture = await executiveFixture(page, baseURL!, "ceo", { failInitialRead: true });
  await page.goto("/hq/executive");
  await expect(page.getByRole("alert")).toContainText("The executive snapshot is temporarily unavailable.");
  await expect(page.getByTestId("executive-metric-revenue")).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh records", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByTestId("executive-metric-revenue")).toContainText("90,000");
  fixture.emptyRecords();
  await page.getByRole("button", { name: "Refresh records", exact: true }).click();
  await expect(page.getByTestId("executive-metric-revenue")).toContainText("MWK 0");
  await expect(page.getByTestId("executive-risk-register")).toContainText("No inventory risk lines match this view.");
  await expect(page.getByText("No decisions match this view. Create a decision to start tracking a management priority.", { exact: true })).toBeVisible();
  await expect(page.getByText("No eligible staff access requests await your approval.", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Monthly financial movement", exact: true }).locator("tbody tr")).toHaveCount(6);
  expect(fixture.actions).toHaveLength(0);
});
