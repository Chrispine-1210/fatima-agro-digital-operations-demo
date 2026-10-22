import type { ActionRequest, ModuleId } from "@/lib/portal-types";
import { applyAction, snapshot } from "@/lib/server/domain";
import { localDemoEnabled, requireSameOrigin, sessionUser } from "@/lib/server/auth";
import { mutateState, readState } from "@/lib/server/store";
import { PortalError, ensure } from "@/lib/server/errors";

const modules: ModuleId[] = ["public", "customer", "executive", "finance", "hr", "procurement", "admin", "communications", "notifications"];
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
function failed(error: unknown) { const known = error instanceof PortalError; if (!known) console.error("Portal request failed without committing a response", error); return response({ error: known ? error.message : "The request could not be completed. Refresh and try again.", code: known ? error.code : "INTERNAL" }, known ? error.status : 500); }
export async function GET(request: Request) { try { const selectedModule = (new URL(request.url).searchParams.get("module") ?? "public") as ModuleId; ensure(modules.includes(selectedModule), "Unknown workspace.", 404); const user = selectedModule === "public" ? null : await sessionUser(request); const state = await readState(); const effectiveUser = user ? state.users.find((u) => u.id === user.id) ?? null : null; return response(snapshot(state, effectiveUser, selectedModule)); } catch (error) { return failed(error); } }
export async function POST(request: Request) { try {
  requireSameOrigin(request); ensure((request.headers.get("content-type") ?? "").startsWith("application/json"), "Send a JSON request.", 415); ensure(Number(request.headers.get("content-length") ?? 0) < 32_000, "The request is too large.", 413);
  const raw = await request.text(); ensure(raw.length < 32_000, "The request is too large.", 413); let body: ActionRequest; try { body = JSON.parse(raw); } catch { throw new PortalError("The request contains invalid JSON."); }
  ensure(body && typeof body.action === "string" && (body.data === undefined || (body.data !== null && typeof body.data === "object" && !Array.isArray(body.data))), "The request contains invalid action data.");
  const user = await sessionUser(request);
  const action = body.action, data = body.data ?? {};
  let rateKey = "";
  if (["enquiry.create", "communication.unsubscribe"].includes(action) && !user) { const address = request.headers.get("cf-connecting-ip") ?? (localDemoEnabled(request) ? "local" : "anonymous"); const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${address}:${new Date().toISOString().slice(0, 13)}`)); rateKey = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
  const saved = await mutateState((state) => { if (rateKey) { const cutoff = Date.now() - 60_000; const count = state.rateLimits.filter((r) => r.key === rateKey && Date.parse(r.at) >= cutoff).length; ensure(count < 6, "Please wait a minute before trying again.", 429, "RATE_LIMIT"); } const effectiveUser = user ? { ...state.users.find((u) => u.id === user.id)!, localDemo: user.localDemo } : null; ensure(!user || effectiveUser?.id, "Sign in again to continue.", 401); const result = applyAction(state, effectiveUser, action, data); if (rateKey && result.state !== state) { result.state.rateLimits = result.state.rateLimits.filter((r) => Date.parse(r.at) >= Date.now() - 60_000); result.state.rateLimits.push({ key: rateKey, at: new Date().toISOString() }); } return { state: result.state, result: { message: result.message, result: result.result } }; });
  return response({ ...saved.result, revision: saved.revision });
} catch (error) { return failed(error); } }
