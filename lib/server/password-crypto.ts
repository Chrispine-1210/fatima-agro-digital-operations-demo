/** Server-only password/session primitives. No credential belongs in a portal snapshot. */
export const PASSWORD_ITERATIONS = 100_000;
export const SESSION_LIFETIME = 8 * 60 * 60 * 1000;
export type PasswordHash = { algorithm: "PBKDF2-SHA256-HMAC"; iterations: number; salt: string; digest: string };
export type ManagedCredential = { accountId: string; username: string; password: PasswordHash; version: number; enabled: boolean; createdAt: string; updatedAt: string };
export type ManagedSession = { tokenHash: string; accountId: string; credentialVersion: number; createdAt: string; expiresAt: string };
const encoder = new TextEncoder();
export function base64url(bytes: Uint8Array) { let value = ""; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function bytes(value: string) { return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), char => char.charCodeAt(0)); }
export function randomToken() { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
export function normalizeUsername(value: unknown) { return typeof value === "string" ? value.trim().toLowerCase() : ""; }
export function validUsername(value: string) { return /^[a-z0-9][a-z0-9._-]{2,63}$/.test(value); }
export function validPassword(value: unknown): value is string { return typeof value === "string" && value.length >= 16 && value.length <= 128 && encoder.encode(value).length <= 512; }
export function validPasswordHash(value: unknown): value is PasswordHash {
  const v = value as PasswordHash | null;
  return !!v && v.algorithm === "PBKDF2-SHA256-HMAC" && v.iterations === PASSWORD_ITERATIONS && /^[A-Za-z0-9_-]{43}$/.test(v.salt) && /^[A-Za-z0-9_-]{43}$/.test(v.digest);
}
async function hmac(value: string, pepper: string) {
  if (pepper.length < 43 || pepper.length > 200) throw new Error("Password authentication configuration requires review.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
export async function privateDigest(value: string, pepper: string) { return base64url(await hmac(value, pepper)); }
export async function hashSessionToken(value: string) { return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))); }
async function derive(password: string, salt: string, pepper: string) {
  const material = await crypto.subtle.importKey("raw", await hmac(password, pepper), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytes(salt), iterations: PASSWORD_ITERATIONS }, material, 256));
}
export async function hashPassword(password: string, pepper: string): Promise<PasswordHash> {
  if (!validPassword(password)) throw new Error("Provision a password between 16 and 128 characters.");
  const salt = randomToken();
  return { algorithm: "PBKDF2-SHA256-HMAC", iterations: PASSWORD_ITERATIONS, salt, digest: base64url(await derive(password, salt, pepper)) };
}
export function equalBytes(a: Uint8Array, b: Uint8Array) { let difference = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0); return difference === 0; }
/** Always performs the same KDF for an unknown/disabled account as for a known account. */
export async function verifyPassword(password: unknown, credential: ManagedCredential | null, pepper: string) {
  const valid = validPassword(password), stored = credential && validPasswordHash(credential.password) ? credential.password : null;
  const salt = stored?.salt ?? "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const derived = await derive(valid ? password : "invalid-login-password", salt, pepper);
  const matched = equalBytes(derived, bytes(stored?.digest ?? "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"));
  return !!(valid && stored && credential?.enabled && matched);
}
export function validSession(session: ManagedSession, credential: ManagedCredential, revokedBefore: string | undefined, now = Date.now()) {
  const created = Date.parse(session.createdAt), expires = Date.parse(session.expiresAt), revoked = revokedBefore ? Date.parse(revokedBefore) : 0;
  return credential.enabled && credential.accountId === session.accountId && credential.version === session.credentialVersion && Number.isFinite(created) && Number.isFinite(expires) && created <= now && expires > now && expires - created <= SESSION_LIFETIME && (!revokedBefore || (Number.isFinite(revoked) && created > revoked));
}
export function safeReturnPath(value: unknown) {
  if (typeof value !== "string" || value.length > 300 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/account";
  const target = new URL(value, "https://fatima.invalid");
  return target.origin === "https://fatima.invalid" && /^\/(?:hq(?:\/|$)|account(?:\/|$)|products\/|cart$|reviews$)/.test(target.pathname) ? `${target.pathname}${target.search}` : "/account";
}
