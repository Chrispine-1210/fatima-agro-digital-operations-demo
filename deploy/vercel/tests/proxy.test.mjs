import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { createProxy } from "../api/index.mjs";

const origin = "https://fatima-worker.example";
const publicOrigin = "https://fatima-demo.vercel.app";
const env = { FATIMA_UPSTREAM_ORIGIN: origin };
const request = (path = "/", init) => new Request(`${publicOrigin}${path}`, init);
function mutation(headers = {}, body = '{"action":"login"}') {
  return request("/api/session?returnTo=%2Fhq%2Fexecutive", {
    method: "POST", headers: { Origin: publicOrigin, "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin", ...headers }, body,
  });
}

test("preserves encoded path, repeated query values and routing headers", async () => {
  let received;
  const proxy = createProxy(env, async (url, init) => { received = { url, init }; return new Response("flight", { headers: { "Content-Type": "text/x-component" } }); });
  const headers = {
    RSC: "1", "Next-Router-State-Tree": "%5B%22%22%5D", "Next-Router-Prefetch": "1",
    "Next-Router-Segment-Prefetch": "/_tree", "Next-Url": "/hq", "X-Vinext-Interception-Context": "context",
    "X-Vinext-Mounted-Slots": "slot", "X-Vinext-Rsc-Render-Mode": "navigation", "X-Rsc-Action": "action-id", "Next-Action": "fallback-id",
  };
  const response = await proxy(request("/products/a%2Fb.rsc?q=maize+bag&q=%2B&_rsc=exact%2Bhash", { headers }));
  assert.equal(received.url, `${origin}/products/a%2Fb.rsc?q=maize+bag&q=%2B&_rsc=exact%2Bhash`);
  for (const [name, value] of Object.entries(headers)) assert.equal(received.init.headers.get(name), value);
  assert.equal(await response.text(), "flight");
  assert.equal(response.headers.get("Content-Type"), "text/x-component");
});

test("a double-slash path cannot replace the fixed upstream host", async () => {
  let received;
  const proxy = createProxy(env, async url => { received = url; return new Response("ok"); });
  await proxy(request("//attacker.example/order"));
  assert.equal(received, `${origin}//attacker.example/order`);
});

test("forwards the original POST body only after same-origin validation", async () => {
  let received;
  const body = '{"quantity":2,"note":"maize + lime 🌽"}';
  const proxy = createProxy(env, async (url, init) => {
    received = { url, method: init.method, body: await new Response(init.body).text(), origin: init.headers.get("Origin"), site: init.headers.get("Sec-Fetch-Site"), redirect: init.redirect, duplex: init.duplex };
    return Response.json({ saved: true });
  });
  const response = await proxy(mutation({}, body));
  assert.equal(response.status, 200);
  assert.deepEqual(received, { url: `${origin}/api/session?returnTo=%2Fhq%2Fexecutive`, method: "POST", body, origin, site: "same-origin", redirect: "manual", duplex: "half" });
});

test("rejects missing, foreign and null origins and cross-site fetch metadata without upstream calls", async () => {
  let calls = 0;
  const proxy = createProxy(env, async () => { calls++; return new Response("bad"); });
  for (const headers of [
    { Origin: "https://attacker.example" }, { Origin: "null" }, { Origin: "" },
    { "Sec-Fetch-Site": "cross-site" }, { "Sec-Fetch-Site": "same-site" },
  ]) {
    const response = await proxy(mutation(headers));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, "ORIGIN");
  }
  const missing = new Request(`${publicOrigin}/api/session`, { method: "POST", body: "{}" });
  assert.equal((await proxy(missing)).status, 403);
  assert.equal(calls, 0);
});

test("permits a same-origin non-browser client without fetch metadata", async () => {
  const proxy = createProxy(env, async () => new Response("ok"));
  assert.equal((await proxy(request("/api/session", { method: "POST", headers: { Origin: publicOrigin }, body: "{}" }))).status, 200);
});

test("does not trust Host or forwarded identity and framework-internal headers", async () => {
  let received;
  const proxy = createProxy(env, async (_url, init) => { received = init.headers; return new Response("ok"); });
  await proxy(mutation({
    Host: "attacker.example", Forwarded: "host=attacker.example", "X-Forwarded-Host": "attacker.example",
    "X-Forwarded-For": "1.2.3.4", "CF-Connecting-IP": "1.2.3.4", "X-Real-IP": "1.2.3.4",
    "X-Oai-User-Id": "ceo", "X-Openai-User": "ceo", Authorization: "Bearer forged",
    "X-Vinext-Mw-Ctx": "forged", "X-Vinext-Prerender-Secret": "forged", "X-Middleware-Request-Cookie": "forged",
    Cookie: "__Host-fatima_session=existing-token",
  }));
  for (const name of ["host", "forwarded", "x-forwarded-host", "x-forwarded-for", "cf-connecting-ip", "x-real-ip", "x-oai-user-id", "x-openai-user", "authorization", "x-vinext-mw-ctx", "x-vinext-prerender-secret", "x-middleware-request-cookie"]) assert.equal(received.get(name), null, name);
  assert.equal(received.get("Cookie"), "__Host-fatima_session=existing-token");
  assert.equal(received.get("Origin"), origin);
});

test("a forged Host header cannot authorise a foreign-origin mutation", async () => {
  let calls = 0;
  const proxy = createProxy(env, async () => { calls++; return new Response("bad"); });
  const response = await proxy(mutation({ Host: "attacker.example", Origin: "https://attacker.example" }));
  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

test("preserves separate host-only session and expiry cookies including an Expires comma", async () => {
  const cookies = [
    "__Host-fatima_session=token; HttpOnly; SameSite=Strict; Path=/; Max-Age=14400; Secure",
    "fatima_local_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  const headers = new Headers();
  cookies.forEach(cookie => headers.append("Set-Cookie", cookie));
  const response = await createProxy(env, async () => new Response("ok", { headers }))(request());
  assert.deepEqual(response.headers.getSetCookie(), cookies);
});

test("fails closed for Domain cookies and malformed __Host session cookie attributes", async () => {
  for (const cookie of [
    "session=token; Domain=.example; Secure", "__Host-fatima_session=token; HttpOnly; SameSite=Strict; Path=/",
    "__Host-fatima_session=token; Secure; SameSite=Strict; Path=/", "__Host-fatima_session=token; Secure; HttpOnly; Path=/",
    "__Host-fatima_session=token; Secure; HttpOnly; SameSite=Strict; Path=/hq",
  ]) {
    const response = await createProxy(env, async () => new Response("ok", { headers: { "Set-Cookie": cookie } }))(request());
    assert.equal(response.status, 502, cookie);
    assert.equal(response.headers.get("Set-Cookie"), null);
  }
});

test("rewrites same-upstream absolute, relative and RSC redirects while preserving external destinations", async () => {
  for (const [location, expected] of [
    [`${origin}/account?returnTo=%2Fhq#sign-in`, `${publicOrigin}/account?returnTo=%2Fhq#sign-in`],
    ["/hq/executive.rsc?_rsc=a%2Bb", `${publicOrigin}/hq/executive.rsc?_rsc=a%2Bb`],
    ["../products", `${publicOrigin}/products`],
    ["https://external.example/help", "https://external.example/help"],
  ]) {
    const response = await createProxy(env, async () => new Response(null, { status: 307, headers: { Location: location } }))(request("/account"));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("Location"), expected);
  }
});

test("disables shared caching on success and errors; strips stale transport and internal response headers", async () => {
  const headers = {
    "Cache-Control": "public, max-age=86400", "CDN-Cache-Control": "max-age=86400", "Vercel-CDN-Cache-Control": "max-age=86400",
    Connection: "x-transport-private", "X-Transport-Private": "secret", "Content-Length": "999", "Content-Encoding": "gzip",
    "X-Oai-User": "secret", "X-Oai-Role": "secret", "X-Openai-Internal": "secret", "X-Middleware-Next": "1",
    Vary: "RSC, Next-Url", "X-Vinext-Params": "%7B%7D",
  };
  const response = await createProxy(env, async () => new Response("decoded body", { headers }))(request());
  assert.equal(await response.text(), "decoded body");
  for (const name of ["Connection", "X-Transport-Private", "Content-Length", "Content-Encoding", "X-Oai-User", "X-Oai-Role", "X-Openai-Internal", "X-Middleware-Next"]) assert.equal(response.headers.get(name), null, name);
  assert.equal(response.headers.get("Vary"), "RSC, Next-Url");
  assert.equal(response.headers.get("X-Vinext-Params"), "%7B%7D");
  for (const current of [response, await createProxy({})(request())]) {
    assert.equal(current.headers.get("Cache-Control"), "private, no-store");
    assert.equal(current.headers.get("CDN-Cache-Control"), "no-store");
    assert.equal(current.headers.get("Vercel-CDN-Cache-Control"), "no-store");
  }
});

test("native fetch decompression reaches the browser once with correct body bytes", async () => {
  const html = "<main>Fatima Agro 🌽</main>";
  const zipped = gzipSync(html);
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Encoding": "gzip", "Content-Length": zipped.byteLength });
    res.end(zipped);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const transport = () => fetch(`http://127.0.0.1:${server.address().port}`);
    const response = await createProxy(env, transport)(request());
    assert.equal(await response.text(), html);
    assert.equal(response.headers.get("Content-Encoding"), null);
    assert.equal(response.headers.get("Content-Length"), null);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test("HEAD and bodyless status codes remain bodyless", async () => {
  const head = await createProxy(env, async () => new Response("not emitted"))(request("/", { method: "HEAD" }));
  assert.equal(await head.text(), "");
  for (const status of [204, 205, 304]) {
    const response = await createProxy(env, async () => new Response(null, { status }))(request());
    assert.equal(response.status, status);
    assert.equal(await response.text(), "");
  }
});

test("preserves upstream HTTP failures but hides transport error details", async () => {
  const denied = await createProxy(env, async () => Response.json({ error: "Denied" }, { status: 403 }))(request());
  assert.equal(denied.status, 403);
  assert.deepEqual(await denied.json(), { error: "Denied" });
  const unavailable = await createProxy(env, async () => { throw new Error("private database credential and hostname"); })(request());
  assert.equal(unavailable.status, 502);
  const text = await unavailable.text();
  assert.match(text, /UPSTREAM_UNAVAILABLE/);
  assert.doesNotMatch(text, /credential|hostname/);
});

test("rejects invalid or looping configuration without making an upstream request", async () => {
  let calls = 0;
  for (const value of [undefined, "", " http://bad.example", "http://bad.example", "https://user:password@worker.example", `${origin}/path`, `${origin}?secret=1`, `${origin}#fragment`, `${origin}?`, `${origin}#`, `${origin} `, publicOrigin, "not a URL"]) {
    const response = await createProxy({ FATIMA_UPSTREAM_ORIGIN: value }, async () => { calls++; return new Response("bad"); })(request());
    assert.equal(response.status, 503, String(value));
    assert.equal((await response.json()).code, "HOSTING_CONFIGURATION");
  }
  assert.equal(calls, 0);
});

test("accepts the harmless trailing slash on an HTTPS origin", async () => {
  let received;
  const proxy = createProxy({ FATIMA_UPSTREAM_ORIGIN: `${origin}/` }, async url => { received = url; return new Response("ok"); });
  assert.equal((await proxy(request("/products"))).status, 200);
  assert.equal(received, `${origin}/products`);
});
