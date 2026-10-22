import type { ModuleId, PortalRole, SessionUser } from "../portal-types";

const moduleRoles: Record<ModuleId, PortalRole[]> = {
  public: [], customer: ["customer"], finance: ["finance", "finance-director"], hr: ["hr", "hr-director"],
  procurement: ["procurement", "storekeeper", "operations-director", "branch-manager", "finance-director", "sales"],
  admin: ["administrator", "operations-director", "branch-manager", "ceo", "finance-director", "hr-director"],
  communications: ["communications", "operations-director"], notifications: [], executive: ["ceo"],
};
export function canAccessModule(user: SessionUser | null, module: ModuleId) {
  if (module === "public") return true;
  if (!user) return false;
  if (module === "notifications") return true;
  return moduleRoles[module]?.includes(user.role) ?? false;
}
const grants: Record<string, PortalRole[]> = {
  "executive.decisionCreate": ["ceo"], "executive.decisionProgress": ["ceo"], "executive.decisionClose": ["ceo"],
  "customer.register": ["customer"], "customer.updateProfile": ["customer"], "customer.consent": ["customer"], "cart.set": ["customer"], checkout: ["customer"],
  "review.create": ["customer"], "review.moderate": ["communications", "operations-director"], "support.create": ["customer"],
  "order.status": ["sales", "operations-director", "branch-manager"],
  "enquiry.respond": ["sales", "operations-director", "branch-manager"], "support.respond": ["sales", "operations-director", "branch-manager"],
  "finance.invoice": ["finance", "finance-director"], "finance.bill": ["finance", "finance-director"], "finance.payment": ["finance", "finance-director"],
  "finance.expense": ["finance", "finance-director"], "finance.credit": ["finance-director"], "finance.statement": ["finance", "finance-director"], "finance.reconcile": ["finance-director"],
  "finance.taxConfig": ["finance-director"],
  "procurement.supplier": ["procurement", "operations-director"], "procurement.request": ["procurement", "storekeeper", "branch-manager"],
  "procurement.approve": ["operations-director", "finance-director"], "procurement.order": ["procurement", "operations-director"], "procurement.receive": ["storekeeper", "procurement"],
  "inventory.identify": ["procurement", "operations-director"],
  "inventory.adjustmentRequest": ["storekeeper", "branch-manager", "procurement", "operations-director"],
  "inventory.adjustmentDecision": ["operations-director"],
  "inventory.transferRequest": ["storekeeper", "branch-manager", "procurement", "operations-director"],
  "inventory.transferDecision": ["operations-director"],
  "admin.unitLocation": ["operations-director", "branch-manager", "ceo"],
  "finance.receiptCapture": ["finance", "finance-director", "procurement", "storekeeper"],
  "hr.employee": ["hr", "hr-director"], "hr.onboarding": ["hr", "hr-director"], "hr.leave": ["hr", "hr-director"], "hr.leaveDecision": ["hr-director"], "hr.attendance": ["hr", "hr-director"], "hr.payroll": ["hr", "hr-director"],
  "admin.unit": ["operations-director", "ceo"], "admin.activateUnit": ["ceo"], "admin.task": ["operations-director", "branch-manager"], "admin.taskEvidence": ["operations-director", "branch-manager"], "admin.taskApprove": ["operations-director", "branch-manager"],
  "admin.roleRequest": ["administrator", "operations-director", "branch-manager", "ceo"], "admin.roleDecision": ["ceo", "operations-director", "finance-director", "hr-director"], "admin.applyRole": ["administrator"], "admin.reset": ["administrator"],
  "campaign.preview": ["communications", "operations-director"], "campaign.create": ["communications", "operations-director"], "campaign.capture": ["communications", "operations-director"], "campaign.processDue": ["communications", "operations-director"],
  "notification.read": ["customer", "sales", "storekeeper", "procurement", "finance", "finance-director", "hr", "hr-director", "operations-director", "branch-manager", "administrator", "communications", "ceo"],
  "communication.unsubscribe": ["communications", "operations-director"],
};
export const allRoles = Object.values(moduleRoles).flat().filter((x, i, xs) => xs.indexOf(x) === i).concat("sales");
export function capabilities(user: SessionUser | null) { return Object.entries(grants).filter(([, roles]) => user && roles.includes(user.role)).map(([action]) => action); }
export function canPerform(user: SessionUser | null, action: string) { return action === "enquiry.create" || action === "communication.unsubscribe" || capabilities(user).includes(action); }
export function scopedUnit(user: SessionUser) { return ["branch-manager", "storekeeper", "sales"].includes(user.role) ? user.unitId : null; }
