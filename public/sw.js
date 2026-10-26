/* Cache only the public, identity-free offline screen. Bump this version when it changes. */
const OFFLINE_CACHE_PREFIX = "fatima-public-offline-";
const OFFLINE_CACHE = `${OFFLINE_CACHE_PREFIX}v2`;
// Cloudflare serves HTML assets at their extensionless canonical URL.
const OFFLINE_URL = new URL("/offline", self.location.origin).href;
const OFFLINE_MARKER = 'data-fatima-offline="v1"';

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    // Credentials are deliberately excluded, even when a member of staff installs the app.
    const response = await fetch(new Request(OFFLINE_URL, { credentials: "omit", cache: "reload" }));
    const contentType = response.headers.get("Content-Type") ?? "";
    if (!response.ok || response.redirected || (response.url && response.url !== OFFLINE_URL)
        || !/^text\/html(?:;|$)/i.test(contentType)
        || !(await response.clone().text()).includes(OFFLINE_MARKER)) {
      throw new Error("The public Fatima offline screen could not be prepared.");
    }
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.put(OFFLINE_URL, response);
  })());
  // Let the browser activate updates after existing app windows close. Never force a reload.
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(OFFLINE_CACHE_PREFIX) && name !== OFFLINE_CACHE)
      .map(name => caches.delete(name)));
  })());
});

function isDocumentNavigation(request) {
  const url = new URL(request.url);
  return request.method === "GET" && request.mode === "navigate"
    && url.origin === self.location.origin
    && url.pathname !== "/api" && !url.pathname.startsWith("/api/")
    && !/\.(?:pdf|csv|xlsx?|docx?|zip|apk|aab)$/i.test(url.pathname)
    && request.headers.get("rsc") !== "1"
    && !(request.headers.get("accept") ?? "").includes("text/x-component")
    && !url.searchParams.has("_rsc") && !/\.rsc$/i.test(url.pathname);
}

async function offlineNavigation() {
  const cache = await caches.open(OFFLINE_CACHE);
  const offline = await cache.match(OFFLINE_URL);
  const body = offline?.body ?? '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fatima Agro | Offline</title><body><main><h1>Fatima Agro</h1><h2>You are offline.</h2><p>Reconnect to sign in, view current records and save work.</p><a href="">Try again</a> <a href="/account">Account sign-in</a></main></body></html>';
  return new Response(body, { status: 503, headers: {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  } });
}

self.addEventListener("fetch", event => {
  if (!isDocumentNavigation(event.request)) return;
  // HTTP errors and every online page pass through unchanged. Only a network failure
  // gets the generic offline503 screen; no account, API, document or RSC response is saved.
  event.respondWith(fetch(event.request).catch(() => offlineNavigation()));
});
