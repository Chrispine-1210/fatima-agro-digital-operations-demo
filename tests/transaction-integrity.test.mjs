import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { loadTypescript } from "./helpers/load-typescript.mjs";

const { applyAction, snapshot } = await import(await loadTypescript(new URL("../lib/server/domain.ts", import.meta.url)));
const { initialState, localPersonas } = await import(await loadTypescript(new URL("../lib/server/seed.ts", import.meta.url)));
const H = localPersonas.hr, HD = localPersonas["hr-director"], P = localPersonas.procurement, O = localPersonas["operations-director"];
function harness() {
  let state = initialState(); state.users = Object.values(localPersonas);
  return { get state() { return state; }, act(user, action, data = {}) { const saved = applyAction(state, user, action, data); state = saved.state; return saved.result; } };
}
function employee(h, startDate = "2026-11-15") {
  return h.act(H, "hr.employee", { name: "Synthetic employee", roleTitle: "Sample storekeeper", unitId: "BR-DEMO-01", workEmail: "lifecycle@example.test", startDate, salary: 200000 });
}
function activate(h, row) { for (const check of ["Identity verification", "Contract review", "Safety induction", "System access review"]) h.act(H, "hr.onboarding", { employeeId: row.id, check }); }

test("HR rejects pre-employment attendance and leave atomically while allowing the start date", () => {
  const h = harness(), row = employee(h), before = structuredClone(h.state);
  assert.throws(() => h.act(H, "hr.attendance", { employeeId: row.id, date: "2026-11-14", status: "Present" }), /start date/);
  assert.throws(() => h.act(H, "hr.leave", { employeeId: row.id, from: "2026-11-14", to: "2026-11-16", reason: "Before employment" }), /start date/);
  assert.deepEqual(h.state, before);
  const attendance = h.act(H, "hr.attendance", { employeeId: row.id, date: row.startDate, status: "Present" });
  assert.equal(attendance.date, row.startDate);
  assert.equal(h.act(H, "hr.leave", { employeeId: row.id, from: "2026-11-16", to: "2026-11-17", reason: "Synthetic planned leave" }).status, "Pending");
});

test("Leave attendance requires an independent approved request covering that employee and day", () => {
  const h = harness(), row = employee(h), data = { employeeId: row.id, date: "2026-11-20", status: "Leave" };
  assert.throws(() => h.act(H, "hr.attendance", data), /approved leave/);
  const leave = h.act(H, "hr.leave", { employeeId: row.id, from: "2026-11-20", to: "2026-11-21", reason: "Synthetic annual leave" });
  assert.throws(() => h.act(H, "hr.attendance", data), /approved leave/);
  assert.throws(() => h.act({ ...HD, id: H.id }, "hr.leaveDecision", { leaveId: leave.id, decision: "Approved" }), /different HR reviewer/);
  h.act(HD, "hr.leaveDecision", { leaveId: leave.id, decision: "Approved" });
  assert.equal(h.act(H, "hr.attendance", data).status, "Leave");
  assert.throws(() => h.act(H, "hr.attendance", { ...data, date: "2026-11-22" }), /approved leave/);
  assert.equal(snapshot(h.state, H, "hr").attendance.length, 1);
});

test("payroll excludes pre-employment months and keeps same-month preparation and duplicate guards", () => {
  const h = harness(), row = employee(h); activate(h, row);
  const before = structuredClone(h.state);
  assert.throws(() => h.act(H, "hr.payroll", { period: "2026-10", employeeIds: [row.id], deductions: 0 }), /start month/);
  assert.deepEqual(h.state, before);
  const preparation = h.act(H, "hr.payroll", { period: "2026-11", employeeIds: [row.id], deductions: 20000 });
  assert.equal(preparation.net, 180000); assert.equal(preparation.status, "Prepared only");
  assert.throws(() => h.act(H, "hr.payroll", { period: "2026-11", employeeIds: [row.id], deductions: 0 }), /already/);
  assert.equal(h.state.payrollPreparations.length, 1);
});

test("purchase orders recheck branch activation and procurement authority after independent approval", () => {
  for (const change of [unit => { unit.status = "Setup"; }, unit => { unit.functions = ["Inventory", "Tasks"]; }]) {
    const h = harness();
    const supplier = h.act(P, "procurement.supplier", { name: "Synthetic supplier", email: "supplier@example.test" });
    const request = h.act(P, "procurement.request", { productId: "demo-maize", quantity: 5, unitId: "BR-DEMO-01", neededBy: "2026-11-20", evidence: "SYNTHETIC-NEED" });
    h.act(O, "procurement.approve", { requestId: request.id, decision: "Approved" });
    const unit = h.state.units.find(item => item.id === request.unitId); change(unit);
    const before = structuredClone(h.state);
    assert.throws(() => h.act(P, "procurement.order", { requestId: request.id, supplierId: supplier.id, unitPrice: 60000 }), /activation|not approved/);
    assert.deepEqual(h.state, before);
    unit.status = "Active"; unit.functions = ["Inventory", "Procurement requests", "Tasks"];
    const order = h.act(P, "procurement.order", { requestId: request.id, supplierId: supplier.id, unitPrice: 60000 });
    assert.equal(order.quantity, 5); assert.equal(h.state.purchaseOrders.length, 1);
    assert.throws(() => h.act(P, "procurement.order", { requestId: request.id, supplierId: supplier.id, unitPrice: 60000 }), /independent approval/);
  }
});

// Execute the real route with storage/session boundaries stubbed. This tests request
// streaming and rejection order without requiring Cloudflare or touching live records.
const errorsUrl = await loadTypescript(new URL("../lib/server/errors.ts", import.meta.url));
const fixtureKey = `__fatimaRouteIntegrity${crypto.randomUUID().replaceAll("-", "")}`;
const fixture = { originCalls: 0, mutations: 0, reads: 0 };
globalThis[fixtureKey] = fixture;
function moduleUrl(code) { return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`; }
const dependencies = {
  "@/lib/server/domain": moduleUrl('export const applyAction = state => ({ state: { ...state }, result: { saved: true }, message: "Saved" }); export const snapshot = () => ({});'),
  "@/lib/server/auth": moduleUrl(`import { PortalError } from ${JSON.stringify(errorsUrl)}; const f = globalThis[${JSON.stringify(fixtureKey)}]; export const localDemoEnabled = () => true; export const sessionUser = async () => null; export function requireSameOrigin(request) { f.originCalls++; if (request.headers.get("origin") !== new URL(request.url).origin) throw new PortalError("Origin denied", 403, "ORIGIN"); }`),
  "@/lib/server/store": moduleUrl(`const f = globalThis[${JSON.stringify(fixtureKey)}]; export const readState = async () => ({}); export const mutateState = async change => { f.mutations++; const saved = change({ users: [], rateLimits: [] }); return { result: saved.result, revision: f.mutations }; };`),
  "@/lib/server/errors": errorsUrl,
};
const routeSource = await readFile(new URL("../app/api/portal/route.ts", import.meta.url), "utf8");
let routeCode = ts.transpileModule(routeSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
for (const [name, url] of Object.entries(dependencies)) routeCode = routeCode.replaceAll(`from "${name}"`, `from ${JSON.stringify(url)}`);
const { POST } = await import(moduleUrl(routeCode));
function request(body, headers = {}) { return new Request("https://fatima.example/api/portal", { method: "POST", headers: { origin: "https://fatima.example", "content-type": "application/json", ...headers }, body }); }
function stream(chunks, onCancel = () => {}) {
  let index = 0;
  return new ReadableStream({ pull(controller) { if (index === chunks.length) controller.close(); else { fixture.reads++; controller.enqueue(chunks[index++]); } }, cancel: onCancel });
}

test("portal consumes a bounded body before origin denial and does not invoke storage", async () => {
  const body = request(JSON.stringify({ action: "enquiry.create", data: {} }), { origin: "https://other.example" });
  const mutations = fixture.mutations;
  const denied = await POST(body);
  assert.equal(denied.status, 403); assert.equal(body.bodyUsed, true); assert.equal(fixture.mutations, mutations);
  const next = await POST(request(JSON.stringify({ action: "enquiry.create", data: {} })));
  assert.equal(next.status, 200); assert.equal((await next.json()).revision, mutations + 1);
});

test("portal bounds streamed UTF-8 bytes, cancels excess input and never mutates rejected requests", async () => {
  const body = JSON.stringify({ action: "enquiry.create", data: { message: "\u754c".repeat(12000) } });
  assert.ok(body.length < 32000); assert.ok(new TextEncoder().encode(body).byteLength > 32000);
  const before = fixture.mutations;
  assert.equal((await POST(request(body))).status, 413);
  const encoded = new TextEncoder().encode(body); let cancelled = false;
  const response = await POST(new Request("https://fatima.example/api/portal", { method: "POST", headers: { origin: "https://fatima.example", "content-type": "application/json" }, body: stream([encoded.slice(0, 16000), encoded.slice(16000, 32001), new Uint8Array(1000000)], () => { cancelled = true; }), duplex: "half" }));
  assert.equal(response.status, 413); assert.equal(cancelled, true); assert.equal(fixture.mutations, before);
});

test("portal rejects oversized declared bodies and malformed UTF-8/JSON before storage", async () => {
  const before = fixture.mutations;
  assert.equal((await POST(request("{}", { "content-length": "50000000" }))).status, 413);
  assert.equal((await POST(request(new Uint8Array([0xff, 0xfe])))).status, 400);
  const prefix = new TextEncoder().encode('{"action":"enquiry.create","data":{"note":"'), suffix = new TextEncoder().encode('"}}');
  const invalidText = new Uint8Array(prefix.byteLength + 1 + suffix.byteLength);
  invalidText.set(prefix); invalidText[prefix.byteLength] = 0xff; invalidText.set(suffix, prefix.byteLength + 1);
  assert.equal((await POST(request(invalidText))).status, 400);
  assert.equal((await POST(request("{"))).status, 400);
  assert.equal((await POST(request("[]"))).status, 400);
  assert.equal(fixture.mutations, before);
});

test("portal byte boundary accepts exactly 32KB and rejects the next byte without a mutation", async () => {
  const json = JSON.stringify({ action: "enquiry.create", data: {} });
  const boundary = json + " ".repeat(32000 - new TextEncoder().encode(json).byteLength);
  const before = fixture.mutations;
  assert.equal((await POST(request(boundary))).status, 200);
  assert.equal((await POST(request(boundary + " "))).status, 413);
  assert.equal(fixture.mutations, before + 1);
});

test("portal drains bounded non-JSON requests without bypassing content-type or origin checks", async () => {
  const body = request("text", { "content-type": "text/plain" });
  const before = fixture.mutations;
  assert.equal((await POST(body)).status, 415); assert.equal(body.bodyUsed, true); assert.equal(fixture.mutations, before);
});
