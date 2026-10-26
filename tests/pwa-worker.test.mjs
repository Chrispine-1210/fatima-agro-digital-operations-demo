import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("public/sw.js", root), "utf8");
const offlineHTML = await readFile(new URL("public/offline.html", root), "utf8");
const origin = "https://fatima-app.example";
const offlineURL = `${origin}/offline.html`;
const cacheName = "fatima-public-offline-v1";

function worker(fetcher) {
  const listeners = new Map(), stores = new Map(), calls = { fetch: [], puts: [], deleted: [], skipWaiting: 0, claim: 0 };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const records = stores.get(name);
      return {
        async put(key, response) { calls.puts.push({ cache: name, url: String(key) }); records.set(String(key), response.clone()); },
        async match(key) { return records.get(String(key))?.clone(); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { calls.deleted.push(name); return stores.delete(name); },
  };
  const fetch = async request => { calls.fetch.push(request); return fetcher(request); };
  const self = {
    location: { origin },
    addEventListener(type, callback) { listeners.set(type, callback); },
    skipWaiting() { calls.skipWaiting++; },
    clients: { claim() { calls.claim++; } },
  };
  vm.runInNewContext(source, { self, caches, fetch, Request, Response, Headers, URL, Promise }, { filename: "sw.js" });
  async function dispatch(type, request) {
    const tasks = [];
    let response;
    const event = { request, waitUntil(task) { tasks.push(task); }, respondWith(task) { response = task; } };
    listeners.get(type)(event);
    await Promise.all(tasks);
    return { intercepted: response !== undefined, response: response ? await response : undefined };
  }
  return { calls, stores, caches, dispatch };
}

function navigation(path = "/account", headers = {}) {
  return { url: origin + path, method: "GET", mode: "navigate", headers: new Headers(headers) };
}

test("installation caches only the verified public offline page and omits account credentials", async () => {
  const app = worker(async () => new Response(offlineHTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
  await app.dispatch("install");
  assert.equal(app.calls.fetch.length, 1);
  const request = app.calls.fetch[0];
  assert.equal(request.url, offlineURL);
  assert.equal(request.credentials, "omit");
  assert.equal(request.cache, "reload");
  assert.deepEqual(app.calls.puts, [{ cache: cacheName, url: offlineURL }]);
  assert.equal(app.calls.skipWaiting, 0);
  assert.equal(app.calls.claim, 0);
});

test("a wrong, redirected or unavailable install response is never cached", async () => {
  const followedRedirect = new Response(offlineHTML, { headers: { "Content-Type": "text/html" } });
  Object.defineProperty(followedRedirect, "redirected", { value: true });
  const wrongLocation = new Response(offlineHTML, { headers: { "Content-Type": "text/html" } });
  Object.defineProperty(wrongLocation, "url", { value: `${origin}/account` });
  for (const response of [
    new Response("private account page", { headers: { "Content-Type": "text/html" } }),
    new Response(offlineHTML, { headers: { "Content-Type": "application/json" } }),
    new Response(offlineHTML, { status: 503, headers: { "Content-Type": "text/html" } }),
    Response.redirect(`${origin}/account`, 302),
    followedRedirect,
    wrongLocation,
  ]) {
    const app = worker(async () => response);
    await assert.rejects(app.dispatch("install"));
    assert.equal(app.calls.puts.length, 0);
  }
});

test("private online navigations preserve the exact network response without caching", async () => {
  for (const path of ["/account", "/account/orders/ORD-private", "/hq/executive", "/hq/hr", "/hq/finance"]) {
    const privateResponse = new Response("CONFIDENTIAL PRIVATE RECORD", { headers: { "Cache-Control": "no-store" } });
    const app = worker(async () => privateResponse);
    const request = navigation(path);
    const result = await app.dispatch("fetch", request);
    assert.equal(result.intercepted, true);
    assert.equal(result.response, privateResponse);
    assert.equal(app.calls.fetch[0], request);
    assert.equal(await result.response.text(), "CONFIDENTIAL PRIVATE RECORD");
    assert.equal(app.calls.puts.length, 0);
    assert.equal(app.stores.size, 0);
  }
});

test("HTTP auth, validation and server failures remain network errors, never offline success", async () => {
  for (const status of [401, 403, 404, 409, 500, 503]) {
    const upstream = new Response("upstream failure", { status });
    const app = worker(async () => upstream);
    const result = await app.dispatch("fetch", navigation("/hq/executive"));
    assert.equal(result.response, upstream);
    assert.equal(result.response.status, status);
    assert.equal(await result.response.text(), "upstream failure");
    assert.equal(app.calls.puts.length, 0);
  }
});

test("API, mutations, RSC, documents and other non-navigation requests bypass the worker", async () => {
  const forbiddenFetch = () => { throw new Error("Worker must leave this request to the browser network."); };
  const app = worker(forbiddenFetch);
  const requests = [
    new Request(`${origin}/api/session`),
    new Request(`${origin}/api/portal?module=executive`),
    new Request(`${origin}/api/portal`, { method: "POST", body: '{"action":"finance.payment"}' }),
    new Request(`${origin}/api/receipt/private`, { method: "DELETE" }),
    new Request(`${origin}/private-receipt.pdf`),
    new Request(`${origin}/assets/app.js`),
    new Request(`${origin}/brand/fatima-logo.svg`),
    navigation("/api/portal?module=hr"),
    navigation("/documents/receipt-private.pdf"),
    navigation("/exports/payroll-private.csv"),
    navigation("/downloads/Fatima-Agro.apk"),
    navigation("/downloads/Fatima-Agro.aab"),
    navigation("/hq/finance", { rsc: "1" }),
    navigation("/hq/hr", { accept: "text/x-component" }),
    navigation("/hq/executive?_rsc=private"),
    navigation("/hq/hr.rsc"),
    { ...navigation("/"), url: "https://different.example/account" },
  ];
  for (const request of requests) assert.equal((await app.dispatch("fetch", request)).intercepted, false);
  assert.equal(app.calls.fetch.length, 0);
  assert.equal(app.calls.puts.length, 0);
  assert.equal(app.stores.size, 0);
});

test("a navigation network failure returns only the generic offline503 page, never prior private data", async () => {
  let offline = false;
  const app = worker(async request => {
    if (request.url === offlineURL) return new Response(offlineHTML, { headers: { "Content-Type": "text/html" } });
    if (offline) throw new TypeError("Network connection unavailable");
    return new Response("PREVIOUS PRIVATE CEO RECORD");
  });
  await app.dispatch("install");
  assert.equal(await (await app.dispatch("fetch", navigation("/hq/executive"))).response.text(), "PREVIOUS PRIVATE CEO RECORD");
  offline = true;
  const response = (await app.dispatch("fetch", navigation("/hq/executive?private=secret"))).response;
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Content-Type"), "text/html; charset=utf-8");
  const body = await response.text();
  assert.ok(body.includes('data-fatima-offline="v1"'));
  assert.ok(body.includes('href="/account"'));
  assert.ok(body.includes('href=""'));
  assert.equal(new URL("", `${origin}/hq/executive?tab=decisions`).href, `${origin}/hq/executive?tab=decisions`);
  assert.doesNotMatch(body, /PREVIOUS PRIVATE CEO RECORD|private=secret/);
  assert.deepEqual(app.calls.puts, [{ cache: cacheName, url: offlineURL }]);
});

test("missing offline cache still yields a generic503 without exposing the failed URL", async () => {
  const app = worker(async () => { throw new TypeError("Cannot connect"); });
  const response = (await app.dispatch("fetch", navigation("/account?private=secret"))).response;
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.match(body, /Fatima Agro/);
  assert.doesNotMatch(body, /private=secret/);
  assert.equal(app.calls.puts.length, 0);
});

test("activation clears only old Fatima offline screens and never claims active app windows", async () => {
  const app = worker(async () => new Response("unused"));
  for (const name of ["fatima-public-offline-v0", cacheName, "unrelated-cache"]) await app.caches.open(name);
  await app.dispatch("activate");
  assert.deepEqual(app.calls.deleted, ["fatima-public-offline-v0"]);
  assert.ok(app.stores.has(cacheName));
  assert.ok(app.stores.has("unrelated-cache"));
  assert.equal(app.calls.skipWaiting, 0);
  assert.equal(app.calls.claim, 0);
});

test("manifest and icons use a host-independent account entry and supported branded dimensions", async () => {
  const manifest = JSON.parse(await readFile(new URL("public/manifest.webmanifest", root), "utf8"));
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/account");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#1d8428");
  assert.equal(manifest.prefer_related_applications, false);
  assert.equal(manifest.icons.length, 3);
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith("/app-icons/"));
    const png = await readFile(new URL(`public${icon.src}`, root));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
    assert.equal(icon.type, "image/png");
  }
  const apple = await readFile(new URL("public/app-icons/apple-touch-icon.png", root));
  assert.equal(apple.readUInt32BE(16), 180);
  assert.equal(apple.readUInt32BE(20), 180);
  assert.ok(manifest.icons.some(icon => icon.purpose === "maskable" && icon.sizes === "512x512"));
});
