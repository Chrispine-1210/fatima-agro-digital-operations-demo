/** Vercel gateway. Cloudflare remains the application runtime and database owner. */
const REQUEST_HEADERS = [
  "accept", "accept-language", "cache-control", "content-type", "cookie",
  "if-match", "if-none-match", "if-modified-since", "if-unmodified-since",
  "range", "if-range", "user-agent", "sec-fetch-site", "sec-fetch-mode", "sec-fetch-dest",
  "rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch",
  "next-url", "next-action", "x-rsc-action", "x-vinext-interception-context",
  "x-vinext-mounted-slots", "x-vinext-rsc-render-mode",
];
const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const HOP_HEADERS = [
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade", "content-length", "content-encoding",
];
function privateHeaders(headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Vercel-CDN-Cache-Control", "no-store");
  return headers;
}
function failure(status, message, code) {
  return Response.json({ error: message, code }, {
    status, headers: privateHeaders(new Headers({ "X-Content-Type-Options": "nosniff" })),
  });
}
function configuredOrigin(env) {
  const raw = env.FATIMA_UPSTREAM_ORIGIN;
  if (typeof raw !== "string" || !raw || raw !== raw.trim() || /[?#]/.test(raw)) throw new Error("Invalid upstream");
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/") throw new Error("Invalid upstream");
  return url.origin;
}
function rewrittenLocation(value, upstreamUrl, publicOrigin) {
  const location = new URL(value, upstreamUrl);
  return location.origin === upstreamUrl.origin
    ? `${publicOrigin}${location.pathname}${location.search}${location.hash}`
    : value;
}
function validCookie(cookie) {
  // Fatima uses host-only cookies. Never widen a cookie's scope on the gateway.
  if (/(?:^|;)\s*domain\s*=/i.test(cookie)) return false;
  if (!cookie.startsWith("__Host-fatima_session=")) return true;
  return /;\s*secure(?:;|$)/i.test(cookie)
    && /;\s*httponly(?:;|$)/i.test(cookie)
    && /;\s*samesite=strict(?:;|$)/i.test(cookie)
    && /;\s*path=\/(?:;|$)/i.test(cookie);
}

/** Injected transport keeps security and byte-preservation tests independent of hosting. */
export function createProxy(env, fetcher = globalThis.fetch) {
  return async function proxy(request) {
    let upstreamOrigin, publicUrl;
    try {
      upstreamOrigin = configuredOrigin(env);
      publicUrl = new URL(request.url);
      if (publicUrl.origin === upstreamOrigin) throw new Error("Upstream loop");
    } catch {
      return failure(503, "Fatima hosting configuration requires developer review.", "HOSTING_CONFIGURATION");
    }
    if (!METHODS.has(request.method)) return failure(405, "This request method is not supported.", "METHOD");
    const unsafe = request.method !== "GET" && request.method !== "HEAD";
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    if (unsafe && (origin !== publicUrl.origin || (fetchSite && !["same-origin", "none"].includes(fetchSite)))) {
      return failure(403, "Request origin was not accepted.", "ORIGIN");
    }
    // Assign path/search separately: a //pathname must never replace the fixed hostname.
    const upstreamUrl = new URL(upstreamOrigin);
    upstreamUrl.pathname = publicUrl.pathname;
    upstreamUrl.search = publicUrl.search;
    const headers = new Headers();
    const connectionHeaders = new Set((request.headers.get("connection") ?? "").toLowerCase().split(",").map(value => value.trim()));
    for (const name of REQUEST_HEADERS) {
      if (connectionHeaders.has(name)) continue;
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    // Validation precedes translation. No forwarded/identity headers are trusted.
    if (origin === publicUrl.origin) headers.set("Origin", upstreamOrigin);
    const init = { method: request.method, headers, redirect: "manual", signal: AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]) };
    if (unsafe && request.body) { init.body = request.body; init.duplex = "half"; }
    let upstream;
    try { upstream = await fetcher(upstreamUrl.href, init); }
    catch { return failure(502, "Fatima is temporarily unavailable. Please try again.", "UPSTREAM_UNAVAILABLE"); }
    try {
      const responseHeaders = new Headers(upstream.headers);
      const cookies = upstream.headers.getSetCookie();
      if (!cookies.every(validCookie)) {
        await upstream.body?.cancel();
        return failure(502, "Fatima account delivery requires developer review.", "UPSTREAM_COOKIE");
      }
      const hopNames = (responseHeaders.get("connection") ?? "").split(",").map(value => value.trim()).filter(Boolean);
      for (const name of [...HOP_HEADERS, ...hopNames]) responseHeaders.delete(name);
      responseHeaders.delete("Set-Cookie");
      for (const cookie of cookies) responseHeaders.append("Set-Cookie", cookie);
      for (const name of [...responseHeaders.keys()]) if (/^(?:x-oai-|x-openai-|x-middleware-)/i.test(name)) responseHeaders.delete(name);
      const location = responseHeaders.get("Location");
      if (location) responseHeaders.set("Location", rewrittenLocation(location, upstreamUrl, publicUrl.origin));
      privateHeaders(responseHeaders);
      // Node fetch has decompressed the body; stale wire encoding/length must not survive.
      const noBody = request.method === "HEAD" || [204, 205, 304].includes(upstream.status);
      if (noBody) await upstream.body?.cancel();
      return new Response(noBody ? null : upstream.body, {
        status: upstream.status, statusText: upstream.statusText, headers: responseHeaders,
      });
    } catch {
      await upstream.body?.cancel().catch(() => {});
      return failure(502, "Fatima returned an unavailable response. Please try again.", "UPSTREAM_RESPONSE");
    }
  };
}

export default { fetch: request => createProxy(process.env)(request) };
