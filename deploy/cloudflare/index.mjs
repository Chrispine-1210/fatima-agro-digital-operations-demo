import { createProxy } from "../vercel/api/index.mjs";

const DEFAULT_UPSTREAM_ORIGIN = "https://fatima-agro-operations-demo.chrispine-ala.chatgpt.site";

/** Cloudflare entry point for the same reviewed, fixed-origin gateway as Vercel. */
export function createCloudflareGateway(env = {}, fetcher = globalThis.fetch) {
  return createProxy({
    FATIMA_UPSTREAM_ORIGIN: env.FATIMA_UPSTREAM_ORIGIN ?? DEFAULT_UPSTREAM_ORIGIN,
  }, (url, init) => {
    const headers = new Headers(init.headers);
    // The shared gateway removes wire Content-Encoding/Length headers. Ask for
    // identity bytes explicitly so Workers and Node use the same body contract.
    headers.set("Accept-Encoding", "identity");
    return fetcher(url, { ...init, headers });
  });
}

export default {
  fetch(request, env) {
    return createCloudflareGateway(env)(request);
  },
};
