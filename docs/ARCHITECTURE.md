# Architecture and control boundaries

Executive extension (21 October 2026): the CEO-only `/hq/executive` workspace projects financial summaries, six monthly financial flows, departmental workload counts, active inventory-unit SKU risks and operating-unit status totals from the existing records. `lib/server/executive.ts` explicitly selects aggregate fields; raw HR, customer and campaign collections are excluded. `/hq` routes an approved CEO directly to this view. Other staff retain their existing workspaces.

Management decisions are CEO-recorded follow-up entries with accountable department/unit, priority, due date, progress evidence and a versioned closure history. Creation and updates use idempotency keys; stale versions are rejected. This register does not approve payments, payroll, stock or access. Eligible existing CEO access and unit-activation reviews retain independent review and application rules. The additive decision-array migration preserves existing state. See [executive dashboard](EXECUTIVE_DASHBOARD.md) for metric definitions, use and access setup.

Current extension (21 October 2026): [inventory and device execution](INVENTORY-EXECUTION.md) adds internal SKU/Code 128 identities, branch stock counts and transfers with independent review, verified unit locations, local receipt OCR/metadata, and protected thermal/A4 receipt printing. The additive normalizer in `lib/server/state-migrations.ts` is applied to persisted state and domain entry points; existing balances, accounts and historical money are retained. Generated OCR runtime assets are pinned, self-hosted and copied during prebuild. See [device integration details](DEVICE-INTEGRATIONS.md) for data handling and hardware limits.

Source review: 18 October 2026. Final build, hosted identity, persistence and browser outcomes remain subject to [current release evidence](../aothothe-pack/09-release-evidence.md). The September browser-memory architecture is historical.

## Runtime and data flow

The existing React 19/TypeScript interface uses Next-compatible routes compiled by Vinext/Vite for a Cloudflare Worker-compatible Sites runtime. Public routes and customer routes are separate from protected `/hq` workspaces. Shared records are defined in `lib/portal-types.ts`; domain actions, permissions, identity resolution and storage live under `lib/server/`.

`/api/session` resolves identity and registration state. `/api/portal` reads scoped snapshots and applies validated actions. D1 binding `DB` stores the `presentation-v2` state record in `portal_state`. A compare-and-update revision guard commits linked ledgers, stock and audit changes together, retries conflicting writes up to five times, and rejects state above the configured approximately 4 MB bound. This is a presentation store, not a production relational/accounting design.

## Identity and authorization

Hosted identity comes from trusted Sites identity headers on the configured hostname. Fatima profile registration links a customer record to the provider identity; it does not create a Fatima password or staff role. Password recovery remains with the provider. `HQ_ADMIN_EMAILS` can identify approved initial administrators, but administrator status does not grant routine accounting, HR or executive approval rights. Confirm hosting's trusted-header boundary and sign-in behavior in an authenticated deployment rehearsal.

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

## Restricted hosted role bootstrap

Deployment supports explicit, empty-by-default `FATIMA_BOOTSTRAP_CEO_EMAILS` and `FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS` lists for approved initial business approvers. Configure only distinct, authorized people through protected hosting configuration, never guessed addresses. Each person signs in using their provider identity; verify the granted role and audit record, then remove both bootstrap lists. The grant is recorded once so stale configuration cannot silently undo a later demotion. Removing a bootstrap list does not itself revoke an already assigned role; use the normal independently approved role-change process. No identities are configured by this documentation and hosted bootstrap verification remains pending.
