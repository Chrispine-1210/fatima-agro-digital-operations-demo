# Current feature and evidence register

Reviewed 18 October 2026 for the 19 October presentation. This register describes current source capabilities. The [release evidence record](../aothothe-pack/09-release-evidence.md) alone records checks completed on the final revision. Historical September test totals do not validate these workflows.

| Area | Current source capability | Verification / external boundary |
| --- | --- | --- |
| Public catalogue | Search/filter/detail, enquiries, responsive states and image credits | Final browser/direct-route/image checks pending; prices, stock and photos are illustrative. |
| Customer identity | Provider sign-in plus linked Fatima profile creation; provider-based recovery | Hosted authenticated rehearsal pending; local personas do not prove hosted recovery. |
| Customer transactions | Cart quantities, checkout, unique order, timeline, own-record account | Final persistence, ownership and browser checks pending. No live settlement or dispatch. |
| Accounting | Invoice, bill, captured payment/receipt, expense, credit, statement line, reconciliation and reports | Final linked-record/balance/reviewer checks pending. No fiscal submission or bank transfer. |
| HR | Synthetic employee, onboarding, leave review, attendance and payroll preparation | Final role/privacy/validation checks pending. No statutory payroll processing or remittance. |
| Procurement | Supplier, request, independent approval, PO, partial receipt, stock and supplier bill | Final workflow/duplicate/over-receipt checks pending. No supplier order sent. |
| Administration | Units/functions, access requests/decisions, task evidence and audit | Final role/unit/independent-person checks pending. No actual company appointment implied. |
| Notifications | Scoped account/order/procurement/stock events and read state | Final recipient/ownership checks pending. |
| Campaigns | Preview, recipient count, consent, unsubscribe, deduplication, due capture and status | Captured only; no email delivery or automatic schedule execution. Final checks pending. |
| Persistence and reset | Guarded D1 state document; local administrator reset | Final actual-runtime checks pending. Reset preserves accounts; hosted reset disabled. |
| Recovery | Source/version rollback and documented isolated database recovery procedure | Backup/restore rehearsal pending; no recoverability or SLA claimed. |

The earlier seller/till-close, expansive CMS, statutory-stage, agent/dealer and contract dashboards described in September documents are not current verified capabilities merely because historical tests or screenshots exist. Demonstrate only current implemented and rehearsed paths. Future live integrations, market availability and regulated product offers require their own evidence and acceptance gates.

## Candidate verification - 19 October

On 19 October, 34 source tests, TypeScript, the production build and 2 release-artifact checks passed. Lint reported 0 errors and 17 warnings; the secret scan checked 176 working files and 4 commits. Installed production audit: 0 vulnerabilities; full toolchain audit: 24 vulnerable-package records (18 high, 5 moderate, 1 low, 0 critical). All three local browser journeys passed across two recorded runs: customer/public 2 passes and the affected internal journey 1 pass. These are combined verified journeys, not a claimed single three-test green run. Local recovery failed at export and is being corrected; deployment and authenticated hosted rehearsal remain open. See document 09 for exact logs and limits.
