# Current feature and evidence register

Updated 21 October 2026. [Management release evidence](MANAGEMENT_RELEASE_2026-10-21.md) records current checks; historical presentation records remain in the Aothothe pack. All transactions are synthetic demonstration records.

| Area | Implemented behavior | Evidence / operating boundary |
| --- | --- | --- |
| Public experience | Photo/vector backgrounds, team actions, location/collection/delivery cards, responsive catalogue and enquiry/feedback states | Nine current public UX scenarios passed; product availability and prices need business confirmation. |
| Customer identity and orders | Provider-linked profile, cart/checkout, own orders/timeline and own receipt print preview | Ownership/domain checks passed; current receipt refresh/printing browser checks passed. Hosted authenticated role rehearsal remains separate. |
| Accounting | Invoices, bills, payments/numbered receipts, credits, expenses, statement matching and balanced reports | Source suites passed; receipt/metadata/printing browser evidence current. No bank settlement or fiscal submission. |
| HR | Synthetic employee onboarding, attendance, independent leave review and payroll preparation | Current source suites cover controls; earlier internal UI evidence is historical. No salary release or statutory payroll processing. |
| Procurement | Supplier, approved request, purchase order, partial goods receipt, linked stock/bill | Domain tests cover linked records and duplicate prevention. Supplier orders are not externally sent. |
| Inventory devices | Unique SKU/barcode identities, USB/manual lookup, phone-camera and image decode, printable Code 128 labels | Actual local image-decoding round trip passed; synthetic camera track cleanup passed. Physical devices need commissioning. |
| Stock control | Per-unit balances, evidenced counts, stale-count protection, independently approved transfers and audit history | Domain and current browser tests passed. Balances represent available units after order reservations. Transfers record completed handover; no transit/carrier tracking. |
| Receipt capture | Phone/file preview, local OCR, editable extraction, explicit reference/note and fingerprint | Actual local OCR and metadata-only save passed with no observed external HTTP. Images remain on the device; no image archive. |
| Printing | Protected numbered receipt, 58 mm/80 mm/A4 layouts and isolated print dialog | Current browser checks and synthetic PDFs passed; physical paper/scanner acceptance remains open. |
| Locations | Internal address/town/country, optional GPS, explicit device location and map links | Mock GPS/save/refresh browser test passed; actual premises positions require verification. |
| Administration | Units/functions, activation/access reviews, tasks and role-scoped audit | Source suites passed; administrator does not receive business approval rights. No actual recruitment or appointment implied. |
| Notifications and campaigns | Scoped notifications/read state; consent-aware campaigns, unsubscribe and scheduled capture processing | Source suites passed. Email is captured, never sent; no automatic background sender. |
| Persistence and recovery | Revision-guarded D1 state with additive migration; local reset and prior-version rollback | Migration preserves stock, money and access. Production backup/restore acceptance, retention and scale upgrade remain required. |

[Inventory execution](INVENTORY-EXECUTION.md) provides practical steps, hardware acceptance and team ownership. [Architecture](ARCHITECTURE.md) describes runtime/control boundaries. Current release identifiers and delivered artifacts are recorded after publication in the accompanying RELEASE.json.
