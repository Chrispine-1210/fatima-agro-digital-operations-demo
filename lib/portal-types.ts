/** Shared browser/server contract. Every business transaction in this release is a simulation. */
export type PortalRole = "customer" | "sales" | "storekeeper" | "procurement" | "finance" | "finance-director" | "hr" | "hr-director" | "operations-director" | "branch-manager" | "administrator" | "communications" | "ceo";
export type ModuleId = "public" | "customer" | "finance" | "hr" | "procurement" | "admin" | "communications" | "notifications" | "executive";
export type SessionUser = { id: string; name: string; email: string; role: PortalRole; unitId: string; localDemo?: boolean; managedAccount?: boolean };
export type SessionResponse = { user: SessionUser | null; localDemo: boolean; signInUrl: string; signOutUrl: string; mode: "captured demonstration"; registrationRequired?: boolean; authMode?: "fatima" };
export type Product = { id: string; sku: string; barcode: string; barcodeKind: "Internal Code 128"; name: string; category: string; pack: string; description: string; price: number; stock: number; reorderLevel: number; image: string; imageAlt: string; imageNote: string; taxCode: string; taxRate: number };
/** Internal planning and tax-reference fields are absent from customer catalogue responses. */
export type CatalogProduct = Omit<Product, "reorderLevel" | "taxCode" | "sku" | "barcode" | "barcodeKind"> & Partial<Pick<Product, "reorderLevel" | "taxCode" | "sku" | "barcode" | "barcodeKind">>;
/** Amounts are integer Malawi kwacha (0 fractional digits), validated as safe integers. */
export type CustomerProfile = { id: string; name: string; email: string; phone: string; address: string; marketingConsent: boolean; unsubscribed: boolean; createdAt: string };
export type CartLine = { customerId: string; productId: string; quantity: number };
export type OrderLine = { productId: string; name: string; quantity: number; unitPrice: number; taxRate: number; subtotal: number; tax: number; total: number };
export type OrderEvent = { at: string; status: string; note: string; actorId: string };
export type Order = { id: string; customerId: string; unitId: string; lines: OrderLine[]; subtotal: number; tax: number; deliveryFee: number; total: number; fulfilment: "pickup" | "delivery"; deliveryAddress: string; contact: string; status: "Awaiting confirmation" | "Confirmed" | "Ready for collection" | "Dispatched" | "Completed" | "Cancelled"; createdAt: string; events: OrderEvent[]; invoiceId: string; notes?: string };
export type Invoice = { id: string; customerId: string; orderId: string; unitId: string; total: number; tax: number; credited: number; paid: number; status: "Unpaid" | "Part paid" | "Paid" | "Credited"; createdAt: string; dueDate: string; note: string };
export type Supplier = { id: string; name: string; email: string; contact: string; status: "Demo"; createdAt: string };
export type Bill = { id: string; supplierId: string; purchaseOrderId: string; goodsReceiptId: string; unitId: string; total: number; paid: number; status: "Unpaid" | "Part paid" | "Paid"; createdAt: string; note: string };
export type Payment = { id: string; kind: "customer" | "supplier"; referenceId: string; amount: number; method: string; evidence: string; createdAt: string; actorId: string; reconciled: boolean };
export type Receipt = { id: string; paymentId: string; invoiceId: string; customerId: string; amount: number; createdAt: string };
export type Expense = { id: string; category: string; description: string; amount: number; evidence: string; createdAt: string; actorId: string; unitId: string };
export type CreditNote = { id: string; invoiceId: string; amount: number; reason: string; createdAt: string; actorId: string };
export type JournalLine = { account: string; debit: number; credit: number };
export type JournalEntry = { id: string; reference: string; description: string; at: string; lines: JournalLine[] };
export type StatementLine = { id: string; reference: string; amount: number; direction: "in" | "out"; date: string; paymentId: string; status: "Unmatched" | "Matched"; matchedBy?: string; matchedAt?: string };
export type Employee = { id: string; name: string; roleTitle: string; unitId: string; workEmail: string; startDate: string; status: "Onboarding" | "Active"; salary: number; onboarding: string[]; createdAt: string };
export type LeaveRequest = { id: string; employeeId: string; from: string; to: string; reason: string; status: "Pending" | "Approved" | "Declined"; requestedBy: string; approvedBy?: string; createdAt: string };
export type AttendanceEntry = { id: string; employeeId: string; date: string; status: "Present" | "Absent" | "Leave"; recordedBy: string };
export type PayrollPreparation = { id: string; period: string; employeeIds: string[]; gross: number; deductions: number; net: number; status: "Prepared only"; createdAt: string; actorId: string; note: string };
export type PurchaseRequest = { id: string; productId: string; quantity: number; unitId: string; neededBy: string; evidence: string; requestedBy: string; status: "Pending" | "Approved" | "Declined" | "Ordered"; approvedBy?: string; createdAt: string };
export type PurchaseOrder = { id: string; requestId: string; supplierId: string; productId: string; quantity: number; received: number; unitPrice: number; unitId: string; status: "Issued in demonstration" | "Part received" | "Received"; createdAt: string; issuedBy: string };
export type GoodsReceipt = { id: string; purchaseOrderId: string; productId: string; quantity: number; evidence: string; unitId: string; createdAt: string; receivedBy: string; billId: string };
export type StockMovement = { id: string; productId: string; quantity: number; reason: string; reference: string; unitId: string; at: string; actorId: string };
export type Unit = { id: string; name: string; kind: "Headquarters" | "Branch" | "Depot"; status: "Setup" | "Active"; functions: string[]; evidence: string; createdBy: string; address?: string; town?: string; country?: string; latitude?: number; longitude?: number; locationNote?: string; locationUpdatedAt?: string; locationUpdatedBy?: string };
export type StockBalance = { unitId: string; productId: string; quantity: number };
export type StockAdjustment = { id: string; productId: string; unitId: string; expectedQuantity: number; countedQuantity: number; quantityChange: number; reason: string; evidence: string; status: "Pending" | "Approved" | "Declined"; requestedBy: string; createdAt: string; decidedBy?: string; decidedAt?: string };
export type StockTransfer = { id: string; productId: string; fromUnitId: string; toUnitId: string; quantity: number; reason: string; evidence: string; status: "Pending" | "Approved" | "Declined"; requestedBy: string; createdAt: string; decidedBy?: string; decidedAt?: string };
/** The image stays on the device. Only a bounded fingerprint and reviewed reference are saved. */
export type ReceiptCapture = { id: string; targetType: "receipt" | "goods-receipt" | "expense"; targetId: string; unitId: string; source: "camera" | "file" | "manual"; fileName: string; mimeType: string; byteLength: number; sha256: string; reference: string; note: string; createdAt: string; capturedBy: string; storage: "Metadata only" };
export type ReceiptDocument = { receipt: Receipt; invoice: Invoice; payment: Pick<Payment, "id" | "method" | "amount" | "createdAt">; customer: { name: string; email: string }; order?: Order; unit: Pick<Unit, "id" | "name" | "address" | "town" | "country"> };
export type Task = { id: string; unitId: string; title: string; owner: string; due: string; evidence: string; status: "Open" | "Submitted" | "Approved"; createdBy: string; submittedBy?: string; approvedBy?: string };
export type RoleRequest = { id: string; userId: string; email: string; role: PortalRole; unitId: string; reason: string; requestedBy: string; status: "Pending director approval" | "Approved" | "Declined" | "Applied"; approverRole: PortalRole; decidedBy?: string; appliedBy?: string; appliedAt?: string; createdAt: string };
export type Notification = { id: string; userId: string; role?: PortalRole; unitId?: string; title: string; body: string; event: string; createdAt: string; readBy: string[] };
export type Campaign = { id: string; name: string; audience: "consented-customers" | "test-recipients"; template: string; subject: string; body: string; scheduledAt: string; status: "Draft" | "Scheduled capture" | "Captured"; recipientCount: number; createdBy: string; createdAt: string; capturedAt?: string };
export type CapturedMessage = { id: string; userId: string; to: string; subject: string; body: string; kind: "transactional" | "campaign"; campaignId: string; status: "Captured — not sent"; createdAt: string; unsubscribeToken: string };
export type AuditEvent = { id: string; at: string; actorId: string; actorRole: string; action: string; target: string; unitId: string; outcome: string };
export type Enquiry = { id: string; customerId: string; unitId: string; name: string; email: string; phone: string; subject: string; productId: string; quantity: number; message: string; status: "Received" | "Responded"; response?: string; respondedBy?: string; createdAt: string };
export type Review = { id: string; customerId: string; name: string; orderId: string; rating: number; text: string; publicationConsent: boolean; status: "Pending moderation" | "Published" | "Declined"; createdAt: string };
export type SupportRequest = { id: string; customerId: string; unitId: string; subject: string; message: string; status: "Open" | "Answered"; response?: string; respondedBy?: string; createdAt: string };
export type FinanceReports = { receivables: number; payables: number; cash: number; revenue: number; taxLiability: number; expenses: number; customerPayments: number; supplierPayments: number; credits: number; debits: number; journalCredits: number; balanced: boolean };
export type ExecutiveDepartment = "finance" | "hr" | "operations" | "communications" | "administration";
export type ExecutiveDecisionStatus = "Open" | "In progress" | "Blocked" | "Completed" | "Cancelled";
/** CEO-recorded follow-up. This record never authorizes finance, HR, stock or access transactions. */
export type ExecutiveDecision = {
  id: string; title: string; rationale: string; department: ExecutiveDepartment; unitId: string; dueDate: string;
  priority: "Normal" | "High" | "Critical"; status: ExecutiveDecisionStatus; version: number;
  createdAt: string; createdBy: string; updatedAt: string; closedAt?: string; closedBy?: string;
  progress: { id: string; at: string; actorId: string; note: string; evidence: string; status: ExecutiveDecisionStatus }[];
};
export type ExecutiveSnapshot = {
  asOf: string;
  finance: {
    allTime: FinanceReports;
    months: { month: string; revenue: number; expenses: number; customerReceipts: number; supplierPayments: number; netCashMovement: number }[];
    receivables: { outstanding: number; overdue: number; overdueCount: number };
    /** Bills currently have no contractual due date. Aging is not an overdue assertion. */
    payables: { outstanding: number; aged30Days: number; aged30DaysCount: number; dueDateUnavailableCount: number };
  };
  departments: { id: ExecutiveDepartment; name: string; metrics: { label: string; value: number }[]; attentionCount: number; attentionLabel: string; evidence: string }[];
  inventory: { activeUnits: number; trackedSkus: number; lowStockCount: number; outOfStockCount: number; risks: { unitId: string; unitName: string; productId: string; sku: string; name: string; available: number; reorderLevel: number; severity: "Out of stock" | "Low stock" }[] };
  units: { id: string; name: string; kind: Unit["kind"]; status: Unit["status"]; orders: number; openOrders: number; completedOrders: number; orderValue: number; tasksOpen: number; tasksSubmitted: number; tasksApproved: number; tasksOverdue: number }[];
  decisions: ExecutiveDecision[];
  decisionCounts: { open: number; blocked: number; completed: number; overdue: number };
  approvals: {
    roleRequests: { id: string; role: PortalRole; unitId: string; unitName: string; applicantId: string; applicantName: string; reason: string; createdAt: string }[];
    units: { id: string; name: string; kind: Unit["kind"]; functions: string[]; evidence: string }[];
  };
  controls: { pendingCounts: number; pendingTransfers: number; pendingPurchaseRequests: number; pendingLeaveRequests: number; unmatchedStatementLines: number };
};
export type PortalSnapshot = {
  executive?: ExecutiveSnapshot;
  module: ModuleId; mode: "captured demonstration"; revision: number; products?: CatalogProduct[]; profile?: CustomerProfile | null; profiles?: CustomerProfile[]; cart?: CartLine[]; orders?: Order[]; invoices?: Invoice[]; bills?: Bill[]; payments?: Payment[]; receipts?: Receipt[]; expenses?: Expense[]; creditNotes?: CreditNote[]; journals?: JournalEntry[]; statementLines?: StatementLine[]; reports?: FinanceReports;
  suppliers?: Supplier[]; purchaseRequests?: PurchaseRequest[]; purchaseOrders?: PurchaseOrder[]; goodsReceipts?: GoodsReceipt[]; stockMovements?: StockMovement[]; stockBalances?: StockBalance[]; stockAdjustments?: StockAdjustment[]; stockTransfers?: StockTransfer[]; transferDestinations?: Pick<Unit, "id" | "name" | "kind">[]; receiptCaptures?: ReceiptCapture[]; receiptDocuments?: ReceiptDocument[]; employees?: Employee[]; leaveRequests?: LeaveRequest[]; attendance?: AttendanceEntry[]; payrollPreparations?: PayrollPreparation[]; units?: Unit[]; tasks?: Task[]; roleRequests?: RoleRequest[]; users?: SessionUser[]; notifications?: Notification[]; campaigns?: Campaign[]; capturedMessages?: CapturedMessage[]; audit?: AuditEvent[]; capabilities?: string[]; enquiries?: Enquiry[]; reviews?: Review[]; supportRequests?: SupportRequest[]; featureStatus?: { feature: string; status: string; detail: string }[];
};
export type ActionRequest = { action: string; data?: Record<string, unknown> };
export type ActionResponse = { message: string; result: unknown; revision: number };
/** Public actions: customer.register, customer.updateProfile, customer.consent, cart.set, checkout,
 * order.status, finance.invoice, finance.bill, finance.payment, finance.expense, finance.credit,
 * finance.statement, finance.reconcile, procurement.supplier, procurement.request,
 * procurement.approve, procurement.order, procurement.receive, hr.employee, hr.onboarding,
 * hr.leave, hr.leaveDecision, hr.attendance, hr.payroll, admin.unit, admin.activateUnit,
 * admin.task, admin.taskEvidence, admin.taskApprove, admin.roleRequest, admin.roleDecision,
 * admin.applyRole, admin.reset, notification.read, campaign.preview, campaign.create,
 * campaign.capture, campaign.processDue, communication.unsubscribe.
 * Exact payload fields follow entity names; action validation is authoritative on server. */
