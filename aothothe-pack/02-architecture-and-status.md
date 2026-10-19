# Architecture, technology and feature status

Updated 19 October 2026. Current source is materially different from the September browser-state prototype. This document records source capabilities, verified local checks and remaining hosted limits. [The release evidence record](09-release-evidence.md) must identify the actual final revision, runtime and checks.

## Technology inventory

| Item | Source / purpose | Reason |
| --- | --- | --- |
| Bundled Node 24.21.0; project requires at least 22.13 | Local runtime under the parent project's `.sites-runtime`; `package.json`, lockfile | Reproducible tooling without relying on system installation. |
| React 19, TypeScript 5.9 | `app/`, `components/`, `lib/` and package manifest | Existing typed component and domain model. |
| Next-compatible routing, Vinext 0.0.50, Vite 8 | `vite.config.ts`, routes and build scripts | Retain the existing application and configured Sites packaging. |
| Cloudflare-compatible Sites worker | Hosting association and worker build | Existing reviewable source/version/deployment workflow; final deployment remains pending. |
| D1 binding `DB` and migration | `.openai/hosting.json`, `db/schema.ts`, `drizzle/0000_yellow_zuras.sql` | Persist demonstration records across requests; target migration/runtime behavior still requires verification. |
| Guarded bounded state store | `lib/server/store.ts` | One revision-guarded update keeps linked stock, ledger and audit changes together. Approximately 4 MB bound; not production relational storage. |
| Server domain and permissions | `lib/server/domain.ts`, `permissions.ts`, `errors.ts` | Validation, action/module grants, customer/unit scope and independent decisions. |
| Hosted identity plus linked profiles | `lib/server/auth.ts`, `app/api/session/route.ts`, `app/chatgpt-auth.ts` | Provider resolves identity; Fatima customer registration creates the linked application profile. |
| Shared UI and icons | `components/ui`, Base UI/Radix, Lucide | Reuse forms and interface primitives; final browser/accessibility behavior must be checked. |
| Node tests and Playwright | `tests/`, `playwright.config.ts` | Domain, boundary and browser evidence. The new portal-domain suite must actually run. |

## Identity, data and approval boundaries

Public pages receive public snapshots. Customer reads/actions require identity and ownership. Internal APIs enforce module/action grants and relevant unit/functions. Customer profile registration never assigns an internal job. Initial hosted administrator bootstrap is separate from finance, HR and executive approval authority.

Hosted identity headers are accepted on the configured hostname behind the host's identity boundary; this must be verified on the actual deployment. Provider account creation/recovery is handled by the provider, and Fatima stores no separate password. Full provider-authenticated sign-in/profile/recovery behavior remains pending until rehearsed.

Local fictional personas use loopback-only configuration and a signed four-hour session. They demonstrate unassigned internal roles without asserting appointments. Their switcher is unavailable on hosting. An Aothothe-operated executive capability is a synthetic role, not a verified CEO identity.

Successful mutations and identity creation add audit entries. This does not establish immutable audit storage, logging of every read/export/denial, complete session revocation, automatic backup or a verified retention policy. Production use needs those controls reviewed and evidenced.

## Feature register

| Area | Current source capability | Status / final evidence needed |
| --- | --- | --- |
| Public catalogue | Search/filter/detail/enquiry, local photos/credits and fallback | Local public browser checks passed: direct routes, three screen sizes, all six catalogue photographs and image fallback. Exact stock/SKU data unverified. |
| Customer identity/profile | Provider sign-in and linked Fatima profile/preferences; provider recovery route | Source present. Hosted authenticated rehearsal pending; local persona evidence is separate. |
| Cart/order | Quantities, checkout, confirmation, timeline and own orders | Local customer browser and source/domain checks passed for persistence, ownership and order controls. External effects simulated; hosted sign-in remains separate. |
| Accounting | Invoice, bill, payment/receipt, expense, credit, statement, reconciliation and reports | Source/domain controls and local finance browser journey passed. Demonstration accounting; no bank/payment/tax connection. |
| HR | Synthetic employee, onboarding, leave, attendance, payroll preparation | Source/domain controls and local HR browser journey passed, including independent review. No payroll remittance or live personal data. |
| Procurement | Supplier, request, approval, PO, partial receipt, stock and linked bill | Source/domain controls and local procurement browser journey passed. Live supplier/stock processes remain unverified. |
| HQ/units/access/tasks | Evidence, functions, activation, role requests and task review | Source/domain unit, independent-person and audit checks passed. No separate complete admin browser journey or hosted assignments claimed. |
| Notifications | Account/order/procurement/stock events and read state | Source/domain recipient, ownership and branch-scope checks passed. A separate notification-centre browser walkthrough is not recorded. |
| Campaigns | Preview/count/consent/schedule/capture/status/unsubscribe/deduplication | Source/domain controls and local preview/capture/deduplication/unsubscribe browser journey passed. Captured email only; scheduled captures require an operator. |
| Reset/storage | D1 state and local administrator reset preserving accounts | Build/runtime/local setup and browser synthetic reset passed. Hosted reset disabled; deployed migration/persistence pending. |
| Recovery | Source/version rollback and documented isolated state restoration | Local verification script implemented; export attempt failed and is being corrected. No final recovery pass or hosted guarantee. |
| External providers | Payments, bank feeds, EIS/tax, payroll, delivery and email transport | Not connected; no successful external effect claimed. |

For the presentation, source implementation, tested behavior and simulated external effects remain separate statuses. The final release record may promote only checks that were actually performed on the stated revision.

Hosted bootstrap configuration uses empty-by-default `FATIMA_BOOTSTRAP_CEO_EMAILS` and `FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS` for distinct approved identities, with one-time audited grants. Actual sign-in, grant verification and removal of bootstrap lists remain deployment tasks. No identity or company appointment is invented here; see the operations runbook for the procedure.

## Candidate verification - 19 October

On 19 October, 34 source tests, TypeScript, the production build and 2 release-artifact checks passed. Lint reported 0 errors and 17 warnings; the secret scan checked 176 working files and 4 commits. Installed production audit: 0 vulnerabilities; full toolchain audit: 24 vulnerable-package records (18 high, 5 moderate, 1 low, 0 critical). All three local browser journeys passed across two recorded runs: customer/public 2 passes and the affected internal journey 1 pass. These are combined verified journeys, not a claimed single three-test green run. Local recovery failed at export and is being corrected; deployment and authenticated hosted rehearsal remain open. See document 09 for exact logs and limits.
