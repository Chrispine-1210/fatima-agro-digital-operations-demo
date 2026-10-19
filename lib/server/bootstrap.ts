import type { PortalRole, SessionUser } from "../portal-types";
import type { PortalState } from "./seed";
import { ensure } from "./errors";

export type BootstrapConfiguration = {
  HQ_ADMIN_EMAILS?: string;
  FATIMA_BOOTSTRAP_CEO_EMAILS?: string;
  FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS?: string;
};

/** Only server configuration and the identity proxy's verified email may seed initial authority. */
export function hostedBootstrapRole(email: string, config: BootstrapConfiguration): PortalRole {
  const assignments: [PortalRole, string | undefined][] = [
    ["administrator", config.HQ_ADMIN_EMAILS],
    ["ceo", config.FATIMA_BOOTSTRAP_CEO_EMAILS],
    ["operations-director", config.FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS],
  ];
  const normalized = email.trim().toLowerCase();
  const matches = assignments.filter(([, addresses]) => (addresses ?? "").split(",").some((address) => address.trim().toLowerCase() === normalized && normalized !== ""));
  ensure(matches.length <= 1, "Initial access configuration assigns conflicting roles. Ask the operator to review the server allowlists.", 503, "BOOTSTRAP_CONFIGURATION");
  return matches[0]?.[0] ?? "customer";
}

/** A persisted audit marker consumes a bootstrap grant, so later approved demotions remain effective. */
export function registerIdentity(state: PortalState, identity: SessionUser): { state: PortalState; result: SessionUser } {
  const existing = state.users.find((user) => user.id === identity.id);
  const bootstrap = !identity.localDemo && identity.role !== "customer" && !state.audit.some((event) => event.action === "account.bootstrap" && event.target === identity.id);
  if (existing && !bootstrap) return { state, result: { ...existing, localDemo: identity.localDemo } };
  const updated = structuredClone(state);
  const user = existing ? { ...existing, ...(bootstrap ? { role: identity.role, unitId: "HQ" } : {}), localDemo: identity.localDemo } : identity;
  if (existing) updated.users[updated.users.findIndex((item) => item.id === identity.id)] = user;
  else updated.users.push(user);
  updated.audit.unshift({ id: `AUTH-${crypto.randomUUID().slice(0, 8)}`, at: new Date().toISOString(), actorId: identity.id, actorRole: user.role, action: bootstrap ? "account.bootstrap" : "account.identity", target: identity.id, unitId: user.unitId, outcome: bootstrap ? "Initial role assigned once from explicit server allowlist and verified Sites identity" : identity.localDemo ? "Local synthetic persona registered" : "Verified Sites identity registered" });
  return { state: updated, result: user };
}
