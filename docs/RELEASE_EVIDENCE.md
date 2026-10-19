# Historical September v1.0.0-demo release evidence

**Historical record, reviewed 18 October 2026.** The claims below were recorded for an earlier September synthetic prototype. They have not been rerun or independently established for the current October implementation. They are retained as history, not current pass results. Current identity, customer, accounting, HR, procurement, communications, D1 and routing work must use [the October release evidence record](../aothothe-pack/09-release-evidence.md).

Release date: 10 September 2026

Evidence refresh: 11 September 2026

Provider: Aothothe Technologies

This report covers the public, synthetic-data evidence prototype only. It does not approve production operation, real-data migration, payments, legal claims or a live agent/dealer network.

## Historically recorded gate results

| Gate | Evidence | Result |
| --- | --- | --- |
| G0 — public/private boundary | Git ignore verification, staged-file review, working-tree and full-history secret scans | Pass |
| G1 — static quality | ESLint and strict TypeScript checks in an isolated dependency install | Pass |
| G2 — dependency security | `npm audit --omit=dev --audit-level=high` | Pass — 0 vulnerabilities |
| G3 — production build | Five-stage Vinext/Vite build plus rendered HTML metadata test | Pass |
| G4 — functional workflows | 9 unit/workflow/boundary tests, 3 component/accessibility checks and 12 Playwright journeys | Pass |
| G5 — responsive evidence | Desktop, tablet and mobile overflow tests and screenshots | Pass |
| G6 — release metadata | Version label, date, provider attribution, docs, copyright and rollback guidance | Pass |

## Historically recorded browser journey coverage

Each of the following ran on desktop, tablet and mobile profiles:

1. Seller records a sale and submits a cash count; seller self-approval is denied; supervisor approval becomes available only after the role hand-off.
2. A visitor creates a uniquely referenced synthetic enquiry and reaches the sample quotation.
3. A major portal deep link survives a page refresh.
4. The application shell renders without horizontal page overflow and produces a screenshot.

## Historical screenshots

- [Desktop dashboard](screenshots/dashboard-desktop.png)
- [Tablet dashboard](screenshots/dashboard-tablet.png)
- [Mobile dashboard](screenshots/dashboard-mobile.png)

## September deferred capabilities (historical scope)

Identity, MFA, server-side authorization, persistent records, integrations, notifications, fiscal/POS operation, accounting, business-bank statement import, supported bank feeds, payment initiation, monitoring, backup/restore, incident operations, verified legal/privacy controls and real-data migration remain outside this demo release.

This paragraph describes September scope. The October source adds server authorization, a D1 demonstration store and new business workflows; their verification and production limits are recorded separately. No current readiness claim should be inferred from these historical screenshots or totals.
