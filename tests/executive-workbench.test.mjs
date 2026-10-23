import test from "node:test";
import assert from "node:assert/strict";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const { filterExecutiveDecisions, defaultDecisionFilters, executivePriorities, malawiDay } = await import(await loadTypescript(new URL("../lib/executive-workbench.ts", import.meta.url)));
const base = { rationale: "Kanengo stock evidence", unitId: "BR-1", department: "operations", status: "Open", dueDate: "2026-10-24", priority: "Normal", updatedAt: "2026-10-22T10:00:00Z", progress: [] };
const decisions = [
  { ...base, id: "normal", title: "Plan maize" },
  { ...base, id: "critical", title: "Review maize supply", priority: "Critical", dueDate: "2026-10-23" },
  { ...base, id: "blocked", title: "Resolve supply", status: "Blocked", department: "finance", dueDate: "2026-10-22" },
  { ...base, id: "closed", title: "Completed maize", status: "Completed", priority: "Critical", dueDate: "2026-10-20" },
];
test("executive decision filters combine department, unit, priority and all search words without mutating input", () => {
  const before = structuredClone(decisions);
  const result = filterExecutiveDecisions(decisions, { ...defaultDecisionFilters, search: " maize  review ", department: "operations", unitId: "BR-1", priority: "Critical" }, "2026-10-22T22:30:00Z");
  assert.deepEqual(result.map(item => item.id), ["critical"]); assert.deepEqual(decisions, before);
  assert.equal(filterExecutiveDecisions(decisions, { ...defaultDecisionFilters, unitId: "OTHER" }, "2026-10-23T00:00:00Z").length, 0);
});
test("decision dates use Malawi midnight, exclude closed decisions and distinguish overdue from due this week", () => {
  assert.equal(malawiDay("2026-10-22T22:30:00Z"), "2026-10-23");
  assert.deepEqual(filterExecutiveDecisions(decisions, { ...defaultDecisionFilters, due: "overdue" }, "2026-10-22T22:30:00Z").map(item => item.id), ["blocked"]);
  assert.deepEqual(filterExecutiveDecisions(decisions, { ...defaultDecisionFilters, due: "week" }, "2026-10-22T22:30:00Z").map(item => item.id), ["critical", "normal"]);
  assert.deepEqual(filterExecutiveDecisions(decisions, defaultDecisionFilters, "2026-10-23T00:00:00Z").map(item => item.id), ["critical", "blocked", "normal", "closed"]);
});
test("executive attention derives only real nonzero queues and counts blocked/overdue decisions once", () => {
  const snapshot = { asOf: "2026-10-22T22:30:00Z", decisions, inventory: { outOfStockCount: 0 }, finance: { receivables: { overdueCount: 2 } }, controls: { pendingCounts: 1, pendingTransfers: 2, pendingPurchaseRequests: 0, pendingLeaveRequests: 0 }, approvals: { units: [], roleRequests: [] }, units: [{ tasksOverdue: 3 }] };
  const rows = executivePriorities(snapshot);
  assert.deepEqual(rows.map(item => [item.id, item.count]), [["receivables", 2], ["follow-up", 1], ["reviews", 3], ["tasks", 3]]);
  assert.equal(JSON.stringify(rows).includes("Kanengo stock evidence"), false);
  const attention = rows.find(item => item.id === "follow-up");
  assert.equal(filterExecutiveDecisions(decisions, { ...defaultDecisionFilters, ...attention.decisionFilter }, snapshot.asOf).length, attention.count);
});
test("decision search includes the department label displayed to executives", () => {
  const rows = [{ ...decisions[0], department: "hr" }];
  assert.equal(filterExecutiveDecisions(rows, { ...defaultDecisionFilters, search: "People" }, "2026-10-23T00:00:00Z").length, 1);
});
