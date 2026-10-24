# Fatima Agro: Cloudflare and Vercel hosting

The safe initial rollout adds two hosted entry points while retaining the current application and database: Vercel gateway → developer-owned Cloudflare gateway Worker → existing Sites-managed Cloudflare application and D1. The Cloudflare entry point can also be used directly. Both entry points retain the exact existing Fatima-issued identities and operational records. No database copy or credential reissue is required for this gateway rollout.

Provider staging files do not prove a deployment. Cloudflare and Vercel account authentication, gateway configuration, deployment and live acceptance must succeed before a new address is announced as ready. Keep the existing Sites release available. The core application and its database remain managed by Sites during this rollout; this is not an independent migration of the backend.

## Default rollout: preserve the current backend

Use the gateway sources and procedures under `deploy/cloudflare` and `deploy/vercel`. Configure the Cloudflare gateway against the exact current Sites application origin; then configure Vercel against the deployed Cloudflare gateway origin. Deploy the gateway projects from their dedicated directories, not the full Cloudflare application build. Gateway configuration must allow only the reviewed fixed upstream and preserve same-origin mutations, method, body, query strings, redirects and protected cookies. Private and API responses must bypass shared caches.

No production pepper, account provisioning batch or database export belongs in a gateway. The protected backend secrets and D1 records remain in the existing deployment. Verify both gateway addresses before announcing them. A provider login or missing account permission is an outstanding dependency until resolved; a local package does not establish an active deployment.

## Future option: migrate the complete backend

The full-application staging script below prepares a separate developer-owned Cloudflare deployment. It is an independent future migration option, not the default gateway rollout. Current database table previews include truncated payloads and are insufficient for a complete migration. Do not switch the authoritative backend until a full protected export and verified restore are available.

### Stage the complete Cloudflare build

Build using the existing release workflow first. The staging script requires actual, non-secret account and D1 database IDs. Obtain them from the intended Cloudflare account. It does not create a database, authenticate, deploy, copy a local rehearsal database or read the protected account vault.

```powershell
node scripts/prepare-cloudflare-release.mjs --account-id <CLOUDFLARE_ACCOUNT_ID> --database-id <D1_DATABASE_UUID> --name fatima-agro
node --test tests/cloudflare-release.test.mjs
```

The default output is ignored `work/cloudflare-release`. It contains copies of the compiled release, a provider-specific `server/wrangler.json`, and the packaged SQL migration files. The script preserves the original `dist` build and Sites project identity. It refuses source/build output locations, existing nonempty output directories, placeholder IDs and unreviewed extra runtime bindings. Choose a new `--output work/cloudflare-release-<release>` for subsequent packages; it never deletes an earlier package.

The staged configuration binds `DB` to database `fatima-agro`, enables the Worker address, disables version preview addresses, and sets `FATIMA_LOCAL_DEMO=false`. Cloudflare's provider-generated Worker address is determined by the selected account. No URL is guaranteed by the local package.

After authenticating the intended account, review the staged config and upload the compiled Worker with the repository's pinned Wrangler:

```powershell
node node_modules/wrangler/bin/wrangler.js whoami
node node_modules/wrangler/bin/wrangler.js deploy --config work/cloudflare-release/server/wrangler.json --dry-run
# Deploy only after completing the database and secret checks below.
node node_modules/wrangler/bin/wrangler.js deploy --config work/cloudflare-release/server/wrangler.json
```

An initial SQL migration creates only the business table. Do not run a fresh demonstration seed or replay the original account creation batches as a migration. A clean database would lose the current operational records and could create different identities.

### Preserve accounts and records before a backend migration

Obtain a complete, protected backup from the current hosting database. A table preview with truncated JSON payloads is not a backup and cannot support migration. Validate export completeness and restore into the target D1 database before serving application requests.

| Table | Required row | Preserve |
| --- | --- | --- |
| `portal_state` | `presentation-v2` | Full payload, revision and timestamp, including users, roles, units, transactions, audit and revocations |
| `fatima_auth_state` | `fatima-password-v1` | Full payload, revision and timestamp, including credential hashes, versions, enablement and processed directive IDs |

Inventory all existing rows and tables rather than assuming these two rows are the entire database. Protect any backup containing password hashes and private business information. The auth table is created lazily by the server and is absent from the checked-in initial Drizzle migration; a migration must explicitly include it. Keep auth `processed` markers so consumed directives cannot replay. Preserve row IDs and user IDs exactly. Verify source/target payload byte counts and cryptographic hashes through a private process, then reconcile business and credential counts. Coordinate a write freeze or final delta transfer so activity after the backup is not lost.

The exact production `FATIMA_PASSWORD_PEPPER` is mandatory to preserve existing passwords. The current developer-owned recovery vault is protected with Windows DPAPI and is excluded from version control. Use a protected stdin helper to transfer required secret values directly into provider secret tooling. Never place the pepper, issued passwords, account-operation JSON, provider tokens or database backups in tracked files, shell arguments, terminal output, screenshots or the deployment package. Do not use the isolated local QA pepper or accounts.

`FATIMA_ACCOUNT_BATCH_1`, `_2` and `_3` are developer provisioning directives, not business-data backups. When migrating the existing auth state, consumed batches do not need replay. Install only reviewed required runtime secrets; do not regenerate the pepper or reissue credentials as part of hosting setup. Retain the existing deployment configuration until a tested rollback is available.

## Vercel gateway

Deploy the dedicated gateway project under `deploy/vercel` against the successfully deployed Cloudflare gateway origin. It must forward routes, query strings, request bodies and protected cookies while keeping the existing Sites-backed Cloudflare database authoritative. Use that directory as the Vercel project root; the Cloudflare-specific full application is not a generic Next.js Vercel build. A later complete backend migration changes the gateway's reviewed upstream only after successful restore and acceptance.

Use the gateway's documented origin setting and provider authentication procedure. Never proxy a production session through a temporary unknown origin or permit arbitrary client-selected upstream hosts. Confirm the gateway's handling of `Origin`, host headers and cookies against Fatima's same-origin mutation checks. Both the Vercel and Cloudflare addresses require independent HTTPS session acceptance. Disable shared caching for account, portal and API responses. Static assets may be cached separately.

## Acceptance and handover

For each published origin verify catalogue and images, direct portal navigation and refresh, phone layout, Fatima username/password sign-in, role restrictions, CEO dashboard, a controlled persisted business change, logout/replay denial, receipt printing, barcode scanning and browser-camera permissions. Confirm private HTML/API responses are never served from shared cache. Use controlled test data and avoid exposing credentials in evidence. Existing cookies are scoped to their original host; operators will sign in again at a new host.

Record the actual Cloudflare account/project, gateway Worker release, Vercel project/release, tested URLs, current backend origin, source commit, acceptance evidence and rollback steps. For a later independent backend migration, also record the new D1 database and restored backup reference. DNS changes and traffic cutover follow successful verification. This document records procedures; authentication and deployments remain pending until confirmed by provider results. The complete backend migration has not been performed.

Provider references: [Cloudflare Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Cloudflare D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/), [Vercel external rewrites](https://vercel.com/docs/routing/rewrites).
