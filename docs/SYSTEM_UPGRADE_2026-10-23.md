# Fatima system upgrade — 23 October 2026

Prepared by Aothothe Technologies for Fatima Agro Dealers and General Suppliers, Kanengo, Lilongwe. This edition improves the working presentation across customer, department and executive journeys. “10x” is the requested ambition, not a measured performance claim. The scope below records concrete delivered changes.

## Customer and public experience

- Catalogue search matches multiple words. Category, availability and sorting controls use the URL and survive refresh; result counts, active filters, clear and empty-state recovery make the current view understandable.
- Product cards show stock limits and cart state. Quantity changes stay as editable drafts until explicitly saved; checkout blocks unsaved or invalid drafts. Delivery requests require the relevant location details.
- Customer account sections support keyboard navigation. Order history has search/status controls and next-step guidance. Public mobile navigation and product discovery retain Fatima branding and image attribution.
- Existing native account governance remains unchanged: issued Fatima usernames/passwords, no third-party sign-in, no public registration/recovery, developer-managed account directives. Existing credentials remain valid.

## Department operations

- Shared registers add search, status filters, numeric/date/text sorting, pagination and filtered CSV. Export uses only the authorised rows already loaded and displayed columns; spreadsheet formula prefixes are escaped.
- Department navigation links to existing sections/forms rather than removing accounting, HR, procurement or administration functions. Role-scoped summaries and review counts expose the next work items.
- The staff shell shows connection/freshness state, aborts discarded reads and provides retry paths. Last loaded records remain visible when a refresh fails. A saved transaction followed by a failed reload is reported as saved with refresh required.
- Notification search and unread filtering use existing scoped events and read-state actions.

## Executive workbench

- Attention cards derive out-of-stock lines, overdue invoices, blocked/overdue decisions, executive approvals, departmental review queues and overdue tasks from the existing CEO aggregate. Each card links to the relevant evidence; decision drill-down applies the same count predicate.
- Decision filters combine department, operating unit, priority, status, all search words, due horizon and sort. Malawi calendar dates determine overdue status. Closed decisions are excluded from date-based attention filters.
- A stock risk can prepare an editable management follow-up with SKU/unit evidence, responsible department and suggested priority. No record is created until the CEO reviews the draft, sets its due date and saves. This does not issue a purchase order or bypass independent departmental approvals.
- Financial balances remain ledger-derived. No net profit, inventory valuation, live cash settlement or unrecorded commercial target is invented.

## Transaction integrity

- Portal input streams are capped at 32,000 actual UTF-8 bytes; invalid UTF-8 and overflow are rejected before persistence. Bounded request bodies are consumed before origin/content-type denial, preserving subsequent Worker requests. Origin and authority checks still precede mutation.
- Purchase-order issuance rechecks that the operating unit is active and still permits procurement, even after request approval.
- Attendance and leave cannot predate employment. Leave attendance requires a covering independently approved leave record. Payroll preparation rejects a month before an employee's hire month. These are preparation controls, not payroll remittance.

## Verification

The final source suite passed **80 tests**, TypeScript passed, the production build passed and all **3 release artifact checks** passed. A final single browser run passed **45 scenarios in 9.2 minutes**: 4 department, 10 executive, 6 native account, 11 device/inventory/receipt and 14 public/customer scenarios. This includes all thirteen issued rehearsal roles, logout/replacement sessions, protected direct routes, numeric sorting and filtered export, phone layouts, real local barcode image decoding, local receipt OCR and isolated thermal printing. Physical hardware commissioning is not implied.

The current source/build confidentiality scan checked **291 text files** and found no issued passwords or server pepper; embedded source credential patterns were clean. `git diff --check` passed. Browser screenshots were visually reviewed. Initial new-workflow acceptance passed 9 of 11; two exact-label checks exposed inconsistent select labels, which were made explicit before the final 45-scenario pass. Exact source/version/deployment identity is recorded in the external `RELEASE.json` after publication. No source hash is embedded here because the document is part of that source state.

Browser fixtures use synthetic intercepted business data; native account tests use a separate local QA environment/database. Live production credentials, the pepper and the private developer vault are never copied into tests, source, logs or browser bundles. The confidential account register issued on 22 October remains the access handover.

## Operator acceptance and next execution

| Owner | Next procedure | Evidence |
| --- | --- | --- |
| Chrispine Mndala — Founder, CTO, Lead Systems Architecture Engineer | Review source/build, publish exact version, retain rollback and verify native account read access | Release manifest, matching source tree, native deployment outcome and sanitised checks |
| Wilson Chipeta — proposed contributor | Walk through catalogue/cart, Finance/HR/procurement registers and executive follow-up with synthetic records; record usability findings | Dated acceptance checklist with role, viewport and record references; no passwords |
| Unrecruited implementation/support specialist | Once recruited and authorised, commission phone scanning, USB scanners and 58/80 mm thermal printing at each verified premises | Device model, paper width, scan/print samples and operator sign-off |
| Fatima management | Assign each issued identity to an accountable operator; confirm products, prices, stock, units and business launch priorities | Recorded management directives and approved source records |

The presentation retains captured email and synthetic payments, tax, payroll and delivery. External service onboarding, production backup/restore, retention and scale acceptance remain separate business launch tasks. See [account operation](FATIMA_ACCOUNTS.md), [feature evidence](FEATURE_MATRIX.md), [device commissioning](DEVICE-INTEGRATIONS.md) and [deployment](DEPLOYMENT.md).
