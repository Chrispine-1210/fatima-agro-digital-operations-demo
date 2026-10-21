# Aothothe delivery note: inventory, devices and locations

Prepared for Fatima Agro Dealers and General Suppliers, Kanengo, Lilongwe. Implementation started 20 October 2026; verification and handover continued 21 October. This extends the public visual release with restricted operational tools. It does not establish new physical branches or announce delivery coverage.

## Operator procedures

1. Open **Orders, procurement and stock** with an approved stores, procurement or operations account. Focus the scan field. A keyboard-emulating USB scanner enters a code followed by Enter; phone users can choose camera scanning or a barcode image. Check the selected product and pack before continuing. A scan alone changes no stock.
2. Approved procurement/operations staff can assign a unique SKU and internal barcode. Product IDs remain stable, preserving historical orders. Print or download a Code 128 label, keep its white margins, and verify it with the actual scanner before labelling stock. Internal codes do not claim manufacturer GTIN allocation.
3. Select the operating unit and count **available** units after excluding units already reserved for open orders. Enter the count sheet reference and reason. Submission creates a pending request. A separate operations director reviews it; if stock has changed, decline the stale count and recount. A matching count records the check without a stock movement.
4. For a transfer, choose distinct active units approved for Inventory, enter quantity and handover evidence, and submit. Independent approval rechecks availability and posts equal outgoing/incoming movements atomically. Approval records a completed inventory transfer in this demonstration: it does not book transport, prove dispatch, or track goods in transit. Use the evidence reference for the actual handover record.
5. Open **Organisation and access → Branch and depot locations**. Enter a verified address and optional coordinate pair. Use device location only while at the premises, check the reported accuracy, and explicitly save. Map links use the saved position. Location edits do not activate units or change public delivery promises.
6. Open **Accounting → Receipts and document capture**. Scan a receipt reference or filter by receipt, invoice or payment. Preview the existing numbered payment record, select 58 mm, 80 mm or A4, and open the browser print dialog. Select the matching installed printer, correct paper, no extra browser headers/footers and suitable scaling. Cancelling or repeating printing creates no transaction. Customer accounts can print only their own joined receipts.
7. Photograph or select a receipt, extract text locally if useful, compare it with the original, and explicitly enter the reference/note to save. Link it to an existing payment receipt, goods receipt or expense. Only bounded metadata and a SHA-256 fingerprint are persisted. Download or retain the original image: the app does not archive images. OCR never books a payment, approves a document or changes stock.

## Access and execution ownership

| Work | Responsible person / proposed role | Completion evidence |
| --- | --- | --- |
| Architecture, permissions, source review and release | Chrispine Mndala — founder, CTO and Lead Systems Architecture Engineer | Source/tree identity, domain and browser results, deployment ID and rollback version |
| Device setup and operator rehearsal | Wilson Chipeta — proposed implementation contributor | Scanner suffix configuration, printer driver/paper setup, paired SKU/label scan, sample receipt output and operator checklist |
| Branch/depot stock and location support | Inventory support specialist — not yet recruited | Supervised stock count, approved transfer and verified premises location; access requested only after recruitment and approval |
| Independent business review | Assigned operations director; finance reviewer for accounting | Distinct requester/reviewer identities, decision record and evidence reference |

Wilson's proposed concentration is device commissioning, operator procedures and evidence collection. This technical task allocation supplements the contribution memorandum in the client pack; it does not execute an employment agreement, compensation, equity or authority to approve his own work. The unfilled role must not receive a real account until recruitment and access approval are complete.

## Implemented control boundaries

- Shared product identities and per-unit available balances feed the existing purchasing, goods-receipt, checkout and cancellation workflows. Count approvals and paired transfers use the same revision-guarded transaction and audit history. Requests and decisions have idempotency keys.
- Additive state normalization fills missing identities, locations and new arrays without reseeding accounts, money or stock. There is no destructive database reset in this release.
- Public/customer snapshots exclude stock controls, private unit records and receipt-capture evidence. Receipt documents join persisted payment/invoice/customer records on the server; customers receive only their own joins. Technical administrators retain security administration rather than business approval rights.
- Native camera detection and ZXing decode locally. Tesseract workers, WebAssembly and the English model load from the same site. Camera access is explicit and tracks are stopped on completion/cancellation. Manual entry remains available when permissions or browser features are unavailable.
- Thermal output uses browser printing and installed drivers. Direct ESC/POS, Bluetooth, cash-drawer control and silent kiosk printing are outside the implemented adapter. Physical hardware acceptance is still required.

## Commissioning checklist

| Check | Acceptance evidence to collect at Fatima |
| --- | --- |
| Phone camera | HTTPS permission granted; clear Code 128 label resolves the correct product/pack; Stop scan releases camera |
| USB scanner | Code enters the focused field once; Enter suffix triggers lookup; unknown code produces a useful message |
| Thermal printer | Confirm model, 58/80 mm roll and installed driver; print one receipt with readable references and an unclipped barcode; rescan printed barcode |
| Stock | Compare available balance with count after reservations; demonstrate independent review and stale-count rejection |
| Transfer | Verify both approved units, physical handover reference, matched movements and unchanged company total |
| Receipt evidence | Sharp original retained; extracted text reviewed; saved metadata links to the correct existing record |
| Locations | Premises owner confirms address and captured coordinates; record accuracy and verification note |
| Recovery | Preserve prior deployment/version and perform the separately documented backup/restore acceptance before real data |

Actual device models, printed-paper scans and verified GPS positions must be supplied by the on-site commissioning exercise. Browser automation is software evidence and does not substitute for those checks. All current transactions remain synthetic demonstration records; payment settlement and fiscal integrations remain separate work.

Technical details and primary references: [device integrations](DEVICE-INTEGRATIONS.md), [architecture](ARCHITECTURE.md). Exact final checks and release identity are recorded in the management release evidence document.
