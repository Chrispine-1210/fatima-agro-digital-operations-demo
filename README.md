# Fatima Agro Digital Operations Demonstration

Presentation preparation reviewed **18 October 2026** for the CEO and shareholder meeting on **Monday, 19 October 2026**. Aothothe's delivery lead is Chrispine Mndala, Founder, CTO and Lead Systems Architecture Engineer, using the title supplied in the project request. Wilson Chipeta's contribution is proposed and the additional specialist position is vacant.

This is a synthetic-data demonstration for Fatima Agro Dealers and General Suppliers, with the client-pack location reference Kanengo, Lilongwe. Prices, stock, customers, staff, transactions and operating units are examples. No signed commercial package, verified product offer, company appointment or production approval is asserted.

## Current implementation

| Area | Source capability; final verification is recorded separately |
| --- | --- |
| Public website | Catalogue, search and filters, product details, enquiries, buying guides, image credits, contact, privacy and terms. Internal workspaces and private executive information are excluded from customer navigation. |
| Customer account | Provider-backed identity, Fatima customer profile creation and preferences, cart, demonstration checkout, own orders and notifications, support and feedback. Fatima does not issue or store a separate customer password. |
| Accounting | Invoices, supplier bills, captured payments and receipts, expenses, credit notes, statement lines, independent reconciliation and ledger-derived reports. |
| HR | Synthetic employees, onboarding, leave and independent decisions, attendance and payroll preparation. |
| Procurement | Suppliers, purchase requests, separate approval, purchase orders, partial goods receipts, inventory movements and linked supplier bills. |
| Administration | Operating units, function boundaries, role requests and decisions, task evidence and audit records. These model proposed company controls rather than confirmed appointments. |
| Notifications and campaigns | In-application events and captured email previews/messages, consent filtering, unsubscribe, duplicate prevention and manually processed due schedules. No external email is sent. |

Read [the feature register](docs/FEATURE_MATRIX.md), [architecture](docs/ARCHITECTURE.md) and [current release evidence](aothothe-pack/09-release-evidence.md). Source availability is not a test pass. Final browser, deployment and recovery evidence is pending until entered in that record.

## Customer identity and internal rehearsal

On the configured host, the customer signs in through the identity provider and creates a Fatima profile linked to that identity. Account creation or recovery at the provider belongs to the provider's own supported flow; an authenticated hosted rehearsal remains a release check. New customer registration grants no internal role. Initial administrator configuration is separate from business approval authority.

Local rehearsal provides fictional customer and staff personas only on loopback, with explicit local configuration and a signed four-hour session. It is the presentation path for internal roles that have no confirmed hosted assignment. `/rehearsal` does not grant access on the hosted site. The executive approval persona is operated by Aothothe and does not create a real executive account or assign preparation work to the Fatima CEO.

## Exact local setup

Use the existing opened checkout and bundled runtime in PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\dell\Desktop\Fatima_Agro_Digital_Transformation_Complete_Pack\.sites-publish-checkout'
$fatimaRuntime = 'C:\Users\dell\Desktop\Fatima_Agro_Digital_Transformation_Complete_Pack\.sites-runtime\node-v24.21.0-win-x64'
$fatimaNode = Join-Path $fatimaRuntime 'node.exe'
$env:Path = "$fatimaRuntime;$env:Path"
& $fatimaNode --version
& $fatimaNode 'node_modules/vinext/dist/cli.js' build
& $fatimaNode 'scripts/setup-demo.mjs'
& $fatimaNode 'scripts/start-demo.mjs'
```

The setup script preserves existing ignored `.dev.vars`, creates a random local session key if absent, and applies the packaged local D1 migration. Do not print or commit the key. The final start/build/migration results and occupied port must be confirmed in the release record. Open `http://127.0.0.1:5173/`, then `/rehearsal` for fictional roles. Do not reinstall or rebuild a frozen presentation environment without a reason. Full setup, checks and reset instructions are in [the operations runbook](aothothe-pack/03-operations-runbook.md).

## Storage and external effects

The current source uses D1 binding `DB`, with a bounded state document and guarded revision update. This replaces the earlier browser-memory demonstration. It is not a claimed production accounting architecture, automatic backup service or proven recovery system. Hosting, migration, identity and persistence must be verified on the actual deployed version.

Payments, payroll, fiscal invoices/tax filing, bank feeds, carrier bookings and email delivery are not connected. A captured payment records evidence without transferring funds. Product photographs have documented rights and illustration labels; exact commercial packaging and product-specific tax treatment remain unverified. See [image and source evidence](aothothe-pack/08-source-register.md).

## Presentation and handover

The [Aothothe pack](aothothe-pack/README.md) contains the demonstration script, technology inventory, team procedures, proposed Wilson memorandum, roadmap, growth/tax/delivery research, sources, readiness checklist and release evidence. The [September release record](docs/RELEASE_EVIDENCE.md) is historical and does not validate this implementation. Its old dashboard screenshots are not current readiness evidence.

Keep confidential client-pack documents, credentials, real payroll/customer records and private leadership material outside public assets and public evidence. Use only disposable synthetic records in the demonstration. Follow [deployment and rollback guidance](docs/DEPLOYMENT.md) for a reviewable release; no access-policy change or external message is authorized by this README.

## Contributing and rights

Review [CONTRIBUTING.md](CONTRIBUTING.md). Report suspected security issues privately as described in [SECURITY.md](SECURITY.md).

Copyright ? 2026 Aothothe Technologies. All rights reserved. Evaluation publication does not grant commercial reuse, redistribution, sublicensing or production-operation rights. No open-source licence is granted unless Aothothe approves and publishes one separately. Third-party images retain their documented licences.

## Candidate verification - 19 October

On 19 October, 34 source tests, TypeScript, the production build and 2 release-artifact checks passed. Lint reported 0 errors and 17 warnings; the secret scan checked 176 working files and 4 commits. Installed production audit: 0 vulnerabilities; full toolchain audit: 24 vulnerable-package records (18 high, 5 moderate, 1 low, 0 critical). All three local browser journeys passed across two recorded runs: customer/public 2 passes and the affected internal journey 1 pass. These are combined verified journeys, not a claimed single three-test green run. Local recovery failed at export and is being corrected; deployment and authenticated hosted rehearsal remain open. See document 09 for exact logs and limits.
