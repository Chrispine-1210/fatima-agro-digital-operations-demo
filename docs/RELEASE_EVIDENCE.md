# v1.0.0-demo release evidence

Release date: 10 September 2026

Evidence refresh: 11 September 2026

Provider: Aothothe Technologies

This report covers the public, synthetic-data evidence prototype only. It does not approve production operation, real-data migration, payments, legal claims or a live agent/dealer network.

## Gate results

| Gate | Evidence | Result |
| --- | --- | --- |
| G0 — public/private boundary | Git ignore verification, staged-file review, working-tree and full-history secret scans | Pass |
| G1 — static quality | ESLint and strict TypeScript checks in an isolated dependency install | Pass |
| G2 — dependency security | `npm audit --omit=dev --audit-level=high` | Pass — 0 vulnerabilities |
| G3 — production build | Five-stage Vinext/Vite build plus rendered HTML metadata test | Pass |
| G4 — functional workflows | 9 unit/workflow/boundary tests, 3 component/accessibility checks and 12 Playwright journeys | Pass |
| G5 — responsive evidence | Desktop, tablet and mobile overflow tests and screenshots | Pass |
| G6 — release metadata | Version label, date, provider attribution, docs, copyright and rollback guidance | Pass |

## Browser journey coverage

Each of the following ran on desktop, tablet and mobile profiles:

1. Seller records a sale and submits a cash count; seller self-approval is denied; supervisor approval becomes available only after the role hand-off.
2. A visitor creates a uniquely referenced synthetic enquiry and reaches the sample quotation.
3. A major portal deep link survives a page refresh.
4. The application shell renders without horizontal page overflow and produces a screenshot.

## Screenshots

- [Desktop dashboard](screenshots/dashboard-desktop.png)
- [Tablet dashboard](screenshots/dashboard-tablet.png)
- [Mobile dashboard](screenshots/dashboard-mobile.png)

## Deferred production capabilities

Identity, MFA, server-side authorization, persistent records, integrations, notifications, fiscal/POS operation, accounting, business-bank statement import, supported bank feeds, payment initiation, monitoring, backup/restore, incident operations, verified legal/privacy controls and real-data migration remain outside this demo release.
