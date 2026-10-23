import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { applyAction, snapshot } from "../../lib/server/domain";
import { initialState, localPersonas } from "../../lib/server/seed";
import type { ActionRequest, ModuleId, SessionResponse } from "../../lib/portal-types";

async function workbench(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin, user = localPersonas.ceo;
  let state = initialState(); state.users = Object.values(localPersonas);
  const date = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  for (const [index, department] of ["operations", "finance"].entries()) {
    state = applyAction(state, user, "executive.decisionCreate", { title: index ? "Review finance evidence" : "Resolve maize supply", rationale: "Recorded synthetic management evidence", department, unitId: "BR-DEMO-01", priority: index ? "Normal" : "Critical", dueDate: date(index ? 3 : -2), idempotencyKey: `workbench-fixture-${index}` }).state;
  }
  const product = state.products[0];
  state.stockByUnit[`BR-DEMO-01:${product.id}`] = 0;
  const login = await page.context().request.post(`${origin}/api/session`, { headers: { Origin: origin }, data: { persona: "ceo" } }); expect(login.ok()).toBeTruthy();
  const actions: ActionRequest[] = [];
  await page.route(/\/api\/(?:session|portal)(?:\?.*)?$/, async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/api/session") return route.fulfill({ json: { user, localDemo: true, authMode: "fatima", signInUrl: "/account", signOutUrl: "/account", mode: "captured demonstration" } satisfies SessionResponse });
    if (request.method() === "GET") return route.fulfill({ json: snapshot(state, user, url.searchParams.get("module") as ModuleId) });
    try { const action = request.postDataJSON() as ActionRequest; actions.push(action); const changed = applyAction(state, user, action.action, action.data ?? {}); state = changed.state; state.revision++; return route.fulfill({ json: { message: changed.message, result: changed.result, revision: state.revision } }); }
    catch (cause) { const error = cause as Error & { status?: number }; return route.fulfill({ status: error.status ?? 400, json: { error: error.message } }); }
  });
  await page.goto("/hq/executive"); await expect(page.getByRole("heading", { name: "Where your attention matters." })).toBeVisible();
  return { actions, product, date, get state() { return state; } };
}

test("executive workbench narrows decisions by evidence, department, priority and due date", async ({ page, baseURL }) => {
  await workbench(page, baseURL!);
  const decisions = page.locator(".ex-decision"); await expect(decisions).toHaveCount(2);
  await page.getByLabel("Decision department", { exact: true }).selectOption("operations");
  await page.getByLabel("Decision due date", { exact: true }).selectOption("overdue");
  await page.getByLabel("Decision priority", { exact: true }).selectOption("Critical");
  await page.getByLabel("Find a decision", { exact: true }).fill("maize resolve");
  await expect(decisions).toHaveCount(1); await expect(decisions).toContainText("Resolve maize supply");
  await page.getByRole("button", { name: "Clear decision filters", exact: true }).click(); await expect(decisions).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("stock risk prepares an editable decision and saves only after review", async ({ page, baseURL }) => {
  const fixture = await workbench(page, baseURL!);
  await page.getByRole("button", { name: new RegExp(`Prepare follow-up for ${fixture.product.sku}`) }).first().click();
  const draft = page.getByRole("form", { name: "Create stock management follow-up", exact: true });
  await expect(draft.getByLabel("Follow-up title", { exact: true })).toHaveValue(`Review ${fixture.product.name} replenishment`);
  await expect(draft.getByLabel("Responsible department", { exact: true })).toHaveValue("operations");
  await expect(draft.getByLabel("Follow-up priority", { exact: true })).toHaveValue("Critical");
  expect(fixture.actions).toHaveLength(0);
  await draft.getByLabel("Follow-up due date", { exact: true }).fill(fixture.date(2));
  await draft.getByRole("button", { name: "Save stock follow-up", exact: true }).click();
  await expect(draft).toHaveCount(0); expect(fixture.actions).toHaveLength(1);
  expect(fixture.actions[0].action).toBe("executive.decisionCreate"); expect(fixture.state.executiveDecisions).toHaveLength(3);
  await mkdir("work/system-upgrade-evidence", { recursive: true }); await page.screenshot({ path: "work/system-upgrade-evidence/executive-workbench.png", fullPage: true });
});
