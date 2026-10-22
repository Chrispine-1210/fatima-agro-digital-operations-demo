import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ModuleId, SessionUser } from "../portal-types";
import { bindings, mutateState } from "./store";
import { localPersonas } from "./seed";
import { canAccessModule } from "./permissions";
import { ensure } from "./errors";
import { registerIdentity } from "./bootstrap";
import { managedSessionUser } from "./fatima-accounts";

export function isLoopback(request: Request) { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname); }
export function localDemoEnabled(request: Request) { return isLoopback(request) && bindings().FATIMA_LOCAL_DEMO === "true" && (bindings().FATIMA_LOCAL_SESSION_SECRET?.length ?? 0) >= 32; }
function bytesToBase64Url(bytes: Uint8Array) { let text = ""; for (const byte of bytes) text += String.fromCharCode(byte); return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function fromBase64Url(value: string) { const text = atob(value.replaceAll("-", "+").replaceAll("_", "/")); return Uint8Array.from(text, (char) => char.charCodeAt(0)); }
async function key() { return crypto.subtle.importKey("raw", new TextEncoder().encode(bindings().FATIMA_LOCAL_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
export async function createLocalToken(request: Request, persona: string) { ensure(localDemoEnabled(request), "Local demonstration sign-in is disabled.", 403); ensure(localPersonas[persona], "Choose a valid local demonstration account."); const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ persona, issuedAt: new Date().toISOString(), expires: Date.now() + 4 * 60 * 60 * 1000 }))); const signature = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(payload)); return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`; }
async function localIdentity(request: Request): Promise<SessionUser | null> {
  if (!localDemoEnabled(request)) return null;
  const value = request.headers.get("cookie")?.split(";").map((c) => c.trim()).find((c) => c.startsWith("fatima_local_session="))?.slice("fatima_local_session=".length);
  if (!value) return null;
  try { const parts = value.split("."); if (parts.length !== 2) return null; const [payload, signature] = parts; if (!await crypto.subtle.verify("HMAC", await key(), fromBase64Url(signature), new TextEncoder().encode(payload))) return null; const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { persona: string; expires: number }; if (decoded.expires < Date.now() || !localPersonas[decoded.persona]) return null; return localPersonas[decoded.persona]; } catch { return null; }
}
export async function sessionUser(request: Request): Promise<SessionUser | null> {
  if (localDemoEnabled(request)) {
    const identity = await localIdentity(request);
    if (identity) return (await mutateState(state => registerIdentity(state, identity))).result;
  }
  return managedSessionUser(request);
}
export function requireSameOrigin(request: Request) { const origin = request.headers.get("origin"); ensure(origin === new URL(request.url).origin, "Request origin was not accepted.", 403, "ORIGIN"); const fetchSite = request.headers.get("sec-fetch-site"); ensure(!fetchSite || ["same-origin", "none"].includes(fetchSite), "Cross-site requests are not accepted.", 403, "ORIGIN"); }
export async function requirePortalPage(module: ModuleId): Promise<SessionUser> {
  const incoming = await headers(); const host = incoming.get("host") ?? "localhost"; const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const request = new Request(`${protocol}://${host}/hq/${module}`, { headers: incoming });
  const user = await sessionUser(request);
  if (!user) redirect(`/account?returnTo=${encodeURIComponent(`/hq/${module}`)}`);
  if (user.role === "customer") redirect("/account");
  if (!canAccessModule(user, module)) redirect("/hq?denied=1");
  return user;
}
