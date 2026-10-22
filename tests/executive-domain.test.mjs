import test from "node:test";
import assert from "node:assert/strict";
import { loadTypescript } from "./helpers/load-typescript.mjs";

const { applyAction, snapshot, financeReports } = await import(await loadTypescript(new URL("../lib/server/domain.ts", import.meta.url)));
const { initialState, localPersonas } = await import(await loadTypescript(new URL("../lib/server/seed.ts", import.meta.url)));
const { executiveSnapshot, blantyreDate } = await import(await loadTypescript(new URL("../lib/server/executive.ts", import.meta.url)));
const { normalizeState } = await import(await loadTypescript(new URL("../lib/server/state-migrations.ts", import.meta.url)));
const { canAccessModule, capabilities } = await import(await loadTypescript(new URL("../lib/server/permissions.ts", import.meta.url)));
const CEO = localPersonas.ceo, ADMIN = localPersonas.administrator, F = localPersonas.finance, FD = localPersonas["finance-director"], O = localPersonas["operations-director"], C = localPersonas["customer-a"];
function harness() { let state = initialState(); state.users = Object.values(localPersonas); return { get state() { return state; }, act(user, action, data = {}) { const output = applyAction(state, user, action, data); state = output.state; return output.result; } }; }
function decision(h, overrides = {}) { return h.act(CEO, "executive.decisionCreate", { title: "Review Kanengo replenishment", rationale: "Assign a management follow-up to address low stock through the existing procurement review.", department: "operations", unitId: "BR-DEMO-01", priority: "High", dueDate: "2026-10-25", idempotencyKey: "decision-one", ...overrides }); }
function report(h, asOf = "2026-10-21T10:00:00.000Z") { return executiveSnapshot(h.state, CEO, financeReports(h.state), asOf); }

test("executive access and follow-up actions are restricted to an approved CEO", () => {
  const h = harness();
  assert.throws(() => snapshot(h.state, null, "executive"), /Sign in/);
  for (const user of Object.values(localPersonas).filter(user => user.role !== "ceo")) {
    assert.equal(canAccessModule(user, "executive"), false, user.role);
    assert.throws(() => snapshot(h.state, user, "executive"), /approved role/, user.role);
    for (const action of ["executive.decisionCreate", "executive.decisionProgress", "executive.decisionClose"]) assert.throws(() => h.act(user, action), /approved role/, `${user.role} ${action}`);
  }
  assert.equal(canAccessModule(CEO, "executive"), true);
  for (const action of ["finance.payment", "finance.credit", "finance.reconcile", "hr.payroll", "hr.leaveDecision", "inventory.adjustmentDecision", "inventory.transferDecision", "procurement.approve", "admin.applyRole"]) assert.equal(capabilities(CEO).includes(action), false, action);
});

test("executive legacy migration only adds the empty decision register and is repeatable", () => {
  const legacy = initialState(); delete legacy.executiveDecisions;
  legacy.users = Object.values(localPersonas); legacy.revision = 87;
  const before = structuredClone(legacy), migrated = normalizeState(legacy);
  assert.deepEqual(legacy, before); assert.deepEqual(migrated.executiveDecisions, []);
  for (const key of ["revision", "users", "stockByUnit", "products", "invoices", "journals", "roleRequests"]) assert.deepEqual(migrated[key], before[key]);
  assert.deepEqual(normalizeState(migrated), migrated);
  assert.throws(() => normalizeState({ ...migrated, executiveDecisions: {} }), /reviewed recovery/);
});

test("executive finance reconciles source ledger and aged balances after payments, credits and expenses", () => {
  const h = harness(); h.act(C, "customer.register", { name: C.name, marketingConsent: false });
  const invoice = h.act(F, "finance.invoice", { customerId: C.id, total: 100000, tax: 10000, dueDate: "2026-10-20", note: "TEST-ONLY" });
  h.act(FD, "finance.credit", { invoiceId: invoice.id, amount: 10000, reason: "TEST-ONLY credit" });
  h.act(F, "finance.payment", { kind: "customer", referenceId: invoice.id, amount: 60000, method: "Synthetic cash", evidence: "TEST-PAY", idempotencyKey: "finance-pay" });
  const supplier = h.act(localPersonas.procurement, "procurement.supplier", { name: "Sample Supplier", email: "supplier@example.test", contact: "TEST" });
  const bill = h.act(F, "finance.bill", { supplierId: supplier.id, total: 20000, note: "TEST-BILL" });
  h.state.bills.find(item => item.id === bill.id).createdAt = "2026-09-20T22:30:00.000Z";
  h.act(F, "finance.payment", { kind: "supplier", referenceId: bill.id, amount: 5000, method: "Synthetic cash", evidence: "TEST-SUPPLY", idempotencyKey: "supplier-pay" });
  h.act(F, "finance.expense", { amount: 3000, category: "Synthetic transport", description: "Test expense", evidence: "TEST-EXP" });
  const view = report(h);
  assert.deepEqual(view.finance.allTime, financeReports(h.state));
  assert.equal(view.finance.allTime.revenue, 81000); assert.equal(view.finance.allTime.cash, 52000); assert.equal(view.finance.allTime.expenses, 3000);
  assert.equal(view.finance.allTime.balanced, true); assert.equal(view.finance.allTime.debits, view.finance.allTime.journalCredits);
  assert.deepEqual(view.finance.receivables, { outstanding: 30000, overdue: 30000, overdueCount: 1 });
  assert.deepEqual(view.finance.payables, { outstanding: 15000, aged30Days: 15000, aged30DaysCount: 1, dueDateUnavailableCount: 1 });
  assert.equal(view.finance.receivables.outstanding, view.finance.allTime.receivables); assert.equal(view.finance.payables.outstanding, view.finance.allTime.payables);
  assert.equal(view.finance.payables.overdue, undefined);
});

test("six monthly trends and overdue dates use the Africa/Blantyre calendar at UTC boundaries", () => {
  const h = harness();
  h.state.journals = [
    { id: "SEP", reference: "TEST", description: "Test", at: "2026-09-30T21:59:59.000Z", lines: [{ account: "Accounts receivable", debit: 1000, credit: 0 }, { account: "Sales revenue", debit: 0, credit: 1000 }] },
    { id: "OCT", reference: "TEST", description: "Test", at: "2026-09-30T22:00:00.000Z", lines: [{ account: "Accounts receivable", debit: 2000, credit: 0 }, { account: "Sales revenue", debit: 0, credit: 2000 }] },
    { id: "RETURN", reference: "TEST", description: "Test", at: "2026-10-01T10:00:00.000Z", lines: [{ account: "Sales returns", debit: 500, credit: 0 }, { account: "Accounts receivable", debit: 0, credit: 500 }] },
    { id: "CASH", reference: "TEST", description: "Test", at: "2026-10-05T10:00:00.000Z", lines: [{ account: "Demo cash and bank", debit: 1000, credit: 0 }, { account: "Accounts receivable", debit: 0, credit: 1000 }] },
    { id: "EXP", reference: "TEST", description: "Test", at: "2026-10-06T10:00:00.000Z", lines: [{ account: "Operating expenses", debit: 100, credit: 0 }, { account: "Demo cash and bank", debit: 0, credit: 100 }] },
  ];
  h.state.payments = [{ id: "PAY", kind: "customer", referenceId: "TEST", amount: 1000, method: "TEST", evidence: "SECRET-PAYMENT-EVIDENCE", createdAt: "2026-10-05T10:00:00.000Z", actorId: F.id, reconciled: false }];
  h.state.invoices = [{ id: "INV", customerId: C.id, unitId: "HQ", orderId: "", total: 10, tax: 0, credited: 0, paid: 0, status: "Unpaid", createdAt: "2026-10-01T10:00:00.000Z", dueDate: "2026-10-31", note: "TEST" }];
  const view = report(h, "2026-10-31T22:00:00.000Z");
  assert.equal(blantyreDate("2026-09-30T22:00:00.000Z"), "2026-10-01");
  assert.deepEqual(view.finance.months.map(row => row.month), ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
  assert.equal(view.finance.months[3].revenue, 1000);
  assert.deepEqual(view.finance.months[4], { month: "2026-10", revenue: 1500, expenses: 100, customerReceipts: 1000, supplierPayments: 0, netCashMovement: 900 });
  assert.equal(view.finance.receivables.overdueCount, 1);
  assert.equal(sumMonths(view.finance.months, "revenue"), view.finance.allTime.revenue);
  assert.equal(sumMonths(view.finance.months, "netCashMovement"), view.finance.allTime.cash);
});
function sumMonths(months, field) { return months.reduce((total, row) => total + row[field], 0); }

test("inventory risks use available stock per active inventory unit and never multiply HQ or proposed-unit stock", () => {
  const h = harness();
  h.state.units.push({ id: "DP-NEW", name: "Test depot", kind: "Depot", status: "Active", functions: ["Inventory"], evidence: "TEST", createdBy: O.id });
  h.state.units.push({ id: "DP-SETUP", name: "Proposed depot", kind: "Depot", status: "Setup", functions: ["Inventory"], evidence: "TEST", createdBy: O.id });
  for (const product of h.state.products) h.state.stockByUnit[`DP-NEW:${product.id}`] = product.reorderLevel;
  h.state.stockByUnit["DP-NEW:demo-maize"] = 0;
  h.state.stockByUnit["BR-DEMO-01:demo-maize"] = 49;
  const inventory = report(h).inventory;
  assert.equal(inventory.activeUnits, 2); assert.equal(inventory.trackedSkus, 6);
  assert.equal(inventory.outOfStockCount, 1); assert.equal(inventory.lowStockCount, 4);
  assert.ok(inventory.risks.every(row => ["BR-DEMO-01", "DP-NEW"].includes(row.unitId)));
  assert.deepEqual(inventory.risks.find(row => row.unitId === "DP-NEW"), { unitId: "DP-NEW", unitName: "Test depot", productId: "demo-maize", sku: "FA-MAIZE-10KG", name: "Maize seed", available: 0, reorderLevel: 50, severity: "Out of stock" });
  assert.equal(inventory.risks.find(row => row.unitId === "BR-DEMO-01" && row.productId === "demo-maize").available, 49);
});

test("executive projections contain aggregate-only departmental evidence and no private source arrays", () => {
  const h = harness();
  h.state.profiles.push({ id: "PRIVATE-CUSTOMER", name: "SECRET-CUSTOMER-NAME", email: "secret-customer@example.test", phone: "SECRET-PHONE", address: "SECRET-ADDRESS", marketingConsent: false, unsubscribed: false, createdAt: "2026-10-01T00:00:00Z" });
  h.state.employees.push({ id: "SECRET-EMP-ID", name: "SECRET-EMPLOYEE", workEmail: "secret-employee@example.test", roleTitle: "Private role", salary: 928374, status: "Active", startDate: "2026-10-01", unitId: "HQ", onboarding: [], createdAt: "2026-10-01T00:00:00Z" });
  h.state.campaigns.push({ id: "SECRET-CAMPAIGN", name: "SECRET-CAMPAIGN-NAME", audience: "test-recipients", template: "SECRET-TEMPLATE", subject: "SECRET-SUBJECT", body: "SECRET-CAMPAIGN-BODY", scheduledAt: "", status: "Draft", recipientCount: 8, createdBy: localPersonas.communications.id, createdAt: "2026-10-01T00:00:00Z" });
  const view = snapshot(h.state, CEO, "executive"), serialized = JSON.stringify(view);
  assert.deepEqual(Object.keys(view).sort(), ["capabilities", "executive", "mode", "module", "revision"]);
  assert.doesNotMatch(serialized, /SECRET-|secret-customer|secret-employee|928374/);
  assert.equal(view.executive.departments.find(row => row.id === "hr").metrics.find(row => row.label === "Active employees").value, 1);
  assert.equal(view.executive.departments.find(row => row.id === "communications").metrics.find(row => row.label === "Campaign drafts").value, 1);
  assert.equal(snapshot(h.state, null, "public").executive, undefined);
  assert.equal(snapshot(h.state, C, "customer").executive, undefined);
});

test("CEO approval queue shows only eligible assigned reviews and preserves independent approval/application controls", () => {
  const h = harness();
  const access = h.act(ADMIN, "admin.roleRequest", { userId: C.id, role: "finance-director", unitId: "HQ", reason: "Review accounting responsibilities" });
  h.act(ADMIN, "admin.roleRequest", { userId: localPersonas["customer-b"].id, role: "finance", unitId: "HQ", reason: "Finance director queue" });
  const self = h.act(CEO, "admin.roleRequest", { userId: CEO.id, role: "ceo", unitId: "HQ", reason: "Self review forbidden" });
  const unit = h.act(O, "admin.unit", { name: "Proposed depot", kind: "Depot", functions: ["Inventory"], evidence: "Opening review reference" });
  const ownUnit = h.act(CEO, "admin.unit", { name: "CEO proposed depot", kind: "Depot", functions: ["Inventory"], evidence: "Self activation forbidden" });
  const approvals = report(h).approvals;
  assert.deepEqual(approvals.roleRequests.map(row => row.id), [access.id]);
  assert.equal(approvals.roleRequests[0].applicantName, C.name); assert.equal(approvals.roleRequests[0].reason, "Review accounting responsibilities"); assert.equal(approvals.roleRequests[0].email, undefined);
  assert.deepEqual(approvals.units.map(row => row.id), [unit.id]);
  assert.throws(() => h.act(CEO, "admin.roleDecision", { requestId: self.id, decision: "Approved" }), /cannot approve/);
  assert.throws(() => h.act(CEO, "admin.activateUnit", { unitId: ownUnit.id }), /separate executive/);
  h.act(CEO, "admin.roleDecision", { requestId: access.id, decision: "Approved" });
  assert.equal(h.state.users.find(row => row.id === C.id).role, "customer");
  assert.throws(() => h.act(CEO, "admin.applyRole", { requestId: access.id }), /approved role/);
  h.act(ADMIN, "admin.applyRole", { requestId: access.id });
  assert.equal(h.state.users.find(row => row.id === C.id).role, "finance-director");
  h.act(CEO, "admin.activateUnit", { unitId: unit.id });
  assert.equal(report(h).approvals.units.length, 0);
});

test("management follow-up records persist audited progress with idempotency and optimistic version guards", () => {
  const h = harness(), created = decision(h), before = structuredClone(h.state);
  assert.equal(created.status, "Open"); assert.equal(created.version, 1);
  assert.equal(h.state.audit[0].action, "executive.decisionCreate");
  assert.equal(h.act(CEO, "executive.decisionCreate", { idempotencyKey: "decision-one" }).id, created.id); assert.deepEqual(h.state, before);
  const progress = { decisionId: created.id, expectedVersion: 1, status: "Blocked", note: "Awaiting a separate procurement review", evidence: "FOLLOW-UP-REF", idempotencyKey: "progress-one" };
  const updated = h.act(CEO, "executive.decisionProgress", progress);
  assert.equal(updated.version, 2); assert.equal(updated.progress.length, 1); assert.equal(updated.progress[0].actorId, CEO.id);
  const saved = structuredClone(h.state);
  assert.equal(h.act(CEO, "executive.decisionProgress", progress).version, 2); assert.deepEqual(h.state, saved);
  assert.throws(() => h.act(CEO, "executive.decisionProgress", { ...progress, idempotencyKey: "stale-progress" }), /changed/);
  assert.deepEqual(h.state, saved);
  assert.throws(() => h.act(CEO, "executive.decisionClose", { decisionId: created.id, expectedVersion: 2, outcome: "Completed", note: "Evidence missing", idempotencyKey: "close-bad" }), /evidence reference/);
  assert.deepEqual(h.state, saved);
  const close = { decisionId: created.id, expectedVersion: 2, outcome: "Completed", note: "Management follow-up reviewed", evidence: "DEPARTMENT-REVIEW-REF", idempotencyKey: "close-good" };
  const closed = h.act(CEO, "executive.decisionClose", close);
  assert.equal(closed.status, "Completed"); assert.equal(closed.version, 3); assert.equal(closed.progress.length, 2); assert.equal(closed.closedBy, CEO.id);
  const final = structuredClone(h.state); assert.equal(h.act(CEO, "executive.decisionClose", close).id, created.id); assert.deepEqual(h.state, final);
  assert.throws(() => h.act(CEO, "executive.decisionProgress", { ...progress, expectedVersion: 3, idempotencyKey: "after-close" }), /already closed/);
  assert.deepEqual(h.state, final);
  for (const key of ["journals", "payments", "employees", "stockByUnit", "roleRequests", "purchaseRequests"]) assert.deepEqual(h.state[key], before[key], key);
});

test("follow-up validation rejects invalid scope, arbitrary status, unsafe fields and impossible dates atomically", () => {
  const h = harness(), before = structuredClone(h.state);
  for (const changes of [{ unitId: "UNKNOWN" }, { department: "ceo" }, { priority: "Urgent" }, { dueDate: "2026-02-30" }, { title: "x".repeat(181) }, { role: "ceo" }, { status: "Completed" }]) {
    assert.throws(() => decision(h, changes)); assert.deepEqual(h.state, before);
  }
  const created = decision(h), saved = structuredClone(h.state);
  assert.throws(() => h.act(CEO, "executive.decisionProgress", { decisionId: created.id, expectedVersion: 1, status: "Approved", note: "No approval bypass", idempotencyKey: "invalid-status" }), /In progress or Blocked/);
  assert.throws(() => h.act(CEO, "executive.decisionClose", { decisionId: created.id, expectedVersion: 1, outcome: "Completed", note: "Test", evidence: "TEST", role: "ceo", idempotencyKey: "unsafe-field" }), /follow-up fields/);
  assert.deepEqual(h.state, saved);
  const cancelled = h.act(CEO, "executive.decisionClose", { decisionId: created.id, expectedVersion: 1, outcome: "Cancelled", note: "No longer required", idempotencyKey: "cancel-one" });
  assert.equal(cancelled.status, "Cancelled"); assert.equal(report(h).decisionCounts.open, 0); assert.equal(report(h).decisionCounts.completed, 0);
});

test("unit performance and decision attention count actual status records, excluding cancelled order value", () => {
  const h = harness();
  const base = { customerId: C.id, unitId: "BR-DEMO-01", lines: [], subtotal: 100, tax: 0, deliveryFee: 0, total: 100, fulfilment: "pickup", deliveryAddress: "PRIVATE-ADDRESS", contact: "PRIVATE-CONTACT", createdAt: "2026-10-01T00:00:00Z", events: [], invoiceId: "" };
  h.state.orders.push({ ...base, id: "OPEN", status: "Awaiting confirmation" }, { ...base, id: "COMPLETE", status: "Completed" }, { ...base, id: "CANCEL", status: "Cancelled" });
  h.state.tasks.push({ id: "TASK", unitId: "BR-DEMO-01", title: "PRIVATE-TASK", owner: "PRIVATE-OWNER", due: "2026-10-20", evidence: "PRIVATE-EVIDENCE", status: "Submitted", createdBy: O.id });
  const record = decision(h, { dueDate: "2026-10-20" });
  h.act(CEO, "executive.decisionProgress", { decisionId: record.id, expectedVersion: 1, status: "Blocked", note: "Awaiting review", idempotencyKey: "blocked" });
  const view = report(h), unit = view.units.find(row => row.id === "BR-DEMO-01");
  assert.deepEqual(unit, { id: "BR-DEMO-01", name: "Demonstration branch", kind: "Branch", status: "Active", orders: 3, openOrders: 1, completedOrders: 1, orderValue: 200, tasksOpen: 0, tasksSubmitted: 1, tasksApproved: 0, tasksOverdue: 1 });
  assert.deepEqual(view.decisionCounts, { open: 1, blocked: 1, completed: 0, overdue: 1 });
  assert.doesNotMatch(JSON.stringify(view), /PRIVATE-/);
});
