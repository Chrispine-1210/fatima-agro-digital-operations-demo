import test from "node:test";
import assert from "node:assert/strict";
import { loadTypescript } from "./helpers/load-typescript.mjs";

const { applyAction, snapshot, financeReports } = await import(await loadTypescript(new URL("../lib/server/domain.ts", import.meta.url)));
const { initialState, localPersonas } = await import(await loadTypescript(new URL("../lib/server/seed.ts", import.meta.url)));
const { normalizeState } = await import(await loadTypescript(new URL("../lib/server/state-migrations.ts", import.meta.url)));
const { capabilities } = await import(await loadTypescript(new URL("../lib/server/permissions.ts", import.meta.url)));
const S = localPersonas.storekeeper, P = localPersonas.procurement, O = localPersonas["operations-director"], R = localPersonas["operations-reviewer"], B = localPersonas["branch-manager"], F = localPersonas.finance, FD = localPersonas["finance-director"], C = localPersonas["customer-a"], OTHER = localPersonas["customer-b"], CEO = localPersonas.ceo, ADMIN = localPersonas.administrator;
const branch = "BR-DEMO-01", depot = "DP-TEST", productId = "demo-maize", stockKey = `${branch}:${productId}`;
function harness() {
  let state = initialState(); state.users = Object.values(localPersonas);
  state.units.push({ id: depot, name: "Synthetic test depot", kind: "Depot", status: "Active", functions: ["Inventory", "Tasks"], evidence: "TEST-ONLY", createdBy: O.id, address: "Private test address", town: "Lilongwe", country: "Malawi" });
  return { get state() { return state; }, act(user, action, data = {}) { const result = applyAction(state, user, action, data); state = result.state; return result.result; } };
}
function requestCount(h, user = S, overrides = {}) { return h.act(user, "inventory.adjustmentRequest", { productId, unitId: branch, expectedQuantity: h.state.stockByUnit[stockKey], countedQuantity: 140, reason: "Physical sample count", evidence: "COUNT-EVIDENCE-01", idempotencyKey: "count-1", ...overrides }); }
function requestTransfer(h, user = S, overrides = {}) { return h.act(user, "inventory.transferRequest", { productId, fromUnitId: branch, toUnitId: depot, quantity: 10, reason: "Sample depot replenishment", evidence: "TRANSFER-EVIDENCE-01", idempotencyKey: "transfer-1", ...overrides }); }
function customerReceipt(h, user = C, key = "one") {
  h.act(user, "customer.register", { name: user.name, phone: "000-DEMO", marketingConsent: false });
  h.act(user, "cart.set", { productId, quantity: 1 });
  const order = h.act(user, "checkout", { idempotencyKey: `order-${key}`, method: "collection", name: user.name, phone: "000-DEMO" });
  h.act(F, "finance.payment", { kind: "customer", referenceId: order.invoiceId, amount: order.total, method: "Demonstration cash", evidence: "PAYMENT-TEST", idempotencyKey: `pay-${key}` });
  return h.state.receipts.find(item => item.invoiceId === order.invoiceId);
}
function capture(h, targetId, user = F, overrides = {}) { return h.act(user, "finance.receiptCapture", { targetType: "receipt", targetId, source: "camera", fileName: "receipt.jpg", mimeType: "image/jpeg", byteLength: 2048, sha256: "a".repeat(64), reference: "PHOTO-TEST-01", note: "Reviewed locally; file stays on device", idempotencyKey: "capture-1", ...overrides }); }

test("legacy state normalization adds identities and collections without replacing accounts, money, stock or saved locations", () => {
  const h = harness(); customerReceipt(h);
  const legacy = structuredClone(h.state);
  delete legacy.stockAdjustments; delete legacy.stockTransfers; delete legacy.receiptCaptures;
  for (const product of legacy.products) { delete product.sku; delete product.barcode; delete product.barcodeKind; }
  legacy.units[0].address = "Existing premises"; legacy.units[0].town = "Existing town"; legacy.units[0].latitude = -13.9; legacy.units[0].longitude = 33.7;
  const before = structuredClone(legacy), migrated = normalizeState(legacy);
  assert.deepEqual(legacy, before);
  for (const key of ["revision", "users", "profiles", "orders", "invoices", "payments", "receipts", "journals", "stockByUnit", "stockMovements", "roleRequests", "revokedBefore"]) assert.deepEqual(migrated[key], before[key], key);
  assert.deepEqual(normalizeState(migrated), migrated);
  assert.equal(migrated.products.find(item => item.id === productId).sku, "FA-MAIZE-10KG");
  assert.ok(migrated.products.every(item => item.barcode === item.sku && item.barcodeKind === "Internal Code 128"));
  assert.equal(migrated.units[0].address, "Existing premises"); assert.equal(migrated.units[0].town, "Existing town"); assert.equal(migrated.units[0].latitude, -13.9);
  assert.deepEqual(migrated.stockAdjustments, []); assert.deepEqual(migrated.stockTransfers, []); assert.deepEqual(migrated.receiptCaptures, []);
  assert.equal(migrated.units.find(item => item.id === branch).town, "Lilongwe");
  assert.equal(migrated.units.find(item => item.id === branch).latitude, undefined);
});

test("backfill deterministically avoids existing identifier collisions and refuses malformed stored collections", () => {
  const legacy = initialState();
  delete legacy.products[0].sku; delete legacy.products[0].barcode;
  legacy.products[1].sku = "FA-FERT-50KG"; legacy.products[1].barcode = "FA-FERT-50KG";
  legacy.products.push({ ...legacy.products[2], id: "custom/unmapped-product", sku: undefined, barcode: undefined });
  const migrated = normalizeState(legacy);
  assert.equal(migrated.products[0].sku, "FA-FERT-50KG-2");
  assert.match(migrated.products.at(-1).sku, /^FA-CUSTOM-UNMAPPED-PRODUCT/);
  assert.deepEqual(normalizeState(migrated), migrated);
  assert.throws(() => normalizeState({ ...legacy, stockTransfers: {} }), /reviewed recovery/);
  assert.throws(() => normalizeState({ ...migrated, products: [{ ...migrated.products[0], barcode: null }] }), /reviewed recovery/);
});

test("product identity edit uses unique internal identifiers and preserves historical order references", () => {
  const h = harness(); customerReceipt(h);
  const oldOrder = structuredClone(h.state.orders[0]);
  const product = h.act(P, "inventory.identify", { productId, sku: "fa-seed-001", barcode: "FA-INTERNAL-001" });
  assert.equal(product.sku, "FA-SEED-001"); assert.equal(product.barcode, "FA-INTERNAL-001");
  assert.deepEqual(h.state.orders[0], oldOrder);
  const before = structuredClone(h.state), other = h.state.products.find(item => item.id === "demo-urea");
  assert.throws(() => h.act(O, "inventory.identify", { productId, sku: other.barcode, barcode: "UNIQUE-01" }), /another product/);
  assert.throws(() => h.act(P, "inventory.identify", { productId, sku: "SHORT", barcode: other.sku }), /another product/);
  assert.throws(() => h.act(P, "inventory.identify", { productId, sku: other.id.toUpperCase(), barcode: "VALID-OTHER" }), /another product/);
  for (const sku of ["a b", "<svg>", "A".repeat(33), "A"]) assert.throws(() => h.act(P, "inventory.identify", { productId, sku, barcode: "VALID-1" }));
  assert.throws(() => h.act(S, "inventory.identify", { productId, sku: "VALID-2", barcode: "VALID-2" }), /approved role/);
  assert.deepEqual(h.state, before);
});

test("stock count waits for a separate approver then changes one balance and one movement exactly once", () => {
  const h = harness(), request = requestCount(h), originalTotal = h.state.products.find(item => item.id === productId).stock;
  assert.equal(h.state.stockByUnit[stockKey], 142); assert.equal(h.state.stockMovements.length, 0);
  assert.equal(request.quantityChange, -2); assert.equal(request.status, "Pending");
  const duplicateRequest = h.act(S, "inventory.adjustmentRequest", { idempotencyKey: "count-1" });
  assert.equal(duplicateRequest.id, request.id); assert.equal(h.state.stockAdjustments.length, 1);
  const decided = h.act(O, "inventory.adjustmentDecision", { adjustmentId: request.id, decision: "Approved", idempotencyKey: "count-review-1" });
  assert.equal(decided.decidedBy, O.id); assert.equal(h.state.stockByUnit[stockKey], 140);
  assert.equal(h.state.products.find(item => item.id === productId).stock, originalTotal - 2);
  assert.equal(h.state.stockMovements.length, 1); assert.equal(h.state.stockMovements[0].reference, request.id);
  const before = structuredClone(h.state);
  h.act(O, "inventory.adjustmentDecision", { idempotencyKey: "count-review-1" }); assert.deepEqual(h.state, before);
  assert.throws(() => h.act(R, "inventory.adjustmentDecision", { adjustmentId: request.id, decision: "Approved", idempotencyKey: "count-review-2" }), /already been decided/);
  assert.equal(financeReports(h.state).balanced, true);
});

test("counts reject self approval, stale expected balances and movement after the count without partial changes", () => {
  const h = harness(), request = requestCount(h, O), before = structuredClone(h.state);
  assert.throws(() => h.act(O, "inventory.adjustmentDecision", { adjustmentId: request.id, decision: "Approved", idempotencyKey: "self-count" }), /separate reviewer/);
  assert.deepEqual(h.state, before);
  assert.throws(() => requestCount(h, S, { expectedQuantity: 141, idempotencyKey: "stale-count" }), error => error.code === "STOCK_CHANGED" && error.status === 409);
  h.state.stockByUnit[stockKey] = 141; h.state.products.find(item => item.id === productId).stock = 141;
  const changed = structuredClone(h.state);
  assert.throws(() => h.act(R, "inventory.adjustmentDecision", { adjustmentId: request.id, decision: "Approved", idempotencyKey: "stale-approval" }), error => error.code === "STOCK_CHANGED" && error.status === 409);
  assert.deepEqual(h.state, changed);
  h.act(R, "inventory.adjustmentDecision", { adjustmentId: request.id, decision: "Declined", idempotencyKey: "decline-stale" });
  assert.equal(h.state.stockAdjustments[0].status, "Declined"); assert.equal(h.state.stockByUnit[stockKey], 141);
});

test("zero-difference counts complete without a spurious stock movement", () => {
  const h = harness(), request = requestCount(h, S, { countedQuantity: 142 });
  h.act(O, "inventory.adjustmentDecision", { adjustmentId: request.id, decision: "Approved", idempotencyKey: "zero-count" });
  assert.equal(h.state.stockMovements.length, 0); assert.equal(h.state.stockByUnit[stockKey], 142);
});

test("stock transfers require independent approval and post a matching pair with unchanged total and finance ledger", () => {
  const h = harness(), beforeTotal = h.state.products.find(item => item.id === productId).stock, ledger = structuredClone(h.state.journals), transfer = requestTransfer(h);
  assert.equal(h.state.stockByUnit[stockKey], 142); assert.equal(h.state.stockByUnit[`${depot}:${productId}`], undefined);
  assert.equal(h.act(S, "inventory.transferRequest", { idempotencyKey: "transfer-1" }).id, transfer.id);
  const decided = h.act(O, "inventory.transferDecision", { transferId: transfer.id, decision: "Approved", idempotencyKey: "transfer-review-1" });
  assert.equal(decided.status, "Approved"); assert.equal(h.state.stockByUnit[stockKey], 132); assert.equal(h.state.stockByUnit[`${depot}:${productId}`], 10);
  assert.equal(h.state.products.find(item => item.id === productId).stock, beforeTotal);
  const movements = h.state.stockMovements.filter(item => item.reference === transfer.id);
  assert.equal(movements.length, 2); assert.equal(movements.reduce((sum, item) => sum + item.quantity, 0), 0);
  assert.deepEqual(h.state.journals, ledger);
  const before = structuredClone(h.state); h.act(O, "inventory.transferDecision", { idempotencyKey: "transfer-review-1" }); assert.deepEqual(h.state, before);
  assert.throws(() => h.act(R, "inventory.transferDecision", { transferId: transfer.id, decision: "Approved", idempotencyKey: "new-review-key" }), /already been decided/);
});

test("transfers recheck availability, activation and operating functions; failures preserve both balances", () => {
  const h = harness(), transfer = requestTransfer(h, O), before = structuredClone(h.state);
  assert.throws(() => h.act(O, "inventory.transferDecision", { transferId: transfer.id, decision: "Approved", idempotencyKey: "self-transfer" }), /separate reviewer/); assert.deepEqual(h.state, before);
  h.state.stockByUnit[stockKey] = 5; h.state.products.find(item => item.id === productId).stock = 5;
  const changed = structuredClone(h.state);
  assert.throws(() => h.act(R, "inventory.transferDecision", { transferId: transfer.id, decision: "Approved", idempotencyKey: "over-transfer" }), /Not enough/); assert.deepEqual(h.state, changed);
  h.state.stockByUnit[stockKey] = 142; h.state.products.find(item => item.id === productId).stock = 142;
  h.state.units.find(item => item.id === depot).status = "Setup";
  assert.throws(() => h.act(R, "inventory.transferDecision", { transferId: transfer.id, decision: "Approved", idempotencyKey: "setup-transfer" }), /activation/);
  h.state.units.find(item => item.id === depot).status = "Active"; h.state.units.find(item => item.id === depot).functions = ["Tasks"];
  assert.throws(() => h.act(R, "inventory.transferDecision", { transferId: transfer.id, decision: "Approved", idempotencyKey: "no-inventory" }), /not approved for Inventory/);
  assert.equal(h.state.stockMovements.length, 0); assert.equal(h.state.stockTransfers[0].status, "Pending");
});

test("inventory scope covers snapshot balances, count and transfer writes, and retried requests after reassignment", () => {
  const h = harness(), transfer = requestTransfer(h), request = requestCount(h);
  const staff = snapshot(h.state, S, "procurement"), remoteStaff = { ...S, id: "remote-storekeeper", unitId: depot };
  assert.ok(staff.stockBalances.every(item => item.unitId === branch));
  assert.ok(staff.units.every(item => item.id === branch));
  assert.equal(staff.transferDestinations.find(item => item.id === depot).address, undefined);
  assert.equal(staff.stockTransfers[0].id, transfer.id);
  const before = structuredClone(h.state);
  assert.throws(() => requestCount(h, remoteStaff, { idempotencyKey: "remote-count" }), /another branch/);
  assert.throws(() => requestTransfer(h, remoteStaff, { idempotencyKey: "remote-transfer" }), /another branch/);
  assert.throws(() => h.act({ ...S, unitId: depot }, "inventory.adjustmentRequest", { idempotencyKey: "count-1" }), /another branch/);
  assert.throws(() => h.act({ ...S, unitId: depot }, "inventory.transferRequest", { idempotencyKey: "transfer-1" }), /another branch/);
  assert.deepEqual(h.state, before);
  const remote = snapshot(h.state, remoteStaff, "procurement"); assert.equal(remote.stockAdjustments.length, 0); assert.equal(remote.stockTransfers[0].id, transfer.id);
  assert.equal(snapshot(h.state, O, "procurement").stockAdjustments[0].id, request.id);
});

test("inventory writes reject invalid and overflowing quantities without partial transactions", () => {
  const h = harness(), before = structuredClone(h.state);
  for (const countedQuantity of [-1, 0.5, NaN, Infinity, 1_000_001, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => requestCount(h, S, { countedQuantity, idempotencyKey: `invalid-${countedQuantity}` }));
  for (const quantity of [0, -1, 1.5, NaN, Infinity, 1_000_001]) assert.throws(() => requestTransfer(h, S, { quantity, idempotencyKey: `invalid-transfer-${quantity}` }));
  assert.throws(() => requestTransfer(h, S, { toUnitId: branch }), /different operating units/);
  assert.deepEqual(h.state, before);
  h.state.stockByUnit[`${depot}:${productId}`] = 1_000_000_000_000;
  const transfer = requestTransfer(h), changed = structuredClone(h.state);
  assert.throws(() => h.act(O, "inventory.transferDecision", { transferId: transfer.id, decision: "Approved", idempotencyKey: "overflow-transfer" }), /Combined stock balance|Resulting stock balance/);
  assert.deepEqual(h.state, changed);
});

test("location changes validate paired GPS and retain independent activation, access and unit scope", () => {
  const h = harness(); h.state.units.find(item => item.id === depot).status = "Setup";
  const originalRoles = structuredClone(h.state.users), unit = h.act(O, "admin.unitLocation", { unitId: depot, address: "Sample premises", town: "Lilongwe", country: "Malawi", latitude: -13.9, longitude: 33.7, locationNote: "Operator supplied test point" });
  assert.equal(unit.status, "Setup"); assert.equal(unit.locationUpdatedBy, O.id); assert.equal(unit.latitude, -13.9); assert.deepEqual(h.state.users, originalRoles);
  const before = structuredClone(h.state);
  for (const coords of [{ latitude: 91, longitude: 30 }, { latitude: -13, longitude: -181 }, { latitude: NaN, longitude: 30 }, { latitude: -13 }, { latitude: "-13", longitude: "33" }]) assert.throws(() => h.act(O, "admin.unitLocation", { unitId: depot, address: "Sample", town: "Lilongwe", country: "Malawi", ...coords }));
  assert.throws(() => h.act(B, "admin.unitLocation", { unitId: depot, address: "Sample", town: "Lilongwe", country: "Malawi" }), /another branch/);
  assert.deepEqual(h.state, before);
  h.act(CEO, "admin.unitLocation", { unitId: depot, address: "Sample", town: "Lilongwe", country: "Malawi", latitude: null, longitude: null });
  assert.equal(h.state.units.find(item => item.id === depot).latitude, undefined); assert.equal(h.state.units.find(item => item.id === depot).longitude, undefined);
});

test("receipt capture resolves its unit from persisted links and stores metadata only, once", () => {
  const h = harness(), receipt = customerReceipt(h), financeBefore = financeReports(h.state), item = capture(h, receipt.id);
  assert.equal(item.unitId, branch); assert.equal(item.storage, "Metadata only"); assert.equal(item.targetId, receipt.id); assert.equal(item.capturedBy, F.id);
  assert.equal(Object.hasOwn(item, "image"), false); assert.equal(Object.hasOwn(item, "dataUrl"), false);
  assert.deepEqual(financeReports(h.state), financeBefore);
  const before = structuredClone(h.state); assert.equal(h.act(F, "finance.receiptCapture", { idempotencyKey: "capture-1" }).id, item.id); assert.deepEqual(h.state, before);
  assert.throws(() => h.act({ ...F, role: "procurement" }, "finance.receiptCapture", { idempotencyKey: "capture-1" }), /current role/);
  assert.deepEqual(h.state, before);
  assert.equal(snapshot(h.state, F, "finance").receiptCaptures[0].id, item.id);
});

test("capture validates target, media metadata, bounds, unknown data and financial role", () => {
  const h = harness(), receipt = customerReceipt(h), before = structuredClone(h.state);
  for (const overrides of [{ targetId: "missing" }, { byteLength: 10_000_001 }, { sha256: "not-a-hash" }, { mimeType: "text/html" }, { fileName: "folder/image.jpg" }, { fileName: "folder\\image.jpg" }, { image: "data:image/jpeg;base64,AAAA" }, { unitId: depot }, { source: "manual" }, { source: "camera", mimeType: "application/pdf" }]) assert.throws(() => capture(h, receipt.id, F, overrides));
  assert.throws(() => capture(h, receipt.id, S), /belongs to Accounting/);
  assert.throws(() => capture(h, receipt.id, C), /approved role/);
  assert.deepEqual(h.state, before);
  const manual = capture(h, receipt.id, FD, { source: "manual", fileName: "", mimeType: "", byteLength: 0, sha256: "", reference: "MANUAL-EVIDENCE" });
  assert.equal(manual.byteLength, 0); assert.equal(manual.sha256, "");
});

test("goods receipt capture is scoped and never creates stock, bills or payments", () => {
  const h = harness();
  h.state.goodsReceipts.push({ id: "GRN-TEST", purchaseOrderId: "PO-TEST", productId, quantity: 1, evidence: "SYNTHETIC", unitId: branch, createdAt: "2026-10-20T10:00:00Z", receivedBy: S.id, billId: "BILL-TEST" });
  const beforeStock = structuredClone(h.state.stockByUnit), beforeBills = structuredClone(h.state.bills), item = capture(h, "GRN-TEST", S, { targetType: "goods-receipt" });
  assert.equal(item.unitId, branch); assert.deepEqual(h.state.stockByUnit, beforeStock); assert.deepEqual(h.state.bills, beforeBills); assert.equal(h.state.payments.length, 0);
  assert.equal(snapshot(h.state, S, "procurement").receiptCaptures[0].id, item.id);
  const other = { ...S, id: "other-storekeeper", unitId: depot };
  assert.throws(() => capture(h, "GRN-TEST", other, { targetType: "goods-receipt" }), /another branch/);
  assert.throws(() => capture(h, "GRN-TEST", F, { targetType: "goods-receipt" }), /belongs to procurement/);
  assert.equal(snapshot(h.state, other, "procurement").receiptCaptures.length, 0);
});

test("expense capture is linked to its persisted finance unit", () => {
  const h = harness(); customerReceipt(h);
  const expense = h.act(F, "finance.expense", { category: "Test", description: "Synthetic expense", amount: 100, evidence: "EXP-TEST" });
  const item = capture(h, expense.id, F, { targetType: "expense", source: "manual", fileName: "", mimeType: "", byteLength: 0, sha256: "" });
  assert.equal(item.unitId, "HQ"); assert.equal(item.targetType, "expense");
});

test("customer print documents are joined to owned payment records without exposing other customers or evidence", () => {
  const h = harness(), receipt = customerReceipt(h), otherReceipt = customerReceipt(h, OTHER, "two"); capture(h, receipt.id); requestCount(h); requestTransfer(h);
  const own = snapshot(h.state, C, "customer"), other = snapshot(h.state, OTHER, "customer"), publicData = snapshot(h.state, null, "public"), staff = snapshot(h.state, F, "finance");
  assert.equal(own.receiptDocuments.length, 1); assert.equal(own.receiptDocuments[0].receipt.id, receipt.id); assert.equal(own.receiptDocuments[0].payment.method, "Demonstration cash");
  assert.equal(own.receiptDocuments[0].order.customerId, C.id); assert.equal(own.receiptDocuments[0].customer.email, C.email);
  assert.equal(own.receiptDocuments[0].payment.evidence, undefined); assert.equal(own.receiptDocuments[0].unit.evidence, undefined);
  assert.equal(other.receiptDocuments[0].receipt.id, otherReceipt.id); assert.equal(staff.receiptDocuments.length, 2);
  for (const data of [own, other, publicData]) for (const key of ["stockBalances", "stockAdjustments", "stockTransfers", "transferDestinations", "receiptCaptures", "units"]) assert.equal(data[key], undefined, key);
  assert.equal(publicData.receiptDocuments, undefined); assert.ok(publicData.products.every(product => product.sku === undefined && product.barcode === undefined));
  h.state.payments.find(item => item.id === receipt.paymentId).referenceId = otherReceipt.invoiceId;
  assert.equal(snapshot(h.state, C, "customer").receiptDocuments.length, 0);
});

test("security administrators and customers gain no business inventory or receipt capture permissions", () => {
  for (const actor of [ADMIN, C]) for (const action of ["inventory.identify", "inventory.adjustmentRequest", "inventory.adjustmentDecision", "inventory.transferRequest", "inventory.transferDecision", "admin.unitLocation", "finance.receiptCapture"]) assert.equal(capabilities(actor).includes(action), false, `${actor.role}: ${action}`);
});
