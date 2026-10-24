# Fatima Agro Cloudflare gateway

This Worker gives Fatima a hostname in its own Cloudflare account. The complete application and its D1 database remain on the current Sites-managed Cloudflare runtime at `https://fatima-agro-operations-demo.chrispine-ala.chatgpt.site`. This deployment does not copy business records or issue new passwords. It depends on the existing upstream remaining available.

The Worker reuses the reviewed gateway in `../vercel/api/index.mjs`. It checks mutation origins before translating them, forwards only reviewed browser/routing headers, preserves separate host-only cookies, rewrites same-upstream redirects to the public hostname, streams bodies and disables shared caching. Its adapter explicitly requests `Accept-Encoding: identity` so the shared Node/Workers response handling uses the same byte contract. It does not accept a caller-supplied upstream hostname.

There are no D1 bindings, account credentials or secrets in this gateway. `FATIMA_UPSTREAM_ORIGIN` is a nonsecret deployment setting. Keep this Cloudflare adapter pointed at the exact HTTPS Sites application origin, without credentials, paths, queries or fragments. Do not point it at its own hostname or the Vercel gateway: that would create a request loop. Vercel may intentionally use this Cloudflare gateway as its upstream.

From the repository root, using the installed Node runtime:

```powershell
node --test tests/cloudflare-gateway.test.mjs deploy/vercel/tests/proxy.test.mjs
$gatewayOutput = Join-Path (Get-Location) 'work/cloudflare-gateway-dry-run'
node node_modules/wrangler/bin/wrangler.js deploy --config deploy/cloudflare/wrangler.jsonc --dry-run --outdir $gatewayOutput
```

After Cloudflare account authorization has completed, verify the intended account with `wrangler whoami`, set `CLOUDFLARE_ACCOUNT_ID` for that account, and run:

```powershell
node node_modules/wrangler/bin/wrangler.js deploy --config deploy/cloudflare/wrangler.jsonc
```

Record the returned Worker URL and deployed version. Check public pages, image bytes, direct portal refresh, issued-account sign-in, authorized actions, sign-out and foreign-origin rejection on the actual deployment. Accounts and business records are shared with the current application; session cookies remain separate for each hostname. Network login throttling can be shared across users behind a gateway, so do not add unverified forwarded identity headers to bypass it.

`tests/cloudflare-gateway.test.mjs` runs the actual Worker modules in Miniflare/workerd to check the Workers cookie API, binary response bytes, identity encoding, origin translation and blocked foreign-origin mutations. The separate `scripts/prepare-cloudflare-release.mjs` utility concerns a future full application migration; it is not required or used for this gateway deployment.

References: [Workers Fetch](https://developers.cloudflare.com/workers/runtime-apis/fetch/), [Workers Headers](https://developers.cloudflare.com/workers/runtime-apis/headers/), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).
