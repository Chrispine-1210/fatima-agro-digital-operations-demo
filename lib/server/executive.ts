import type * as T from "../portal-types";
import type { PortalState } from "./seed";
import { ensure, textField, dateField, integer } from "./errors";

const departments: { id: T.ExecutiveDepartment; name: string }[] = [
  { id: "finance", name: "Finance" }, { id: "hr", name: "Human resources" },
  { id: "operations", name: "Sales, procurement and stores" },
  { id: "communications", name: "Communications" }, { id: "administration", name: "Organisation and access" },
];
/** Malawi has UTC+02:00 year round. Date-only business values are already local dates. */
export function blantyreDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const at = Date.parse(value);
  ensure(Number.isFinite(at), "A stored executive reporting date requires review.", 503, "STORAGE_INVALID");
  return new Date(at + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function sum(values: number[]) { return values.reduce((total, value) => total + value, 0); }
function ledgerBalance(rows: T.JournalEntry[], account: string) { return sum(rows.flatMap(row => row.lines).filter(item => item.account === account).map(item => item.debit - item.credit)); }
function openDecision(decision: T.ExecutiveDecision) { return decision.status !== "Completed" && decision.status !== "Cancelled"; }
/** Select every field explicitly; no entity spreads may add private source fields to this projection. */
function decisionView(decision: T.ExecutiveDecision): T.ExecutiveDecision {
  return { id: decision.id, title: decision.title, rationale: decision.rationale, department: decision.department, unitId: decision.unitId, dueDate: decision.dueDate, priority: decision.priority, status: decision.status, version: decision.version, createdAt: decision.createdAt, createdBy: decision.createdBy, updatedAt: decision.updatedAt, closedAt: decision.closedAt, closedBy: decision.closedBy,
    progress: decision.progress.map(item => ({ id: item.id, at: item.at, actorId: item.actorId, note: item.note, evidence: item.evidence, status: item.status })) };
}

/** Aggregate-only executive projection. All money remains synthetic integer MWK. */
export function executiveSnapshot(state: PortalState, user: T.SessionUser, reports: T.FinanceReports, asOf = new Date().toISOString()): T.ExecutiveSnapshot {
  ensure(user.role === "ceo", "Only an approved CEO may read executive reporting.", 403, "FORBIDDEN");
  const today = blantyreDate(asOf), month = today.slice(0, 7);
  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const months = Array.from({ length: 6 }, (_, index) => {
    const cursor = new Date(monthStart); cursor.setUTCMonth(cursor.getUTCMonth() - 5 + index);
    const key = cursor.toISOString().slice(0, 7), journals = state.journals.filter(row => blantyreDate(row.at).startsWith(key));
    const payments = state.payments.filter(row => blantyreDate(row.createdAt).startsWith(key));
    return { month: key, revenue: -ledgerBalance(journals, "Sales revenue") - ledgerBalance(journals, "Sales returns"), expenses: ledgerBalance(journals, "Operating expenses"), customerReceipts: sum(payments.filter(row => row.kind === "customer").map(row => row.amount)), supplierPayments: sum(payments.filter(row => row.kind === "supplier").map(row => row.amount)), netCashMovement: ledgerBalance(journals, "Demo cash and bank") };
  });
  const unpaidInvoices = state.invoices.filter(row => row.total - row.credited - row.paid > 0);
  const overdueInvoices = unpaidInvoices.filter(row => row.dueDate < today);
  const unpaidBills = state.bills.filter(row => row.total - row.paid > 0);
  const agedBills = unpaidBills.filter(row => Date.parse(`${today}T00:00:00Z`) - Date.parse(`${blantyreDate(row.createdAt)}T00:00:00Z`) >= 30 * 86_400_000);
  const pendingCounts = state.stockAdjustments.filter(row => row.status === "Pending").length;
  const pendingTransfers = state.stockTransfers.filter(row => row.status === "Pending").length;
  const pendingPurchaseRequests = state.purchaseRequests.filter(row => row.status === "Pending").length;
  const pendingLeaveRequests = state.leaveRequests.filter(row => row.status === "Pending").length;
  const unmatchedStatementLines = state.statementLines.filter(row => row.status === "Unmatched").length;
  const activeInventory = state.units.filter(row => row.status === "Active" && row.functions.includes("Inventory"));
  const risks: T.ExecutiveSnapshot["inventory"]["risks"] = activeInventory.flatMap(unit => state.products.flatMap(product => {
    const available = integer(state.stockByUnit[`${unit.id}:${product.id}`] ?? 0, "Stored stock balance", 0);
    if (available > 0 && available >= product.reorderLevel) return [];
    return [{ unitId: unit.id, unitName: unit.name, productId: product.id, sku: product.sku, name: product.name, available, reorderLevel: product.reorderLevel, severity: available === 0 ? "Out of stock" as const : "Low stock" as const }];
  })).sort((a, b) => Number(a.available !== 0) - Number(b.available !== 0) || a.available - b.available || a.unitId.localeCompare(b.unitId) || a.sku.localeCompare(b.sku));
  const pendingAccess = state.roleRequests.filter(row => row.status === "Pending director approval");
  const overdueTasks = state.tasks.filter(row => row.status !== "Approved" && row.due < today);
  const departmentViews: T.ExecutiveSnapshot["departments"] = [
    { ...departments[0], metrics: [{ label: "Open invoices", value: unpaidInvoices.length }, { label: "Open supplier bills", value: unpaidBills.length }, { label: "Payments recorded", value: state.payments.length }, { label: "Unmatched statement lines", value: unmatchedStatementLines }], attentionCount: overdueInvoices.length + unmatchedStatementLines, attentionLabel: "Overdue invoices and unmatched statement lines", evidence: "Invoice balances and due dates; payment records and statement reconciliation status. No customer or supplier contacts are included." },
    { ...departments[1], metrics: [{ label: "Active employees", value: state.employees.filter(row => row.status === "Active").length }, { label: "Onboarding employees", value: state.employees.filter(row => row.status === "Onboarding").length }, { label: "Pending leave requests", value: pendingLeaveRequests }, { label: "Payroll preparations", value: state.payrollPreparations.length }], attentionCount: pendingLeaveRequests, attentionLabel: "Leave requests awaiting HR review", evidence: "Aggregated employee status, leave workflow and preparation-only payroll counts. Employee identities and salaries are excluded." },
    { ...departments[2], metrics: [{ label: "Open orders", value: state.orders.filter(row => !["Completed", "Cancelled"].includes(row.status)).length }, { label: "Completed orders", value: state.orders.filter(row => row.status === "Completed").length }, { label: "Pending purchase requests", value: pendingPurchaseRequests }, { label: "Open stock reviews", value: pendingCounts + pendingTransfers }], attentionCount: pendingPurchaseRequests + pendingCounts + pendingTransfers, attentionLabel: "Purchase, stock count and transfer reviews", evidence: "Order statuses and purchasing/stock approval registers; these counts do not authorize transactions." },
    { ...departments[3], metrics: [{ label: "Campaign drafts", value: state.campaigns.filter(row => row.status === "Draft").length }, { label: "Scheduled captures", value: state.campaigns.filter(row => row.status === "Scheduled capture").length }, { label: "Captured campaigns", value: state.campaigns.filter(row => row.status === "Captured").length }, { label: "Reviews awaiting moderation", value: state.reviews.filter(row => row.status === "Pending moderation").length }], attentionCount: state.reviews.filter(row => row.status === "Pending moderation").length, attentionLabel: "Reviews awaiting moderation", evidence: "Campaign and moderation statuses only. Capture is not email delivery; recipients and message bodies are excluded." },
    { ...departments[4], metrics: [{ label: "Active units", value: state.units.filter(row => row.status === "Active").length }, { label: "Proposed units", value: state.units.filter(row => row.status === "Setup").length }, { label: "Pending access reviews", value: pendingAccess.length }, { label: "Overdue operating tasks", value: overdueTasks.length }], attentionCount: pendingAccess.length + overdueTasks.length, attentionLabel: "Access reviews and overdue operating tasks", evidence: "Unit status, assigned access review queues and task due dates. Tasks use their existing independent completion review." },
  ];
  return {
    asOf,
    finance: { allTime: { receivables: reports.receivables, payables: reports.payables, cash: reports.cash, revenue: reports.revenue, taxLiability: reports.taxLiability, expenses: reports.expenses, customerPayments: reports.customerPayments, supplierPayments: reports.supplierPayments, credits: reports.credits, debits: reports.debits, journalCredits: reports.journalCredits, balanced: reports.balanced }, months,
      receivables: { outstanding: sum(unpaidInvoices.map(row => row.total - row.credited - row.paid)), overdue: sum(overdueInvoices.map(row => row.total - row.credited - row.paid)), overdueCount: overdueInvoices.length },
      payables: { outstanding: sum(unpaidBills.map(row => row.total - row.paid)), aged30Days: sum(agedBills.map(row => row.total - row.paid)), aged30DaysCount: agedBills.length, dueDateUnavailableCount: unpaidBills.length } },
    departments: departmentViews,
    inventory: { activeUnits: activeInventory.length, trackedSkus: state.products.length, lowStockCount: risks.filter(row => row.severity === "Low stock").length, outOfStockCount: risks.filter(row => row.severity === "Out of stock").length, risks },
    units: state.units.map(unit => {
      const orders = state.orders.filter(row => row.unitId === unit.id), tasks = state.tasks.filter(row => row.unitId === unit.id);
      return { id: unit.id, name: unit.name, kind: unit.kind, status: unit.status, orders: orders.length, openOrders: orders.filter(row => !["Completed", "Cancelled"].includes(row.status)).length, completedOrders: orders.filter(row => row.status === "Completed").length, orderValue: sum(orders.filter(row => row.status !== "Cancelled").map(row => row.total)), tasksOpen: tasks.filter(row => row.status === "Open").length, tasksSubmitted: tasks.filter(row => row.status === "Submitted").length, tasksApproved: tasks.filter(row => row.status === "Approved").length, tasksOverdue: tasks.filter(row => row.status !== "Approved" && row.due < today).length };
    }),
    decisions: state.executiveDecisions.map(decisionView),
    decisionCounts: { open: state.executiveDecisions.filter(openDecision).length, blocked: state.executiveDecisions.filter(row => row.status === "Blocked").length, completed: state.executiveDecisions.filter(row => row.status === "Completed").length, overdue: state.executiveDecisions.filter(row => openDecision(row) && row.dueDate < today).length },
    approvals: {
      roleRequests: pendingAccess.filter(row => row.approverRole === "ceo" && row.requestedBy !== user.id && row.userId !== user.id && state.users.some(account => account.id === row.userId) && state.units.some(unit => unit.id === row.unitId && unit.status === "Active")).map(row => ({ id: row.id, role: row.role, unitId: row.unitId, unitName: state.units.find(unit => unit.id === row.unitId)?.name ?? row.unitId, applicantId: row.userId, applicantName: state.users.find(account => account.id === row.userId)?.name ?? "Account awaiting review", reason: row.reason, createdAt: row.createdAt })),
      units: state.units.filter(row => row.status === "Setup" && row.kind !== "Headquarters" && row.createdBy !== user.id).map(row => ({ id: row.id, name: row.name, kind: row.kind, functions: [...row.functions], evidence: row.evidence })),
    },
    controls: { pendingCounts, pendingTransfers, pendingPurchaseRequests, pendingLeaveRequests, unmatchedStatementLines },
  };
}

/** The parent domain owns persistence, authorization, idempotency and the shared audit event. */
export function applyExecutiveAction(state: PortalState, user: T.SessionUser, action: string, data: Record<string, unknown>): T.ExecutiveDecision {
  ensure(user.role === "ceo", "Only an approved CEO may record management follow-up.", 403, "FORBIDDEN");
  const at = new Date().toISOString();
  if (action === "executive.decisionCreate") {
    ensure(Object.keys(data).every(key => ["title", "rationale", "department", "unitId", "dueDate", "priority", "idempotencyKey"].includes(key)), "Choose only the management follow-up fields.");
    ensure(state.executiveDecisions.length < 1000, "Archive reviewed decisions before adding more management records.", 409);
    ensure(departments.some(row => row.id === data.department), "Choose an accountable department.");
    ensure(data.priority === "Normal" || data.priority === "High" || data.priority === "Critical", "Choose Normal, High or Critical priority.");
    const unit = state.units.find(row => row.id === data.unitId);
    ensure(unit?.status === "Active", "Choose an active accountable operating unit.");
    const decision: T.ExecutiveDecision = { id: `DEC-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, title: textField(data.title, "Decision title", 180), rationale: textField(data.rationale, "Decision rationale", 1000), department: data.department as T.ExecutiveDepartment, unitId: unit.id, dueDate: dateField(data.dueDate, "Follow-up due date"), priority: data.priority, status: "Open", version: 1, createdAt: at, createdBy: user.id, updatedAt: at, progress: [] };
    state.executiveDecisions.unshift(decision);
    return decisionView(decision);
  }
  ensure(action === "executive.decisionProgress" || action === "executive.decisionClose", "Unknown executive action.");
  const allowed = action === "executive.decisionProgress" ? ["decisionId", "expectedVersion", "status", "note", "evidence", "idempotencyKey"] : ["decisionId", "expectedVersion", "outcome", "note", "evidence", "idempotencyKey"];
  ensure(Object.keys(data).every(key => allowed.includes(key)), "Choose only the management follow-up fields.");
  const decision = state.executiveDecisions.find(row => row.id === data.decisionId);
  ensure(decision, "Management follow-up was not found.", 404, "NOT_FOUND");
  ensure(decision.version === integer(data.expectedVersion, "Expected decision version", 1, 1_000_000), "This decision changed. Refresh before recording another update.", 409, "DECISION_CHANGED");
  ensure(openDecision(decision), "This management follow-up is already closed.", 409, "DECISION_CLOSED");
  ensure(action === "executive.decisionClose" || decision.progress.length < 100, "This decision has reached its update limit. Close it with an evidence reference.", 409);
  const note = textField(data.note, "Progress or closing note", 1000), evidence = textField(data.evidence, "Evidence reference", 500, true);
  let status: T.ExecutiveDecisionStatus;
  if (action === "executive.decisionProgress") {
    ensure(data.status === "In progress" || data.status === "Blocked", "Choose In progress or Blocked.");
    status = data.status;
  } else {
    ensure(data.outcome === "Completed" || data.outcome === "Cancelled", "Choose Completed or Cancelled.");
    ensure(data.outcome !== "Completed" || evidence.length > 0, "A completion evidence reference is required.");
    status = data.outcome;
    decision.closedAt = at; decision.closedBy = user.id;
  }
  decision.progress.push({ id: `UPD-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, at, actorId: user.id, note, evidence, status });
  decision.status = status; decision.version++; decision.updatedAt = at;
  return decisionView(decision);
}
