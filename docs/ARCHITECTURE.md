# Architecture and control boundaries

System extension (23 October 2026): URL-backed catalogue state and explicit cart drafts improve customer flows. Staff registers operate only on existing authorised snapshots, adding local search/sort/pagination and displayed-column CSV exports with formula-prefix escaping. Department command navigation indexes rendered permitted forms; discarded reads are aborted and stale/offline states remain explicit. The executive workbench derives attention queues from the existing aggregate projection and prepares reviewed stock-risk decision drafts. No new data collection, permission, provider or database schema is introduced. See [current upgrade evidence](SYSTEM_UPGRADE_2026-10-23.md).

Portal POST bodies are stream-capped at 32,000 UTF-8 bytes and bounded input is drained before origin/content-type denial. Purchase-order issuance rechecks active-unit procurement authority. HR attendance/leave enforce employment dates; Leave attendance requires independently approved covering leave and payroll preparation cannot precede the hire month. These checks run before the revision-guarded mutation commits.

Executive extension (21 October 2026): the CEO-only `/hq/executive` workspace projects financial summaries, six monthly financial flows, departmental workload counts, active inventory-unit SKU risks and operating-unit status totals from the existing records. `lib/server/executive.ts` explicitly selects aggregate fields; raw HR, customer and campaign collections are excluded. `/hq` routes an approved CEO directly to this view. Other staff retain their existing workspaces.

Management decisions are CEO-recorded follow-up entries with accountable department/unit, priority, due date, progress evidence and a versioned closure history. Creation and updates use idempotency keys; stale versions are rejected. This register does not approve payments, payroll, stock or access. Eligible existing CEO access and unit-activation reviews retain independent review and application rules. The additive decision-array migration preserves existing state. See [executive dashboard](EXECUTIVE_DASHBOARD.md) for metric definitions, use and access setup.

Current extension (21 October 2026): [inventory and device execution](INVENTORY-EXECUTION.md) adds internal SKU/Code 128 identities, branch stock counts and transfers with independent review, verified unit locations, local receipt OCR/metadata, and protected thermal/A4 receipt printing. The additive normalizer in `lib/server/state-migrations.ts` is applied to persisted state and domain entry points; existing balances, accounts and historical money are retained. Generated OCR runtime assets are pinned, self-hosted and copied during prebuild. See [device integration details](DEVICE-INTEGRATIONS.md) for data handling and hardware limits.

Original source review: 18 October 2026. Current source, browser and publication evidence is recorded in [the 23 October upgrade](SYSTEM_UPGRADE_2026-10-23.md) and the external release manifest. The September browser-memory architecture and dated Aothothe release candidates remain historical.

## Runtime and data flow

The existing React 19/TypeScript interface uses Next-compatible routes compiled by Vinext/Vite for a Cloudflare Worker-compatible Sites runtime. Public routes and customer routes are separate from protected `/hq` workspaces. Shared records are defined in `lib/portal-types.ts`; domain actions, permissions, identity resolution and storage live under `lib/server/`.

`/api/session` resolves identity and registration state. `/api/portal` reads scoped snapshots and applies validated actions. D1 binding `DB` stores the `presentation-v2` state record in `portal_state`. A compare-and-update revision guard commits linked ledgers, stock and audit changes together, retries conflicting writes up to five times, and rejects state above the configured approximately 4 MB bound. This is a presentation store, not a production relational/accounting design.

## Identity and authorization

Current authentication (22 October 2026) uses Fatima-issued usernames and passwords. This supersedes the earlier provider-linked account design. Public routes accept anonymous visitors; protected pages and APIs resolve an opaque, revocable Fatima session and the current stored role/unit. Provider identity headers do not grant access. The user explicitly requested independent Fatima accounts in place of the hosting skill's default identity integration.

Private credentials, hashed sessions, attempt limits and consumed developer directives use a separate D1 `fatima_auth_state` row. Server-held pepper and bounded account-operation batches are secret runtime bindings. They do not enter the business snapshot, client bundle, source manifest or normal business export. The eight-hour host-only session cookie is Secure, HttpOnly and SameSite=Strict. See [Fatima account operation](FATIMA_ACCOUNTS.md) for provisioning, hashing, replay prevention, recovery and operating limits.

Account creation, password rotation/disabling and role/unit assignment are controlled by the developer against a recorded Fatima management / CEO directive. Managed users cannot self-register, self-recover or apply account-role changes through portal actions. Departmental transaction review controls remain separate.

Local personas require loopback, `FATIMA_LOCAL_DEMO=true` and a sufficiently long local signing secret. Their signed session expires after four hours. `/rehearsal` is local only and exists for synthetic customer/staff scenarios where hosted business roles have not been assigned. These personas assert no real appointment.

Server checks apply module access, action grants, customer ownership, unit/function restrictions and independent approvals. Public snapshots omit private records. Customer accounts receive their own records. Finance/HR and administrative capabilities are separated. Menu filtering supports these rules but is not their enforcement boundary. Final direct-request and wrong-role checks must verify the implementation.

## Controlled demonstration workflows

- Customer cart/checkout reserves synthetic stock and links orders, invoices, notifications and captured messages.
- Accounting derives balances from linked invoices, bills, payments, credits, expenses and journal entries. Reconciliation requires a separate authorized reviewer.
- Procurement requires approval before an order; partial receipts link inventory movements and supplier bills.
- HR restricts employee data and independently reviewed leave. Payroll is preparation only.
- Unit activation, access changes and tasks use evidence and reviewer boundaries. All job titles and operating units are proposed or synthetic.
- Campaign scheduling stores a due time; an authorized operator processes due captures. There is no automatic scheduler or email transport.

## Limits and production gates

Successful mutation/identity audit entries do not constitute immutable logging or universal read/export/denial monitoring. Automated backups, tested restoration, comprehensive session revocation, production retention and monitored incident response are not established by source presence. Local reset clears synthetic transactions while preserving registered account assignments and adds a reset event; hosted reset is disabled.

No bank/payment, fiscal/EIS, payroll, carrier or email provider is connected. Bank passwords are never required. Any later integration needs verified company-owned services, reviewed scope, authorization and actual sandbox/production evidence. Real data requires verified identities, privileged MFA policy, robust persistence, audit/retention, backup/restore, legal/privacy decisions and operational handover before use.

## Historical provider bootstrap

The previous provider-email bootstrap definitions and tests remain as historical compatibility code. The current hosted session resolver does not use them. Existing provider-linked account IDs and their business records are retained without automatic email matching or reassignment. Any later account-link migration must preserve those identifiers and receive separate review. Native issued accounts use independent stable IDs and explicit developer provisioning.
