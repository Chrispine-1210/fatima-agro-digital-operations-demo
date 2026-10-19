# Readiness, roadmap and acceptance

Internal targets updated 19 October 2026. Chrispine owns every critical task until an additional Aothothe assignment is confirmed. Wilson is proposed; the UX/QA/Data/Adoption position is vacant. The CEO has no preparation tasks. No row implies a production promise or signed client acceptance.

## Presentation readiness — complete with actual evidence

| Gate | Owner | Acceptance criterion | Evidence location / status |
| --- | --- | --- | --- |
| Public confidentiality | Chrispine | Public/customer pages and responses expose no internal administration, private executive, HR/payroll or campaign data | Local browser access denials, source/boundary tests and built-artifact checks passed; hosted access rehearsal pending. |
| Customer journey | Chrispine | Register/sign-in/profile/cart/checkout/own orders work on final build; cross-account direct request is denied | Local customer browser journey passed; provider-authenticated hosted rehearsal pending. |
| Accounting integrity | Chrispine | Linked invoice/payment/receipt/credit/expense/reconciliation reports agree with underlying records | Source/domain tests and local finance browser journey passed; qualified production review remains a separate gate. |
| Procurement integrity | Chrispine | Separate approval precedes PO; receipts update inventory and bills; duplicate/over-receipt blocked | Source/domain tests and local procurement browser journey passed. |
| HR confidentiality | Chrispine | Employee/onboarding/leave/payroll-preparation flows work with synthetic data and restricted roles | Source/domain tests and local HR browser journey passed; synthetic data only. |
| HQ/units/access/tasks | Chrispine | Roles and units enforced on server; director decisions and task evidence/audit traceable | Source/domain authorization checks passed; complete admin browser and hosted assignments are not claimed. |
| Notifications/campaigns | Chrispine | Correct audience, consent, unsubscribe, duplicate prevention and captured delivery states demonstrated | Recipient/unit controls passed in source tests; captured campaign/deduplication/unsubscribe passed in the internal browser journey. No external send. |
| Routing/reliability | Chrispine | Direct URLs, refresh, history, small screen, loading/empty/error/validation and image fallback checked | Local public/customer browser checks passed, including Back/Forward, refresh, mobile and image fallback; final internal mobile check passed. |
| Release/fallback | Chrispine | Exact revision/version/URL recorded, local fallback rehearsed, synthetic reset repeatable | Local browser/reset and isolated recovery verified; publication outcome and exact identity are recorded in delivered RELEASE.json. |
| Documentation | Chrispine; proposed Wilson support | Script, status, sources, team plan, runbook and known limitations reflect final implementation | Pack, procedures, evidence and known limitations prepared; human business acceptance remains pending. |

Stop presentation of any path that leaks restricted data, corrupts stock/financial records or claims an external effect that did not occur. Minor visual issues may be recorded with a workaround. A missing business dependency must remain visible and cannot be converted to “complete” by a polished screen.

## Proposed post-presentation priorities

| Priority / target | Aothothe owner | Dependencies | Acceptance criterion |
| --- | --- | --- | --- |
| P0: 20 Oct meeting record | Chrispine; proposed Wilson notes | Actual 19 Oct decisions | Decisions, issues, shown revision and follow-up logged; no assumed acceptance. |
| P0: 23 Oct business-data and authority baseline | Chrispine | Authorized records and qualified review | Legal identity/location, catalogue, permits, tax/pricing owners and publication data traced to evidence; missing inputs blocked from live sale. |
| P0: before real data | Chrispine | Host/database/identity decisions, approved privacy/retention | Durable storage, trusted sessions, MFA for privileged roles, unit/customer ownership, audit, backup/restore and incident handling independently checked. |
| P1: before financial use | Chrispine with a qualified Malawi accountant/tax adviser | Current rules and an agreed chart of accounts | Amount/rounding/posting/credit/reconciliation controls reviewed; opening balances approved; tax categories validated by SKU; current EIS requirements mapped. |
| P1: before live checkout | Chrispine | Payment-provider approval, stock baseline, delivery/returns policy | Payment confirmation verified on server, reconciliation proven, duplicate prevention, secure refund authorization and customer terms approved. |
| P1: before live messaging | Chrispine; proposed Wilson campaign preparation | Client-owned provider, consent/legal review and explicit campaign authorization | Sender setup, consent, unsubscribe, suppression, rate limits, bounce/complaint handling, deduplication and audit tested; no unauthorized send. |
| P1: recruitment plan by 23 Oct | Chrispine | Budget/availability and recruitment agreement | Vacant specialist role brief and assessment prepared; capacity counted only after an actual appointment. |
| P2: Nov controlled Malawi pilot | Chrispine; recruited specialist if appointed | Verified products/process owners, above gates | Bounded users/location, measured real stock and financial reconciliation, observed usability, signed pilot results and support arrangements. |
| P2: Nov–Dec market feasibility | Chrispine; proposed Wilson research | Real interviews, tax/broker/importer evidence and transport quotes | Candidate market selected from documented demand, landed cost, regulatory eligibility and route trial; no unsupported availability claim. |
| P3: later branches/integrations | Chrispine | Stable pilot, approved scope/resources | Explicit unit ownership, functions, approval limits, stock movements, consolidated reports and recovery controls proved before scaling. |

## Acceptance evidence format

For each check record requirement ID; final revision/environment; actor/role/unit; data IDs; exact steps; expected and observed results; status (pass/fail/blocked/not run); screenshot/log path; timestamp; defect/workaround; reviewer. A simulation can pass a simulation's acceptance check while its live integration remains blocked. These are separate statuses.

## Preparation schedule

**17–18 October:** Aothothe completes critical implementation, code review, relevant tests and role rehearsal, then freezes the build. **19 October before the meeting:** Chrispine confirms hosting/local fallback, test identities, dataset reset and screenshots, then conducts the demonstration. **After the meeting:** Aothothe publishes factual internal decisions and the next acceptance gates. Proposed support work does not reduce Chrispine's accountability.

## Candidate evidence update - 19 October

On 19 October, 34 source tests, TypeScript, the production build and 2 release-artifact checks passed. Lint reported 0 errors and 17 warnings; the secret scan checked 176 working files and 4 commits. Installed production audit: 0 vulnerabilities; full toolchain audit: 24 vulnerable-package records (18 high, 5 moderate, 1 low, 0 critical). All three local browser journeys passed across two recorded runs: customer/public 2 passes and the affected internal journey 1 pass. These are combined verified journeys, not a claimed single three-test green run. Local recovery failed at export and is being corrected; deployment and authenticated hosted rehearsal remain open. See document 09 for exact logs and limits.
