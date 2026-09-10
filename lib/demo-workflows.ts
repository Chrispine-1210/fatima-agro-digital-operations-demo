export type DemoRole = "customer" | "seller" | "storekeeper" | "editor" | "finance" | "supervisor" | "manager" | "administrator" | "agent";
export type ShiftStage = "open" | "sale" | "submitted" | "approved" | "deposited" | "reconciled";
export type ShiftAction = "record-sale" | "submit-count" | "approve-close" | "create-deposit" | "reconcile";

const allowedTransitions: Record<ShiftAction, { from: ShiftStage; to: ShiftStage; roles: DemoRole[] }> = {
  "record-sale": { from: "open", to: "sale", roles: ["seller"] },
  "submit-count": { from: "sale", to: "submitted", roles: ["seller"] },
  "approve-close": { from: "submitted", to: "approved", roles: ["supervisor", "manager", "administrator"] },
  "create-deposit": { from: "approved", to: "deposited", roles: ["finance", "manager", "administrator"] },
  reconcile: { from: "deposited", to: "reconciled", roles: ["finance", "manager", "administrator"] },
};

export function canAdvanceShift(stage: ShiftStage, action: ShiftAction, role: DemoRole) {
  const transition = allowedTransitions[action];
  return transition.from === stage && transition.roles.includes(role);
}

export function advanceShift(stage: ShiftStage, action: ShiftAction, role: DemoRole): ShiftStage {
  if (!canAdvanceShift(stage, action, role)) return stage;
  return allowedTransitions[action].to;
}

export function syntheticReference(prefix: "ENQ" | "QUOTE" | "ORDER" | "RCPT", sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("Synthetic sequence must be a positive integer");
  return `${prefix}-DEMO-${String(sequence).padStart(4, "0")}`;
}
