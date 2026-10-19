# Release-candidate evidence

Delivery owner: Chrispine. Automated verification recorded Monday, 19 October 2026 (Africa/Blantyre); human business acceptance is not implied. All three local browser journeys and isolated recovery passed. Publication identity and its outcome are recorded separately in the delivered release manifest after source finalisation.

## Release identity and environment

The final source commit, saved version, deployment identifier and verification time belong in the delivered `RELEASE.json` after source finalisation. The native saved-version metadata must identify the same source. This tracked document does not embed its own commit identifier.

- Target host: [Fatima Agro demonstration](https://fatima-agro-operations-demo.peterschrispine.chatgpt.site). The existing PUBLIC audience is preserved; application role, ownership and unit checks still protect internal workspaces. A new successful deployment has not yet been recorded here.
- Local candidate: Windows, bundled Node 24.21.0, built Worker at `http://127.0.0.1:5173/`, D1 binding `DB`. Start with `scripts/start-demo.mjs`; see [the runbook](03-operations-runbook.md).
- Hosted identity uses the provider plus a linked Fatima customer profile. The supplied address is configured privately as initial system administrator only; its first sign-in is unverified. An independent executive approver remains unassigned. Local fictional personas demonstrate those roles without granting hosted access or asserting employment.

## Checks recorded on 19 October

| Check | Actual result | Evidence |
| --- | --- | --- |
| Source/domain/bootstrap/boundary | **34 passed, 0 failed** | [Source tests](evidence/source-tests-2026-10-19.txt). Includes ownership, role/unit scope, independent approval, financial/stock and notification controls. |
| TypeScript | **Passed; no diagnostics** | [Typecheck](evidence/typecheck-2026-10-19.txt). |
| Lint | **0 errors, 17 warnings** | [Lint](evidence/lint-2026-10-19.txt). Warnings remain; a successful exit does not mean warning-free source. |
| Production build | **Passed after field-label corrections** | [Build](evidence/build-2026-10-19.txt). Later source changes require a new build and affected checks. |
| Built release boundaries | **2 passed, 0 failed** | [Artifact checks](evidence/release-artifacts-2026-10-19.txt): no private server configuration/state in browser code; advertised script/style assets exist. |
| Secret scan | **Passed** | [Scan](evidence/secret-scan-2026-10-19.txt) records the actual file/commit counts. Bounded scan, not a general security certification. |
| Installed dependencies | **Production 0; full toolchain 24** vulnerable-package records | [Dependency/runtime review](evidence/dependencies-2026-10-19.txt): 18 high, 5 moderate, 1 low, 0 critical in full audit. React/RSC 19.2.8 and image-size 2.0.4 are installed. A clean production-only audit is not a clean full-toolchain audit or proof that every runtime path is unaffected. |
| Native runtime/local setup | **Workerd and setup succeeded** | Same [dependency/runtime review](evidence/dependencies-2026-10-19.txt). Microsoft-signed app-local DLL support restored workerd; setup preserved existing configuration/data and found no unapplied migrations. No machine-wide installation or shared target edit. |
| Customer and public browser journeys | **2 passed**; internal test failed in that same run | [Second full attempt](evidence/browser-2026-10-19-second-attempt.txt). Customer profile/cart/checkout/order persistence, ownership denial, Back/Forward, direct routes, responsive layout, all six category images and deliberate image fallback passed. |
| Affected internal browser journey | **1 passed** in 23.5 seconds | [Final internal run](evidence/browser-internal-2026-10-19.txt). Finance, HR, procurement, sales tracking/enquiry/support, captured campaign/deduplication/unsubscribe and mobile workspace passed. No application source changed since the verified build. |
| Isolated local recovery | **Passed** | [Recovery](evidence/recovery-2026-10-19.txt): exact payload hash, revision 204, record counts and ledger totals matched; original source unchanged. Debits and credits both MWK 434,000. Export 21,905 ms; import 11,146 ms; total 55,861 ms. Local synthetic data only. |
| Clean presentation baseline | **Passed after recovery** | [Baseline](evidence/presentation-baseline-2026-10-19.txt): six products, maize stock 142, zero invoices/payments/campaigns, balanced ledger. Approved account assignments preserved; hosted data untouched. |

The three browser journeys passed across the two final recorded runs above; no single all-three-pass run is claimed. Earlier field-label/history checks and ambiguous campaign header/cell selectors were corrected. The final affected internal rerun passed after a transient local worker-restart failure. Customer/public and internal scenarios use the same built application. Browser-only locator corrections did not change that application source.

Current screenshots: [public desktop](evidence/public-1440.png), [tablet](evidence/public-834.png), [mobile](evidence/public-390.png), [customer order](evidence/customer-order-desktop.png), [accounting](evidence/internal-accounting.png), [HR](evidence/internal-hr.png), [procurement](evidence/internal-procurement.png), [captured email](evidence/internal-captured-email.png) and [internal mobile](evidence/internal-mobile-workspace.png). Public/customer captures belong to the successful customer/public run; internal captures belong to the final successful internal run.

## Open acceptance gates

| Gate | Required evidence / present limit |
| --- | --- |
| Production recovery | The isolated local recovery check passed. Hosted recovery, retention, RPO/RTO and production recovery guarantees remain unverified. |
| Hosted release | Supported save/deploy success, matching native source metadata, migration/persistence and public-route/access checks. Provider-authenticated customer registration/recovery and initial administrator sign-in need an authorized person's actual rehearsal. |
| Final handover | Update this record with actual outcomes, supply the matching release manifest, screenshots/logs, launcher and archive. Chrispine owns all remaining gates; Wilson support is proposed and the specialist position remains vacant. |

## Historical attempts and preparation

The [first full 19 October attempt](evidence/browser-2026-10-19-first-attempt.txt) had 1 pass and 2 failures before field-label/history corrections. The [earlier affected internal attempt](evidence/browser-internal-2026-10-19-first-attempt.txt) failed because a selector matched both the Captured column header and cell. The [runtime attempt](evidence/browser-internal-2026-10-19-runtime-attempt.txt) failed during a transient local worker restart. They are retained as failed attempts and superseded only for the checks covered by the successful runs above. Generic `browser-2026-10-19.txt` duplicates the second full attempt.

The 18 October [source test run](evidence/source-tests-2026-10-18.txt) passed 33 tests; [repeat setup](evidence/setup-repeat-2026-10-18.txt) succeeded. The [18 October browser attempt](evidence/browser-2026-10-18.txt) had 1 pass and 2 failures. The earlier `browser-log.txt`, `lint-2026-10-18.txt`, `dependency-audit-2026-10-18.json` and `recovery-2026-10-18.txt` are prior attempts, not current clean results. September deployment/test claims remain historical in `docs/RELEASE_EVIDENCE.md`.

Five client-pack files were reviewed; source references, missing workbook and unverified company/commercial claims are documented in [document 08](08-source-register.md). Documentation, team proposals, sourced photographs and tax/market research were prepared on 17–18 October. Those activities do not establish final application acceptance or live business integrations. The current screenshots listed above are assigned to their successful local runs. Earlier September screenshots remain historical.

## Demonstration limits and evidence handling

Business records, prices and stock are synthetic. Email is captured rather than sent. External payments, fiscal submission, payroll remittance and carrier dispatch are not connected. Tax categories, exact packaging, market demand, partners, legal/privacy/retention settings and production support require further verification.

Capture only synthetic records and sanitized logs. Never include credentials, identity recovery tokens, private employee/customer contact details or confidential executive material. Show only verified paths; identify captured evidence and skipped steps plainly. Record actual meeting decisions after they occur, with no advance acceptance or business commitment.
