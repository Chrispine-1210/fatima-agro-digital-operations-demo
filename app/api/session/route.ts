import { createLocalToken, localDemoEnabled, requireSameOrigin, sessionUser } from "@/lib/server/auth";
import { passwordLogin, passwordLogout, sessionCookie } from "@/lib/server/fatima-accounts";
import { safeReturnPath } from "@/lib/server/password-crypto";
import { canAccessModule } from "@/lib/server/permissions";
import { PortalError, ensure } from "@/lib/server/errors";
import type { ModuleId, SessionUser } from "@/lib/portal-types";

function destination(user: SessionUser, requested: unknown) {
  const target = safeReturnPath(requested), module = target.split(/[/?]/)[2] as ModuleId;
  if (user.role === "customer") return target.startsWith("/hq") ? "/account" : target;
  if (target.startsWith("/hq/") && canAccessModule(user, module)) return target;
  return user.role === "ceo" ? "/hq/executive" : user.role.startsWith("finance") ? "/hq/finance" : user.role.startsWith("hr") ? "/hq/hr" : user.role === "administrator" ? "/hq/admin" : user.role === "communications" ? "/hq/communications" : "/hq/procurement";
}
function failure(error: unknown) { const known = error instanceof PortalError; return Response.json({ error: known ? error.message : "Fatima account access is temporarily unavailable.", code: known ? error.code : "SESSION" }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
export async function GET(request: Request) {
  try { const user = await sessionUser(request); return Response.json({ user, localDemo: localDemoEnabled(request), signInUrl: "/account", signOutUrl: "/account", authMode: "fatima", mode: "captured demonstration", registrationRequired: false }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    ensure((request.headers.get("content-type") ?? "").startsWith("application/json"), "Send a JSON request.", 415);
    ensure(Number(request.headers.get("content-length") ?? 0) <= 2500, "The sign-in request is too large.", 413);
    // Drain bounded bodies before an early origin denial so keep-alive requests remain usable.
    const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let length = 0;
    if (reader) { while (true) { const part = await reader.read(); if (part.done) break; length += part.value.byteLength; if (length > 2500) { await reader.cancel(); throw new PortalError("The sign-in request is too large.", 413); } chunks.push(part.value); } }
    const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const raw = new TextDecoder().decode(bytes);
    requireSameOrigin(request);
    let data: Record<string, unknown>; try { data = JSON.parse(raw); } catch { throw new PortalError("The sign-in request could not be read."); }
    ensure(data && typeof data === "object" && !Array.isArray(data), "The sign-in request could not be read.");
    if (data.action === "logout") {
      await passwordLogout(request);
      const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      headers.append("Set-Cookie", sessionCookie(request, "", true));
      headers.append("Set-Cookie", "fatima_local_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
      return Response.json({ message: "Signed out of your Fatima account.", redirectTo: "/account" }, { headers });
    }
    if (data.persona && localDemoEnabled(request)) {
      const token = await createLocalToken(request, String(data.persona));
      const headers = new Headers({ "Cache-Control": "no-store" });
      headers.append("Set-Cookie", `fatima_local_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=14400`);
      headers.append("Set-Cookie", sessionCookie(request, "", true));
      return Response.json({ message: "Local synthetic rehearsal account opened." }, { headers });
    }
    ensure(data.action === "login", "This account operation is managed by the authorised developer.", 403, "MANAGED_ACCOUNT");
    const login = await passwordLogin(request, data.username, data.password);
    const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    headers.append("Set-Cookie", sessionCookie(request, login.token));
    headers.append("Set-Cookie", "fatima_local_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
    return Response.json({ message: "Signed in to Fatima Agro.", user: login.user, redirectTo: destination(login.user, data.returnTo ?? new URL(request.url).searchParams.get("returnTo")) }, { headers });
  } catch (error) { return failure(error); }
}
