import type { ExecutiveDecision, ExecutiveSnapshot } from "./portal-types";

export type DecisionFilters = { search: string; status: string; department: string; unitId: string; priority: string; due: "all" | "overdue" | "week" | "attention"; sort: "priority" | "recent" };
export const defaultDecisionFilters: DecisionFilters = { search: "", status: "all", department: "", unitId: "", priority: "", due: "all", sort: "priority" };
export function malawiDay(asOf: string) { return new Date(Date.parse(asOf) + 2 * 60 * 60 * 1000).toISOString().slice(0, 10); }
const active = (decision: ExecutiveDecision) => !["Completed", "Cancelled"].includes(decision.status);
const priority: Record<string, number> = { Critical: 0, High: 1, Normal: 2 };
const departmentLabels: Record<string, string> = { finance: "Finance", hr: "People and HR", operations: "Operations", communications: "Communications", administration: "Administration" };
export function filterExecutiveDecisions(decisions: ExecutiveDecision[], filters: DecisionFilters, asOf: string) {
  const today = malawiDay(asOf), week = new Date(Date.parse(`${today}T12:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
  const terms = filters.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return decisions.filter(item => {
    const search = `${item.id} ${item.title} ${item.department} ${departmentLabels[item.department]} ${item.rationale}`.toLocaleLowerCase();
    return terms.every(term => search.includes(term)) && (filters.status === "all" || (filters.status === "active" ? active(item) : item.status === filters.status)) && (!filters.department || item.department === filters.department) && (!filters.unitId || item.unitId === filters.unitId) && (!filters.priority || item.priority === filters.priority) && (filters.due === "all" || active(item) && (filters.due === "attention" ? item.status === "Blocked" || item.dueDate < today : filters.due === "overdue" ? item.dueDate < today : item.dueDate >= today && item.dueDate <= week));
  }).sort((a, b) => filters.sort === "recent" ? b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id) : Number(!active(a)) - Number(!active(b)) || priority[a.priority] - priority[b.priority] || a.dueDate.localeCompare(b.dueDate) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
}

export type ExecutivePriority = { id: string; title: string; count: number; detail: string; href: string; tone: "urgent" | "review"; decisionFilter?: Partial<DecisionFilters> };
/** Derived solely from the existing aggregate CEO projection; no additional private data is fetched. */
export function executivePriorities(executive: ExecutiveSnapshot): ExecutivePriority[] {
  const today = malawiDay(executive.asOf);
  const needingProgress = executive.decisions.filter(item => active(item) && (item.status === "Blocked" || item.dueDate < today));
  const reviews = executive.controls.pendingCounts + executive.controls.pendingTransfers + executive.controls.pendingPurchaseRequests + executive.controls.pendingLeaveRequests;
  const rows: ExecutivePriority[] = [
    { id: "stock", title: "Out-of-stock lines", count: executive.inventory.outOfStockCount, detail: "Review the affected unit and SKU, then prepare a management follow-up.", href: "#ex-inventory", tone: "urgent" },
    { id: "receivables", title: "Overdue customer invoices", count: executive.finance.receivables.overdueCount, detail: "Recorded outstanding invoices past their due date. Review with Finance.", href: "#ex-finance", tone: "urgent" },
    { id: "follow-up", title: "Decisions needing progress", count: needingProgress.length, detail: "Open decisions that are blocked or overdue; each decision is counted once.", href: "#ex-decisions", tone: "urgent", decisionFilter: { status: "active", due: "attention", sort: "priority" } },
    { id: "approvals", title: "Executive approvals", count: executive.approvals.units.length + executive.approvals.roleRequests.length, detail: "Independently proposed records eligible for your review.", href: "#ex-approvals", tone: "review" },
    { id: "reviews", title: "Department review queues", count: reviews, detail: "Stock counts, transfers, purchase requests and leave. Approvals stay with assigned reviewers.", href: "#ex-departments", tone: "review" },
    { id: "tasks", title: "Overdue operating tasks", count: executive.units.reduce((total, unit) => total + unit.tasksOverdue, 0), detail: "Open or submitted tasks past the recorded due date, across operating units.", href: "#ex-units", tone: "review" },
  ];
  return rows.filter(item => item.count > 0);
}
