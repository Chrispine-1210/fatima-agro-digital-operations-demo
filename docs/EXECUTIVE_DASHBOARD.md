# Fatima Agro executive dashboard

Prepared for Fatima Agro Dealers and General Suppliers by Aothothe. Location context: Kanengo, Lilongwe, Malawi. Documentation date: 22 October 2026, Africa/Blantyre.

## Purpose and access

`/hq/executive` brings financial summaries, departmental work, inventory exceptions, operating unit performance and executive follow-up into one private workspace. A signed-in user with the approved `ceo` role can open it. `/hq` directs that role to this overview. Other staff retain their own workspaces and notification feed.

The server-rendered page and the portal API independently enforce the role. Being an administrator, director of another department or customer does not grant this dashboard. Public catalogue and customer responses contain no executive snapshot or decisions.

Account update, 22 October 2026: Fatima now uses issued usernames and passwords under developer control. The separate `fatima.ceo` identity opens this dashboard. Self-registration, automated recovery and portal-driven account-role application are disabled for managed accounts. See [Fatima account operation](FATIMA_ACCOUNTS.md); this supersedes the earlier provider bootstrap handover.

## What the CEO can do

1. Open the overview and refresh records to retrieve the current revision.
2. Review the all-time ledger totals and six calendar months of movement.
3. Compare department work counts and the evidence behind attention items.
4. Filter inventory exceptions by operating unit and search by product name or SKU, then review available quantity and the configured reorder level.
5. Review branch and depot order/task counts, including outstanding and overdue work.
6. Create a management decision with a department, operating unit, priority, due date and rationale. Record progress or a blocker with a note and reference, then close it with an outcome and supporting evidence.
7. Review proposed unit activations using the existing independence rule. Account assignments follow the developer-controlled CEO directive procedure.
8. Print a board brief using the browser print dialog. The output reflects the records and revision displayed in the dashboard.
9. Export a CSV board summary with all six monthly flows, departmental counts, inventory exceptions, unit activity and decision status. Text cells escape spreadsheet formula prefixes. The export uses the same aggregate projection as the screen.

## Financial definitions

Amounts are integer Malawi kwacha. Summary cards use the existing double-entry ledger calculation, rather than adding order requests as recognised sales. Revenue includes posted sales less posted sales returns. Expenses are posted operating expenses. Cash is the demonstration cash-and-bank ledger balance. Receivables and payables follow their respective ledger accounts. The ledger balance indicator compares total debits with total credits.

The monthly view covers the current month and the preceding five months in the Africa/Blantyre calendar. It distinguishes revenue, expenses, customer receipts, supplier payments and net cash movement. The data table gives the exact values behind the chart and is available without relying on colour.

Receivables aging uses each invoice's due date and outstanding amount after credits and recorded payments. Payable records currently have no contractual due-date field. Their 30-day age is therefore a review prompt, not a claim that a supplier payment is overdue. These two measures are labelled separately.

All transactions remain demonstration records. These summaries are not audited financial statements, bank confirmations, tax returns or real-time external accounting imports. A zero value means no matching posted records in the current state.

## Department and inventory evidence

Department attention is expressed as counts derived from recorded workflows. No synthetic performance score or invented revenue target is presented. Finance, people and HR, operations, communications and administration each expose their relevant aggregate counts and a short explanation of the source.

Stock risks use the existing per-unit inventory balances and product identifiers. The configured reorder level is an operational threshold requiring Fatima's confirmation; it is not a demand forecast. Active units with Inventory functions are considered. A unit filter changes the risk register, while company-wide financial totals remain clearly separate.

The dashboard uses an aggregate server projection. It does not send customer contact details, employee salaries, leave reasons, receipt photographs, complete journals or captured campaign message bodies to the executive browser. Review queues include only the context needed for a decision. Access to raw departmental records continues to use the relevant department's approved role.

## Management decision register

A decision starts as `Open` at version 1. The CEO can append `In progress` or `Blocked` updates, then close it as `Completed` or `Cancelled`. Each update records the acting account, time, note and evidence reference. Completion requires a closure evidence reference. Closed records remain visible for review and cannot continue through the progress workflow.

Decision creation and updates use idempotency keys to protect retries. Updates also send the expected record version; a conflicting update is rejected so the CEO can refresh and review the latest record. Existing history is appended rather than silently replaced. Audit events accompany the actions.

This is executive follow-up recorded by the CEO. It does not certify that another department completed its work and does not approve a purchase, post an accounting transaction, pay an employee, move stock or grant an account's role. Those workflows retain their separate permissions and review controls.

## Existing approval controls

The native account edition keeps account creation, password changes and role assignments under the authorised developer. Managed CEO users do not apply or approve role-change actions through the dashboard. Historical access records may remain visible as evidence.

A proposed operating unit can be activated by a different executive approver from its creator. Ineligible self-created proposals are omitted from the actionable queue, and the server rejects an attempted bypass. Procurement, stock count, transfer and HR approvals continue through their existing authorised reviewers; an executive follow-up decision is not a shortcut.

## Implementation evidence

- Shared contract: `lib/portal-types.ts`, with typed executive summary and decision records.
- Server projection and lifecycle: executive server module, the domain action dispatcher and state migration.
- Permissions: `lib/server/permissions.ts`, with CEO-only executive module and actions.
- Page/API boundary: `/hq/[module]`, `/hq` and `/api/portal` allowlists and server page checks.
- UI: executive dashboard component and scoped style sheet, integrated with the staff shell.
- Meaningful domain tests cover aggregation, role isolation, lifecycle validation, retry/concurrency behaviour and independent approvals.
- Browser tests: `tests/e2e/executive.spec.ts`. Test business records live only in an in-memory fixture using the actual domain functions. Only the local rehearsal authentication endpoint is used to establish a server-readable cookie; browser business requests are intercepted, including query-string variants. No reset or business transaction is written to D1 by these browser tests.

Release checks and captured screenshots are recorded in the delivery verification file after execution. Desktop and 390 px checks include direct navigation, refresh and horizontal-overflow checks. Printed output is verified through browser rendering; paper and printer operation remain an on-site check.

## Aothothe execution responsibilities

| Owner | Concentration | Next evidence |
| --- | --- | --- |
| Chrispine Mndala, Lead Systems Architecture Engineer, Founder and CTO | Permission model, aggregate definitions, independent approvals and release review | Approved executive access, verified release identity and acceptance record |
| Wilson Chipeta | Presentation rehearsal and operational acceptance coordination | Reconciled sample ledger totals, department count review, inventory threshold sign-off and decision walkthrough |
| Future recruited operations/data contributor | Verified branch/depot data and recurring departmental evidence | Approved location records, task evidence references, stock/reorder review and documented exceptions |

Before production use, Fatima should confirm the authorised executive account, department ownership, opening balances, reorder thresholds and unit records. Finance should reconcile the ledger to approved source records. Department owners should validate the counts and follow-up references. Aothothe should capture the resulting acceptance evidence and retain the release/rollback record.
