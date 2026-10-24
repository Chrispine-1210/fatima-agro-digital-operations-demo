# Fatima Agro Vercel gateway

This deployment serves the Fatima site through Vercel. The complete application still runs on Cloudflare Workers, using one D1 database and the existing developer-controlled account register. This is a gateway, not a separate Next.js application or independent database.

Deploy this directory as a standalone Vercel project with framework preset **Other**, Node.js **24.x**, and no build command. Set the server environment variable **FATIMA_UPSTREAM_ORIGIN** to the exact HTTPS origin of the Cloudflare application, for example `https://fatima-agro.example.workers.dev`. Paths, credentials, query parameters and fragments are rejected in this setting. Never set it to this Vercel deployment's own origin.

The gateway validates unsafe requests against its actual request URL before translating the origin for Cloudflare. It forwards only reviewed browser and Vinext routing headers, preserves session cookies without widening their domain, passes streamed responses and redirects, and disables shared caching. Upstream errors return a generic unavailable response.

Users sign in separately on the Vercel and Cloudflare hostnames. Both use the same accounts and records. Cookies remain Secure, HttpOnly, SameSite=Strict and host-only. Account passwords, the password pepper and D1 secrets do not belong in this gateway.

Cloudflare sees Vercel's outbound network address. The current Cloudflare network login limit can therefore be shared by Vercel users. Do not trust arbitrary forwarded IP headers to bypass that protection. A future authenticated proxy identity scheme must be reviewed before changing it.

Run `npm test` before deployment. After deployment verify public pages, static images, direct portal refresh, issued-account sign-in, permitted business actions, sign-out, foreign-origin rejection, and camera access over HTTPS. Confirm that the request path and query reach the handler unchanged on the actual Vercel deployment.

Official references: [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json).
