import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { ModuleId, SessionResponse } from "../../lib/portal-types";
import { applyAction, snapshot } from "../../lib/server/domain";
import { initialState, localPersonas } from "../../lib/server/seed";

/** The application database is used only for a local rehearsal sign-in cookie.
 * Register rows, permissions and all mutations below live in this isolated
 * browser fixture. No business records or private account credentials are used. */
async function departmentFixture(page: Page, baseURL: string, persona = "finance", managed = false) {
  const origin = new URL(baseURL).origin;
  const signedIn = await page.context().request.post(`${origin}/api/session`, { headers: { Origin: origin }, data: { persona } });
  expect(signedIn.ok(), await signedIn.text()).toBe(true);
  const user = { ...localPersonas[persona], managedAccount: managed };
  let state = initialState();
  const at = "2026-10-22T10:00:00.000Z";
  state.users = Object.values(localPersonas);
  for (let index = 1; index <= 13; index++) {
    state.invoices.push({ id: `INV-WORK-${String(index).padStart(2, "0")}`, customerId: index === 13 ? " \t=2+2" : `CUSTOMER-${index}`, orderId: "", unitId: "BR-DEMO-01", total: index * 1000, tax: 0, paid: index % 2 === 0 ? index * 1000 : 0, credited: 0, status: index % 2 === 0 ? "Paid" : "Unpaid", createdAt: at, dueDate: "2026-10-30", note: "HIDDEN-NOTE-MUST-NOT-BE-EXPORTED" });
  }
  state.orders.push(
    { id: "ORDER-OWN-UNIT", customerId: "CUSTOMER-OWN", unitId: "BR-DEMO-01", lines: [], subtotal: 1000, tax: 0, deliveryFee: 0, total: 1000, fulfilment: "pickup", deliveryAddress: "Collection at the test branch", contact: "Synthetic contact", status: "Confirmed", createdAt: at, events: [], invoiceId: "INV-WORK-01" },
    { id: "ORDER-PRIVATE-OTHER-UNIT", customerId: "PRIVATE-CUSTOMER", unitId: "DEPOT-OTHER", lines: [], subtotal: 999, tax: 0, deliveryFee: 0, total: 999, fulfilment: "delivery", deliveryAddress: "PRIVATE-OTHER-ADDRESS", contact: "PRIVATE-OTHER-CONTACT", status: "Confirmed", createdAt: at, events: [], invoiceId: "PRIVATE-INVOICE" },
  );
  state.notifications.push(
    { id: "NOTICE-WORK-UNREAD", userId: user.id, title: "Customer balance needs review", body: "Review the synthetic invoice register.", event: "invoice.created", createdAt: at, readBy: [] },
    { id: "NOTICE-WORK-READ", userId: user.id, title: "Prior payment reviewed", body: "Synthetic payment evidence.", event: "payment.created", createdAt: at, readBy: [user.id] },
  );
  let failNextRead = false;
  const mutations: string[] = [];
  await page.route(/\/api\/(?:session|portal)(?:\?.*)?$/, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/session") {
      const response: SessionResponse = { user, localDemo: true, signInUrl: "/account", signOutUrl: "/account", mode: "captured demonstration", authMode: "fatima" };
      return route.fulfill({ json: response });
    }
    if (request.method() === "GET") {
      if (failNextRead) { failNextRead = false; return route.fulfill({ status: 503, json: { error: "Synthetic connection interruption. Please retry." } }); }
      return route.fulfill({ json: snapshot(state, user, url.searchParams.get("module") as ModuleId) });
    }
    const body = request.postDataJSON() as { action: string; data: Record<string, unknown> };
    mutations.push(body.action);
    const result = applyAction(state, user, body.action, body.data);
    state = result.state;
    state.revision++;
    return route.fulfill({ json: { message: result.message, result: result.result, revision: state.revision } });
  });
  return { mutations, failNextRead: () => { failNextRead = true; } };
}

test("operational registers search, sort, paginate and export only matching visible columns with literal CSV cells", async ({ page, baseURL }) => {
  await departmentFixture(page, baseURL!);
  await page.goto("/hq/finance");
  const register = page.getByRole("region", { name: "Customer invoice register", exact: true });
  const rows = register.locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await register.getByRole("button", { name: "Next page of Customer invoice register", exact: true }).click();
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText("INV-WORK-11");
  const sort = register.getByRole("button", { name: "Sort Customer invoice register by total", exact: true });
  await sort.click();
  await expect(rows.first()).toContainText("INV-WORK-01");
  await sort.click();
  await expect(rows.first()).toContainText("INV-WORK-13");
  await expect(register.locator('th[aria-sort="descending"]')).toContainText("Total");
  await register.getByRole("searchbox", { name: "Search Customer invoice register", exact: true }).fill("INV-WORK-01");
  await expect(rows).toHaveCount(1);
  await register.getByLabel("Filter Customer invoice register by status", { exact: true }).selectOption("Paid");
  await expect(register.getByText("No matching records", { exact: true })).toBeVisible();
  await register.getByRole("button", { name: "Clear filters", exact: true }).first().click();
  await register.getByLabel("Filter Customer invoice register by status", { exact: true }).selectOption("Unpaid");
  await register.getByRole("searchbox", { name: "Search Customer invoice register", exact: true }).fill("INV-WORK-13");
  const downloadEvent = page.waitForEvent("download");
  await register.getByRole("button", { name: "Export Customer invoice register as CSV", exact: true }).click();
  const download = await downloadEvent;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("INV-WORK-13");
  expect(csv).toContain('"\' \t=2+2"');
  expect(csv).not.toContain("INV-WORK-12");
  expect(csv).not.toContain("HIDDEN-NOTE-MUST-NOT-BE-EXPORTED");
  await expect(register.getByText(/Exported 1 matching record/)).toBeVisible();
});

test("department command navigation keeps forms usable on a phone and recovers failed reads without losing records", async ({ page, baseURL, context }) => {
  const fixture = await departmentFixture(page, baseURL!);
  await page.setViewportSize({ width: 390, height: 844 });
  fixture.failNextRead();
  await page.goto("/hq/finance");
  await expect(page.getByRole("alert")).toContainText("Synthetic connection interruption");
  await page.getByRole("button", { name: "Retry loading records", exact: true }).click();
  const register = page.getByRole("region", { name: "Customer invoice register", exact: true });
  await expect(register.locator("tbody tr")).toHaveCount(10);
  await expect(page.getByRole("alert")).toHaveCount(0);
  const navigation = page.getByRole("navigation", { name: "Department sections and actions", exact: true });
  await navigation.getByRole("searchbox", { name: "Find a section or action", exact: true }).fill("Record an expense");
  await navigation.getByRole("link", { name: "Record an expense Action", exact: true }).click();
  await expect(page.getByRole("form", { name: "Record an expense", exact: true }).getByLabel("Category", { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  fixture.failNextRead();
  await page.getByRole("button", { name: "Refresh records", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Synthetic connection interruption");
  await expect(register.locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: "Retry loading records", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await context.setOffline(true);
  await expect(page.locator(".ip-connection")).toHaveText("Offline");
  await context.setOffline(false);
  await expect(page.locator(".ip-connection")).toHaveText("Connected");
  expect(fixture.mutations).toEqual([]);
});

test("branch order exports retain server unit scope and managed account commands omit access provisioning", async ({ page, baseURL }) => {
  await departmentFixture(page, baseURL!, "branch-manager");
  await page.goto("/hq/procurement");
  const register = page.getByRole("region", { name: "Customer order register", exact: true });
  await expect(register.locator("tbody tr")).toHaveCount(1);
  const downloadEvent = page.waitForEvent("download");
  await register.getByRole("button", { name: "Export Customer order register as CSV", exact: true }).click();
  const csv = await readFile((await (await downloadEvent).path())!, "utf8");
  expect(csv).toContain("ORDER-OWN-UNIT");
  expect(csv).not.toContain("ORDER-PRIVATE-OTHER-UNIT");
  expect(csv).not.toContain("PRIVATE-OTHER-ADDRESS");
  await page.unrouteAll({ behavior: "wait" });
  await departmentFixture(page, baseURL!, "administrator", true);
  await page.goto("/hq/admin");
  await expect(page.getByText("Account creation, password changes and access assignments are managed by the authorised developer under CEO direction.", { exact: true })).toBeVisible();
  await expect(page.getByRole("form", { name: "Request role access", exact: true })).toHaveCount(0);
  const navigation = page.getByRole("navigation", { name: "Department sections and actions", exact: true });
  await navigation.getByRole("searchbox", { name: "Find a section or action", exact: true }).fill("Request role access");
  await expect(navigation.getByText(/No sections or actions match/)).toBeVisible();
});

test("notification centre filters unread and search results, marks a single record read and links only to an allowed workspace", async ({ page, baseURL }) => {
  const fixture = await departmentFixture(page, baseURL!);
  await page.goto("/hq");
  await expect(page.locator(".ip-notifications li")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Open accounting", exact: false })).toHaveAttribute("href", "/hq/finance");
  await page.getByRole("button", { name: "Mark read", exact: true }).click();
  await expect(page.getByText("You’re up to date", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All 2", exact: true }).click();
  await expect(page.locator(".ip-notifications li")).toHaveCount(2);
  await page.getByRole("searchbox", { name: "Search notifications", exact: true }).fill("prior payment");
  await expect(page.locator(".ip-notifications li")).toHaveCount(1);
  await expect(page.locator(".ip-notifications li")).toContainText("Prior payment reviewed");
  expect(fixture.mutations).toEqual(["notification.read"]);
});
