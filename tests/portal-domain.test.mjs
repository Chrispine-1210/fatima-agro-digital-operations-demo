import test from "node:test";
import assert from "node:assert/strict";
import { loadTypescript } from "./helpers/load-typescript.mjs";

const { applyAction, snapshot, financeReports, renderCampaignText } = await import(await loadTypescript(new URL("../lib/server/domain.ts", import.meta.url)));
const { initialState, localPersonas } = await import(await loadTypescript(new URL("../lib/server/seed.ts", import.meta.url)));
const { canAccessModule, capabilities } = await import(await loadTypescript(new URL("../lib/server/permissions.ts", import.meta.url)));
const A = localPersonas["customer-a"], B = localPersonas["customer-b"], F = localPersonas.finance, FD = localPersonas["finance-director"], H = localPersonas.hr, HD = localPersonas["hr-director"], P = localPersonas.procurement, S = localPersonas.storekeeper, O = localPersonas["operations-director"], R = localPersonas["operations-reviewer"], ADMIN = localPersonas.administrator, C = localPersonas.communications, CEO = localPersonas.ceo;
function harness() { let state = initialState(); state.users = Object.values(localPersonas); return { get state() { return state; }, act(user, action, data = {}) { const result = applyAction(state, user, action, data); state = result.state; return result.result; } }; }
function profile(h, user = A, marketingConsent = true) { return h.act(user, "customer.register", { name: user.name, phone: "000-000-DEMO", marketingConsent }); }
function order(h, user = A, quantity = 2, key = "checkout-1") { h.act(user, "cart.set", { productId: "demo-maize", quantity }); return h.act(user, "checkout", { idempotencyKey: key, method: "collection", name: user.name, phone: "000-DEMO" }); }

test("anonymous and customer requests cannot read confidential modules or perform staff actions", () => { const h = harness(); for (const selectedModule of ["customer", "finance", "hr", "procurement", "admin", "communications"]) assert.throws(() => snapshot(h.state, null, selectedModule), /Sign in/); for (const selectedModule of ["finance", "hr", "procurement", "admin", "communications"]) assert.throws(() => snapshot(h.state, A, selectedModule), /approved role/); assert.throws(() => h.act(A, "hr.employee", {}), /approved role/); assert.throws(() => h.act(null, "admin.reset", {}), /Sign in/); });

test("administrator has security administration but cannot authorize routine business work or self-escalate", () => { for (const action of ["finance.payment", "finance.credit", "hr.payroll", "procurement.approve", "admin.roleDecision", "admin.activateUnit"]) assert.equal(capabilities(ADMIN).includes(action), false); assert.equal(canAccessModule(ADMIN, "hr"), false); const h = harness(); const req = h.act(ADMIN, "admin.roleRequest", { userId: ADMIN.id, role: "ceo", unitId: "HQ", reason: "Demonstrate a privileged request requiring a separate approver." }); assert.throws(() => h.act(ADMIN, "admin.roleDecision", { requestId: req.id, decision: "Approved" }), /approved role/); h.act(CEO, "admin.roleDecision", { requestId: req.id, decision: "Approved" }); assert.throws(() => h.act(ADMIN, "admin.applyRole", { requestId: req.id }), /own access/); });

test("customer catalogue selects actual products; checkout atomically reserves stock and creates invoice and notifications", () => { const h = harness(); profile(h); const before = h.state.products.find(p => p.id === "demo-maize").stock; const created = order(h); assert.equal(created.lines[0].productId, "demo-maize"); assert.equal(created.total, 137000); assert.equal(h.state.products.find(p => p.id === "demo-maize").stock, before - 2); assert.equal(h.state.invoices[0].orderId, created.id); assert.equal(h.state.carts.length, 0); assert.ok(h.state.notifications.some(n => n.userId === A.id && n.event === "order.created")); assert.ok(h.state.capturedMessages.every(m => m.status === "Captured — not sent")); assert.ok(financeReports(h.state).balanced); });

test("duplicate checkout key returns the original order without creating more stock movement or ledger entries", () => { const h = harness(); profile(h); const created = order(h); const before = structuredClone(h.state); const duplicate = h.act(A, "checkout", { idempotencyKey: "checkout-1" }); assert.equal(duplicate.id, created.id); assert.deepEqual(h.state, before); });

test("invalid checkout and out-of-stock cart do not partially commit records", () => { const h = harness(); profile(h); assert.throws(() => h.act(A, "cart.set", { productId: "demo-sprayer", quantity: 1000 }), /stock/); h.act(A, "cart.set", { productId: "demo-maize", quantity: 2 }); const before = structuredClone(h.state); assert.throws(() => h.act(A, "checkout", { idempotencyKey: "invalid", method: "delivery-request", name: "Demo", phone: "000" }), /address/); assert.deepEqual(h.state, before); assert.throws(() => h.act(A, "cart.set", { productId: "demo-maize", quantity: NaN }), /whole number/); });

test("customer ownership is enforced on all snapshots and order review actions", () => { const h = harness(); profile(h); profile(h, B); const created = order(h); const own = snapshot(h.state, A, "customer"), other = snapshot(h.state, B, "customer"); assert.equal(own.orders.length, 1); assert.equal(other.orders.length, 0); assert.equal(other.invoices.length, 0); assert.equal(other.receipts.length, 0); assert.equal(other.profile.id, B.id); assert.throws(() => h.act(B, "review.create", { orderId: created.id, rating: 5, publicationConsent: true, text: "Sample" }), /own order/); assert.throws(() => h.act(B, "notification.read", { notificationId: h.state.notifications.find(n => n.userId === A.id).id }), /another user/); });

test("payments, credit notes, expenses and independent reconciliation derive a balanced ledger", () => { const h = harness(); profile(h); const created = order(h); h.act(FD, "finance.credit", { invoiceId: created.invoiceId, amount: 7000, reason: "Illustrative agreed price correction" }); const pay = h.act(F, "finance.payment", { kind: "customer", referenceId: created.invoiceId, amount: 130000, method: "Sample cash", evidence: "DEMO-EVID-01", idempotencyKey: "pay-1" }); assert.equal(h.state.invoices[0].status, "Paid"); assert.equal(h.state.receipts.length, 1); const duplicate = h.act(F, "finance.payment", { idempotencyKey: "pay-1" }); assert.equal(duplicate.id, pay.id); assert.throws(() => h.act(F, "finance.payment", { kind: "customer", referenceId: created.invoiceId, amount: 1, method: "Demo", evidence: "Demo", idempotencyKey: "overpay" }), /outstanding/); assert.throws(() => h.act(FD, "finance.credit", { invoiceId: created.invoiceId, amount: 1, reason: "No unpaid balance" }), /unpaid balance/); h.act(F, "finance.expense", { category: "Transport", description: "Synthetic transport", amount: 3000, evidence: "EXP-TEST" }); const stmt = h.act(F, "finance.statement", { reference: "BANK-DEMO-01", amount: 130000, direction: "in", date: "2026-10-19" }); h.act(FD, "finance.reconcile", { statementId: stmt.id, paymentId: pay.id }); assert.equal(h.state.statementLines[0].status, "Matched"); const report = financeReports(h.state); assert.equal(report.receivables, 0); assert.equal(report.cash, 127000); assert.equal(report.revenue, 130000); assert.equal(report.expenses, 3000); assert.equal(report.balanced, true); });

test("a payment preparer cannot reconcile their own payment and mismatches remain open", () => { const h = harness(); profile(h); const created = order(h); const pay = h.act(FD, "finance.payment", { kind: "customer", referenceId: created.invoiceId, amount: 1000, method: "Demo", evidence: "Demo", idempotencyKey: "own-pay" }); const stmt = h.act(F, "finance.statement", { reference: "STMT-OWN", amount: 1000, direction: "in", date: "2026-10-19" }); assert.throws(() => h.act(FD, "finance.reconcile", { statementId: stmt.id, paymentId: pay.id }), /separate reviewer/); assert.equal(h.state.statementLines[0].status, "Unmatched"); });

test("procurement connects supplier, independently approved request, PO, partial GRN, stock and supplier bill", () => { const h = harness(); const supplier = h.act(P, "procurement.supplier", { name: "Sample Supplier", email: "supplier@example.test", contact: "Synthetic contact" }); const request = h.act(S, "procurement.request", { productId: "demo-sprayer", quantity: 10, unitId: "BR-DEMO-01", neededBy: "2026-10-20", evidence: "COUNT-DEMO-01" }); assert.throws(() => h.act(P, "procurement.order", { requestId: request.id, supplierId: supplier.id, unitPrice: 1000 }), /independent approval/); h.act(O, "procurement.approve", { requestId: request.id, decision: "Approved" }); const po = h.act(P, "procurement.order", { requestId: request.id, supplierId: supplier.id, unitPrice: 1000 }); const before = h.state.products.find(p => p.id === "demo-sprayer").stock; const grn = h.act(S, "procurement.receive", { purchaseOrderId: po.id, quantity: 4, evidence: "DEL-DEMO-01", idempotencyKey: "grn-1" }); assert.equal(h.state.products.find(p => p.id === "demo-sprayer").stock, before + 4); assert.equal(h.state.purchaseOrders[0].status, "Part received"); assert.equal(h.state.bills[0].goodsReceiptId, grn.id); assert.equal(h.state.bills[0].total, 4000); h.act(S, "procurement.receive", { idempotencyKey: "grn-1" }); assert.equal(h.state.goodsReceipts.length, 1); assert.throws(() => h.act(S, "procurement.receive", { purchaseOrderId: po.id, quantity: 7, evidence: "DEMO", idempotencyKey: "over-grn" }), /whole number/); assert.equal(financeReports(h.state).payables, 4000); assert.equal(financeReports(h.state).balanced, true); });

test("branch data and writes are scoped to their assigned unit and approved function", () => { const h = harness(); const other = { ...S, id: "other-storekeeper", unitId: "BR-OTHER" }; h.state.units.push({ id: "BR-OTHER", name: "Other demo branch", kind: "Branch", status: "Active", functions: ["Tasks"], evidence: "Demo", createdBy: "system" }); assert.throws(() => h.act(other, "procurement.request", { productId: "demo-maize", quantity: 2, unitId: "BR-DEMO-01", neededBy: "2026-10-20", evidence: "Demo" }), /another branch/); assert.throws(() => h.act(other, "procurement.request", { productId: "demo-maize", quantity: 2, unitId: "BR-OTHER", neededBy: "2026-10-20", evidence: "Demo" }), /not approved/); const data = snapshot(h.state, other, "procurement"); assert.equal(data.units.length, 1); assert.ok(data.products.every(p => p.stock === 0)); });

test("HR completes onboarding, independent leave review, attendance and preparation-only payroll", () => { const h = harness(); const employee = h.act(H, "hr.employee", { name: "Sample Employee", roleTitle: "Sample Storekeeper", unitId: "BR-DEMO-01", workEmail: "employee@example.test", startDate: "2026-10-19", salary: 200000 }); assert.throws(() => h.act(H, "hr.payroll", { period: "2026-10", employeeIds: [employee.id], deductions: 0 }), /onboarding/); for (const check of ["Identity verification", "Contract review", "Safety induction", "System access review"]) h.act(H, "hr.onboarding", { employeeId: employee.id, check }); const leave = h.act(H, "hr.leave", { employeeId: employee.id, from: "2026-10-20", to: "2026-10-21", reason: "Sample annual leave" }); h.act(HD, "hr.leaveDecision", { leaveId: leave.id, decision: "Approved" }); h.act(H, "hr.attendance", { employeeId: employee.id, date: "2026-10-19", status: "Present" }); const payroll = h.act(H, "hr.payroll", { period: "2026-10", employeeIds: [employee.id], deductions: 20000 }); assert.equal(payroll.net, 180000); assert.equal(payroll.status, "Prepared only"); assert.match(payroll.note, /No payroll/); assert.throws(() => h.act(H, "hr.payroll", { period: "2026-10", employeeIds: [employee.id], deductions: 0 }), /already/); assert.equal(snapshot(h.state, O, "admin").employees, undefined); });

test("HR refuses own review, real employee emails, impossible dates and overlapping leave", () => { const h = harness(); assert.throws(() => h.act(H, "hr.employee", { name: "Real employee", roleTitle: "Role", unitId: "HQ", workEmail: "employee@gmail.com", startDate: "2026-10-19", salary: 100 }), /example.test/); assert.throws(() => h.act(H, "hr.employee", { name: "Demo", roleTitle: "Role", unitId: "HQ", workEmail: "employee@example.test", startDate: "2026-02-30", salary: 100 }), /calendar/); const employee = h.act(HD, "hr.employee", { name: "Demo", roleTitle: "Role", unitId: "HQ", workEmail: "employee@example.test", startDate: "2026-10-19", salary: 100 }); const leave = h.act(HD, "hr.leave", { employeeId: employee.id, from: "2026-10-20", to: "2026-10-21", reason: "Sample" }); assert.throws(() => h.act(HD, "hr.leaveDecision", { leaveId: leave.id, decision: "Approved" }), /different HR reviewer/); assert.throws(() => h.act(H, "hr.leave", { employeeId: employee.id, from: "2026-10-21", to: "2026-10-22", reason: "Overlap" }), /overlapping/); });

test("campaigns preview, dedupe recipients, suppress unsubscribed users and never report delivery", () => { const h = harness(); profile(h); profile(h, B); h.state.profiles.push({ ...h.state.profiles[0], id: "duplicate", email: A.email.toUpperCase() }); const payload = { name: "Demo seasonal update", audience: "test-recipients", template: "Seasonal", subject: "Hello {{name}}", body: "Welcome {{name}} <script>unsafe</script>" }; const preview = h.act(C, "campaign.preview", payload); assert.equal(preview.recipientCount, 2); assert.equal(h.state.campaigns.length, 0); assert.match(preview.body, /&lt;script&gt;/); h.act(C, "communication.unsubscribe", { customerId: B.id }); const campaign = h.act(C, "campaign.create", payload); const capture = h.act(C, "campaign.capture", { campaignId: campaign.id }); assert.equal(capture.recipientCount, 1); const messages = h.state.capturedMessages.filter(m => m.campaignId === campaign.id); assert.equal(messages.length, 1); assert.equal(messages[0].status, "Captured — not sent"); assert.match(messages[0].body, /Unsubscribe:/); h.act(C, "campaign.capture", { campaignId: campaign.id }); assert.equal(h.state.capturedMessages.filter(m => m.campaignId === campaign.id).length, 1); h.act(null, "communication.unsubscribe", { token: messages[0].unsubscribeToken }); assert.equal(h.state.profiles.find(p => p.id === A.id).unsubscribed, true); assert.equal(renderCampaignText("{{name}}", "<img>"), "&lt;img&gt;"); });

test("scheduled campaigns cannot capture early; processDue captures only due campaigns", () => { const h = harness(); profile(h); const campaign = h.act(C, "campaign.create", { name: "Future", audience: "test-recipients", template: "Demo", subject: "Demo", body: "Demo", scheduledAt: new Date(Date.now() + 100000).toISOString() }); assert.throws(() => h.act(C, "campaign.capture", { campaignId: campaign.id }), /not arrived/); assert.equal(h.act(C, "campaign.processDue", {}).length, 0); h.state.campaigns[0].scheduledAt = new Date(Date.now() - 1000).toISOString(); assert.equal(h.act(C, "campaign.processDue", {}).length, 1); });

test("task and unit approvals identify independent people instead of merely different roles", () => { const h = harness(); const unit = h.act(O, "admin.unit", { name: "Sample depot", kind: "Depot", functions: ["Tasks"], evidence: "OPEN-DEMO" }); assert.throws(() => h.act(O, "admin.activateUnit", { unitId: unit.id }), /approved role/); h.act(CEO, "admin.activateUnit", { unitId: unit.id }); const task = h.act(O, "admin.task", { title: "Sample stock count", unitId: "BR-DEMO-01", owner: "Sample branch manager", due: "2026-10-19" }); h.act(localPersonas["branch-manager"], "admin.taskEvidence", { taskId: task.id, evidence: "COUNT-DEMO" }); assert.throws(() => h.act(O, "admin.taskApprove", { taskId: task.id }), /different person/); h.act(R, "admin.taskApprove", { taskId: task.id }); assert.equal(h.state.tasks[0].status, "Approved"); });

test("public snapshots omit all private data and review publication requires independent moderation", () => { const h = harness(); profile(h); const created = order(h); const review = h.act(A, "review.create", { orderId: created.id, rating: 5, publicationConsent: true, text: "Synthetic service feedback." }); assert.equal(snapshot(h.state, null, "public").reviews.length, 0); h.act(C, "review.moderate", { reviewId: review.id, decision: "Published" }); const publicData = snapshot(h.state, null, "public"); assert.equal(publicData.reviews[0].customerId, ""); assert.equal(publicData.reviews[0].orderId, ""); for (const key of ["profiles", "users", "orders", "audit", "employees", "payments", "capturedMessages"]) assert.equal(publicData[key], undefined); });

test("local reset is restricted, auditable, reproducible and preserves approved accounts", () => { const h = harness(); profile(h); order(h); assert.throws(() => h.act({ ...ADMIN, localDemo: false }, "admin.reset", { confirmation: "RESET SYNTHETIC DEMONSTRATION" }), /Hosted reset is disabled/); h.act(ADMIN, "admin.reset", { confirmation: "RESET SYNTHETIC DEMONSTRATION" }); assert.equal(h.state.orders.length, 0); assert.equal(h.state.products.find(p => p.id === "demo-maize").stock, 142); assert.equal(h.state.audit[0].action, "admin.reset"); assert.ok(h.state.users.length > 0); });

test("configurable demonstration tax preserves historical invoices and balances credits", () => { const h = harness(); profile(h); const first = order(h); h.act(FD, "finance.taxConfig", { productId: "demo-maize", taxCode: "TEST_ONLY_NOT_LEGAL_ADVICE", taxRate: 1000 }); const second = order(h, A, 1, "taxed-order"); assert.equal(first.tax, 0); assert.equal(second.tax, 6850); assert.equal(second.total, 75350); assert.equal(h.state.invoices.find(i => i.id === first.invoiceId).tax, 0); h.act(FD, "finance.credit", { invoiceId: second.invoiceId, amount: 75350, reason: "Full illustrative credit" }); assert.equal(financeReports(h.state).taxLiability, 0); assert.ok(financeReports(h.state).balanced); assert.throws(() => h.act(F, "finance.taxConfig", { productId: "demo-maize", taxCode: "BAD", taxRate: 500 }), /approved role/); });

test("enquiry and support responses reach only the owning customer and stay within branch scope", () => { const h = harness(); profile(h); profile(h, B); const enquiry = h.act(A, "enquiry.create", { name: "Sample A", email: A.email, phone: "DEMO-PHONE", subject: "Seed packs", message: "Please confirm sample pack sizes.", productId: "demo-maize", quantity: 2 }); assert.equal(h.state.enquiries[0].subject, "Seed packs"); h.act(localPersonas.sales, "enquiry.respond", { enquiryId: enquiry.id, response: "Sample 10 kg packs need brand confirmation." }); const support = h.act(A, "support.create", { subject: "Order question", message: "Please review this sample request." }); h.act(O, "support.respond", { supportId: support.id, response: "The demonstration request has been checked." }); const own = snapshot(h.state, A, "customer"), other = snapshot(h.state, B, "customer"); assert.equal(own.supportRequests[0].status, "Answered"); assert.equal(own.enquiries[0].status, "Responded"); assert.equal(other.supportRequests.length, 0); assert.equal(other.enquiries.length, 0); assert.equal(snapshot(h.state, S, "procurement").supportRequests.length, 0); assert.ok(own.notifications.some(n => n.event === "support.responded")); });

test("public feedback requires explicit publication consent and director access reviews omit unrelated personnel", () => { const h = harness(); profile(h); const created = order(h); assert.throws(() => h.act(A, "review.create", { orderId: created.id, rating: 5, text: "Sample feedback" }), /consent/); h.act(ADMIN, "admin.roleRequest", { userId: B.id, role: "hr", unitId: "HQ", reason: "Sample HR duties" }); h.act(ADMIN, "admin.roleRequest", { userId: A.id, role: "finance", unitId: "HQ", reason: "Sample accounting duties" }); const view = snapshot(h.state, FD, "admin"); assert.equal(view.roleRequests.length, 1); assert.equal(view.roleRequests[0].role, "finance"); assert.deepEqual(view.users, []); assert.deepEqual(view.tasks, []); });

test("applied access approvals cannot replay a previous elevation after an approved demotion", () => {
  const h = harness();
  const elevation = h.act(ADMIN, "admin.roleRequest", { userId: B.id, role: "finance", unitId: "HQ", reason: "Sample finance appointment" });
  h.act(FD, "admin.roleDecision", { requestId: elevation.id, decision: "Approved" });
  h.act(ADMIN, "admin.applyRole", { requestId: elevation.id });
  assert.equal(h.state.users.find(user => user.id === B.id).role, "finance");
  const applied = h.state.roleRequests.find(request => request.id === elevation.id);
  assert.equal(applied.status, "Applied");
  assert.equal(applied.appliedBy, ADMIN.id);
  assert.ok(applied.appliedAt);
  const demotion = h.act(ADMIN, "admin.roleRequest", { userId: B.id, role: "customer", unitId: "BR-DEMO-01", reason: "Sample end of finance duties" });
  h.act(CEO, "admin.roleDecision", { requestId: demotion.id, decision: "Approved" });
  h.act(ADMIN, "admin.applyRole", { requestId: demotion.id });
  const before = structuredClone(h.state);
  assert.throws(() => h.act(ADMIN, "admin.applyRole", { requestId: elevation.id }), /already been applied/);
  assert.equal(h.state.users.find(user => user.id === B.id).role, "customer");
  assert.deepEqual(h.state, before);
});

test("collection and delivery follow only their matching paid fulfilment route", () => {
  const h = harness(); profile(h);
  const collection = order(h);
  h.act(O, "order.status", { orderId: collection.id, status: "Confirmed", note: "Sample stock checked" });
  assert.throws(() => h.act(O, "order.status", { orderId: collection.id, status: "Dispatched", note: "Wrong route" }), /Collection orders/);
  h.act(F, "finance.payment", { kind: "customer", referenceId: collection.invoiceId, amount: collection.total, method: "Sample cash", evidence: "COLLECT-PAY", idempotencyKey: "collect-pay" });
  h.act(O, "order.status", { orderId: collection.id, status: "Ready for collection", note: "Sample pickup ready" });
  h.act(O, "order.status", { orderId: collection.id, status: "Completed", note: "Sample pickup complete" });
  h.act(A, "cart.set", { productId: "demo-maize", quantity: 1 });
  const delivery = h.act(A, "checkout", { idempotencyKey: "delivery-order", method: "delivery-request", name: A.name, phone: "000-DEMO", address: "Synthetic delivery address", area: "Synthetic area" });
  h.act(O, "order.status", { orderId: delivery.id, status: "Confirmed", note: "Sample delivery checked" });
  assert.throws(() => h.act(O, "order.status", { orderId: delivery.id, status: "Ready for collection", note: "Wrong route" }), /Delivery orders/);
  assert.throws(() => h.act(O, "order.status", { orderId: delivery.id, status: "Dispatched", note: "Unpaid" }), /payment/);
  h.act(F, "finance.payment", { kind: "customer", referenceId: delivery.invoiceId, amount: delivery.total, method: "Sample cash", evidence: "DELIVERY-PAY", idempotencyKey: "delivery-pay" });
  h.act(O, "order.status", { orderId: delivery.id, status: "Dispatched", note: "Sample dispatch" });
  h.act(O, "order.status", { orderId: delivery.id, status: "Completed", note: "Sample delivery complete" });
  assert.ok(h.state.orders.every(item => item.status === "Completed"));
});

test("inactive or unapproved fulfilment units reject cart, checkout and staff fulfilment atomically", () => {
  const h = harness(); profile(h);
  const unit = h.state.units.find(item => item.id === "BR-DEMO-01");
  unit.status = "Setup";
  assert.throws(() => h.act(A, "cart.set", { productId: "demo-maize", quantity: 1 }), /activation/);
  unit.status = "Active";
  unit.functions = ["Inventory"];
  assert.throws(() => h.act(A, "cart.set", { productId: "demo-maize", quantity: 1 }), /not approved for Sales/);
  unit.functions = ["Sales", "Inventory"];
  h.act(A, "cart.set", { productId: "demo-maize", quantity: 1 });
  h.state.units.find(item => item.id === unit.id).functions = ["Sales"];
  const before = structuredClone(h.state);
  assert.throws(() => h.act(A, "checkout", { idempotencyKey: "unit-invalid", method: "collection", name: A.name, phone: "000-DEMO" }), /not approved for Inventory/);
  assert.deepEqual(h.state, before);
  h.state.units.find(item => item.id === unit.id).functions = ["Sales", "Inventory"];
  const created = h.act(A, "checkout", { idempotencyKey: "unit-valid", method: "collection", name: A.name, phone: "000-DEMO" });
  h.state.units.find(item => item.id === unit.id).status = "Setup";
  assert.throws(() => h.act(O, "order.status", { orderId: created.id, status: "Confirmed", note: "Inactive" }), /activation/);
});

test("full credit cannot fulfil an order and unpaid credited cancellations release stock once without double credits", () => {
  for (const fullCredit of [true, false]) {
    const h = harness(); profile(h);
    h.act(FD, "finance.taxConfig", { productId: "demo-maize", taxCode: "TEST_ONLY", taxRate: 1000 });
    const stock = h.state.products.find(product => product.id === "demo-maize").stock;
    const created = order(h);
    h.act(FD, "finance.credit", { invoiceId: created.invoiceId, amount: fullCredit ? created.total : 30001, reason: "Sample credit adjustment" });
    h.act(O, "order.status", { orderId: created.id, status: "Confirmed", note: "Sample confirmation" });
    if (fullCredit) assert.throws(() => h.act(O, "order.status", { orderId: created.id, status: "Ready for collection", note: "Invalid fulfilment" }), /fully credited/);
    h.act(O, "order.status", { orderId: created.id, status: "Cancelled", note: "Sample unpaid cancellation" });
    assert.equal(h.state.products.find(product => product.id === "demo-maize").stock, stock);
    assert.equal(h.state.invoices[0].status, "Credited");
    const report = financeReports(h.state);
    assert.equal(report.receivables, 0); assert.equal(report.revenue, 0); assert.equal(report.taxLiability, 0); assert.ok(report.balanced);
    const after = structuredClone(h.state);
    assert.throws(() => h.act(O, "order.status", { orderId: created.id, status: "Cancelled", note: "Duplicate cancellation" }), /cannot move/);
    assert.deepEqual(h.state, after);
  }
});

test("public and customer product responses whitelist catalogue fields and exclude internal tax references and reorder rules", () => {
  const h = harness();
  h.state.products[0].internalDebugNote = "Private implementation concern";
  for (const [user, module] of [[null, "public"], [A, "customer"]]) {
    const products = snapshot(h.state, user, module).products;
    assert.ok(products.length > 0);
    for (const product of products) {
      assert.equal(product.reorderLevel, undefined); assert.equal(product.taxCode, undefined); assert.equal(product.internalDebugNote, undefined);
      assert.ok(product.name); assert.ok(product.image); assert.equal(typeof product.taxRate, "number");
    }
  }
  assert.equal(snapshot(h.state, F, "finance").products[0].taxCode, "REVIEW_REQUIRED");
});

test("branch role notifications disclose only their unit and cannot be marked read across branches", () => {
  const h = harness(); profile(h);
  const other = { ...S, id: "other-branch-storekeeper", unitId: "BR-OTHER" };
  h.state.stockByUnit["BR-OTHER:demo-sprayer"] = 100;
  h.act(A, "cart.set", { productId: "demo-sprayer", quantity: 1 });
  h.act(A, "checkout", { idempotencyKey: "branch-stock-notice", method: "collection", name: A.name, phone: "000-DEMO" });
  const notice = h.state.notifications.find(item => item.event === "stock.low");
  assert.equal(notice.unitId, S.unitId);
  assert.match(notice.body, /^26 units remain at BR-DEMO-01/);
  h.state.notifications.push({ ...notice, id: "notice-other-unit", unitId: other.unitId, body: "Other branch inventory details", readBy: [] });
  h.state.notifications.push({ ...notice, id: "legacy-unscoped-role-notice", unitId: undefined, readBy: [] });
  assert.deepEqual(snapshot(h.state, S, "notifications").notifications.map(item => item.id), [notice.id]);
  assert.deepEqual(snapshot(h.state, other, "notifications").notifications.map(item => item.id), ["notice-other-unit"]);
  const before = structuredClone(h.state);
  assert.throws(() => h.act(S, "notification.read", { notificationId: "notice-other-unit" }), /another user or operating unit/);
  assert.throws(() => h.act(other, "notification.read", { notificationId: notice.id }), /another user or operating unit/);
  assert.throws(() => h.act(S, "notification.read", { notificationId: "legacy-unscoped-role-notice" }), /another user or operating unit/);
  assert.deepEqual(h.state, before);
  h.act(S, "notification.read", { notificationId: notice.id });
  assert.deepEqual(h.state.notifications.find(item => item.id === notice.id).readBy, [S.id]);
});
