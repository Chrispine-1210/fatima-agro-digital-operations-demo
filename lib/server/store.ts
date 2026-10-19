import { env } from "cloudflare:workers";
import { initialState, type PortalState } from "./seed";
import { PortalError, ensure } from "./errors";

type Bindings = { DB?: D1Database; HQ_ADMIN_EMAILS?: string; FATIMA_BOOTSTRAP_CEO_EMAILS?: string; FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS?: string; FATIMA_LOCAL_DEMO?: string; FATIMA_LOCAL_SESSION_SECRET?: string; FATIMA_TRUSTED_HOST?: string };
export function bindings(): Bindings { return env as unknown as Bindings; }
function database() { const db = bindings().DB; ensure(db, "Demonstration storage is unavailable. Please ask the presentation operator to restore the configured database.", 503, "STORAGE_UNAVAILABLE"); return db; }
export async function readState(): Promise<PortalState> {
  const db = database();
  let row: { revision: number; payload: string } | null;
  try {
    row = await db.prepare("SELECT revision, payload FROM portal_state WHERE id = ?").bind("presentation-v2").first<{ revision: number; payload: string }>();
    if (!row) {
      const state = initialState();
      await db.prepare("INSERT OR IGNORE INTO portal_state (id, revision, payload, updated_at) VALUES (?, ?, ?, ?)").bind("presentation-v2", 0, JSON.stringify(state), new Date().toISOString()).run();
      row = await db.prepare("SELECT revision, payload FROM portal_state WHERE id = ?").bind("presentation-v2").first<{ revision: number; payload: string }>();
    }
  } catch { throw new PortalError("Demonstration storage is not ready. Apply the packaged database migration before the presentation.", 503, "STORAGE_NOT_READY"); }
  ensure(row, "Demonstration storage could not be initialized.", 503, "STORAGE_UNAVAILABLE");
  const state = JSON.parse(row.payload) as PortalState; state.revision = row.revision; return state;
}
/** All changed ledgers and audit entries share one guarded D1 update. No mutation is partially committed. */
export async function mutateState<R>(change: (state: PortalState) => { state: PortalState; result: R }): Promise<{ result: R; revision: number }> {
  const db = database();
  for (let retry = 0; retry < 5; retry++) {
    const previous = await readState();
    const changeResult = change(previous);
    if (changeResult.state === previous) return { result: changeResult.result, revision: previous.revision };
    const revision = previous.revision + 1;
    changeResult.state.revision = revision;
    const serialized = JSON.stringify(changeResult.state);
    ensure(serialized.length < 4_000_000, "The bounded presentation store is full. Export records and arrange the reviewed production storage upgrade.", 507, "DEMO_CAPACITY");
    const outcome = await db.prepare("UPDATE portal_state SET revision = ?, payload = ?, updated_at = ? WHERE id = ? AND revision = ?").bind(revision, serialized, new Date().toISOString(), "presentation-v2", previous.revision).run();
    if (outcome.meta.changes === 1) return { result: changeResult.result, revision };
  }
  throw new PortalError("Another user updated these records. Refresh and try again; no duplicate was committed.", 409, "CONCURRENT_UPDATE");
}
