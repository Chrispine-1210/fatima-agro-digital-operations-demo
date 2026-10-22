# Executive dashboard release evidence

Prepared by Aothothe for Fatima Agro Dealers and General Suppliers, Kanengo, Lilongwe. Verified 22 October 2026, Africa/Blantyre. All financial and operating records used for acceptance are synthetic.

## Delivered

The approved CEO role opens `/hq/executive` directly and through `/hq`. Financial balances and six Malawi calendar months of flows use the existing source ledger and payment records. Five departments show recorded workload and attention counts. Inventory risks use active inventory units, per-unit available stock and SKU reorder thresholds, with unit and product/SKU filters. Unit activity distinguishes order counts, non-cancelled order value and task progress.

Management follow-up supports creation, department/unit ownership, priority and due date, progress or blockers, and evidence-based closure. Updates are audited, idempotent and version guarded. Existing CEO access decisions and independent proposed-unit activation remain enforced. Printing and CSV provide a board brief from the same aggregate snapshot.

No new hosted role is assigned by this release. The existing administrator remains an administrator; an independently authorized executive identity is required for hosted access. Raw customer contact data, employee identities/salaries and captured campaign bodies are omitted from the executive projection. Existing departmental transaction permissions are unchanged.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Source tests | 61 passed | `npm test`, including ten executive aggregation, authorization, migration and lifecycle cases |
| TypeScript | Passed | `npm run typecheck` |
| Production build | Passed | `npm run build`; Worker, browser assets and route graph generated |
| Release artifact checks | 3 passed | Private data/config exclusion from browser code, complete preloads, pinned local OCR assets |
| Executive browser journeys | 8 passed | `tests/e2e/executive.spec.ts`; seven passed in first run, one infrastructure-interrupted navigation passed unchanged on isolated rerun |
| Existing management/device browser regression | 11 passed | Inventory, USB/image/camera scan, locations, OCR, protected receipts and thermal print previews |
| Source credential scan | Passed | 212 working-tree text files and 12 retained commits checked before release evidence was added; no potential credentials reported |
| Whitespace/diff check | Passed | `git diff --check` |
| Visual review | Passed | 1440 px desktop, 390 px mobile and complete dashboard sections; no horizontal page overflow |

Browser business records are isolated in memory and use actual domain functions. Portal reads and writes are intercepted; only the local authentication endpoint establishes rehearsal cookies. These tests do not reset D1 or write business transactions to it. One access-navigation attempt was interrupted when Windows slept; the same case passed after infrastructure recovery without a source change.

Screenshots are delivered with the external release evidence bundle, alongside release identifiers after publication. Those screenshots show explicitly synthetic acceptance records, not actual Fatima financial results.

## Operating limits and next acceptance

Supplier bill due dates are not recorded, so 30-day payable age is separate from overdue receivables. Operating expenses exclude cost of goods sold and no net profit is claimed. Department counts describe workload rather than performance ratings. Management follow-up does not certify department completion or authorize accounting, payroll, stock movements or access application.

Fatima should confirm the executive identity, source balances, department owners, inventory thresholds and unit records, then rehearse a complete management decision. Physical scanners, thermal printers and verified premises locations still require on-site acceptance. Bank, fiscal, payroll, carrier and email delivery services remain unconnected. See [dashboard procedures and responsibilities](EXECUTIVE_DASHBOARD.md) and [architecture](ARCHITECTURE.md).

Publication preserves the existing Site identity, public customer audience, database binding and configured administrative identity. The executive route and API remain role restricted. The previously deployed version 9 remains the rollback reference; published version and source/GitHub identifiers are recorded in the delivered `RELEASE.json`.
