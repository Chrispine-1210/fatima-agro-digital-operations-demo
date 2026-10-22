import type { PortalRole, SessionUser } from "../portal-types";
import { bindings, databaseBinding, mutateState, readState } from "./store";
import { ensure, PortalError } from "./errors";
import { normalizeUsername, validUsername, validPasswordHash, validSession, privateDigest, hashSessionToken, randomToken, verifyPassword, SESSION_LIFETIME, type ManagedCredential, type ManagedSession, type PasswordHash } from "./password-crypto";

type AuthState = { revision: number; credentials: ManagedCredential[]; sessions: ManagedSession[]; attempts: { key: string; at: number }[]; processed: string[] };
type ProvisionOperation = { id: string; directive: string; operation: "create" | "rotate" | "disable" | "assign"; accountId: string; username: string; name?: string; role?: PortalRole; unitId?: string; password?: PasswordHash };
const roles: PortalRole[] = ["customer", "sales", "storekeeper", "procurement", "finance", "finance-director", "hr", "hr-director", "operations-director", "branch-manager", "administrator", "communications", "ceo"];
const schemas = new WeakMap<object, Promise<void>>();
async function schema() {
  const db = databaseBinding();
  if (!schemas.has(db)) schemas.set(db, db.prepare("CREATE TABLE IF NOT EXISTS fatima_auth_state (id TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL)").run().then(() => undefined).catch(cause => { schemas.delete(db); throw cause; }));
  await schemas.get(db); return db;
}
async function readAuth(): Promise<AuthState> {
  const db = await schema();
  let row = await db.prepare("SELECT revision, payload FROM fatima_auth_state WHERE id = ?").bind("fatima-password-v1").first<{ revision: number; payload: string }>();
  if (!row) {
    const empty: AuthState = { revision: 0, credentials: [], sessions: [], attempts: [], processed: [] };
    await db.prepare("INSERT OR IGNORE INTO fatima_auth_state (id, revision, payload, updated_at) VALUES (?, ?, ?, ?)").bind("fatima-password-v1", 0, JSON.stringify(empty), new Date().toISOString()).run();
    row = await db.prepare("SELECT revision, payload FROM fatima_auth_state WHERE id = ?").bind("fatima-password-v1").first<{ revision: number; payload: string }>();
  }
  ensure(row, "Account storage is temporarily unavailable.", 503, "AUTH_STORAGE");
  const value = JSON.parse(row.payload) as AuthState;
  ensure(value && [value.credentials, value.sessions, value.attempts, value.processed].every(Array.isArray), "Account storage requires developer review.", 503, "AUTH_STORAGE");
  value.revision = row.revision; return value;
}
async function changeAuth<R>(change: (state: AuthState) => R): Promise<R> {
  const db = await schema();
  for (let retry = 0; retry < 8; retry++) {
    const state = await readAuth(), previous = state.revision;
    const now = Date.now();
    state.sessions = state.sessions.filter(row => Date.parse(row.expiresAt) > now);
    state.attempts = state.attempts.filter(row => row.at > now - 15 * 60 * 1000);
    const result = change(state); state.revision++;
    const payload = JSON.stringify(state);
    ensure(payload.length < 1_000_000, "Account storage requires developer maintenance.", 503, "AUTH_CAPACITY");
    const saved = await db.prepare("UPDATE fatima_auth_state SET revision = ?, payload = ?, updated_at = ? WHERE id = ? AND revision = ?").bind(state.revision, payload, new Date().toISOString(), "fatima-password-v1", previous).run();
    if (saved.meta.changes === 1) return result;
  }
  throw new PortalError("Account access is busy. Please try again.", 503, "AUTH_BUSY");
}
function configuration() { const pepper = bindings().FATIMA_PASSWORD_PEPPER ?? ""; ensure(pepper.length >= 43, "Fatima account access is awaiting developer configuration.", 503, "AUTH_CONFIGURATION"); return pepper; }
function operations(): ProvisionOperation[] {
  const config = bindings();
  const result: ProvisionOperation[] = [];
  for (const batch of [config.FATIMA_ACCOUNT_BATCH_1, config.FATIMA_ACCOUNT_BATCH_2, config.FATIMA_ACCOUNT_BATCH_3]) {
    if (!batch) continue;
    ensure(batch.length <= 5000, "Account provisioning configuration requires review.", 503, "AUTH_CONFIGURATION");
    let parsed: unknown; try { parsed = JSON.parse(batch); } catch { throw new PortalError("Account provisioning configuration requires review.", 503, "AUTH_CONFIGURATION"); }
    ensure(Array.isArray(parsed) && parsed.length <= 20, "Account provisioning configuration requires review.", 503, "AUTH_CONFIGURATION");
    for (const raw of parsed) {
      const row = raw as ProvisionOperation;
      ensure(row && typeof row.id === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(row.id) && typeof row.directive === "string" && row.directive.length >= 10 && row.directive.length <= 300 && ["create", "rotate", "disable", "assign"].includes(row.operation) && typeof row.accountId === "string" && /^[A-Za-z0-9:_-]{8,100}$/.test(row.accountId) && typeof row.username === "string" && validUsername(row.username) && row.username === normalizeUsername(row.username), "Account provisioning configuration requires review.", 503, "AUTH_CONFIGURATION");
      if (["create", "rotate"].includes(row.operation)) ensure(validPasswordHash(row.password), "Account provisioning password requires review.", 503, "AUTH_CONFIGURATION");
      if (row.operation === "create") ensure(typeof row.name === "string" && row.name.length >= 3 && row.name.length <= 100 && roles.includes(row.role!) && typeof row.unitId === "string", "Account provisioning scope requires review.", 503, "AUTH_CONFIGURATION");
      if (row.operation === "assign") ensure(roles.includes(row.role!) && typeof row.unitId === "string", "Account assignment requires review.", 503, "AUTH_CONFIGURATION");
      result.push(row);
    }
  }
  ensure(new Set(result.map(row => row.id)).size === result.length, "Account provisioning references must be unique.", 503, "AUTH_CONFIGURATION");
  return result;
}
/** Developer configuration only. There is deliberately no browser provisioning/reset endpoint. */
export async function provisionManagedAccounts() {
  configuration();
  const pending = operations(), auth = await readAuth();
  for (const operation of pending) {
    if (auth.processed.includes(operation.id)) continue;
    const existing = auth.credentials.find(row => row.username === operation.username || row.accountId === operation.accountId);
    ensure(!existing || existing.username === operation.username && existing.accountId === operation.accountId, "Account provisioning identity conflict requires developer review.", 503, "AUTH_CONFIGURATION");
    ensure(operation.operation === "create" ? !existing : !!existing, "Account provisioning operation requires developer review.", 503, "AUTH_CONFIGURATION");
    const at = new Date().toISOString();
    // Business accounts are written first; a partial failure cannot issue a usable credential.
    await mutateState(state => {
      const marker = `MANAGED-${operation.id}`;
      if (state.audit.some(event => event.id === marker)) return { state, result: null };
      const updated = structuredClone(state);
      let account = updated.users.find(row => row.id === operation.accountId);
      if (operation.operation === "create") {
        ensure(!account, "Existing identities require a reviewed account-link operation.", 503, "AUTH_CONFIGURATION");
        ensure(updated.units.some(unit => unit.id === operation.unitId && unit.status === "Active"), "The assigned operating unit must be active.", 503, "AUTH_CONFIGURATION");
        account = { id: operation.accountId, name: operation.name!, email: `${operation.username}@accounts.fatima.invalid`, role: operation.role!, unitId: operation.unitId!, managedAccount: true };
        updated.users.push(account);
        if (account.role === "customer") updated.profiles.push({ id: account.id, name: account.name, email: account.email, phone: "", address: "", marketingConsent: false, unsubscribed: false, createdAt: at });
      }
      ensure(account, "The account for this directive was not found.", 503, "AUTH_CONFIGURATION");
      if (operation.operation === "assign") {
        ensure(updated.units.some(unit => unit.id === operation.unitId && unit.status === "Active"), "The assigned operating unit must be active.", 503, "AUTH_CONFIGURATION");
        account.role = operation.role!; account.unitId = operation.unitId!;
      }
      updated.revokedBefore[account.id] = at;
      updated.audit.unshift({ id: marker, at, actorId: "developer", actorRole: "developer", action: `account.managed.${operation.operation}`, target: account.id, unitId: account.unitId, outcome: `Developer-controlled account operation. Directive: ${operation.directive}` });
      return { state: updated, result: null };
    });
    await changeAuth(state => {
      if (state.processed.includes(operation.id)) return;
      const credential = state.credentials.find(row => row.username === operation.username || row.accountId === operation.accountId);
      ensure(!credential || credential.username === operation.username && credential.accountId === operation.accountId, "Account identity conflict requires developer review.", 503, "AUTH_CONFIGURATION");
      if (operation.operation === "create") {
        ensure(!credential, "This account has already been provisioned.", 503, "AUTH_CONFIGURATION");
        state.credentials.push({ accountId: operation.accountId, username: operation.username, password: operation.password!, version: 1, enabled: true, createdAt: at, updatedAt: at });
      } else {
        ensure(credential, "The managed account was not found.", 503, "AUTH_CONFIGURATION");
        credential.version++; credential.updatedAt = at;
        if (operation.operation === "disable") credential.enabled = false;
        else if (operation.operation === "rotate") { credential.password = operation.password!; credential.enabled = true; }
      }
      state.sessions = state.sessions.filter(row => row.accountId !== operation.accountId);
      state.processed.push(operation.id);
    });
  }
}
function loopback(request: Request) { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname); }
function cookieName(request: Request) { return loopback(request) ? "fatima_session" : "__Host-fatima_session"; }
export function sessionCookie(request: Request, token: string, clear = false) { return `${cookieName(request)}=${clear ? "" : token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : SESSION_LIFETIME / 1000}${loopback(request) ? "" : "; Secure"}`; }
function tokenFrom(request: Request) { return request.headers.get("cookie")?.split(";").map(row => row.trim()).find(row => row.startsWith(`${cookieName(request)}=`))?.slice(cookieName(request).length + 1) ?? ""; }
export async function managedSessionUser(request: Request): Promise<SessionUser | null> {
  const token = tokenFrom(request); if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  await provisionManagedAccounts();
  const auth = await readAuth(), hash = await hashSessionToken(token), session = auth.sessions.find(row => row.tokenHash === hash);
  if (!session) return null;
  const credential = auth.credentials.find(row => row.accountId === session.accountId);
  const business = await readState(), user = business.users.find(row => row.id === session.accountId);
  return user && credential && validSession(session, credential, business.revokedBefore[user.id]) ? { ...user, managedAccount: true, localDemo: undefined } : null;
}
export async function passwordLogin(request: Request, usernameValue: unknown, password: unknown) {
  const pepper = configuration(); await provisionManagedAccounts();
  const username = normalizeUsername(usernameValue), now = Date.now();
  const address = request.headers.get("cf-connecting-ip") ?? (loopback(request) ? "loopback" : "unknown-network");
  const userKey = await privateDigest(`username:${username.slice(0, 100)}`, pepper), ipKey = await privateDigest(`network:${address}`, pepper);
  // Reserve each attempt atomically before the KDF, including successful and unknown-account attempts.
  await changeAuth(state => {
    ensure(state.attempts.filter(row => row.key === userKey).length < 10 && state.attempts.filter(row => row.key === ipKey).length < 40, "Too many sign-in attempts. Wait 15 minutes or contact the authorised developer.", 429, "LOGIN_LIMIT");
    state.attempts.push({ key: userKey, at: now }, { key: ipKey, at: now });
  });
  const auth = await readAuth(), credential = auth.credentials.find(row => row.username === username) ?? null;
  const valid = await verifyPassword(password, credential, pepper);
  ensure(validUsername(username) && valid && credential, "The username or password was not accepted.", 401, "LOGIN_FAILED");
  const business = await readState(), user = business.users.find(row => row.id === credential.accountId);
  ensure(user, "The username or password was not accepted.", 401, "LOGIN_FAILED");
  const token = randomToken(), tokenHash = await hashSessionToken(token), createdAt = new Date().toISOString();
  await changeAuth(state => {
    const current = state.credentials.find(row => row.accountId === credential.accountId);
    ensure(current?.enabled && current.version === credential.version, "Account access changed. Please sign in again.", 401, "LOGIN_FAILED");
    state.sessions = state.sessions.filter(row => row.accountId !== user.id).concat({ tokenHash, accountId: user.id, credentialVersion: credential.version, createdAt, expiresAt: new Date(Date.parse(createdAt) + SESSION_LIFETIME).toISOString() });
  });
  await mutateState(state => { const updated = structuredClone(state); updated.audit.unshift({ id: `LOGIN-${crypto.randomUUID().slice(0, 12)}`, at: createdAt, actorId: user.id, actorRole: user.role, action: "account.passwordLogin", target: user.id, unitId: user.unitId, outcome: "Fatima username/password session started" }); return { state: updated, result: null }; });
  return { user: { ...user, managedAccount: true }, token };
}
export async function passwordLogout(request: Request) {
  const token = tokenFrom(request); if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const hash = await hashSessionToken(token); await changeAuth(state => { state.sessions = state.sessions.filter(row => row.tokenHash !== hash); });
}
