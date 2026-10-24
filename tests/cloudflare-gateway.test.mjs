import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import { createCloudflareGateway } from "../deploy/cloudflare/index.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicOrigin = "https://fatima-agro.example.workers.dev";
const DEFAULT_UPSTREAM_ORIGIN = "https://fatima-agro-operations-demo.chrispine-ala.chatgpt.site";

test("Cloudflare adapter fixes upstream routing and explicitly requests identity bytes", async () => {
  let received;
  const proxy = createCloudflareGateway({}, async (url, init) => {
    received = { url, init };
    return new Response(Uint8Array.from([0, 255, 128, 1]), { headers: { "Content-Type": "application/octet-stream" } });
  });
  const response = await proxy(new Request(`${publicOrigin}//untrusted.example/file%2Fname?q=%2B&q=1`, {
    headers: { "Accept-Encoding": "br, gzip", "X-Forwarded-Host": "untrusted.example" },
  }));
  assert.equal(received.url, `${DEFAULT_UPSTREAM_ORIGIN}//untrusted.example/file%2Fname?q=%2B&q=1`);
  assert.equal(received.init.headers.get("Accept-Encoding"), "identity");
  assert.equal(received.init.headers.get("X-Forwarded-Host"), null);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), Uint8Array.from([0, 255, 128, 1]));
});

test("actual Workers runtime preserves separate session cookies, binary bytes and same-origin mutation controls", async () => {
  const calls = [];
  const cookies = [
    "__Host-fatima_session=worker-test; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=14400",
    "fatima_local_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  const mf = new Miniflare({
    modulesRoot: root,
    modules: [
      { type: "ESModule", path: path.join(root, "deploy/cloudflare/index.mjs") },
      { type: "ESModule", path: path.join(root, "deploy/vercel/api/index.mjs") },
    ],
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    bindings: { FATIMA_UPSTREAM_ORIGIN: DEFAULT_UPSTREAM_ORIGIN },
    outboundService: async request => {
      calls.push({ url: request.url, origin: request.headers.get("Origin"), encoding: request.headers.get("Accept-Encoding"), body: await request.text() });
      const headers = new Headers({ "Content-Type": "application/octet-stream", "X-Oai-User-Id": "excluded" });
      for (const cookie of cookies) headers.append("Set-Cookie", cookie);
      return new Response(Uint8Array.from([0, 255, 128, 1]), { headers });
    },
  });
  try {
    const response = await mf.dispatchFetch(`${publicOrigin}/api/session?returnTo=%2Fhq%2Fexecutive`, {
      method: "POST",
      headers: { Origin: publicOrigin, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json" },
      body: '{"action":"login"}',
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.headers.getSetCookie(), cookies);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), Uint8Array.from([0, 255, 128, 1]));
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.equal(response.headers.get("X-Oai-User-Id"), null);
    assert.deepEqual(calls, [{
      url: `${DEFAULT_UPSTREAM_ORIGIN}/api/session?returnTo=%2Fhq%2Fexecutive`,
      origin: DEFAULT_UPSTREAM_ORIGIN,
      encoding: "identity",
      body: '{"action":"login"}',
    }]);
    const rejected = await mf.dispatchFetch(`${publicOrigin}/api/session`, {
      method: "POST", headers: { Origin: "https://foreign.example", "Sec-Fetch-Site": "cross-site" }, body: "{}",
    });
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json()).code, "ORIGIN");
    assert.equal(calls.length, 1);
  } finally {
    await mf.dispose();
  }
});
