import type * as T from "../portal-types";

export type PortalState = {
  revision: number; users: T.SessionUser[]; profiles: T.CustomerProfile[]; products: T.Product[]; carts: T.CartLine[]; orders: T.Order[]; invoices: T.Invoice[]; suppliers: T.Supplier[]; bills: T.Bill[]; payments: T.Payment[]; receipts: T.Receipt[]; expenses: T.Expense[]; creditNotes: T.CreditNote[]; journals: T.JournalEntry[]; statementLines: T.StatementLine[]; employees: T.Employee[]; leaveRequests: T.LeaveRequest[]; attendance: T.AttendanceEntry[]; payrollPreparations: T.PayrollPreparation[]; purchaseRequests: T.PurchaseRequest[]; purchaseOrders: T.PurchaseOrder[]; goodsReceipts: T.GoodsReceipt[]; stockMovements: T.StockMovement[]; units: T.Unit[]; tasks: T.Task[]; roleRequests: T.RoleRequest[]; notifications: T.Notification[]; campaigns: T.Campaign[]; capturedMessages: T.CapturedMessage[]; audit: T.AuditEvent[]; enquiries: T.Enquiry[]; reviews: T.Review[]; supportRequests: T.SupportRequest[];
  idempotency: { key: string; userId: string; action: string; result: unknown }[]; rateLimits: { key: string; at: string }[]; stockByUnit: Record<string, number>; revokedBefore: Record<string, string>;
};

export function initialState(): PortalState {
  const definitions = [
    ["demo-fertiliser", "Compound fertiliser", "Fertiliser", "50 kg", 98500, 184, 60, "fertiliser"],
    ["demo-urea", "Nitrogen fertiliser", "Fertiliser", "50 kg", 102000, 76, 80, "urea"],
    ["demo-maize", "Maize seed", "Seed", "10 kg", 68500, 142, 50, "maize"],
    ["demo-groundnut", "Groundnut seed", "Seed", "20 kg", 74000, 61, 70, "groundnuts"],
    ["demo-crop-care", "Crop protection product", "Crop care", "5 L", 42500, 95, 30, "crop-care"],
    ["demo-sprayer", "Knapsack sprayer", "Equipment", "16 L", 89500, 27, 35, "sprayer"],
  ] as const;
  const notes: Record<string, string> = { fertiliser: "Representative 50 kg DAP fertiliser bags; supplied brand and formulation require confirmation.", urea: "Representative prilled urea bag; supplied brand and packaging require confirmation.", maize: "Maize grain sacks; not certified seed packaging.", groundnuts: "Shelled groundnuts; seed grade and variety are unverified.", "crop-care": "Representative 5 L herbicide container; supplied brand, formulation and registration require confirmation.", sprayer: "Representative 16 L sprayer; Fatima brand and model are unconfirmed.", placeholder: "Product photograph awaiting verification; no packaging representation." };
  const products = definitions.map(([id, name, category, pack, price, stock, reorderLevel, photo]) => ({ id, name, category, pack, price, stock, reorderLevel, image: `/images/products/${photo}.jpg`, imageAlt: notes[photo], imageNote: notes[photo], description: `${pack} sample listing for ${name.toLowerCase()}. Brand, suitability, availability and final price require confirmation. Prices and stock in this presentation are demonstration data.`, taxCode: "REVIEW_REQUIRED", taxRate: 0 }));
  const stockByUnit = Object.fromEntries(products.map((p) => [`BR-DEMO-01:${p.id}`, p.stock]));
  return { revision: 0, users: [], profiles: [], products, stockByUnit, carts: [], orders: [], invoices: [], suppliers: [], bills: [], payments: [], receipts: [], expenses: [], creditNotes: [], journals: [], statementLines: [], employees: [], leaveRequests: [], attendance: [], payrollPreparations: [], purchaseRequests: [], purchaseOrders: [], goodsReceipts: [], stockMovements: [], units: [
    { id: "HQ", name: "Fatima Agro Head Office", kind: "Headquarters", status: "Active", functions: ["Management", "Finance", "HR", "Procurement", "Security"], evidence: "Presentation headquarters model — operational assignments pending confirmation", createdBy: "system" },
    { id: "BR-DEMO-01", name: "Demonstration branch", kind: "Branch", status: "Active", functions: ["Sales", "Inventory", "Procurement requests", "Tasks", "MRA source evidence"], evidence: "Synthetic branch for presentation only", createdBy: "system" },
  ], tasks: [], roleRequests: [], notifications: [], campaigns: [], capturedMessages: [], audit: [], enquiries: [], reviews: [], supportRequests: [], idempotency: [], rateLimits: [], revokedBefore: {} };
}

export const localPersonas: Record<string, T.SessionUser> = {
  sales: { id: "local-sales", name: "Sample Sales Officer", email: "sales@example.test", role: "sales", unitId: "BR-DEMO-01", localDemo: true },
  "operations-reviewer": { id: "local-operations-reviewer", name: "Sample Independent Operations Reviewer", email: "operations-reviewer@example.test", role: "operations-director", unitId: "HQ", localDemo: true },
  "customer-a": { id: "local-customer-a", name: "Sample Customer A", email: "customer-a@example.test", role: "customer", unitId: "BR-DEMO-01", localDemo: true },
  "customer-b": { id: "local-customer-b", name: "Sample Customer B", email: "customer-b@example.test", role: "customer", unitId: "BR-DEMO-01", localDemo: true },
  finance: { id: "local-finance", name: "Sample Finance Officer", email: "finance@example.test", role: "finance", unitId: "HQ", localDemo: true },
  "finance-director": { id: "local-finance-director", name: "Sample Finance Reviewer", email: "finance-reviewer@example.test", role: "finance-director", unitId: "HQ", localDemo: true },
  hr: { id: "local-hr", name: "Sample HR Officer", email: "hr@example.test", role: "hr", unitId: "HQ", localDemo: true },
  "hr-director": { id: "local-hr-director", name: "Sample HR Reviewer", email: "hr-reviewer@example.test", role: "hr-director", unitId: "HQ", localDemo: true },
  procurement: { id: "local-procurement", name: "Sample Procurement Officer", email: "procurement@example.test", role: "procurement", unitId: "HQ", localDemo: true },
  storekeeper: { id: "local-storekeeper", name: "Sample Storekeeper", email: "storekeeper@example.test", role: "storekeeper", unitId: "BR-DEMO-01", localDemo: true },
  "operations-director": { id: "local-operations", name: "Sample Operations Reviewer", email: "operations@example.test", role: "operations-director", unitId: "HQ", localDemo: true },
  "branch-manager": { id: "local-branch-manager", name: "Sample Branch Manager", email: "branch-manager@example.test", role: "branch-manager", unitId: "BR-DEMO-01", localDemo: true },
  administrator: { id: "local-administrator", name: "Sample System Administrator", email: "administrator@example.test", role: "administrator", unitId: "HQ", localDemo: true },
  communications: { id: "local-communications", name: "Sample Communications Officer", email: "communications@example.test", role: "communications", unitId: "HQ", localDemo: true },
  ceo: { id: "local-ceo", name: "Sample Executive Approver", email: "executive@example.test", role: "ceo", unitId: "HQ", localDemo: true },
};
