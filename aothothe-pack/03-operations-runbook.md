# Operation, deployment and recovery runbook

Updated Monday, 19 October 2026 (Africa/Blantyre). Owner: Chrispine. Wilson's support remains proposed. These procedures describe the current source. [The release record](09-release-evidence.md) distinguishes completed candidate checks from open browser, recovery and deployment gates; a procedure alone is not execution evidence.

## Presentation environment

Use the canonical opened checkout and the bundled Node 24 runtime. This avoids relying on an unconfigured system Node installation. In PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\dell\Desktop\Fatima_Agro_Digital_Transformation_Complete_Pack\.sites-publish-checkout'
$fatimaRuntime = 'C:\Users\dell\Desktop\Fatima_Agro_Digital_Transformation_Complete_Pack\.sites-runtime\node-v24.21.0-win-x64'
$fatimaNode = Join-Path $fatimaRuntime 'node.exe'
$env:Path = "$fatimaRuntime;$env:Path"
& $fatimaNode --version
git rev-parse HEAD
git status --short
```

Record the commit plus whether the build contains uncommitted changes; a commit alone does not identify a modified working tree. Preserve unrelated work. The private source client pack is in the parent project's `client-pack` directory and must stay outside public assets. Keep credentials and real customer/payroll records out of the demonstration.

The opened checkout already has dependencies. If restoration genuinely requires a clean dependency installation, use `& $fatimaNode (Join-Path $fatimaRuntime 'node_modules/npm/bin/npm-cli.js') ci --include=dev` against the lockfile after preserving the working environment. Do not reinstall during a frozen rehearsal without recording the reason.

## Build, prepare local storage, start

```powershell
& $fatimaNode 'node_modules/vinext/dist/cli.js' build
& $fatimaNode 'scripts/setup-demo.mjs'
& $fatimaNode 'scripts/start-demo.mjs'
```

Run sequentially and stop on a failed step. The build creates `dist/server/wrangler.json`. The setup script creates ignored `.dev.vars` only if absent, generates a local session key without printing it, and applies packaged local D1 migrations with `DB`. Existing configuration is preserved; confirm privately that rehearsal is enabled rather than overwriting an intentional setting. Never commit or display the signing key.

The start command remains running. Open `http://127.0.0.1:5173/`. Use a second PowerShell window with the same runtime/path setup for checks. Confirm this server uses the intended built files and local state, and record the actual URL. If port 5173 is occupied, identify the existing process/environment before using or changing it.

The Windows Vite preview encountered a workerd module-runner failure during preparation. The built-worker scripts now add the optional app-local Microsoft runtime directory through `scripts/local-runtime.mjs`; workerd and local setup succeeded on 19 October. Use the built-worker wrapper above on this machine; Vite is not a verified fallback. The wrapper supplies an absolute path to the root ignored configuration because relative environment-file paths resolve from the generated configuration directory. The package start script invokes the same wrapper. Do not run two previews on port 5173.

## Identity and role rehearsal

Hosted customer flow: open `/account/register`, sign in through the provider, and save a Fatima customer profile linked to that identity. Provider account creation/recovery uses the provider's own supported flow; Fatima stores no separate password. An authenticated hosted rehearsal is pending until recorded. Customer registration does not grant staff access.

Local flow: open `http://127.0.0.1:5173/rehearsal`, select a fictional persona, and complete the linked workflow. These signed sessions expire after four hours and work only on loopback when local rehearsal configuration is enabled. Never publish a persona switcher as hosted authentication.

| Scenario | Persona / route |
| --- | --- |
| Register/profile/cart/order | Customer A; `/account/register`, `/catalogue`, `/cart`, `/account` |
| Cross-customer ownership | Customer B; `/account` and Customer A's recorded order route |
| Accounting preparation | Finance officer; `/hq/finance` |
| Finance independent decisions | Finance reviewer; `/hq/finance` |
| Employee/onboarding/leave/payroll preparation | HR officer, then HR reviewer; `/hq/hr` |
| Supplier/request/PO/receipt | Procurement officer, Branch storekeeper and Operations reviewer; `/hq/procurement` |
| Unit/access/task decisions | System administrator, Operations reviewer, Second operations reviewer and Executive approval capability; `/hq/admin` |
| Notifications/captured campaign | Communications officer; `/hq/communications` |

Return to `/rehearsal` to select the next fictional person. Use separate people for independent decisions. The executive persona demonstrates a proposed system capability under Aothothe operation; it creates no company appointment and assigns no preparation task to Fatima's CEO.

On hosting, initial administrator bootstrap is not business approval authority. Until approved business roles are provisioned, demonstrate those workflows locally and state that limit. Do not bypass the restriction by enabling hosted personas or self-approving an access request.

## Final verification commands

Run relevant checks on the final integrated revision and save actual results. The package test script includes the domain suite; the explicit command below also includes it.

```powershell
& $fatimaNode 'node_modules/typescript/bin/tsc' --noEmit
& $fatimaNode 'node_modules/eslint/bin/eslint.js' . --ignore-pattern dist --ignore-pattern .next --ignore-pattern fatima-agro-operations-demo --ignore-pattern node_modules.partial
& $fatimaNode --experimental-strip-types --test 'tests/unit.test.mjs' 'tests/portal-domain.test.mjs' 'tests/portal-bootstrap.test.mjs' 'tests/release-boundary.test.mjs'
& $fatimaNode 'scripts/secret-scan.mjs'
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:5173'
& $fatimaNode 'node_modules/@playwright/test/cli.js' test --workers=1
```

Browser tests reset a shared synthetic dataset; use one worker and the isolated local instance. The existing configuration selects installed Chrome where present. Record any browser dependency or version problem honestly. Rebuild and rerun affected checks after changes; do not treat historical September tests or an old failure log as final results.

## Local reset and expected baseline

1. Export/copy any permitted evidence needed from the disposable local session before reset.
2. Open `/rehearsal`, select **System administrator**, then open `/hq/admin`.
3. In **Reset the local presentation**, tick the intention checkbox. Enter `RESET SYNTHETIC DEMONSTRATION` and submit **Reset local demonstration**.
4. Confirm transactions/campaigns are cleared, the six sample products are restored, and the reset audit event exists. Seed maize stock is 142 units; this is synthetic.
5. Registered account assignments are preserved. Reset is not a complete identity wipe. Hosted reset is disabled.
6. Run a short customer-order/receipt smoke scenario, then reset again before the meeting and record the actual ready state.

The equivalent local authenticated API action is POST `/api/portal` with action `admin.reset` and data `{ "confirmation": "RESET SYNTHETIC DEMONSTRATION" }`, using a signed local administrator session and the same origin. No password or session token belongs in this pack.

## Backup and restoration

A source rollback does not restore D1 data. The current source has no automatic hosted backup/restore integration, and a browser dump is not a database backup. The local verification script below is implemented; its actual recovery run remains pending in document 09.

For the local built-worker instance, stop writes after browser testing and run:

```powershell
& $fatimaNode 'scripts/verify-recovery.mjs'
```

The script exports only local D1 and restores into a newly generated isolated directory under ignored `work/`; it cannot target hosted storage or overwrite the source presentation dataset. It compares revision, payload SHA256, record counts and ledger balances, then checks that the source has not changed. Raw SQL and diagnostics remain private in the ignored work directory. Sanitized results go to `aothothe-pack/evidence/recovery-2026-10-19.txt`; a filename or script presence is not a pass. Keep the exact source/build revision and compatible schema with protected backups. The local signing configuration is secret and handled separately from shareable evidence.

For hosted D1, obtain the supported provider snapshot/export procedure and access first. Record database/binding identity without secrets, retention, location, encryption and access owner. Do not invent remote database identifiers or use a local command against hosted data.

Local rehearsal acceptance: successful isolated export/import, matching payload hash/revision/counts/ledger, and unchanged source data. Record measured time and gaps. This is a bounded local recovery check; it does not establish hosted recovery, an RPO/RTO or an SLA.

## Deployment and meeting recovery

Use [the deployment procedure](../docs/DEPLOYMENT.md) and supported Sites workflow. Preserve the existing access policy, save the exact reviewed source/build as a version, and record the actual deployment outcome. Hosted sign-in, schema, direct-route access and persistence require actual checks; a successful build alone is insufficient.

If hosting or sign-in fails, use the verified local build of the same revision. If both fail, show permitted current screenshots/logs and explicitly identify captured evidence. Record failures and skipped steps. Never reset shared or real records to rescue a demonstration.

For information exposure, stop the demonstration, restrict the affected release through authorized controls, preserve evidence and involve Chrispine. Do not forward credentials or confidential records in public notes.

## After the presentation

By 20 October, Chrispine records shown revision, actual decisions, failures/skipped steps, owners and next gates. Wilson's note-taking support remains conditional on agreement. Production handover requires verified ownership/access, data export, legal/privacy/retention decisions, trained operating owners, support arrangements and tested recovery. No signature, acceptance or legal relationship is created by this pack.

## Initial hosted business approvers - configuration procedure only

`FATIMA_BOOTSTRAP_CEO_EMAILS` and `FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS` default to empty. Use them only for distinct, explicitly approved people in protected hosting configuration. Do not infer a CEO identity from the client questionnaire or assign a role to the presenter merely to bypass separation of duties. Have each approved person sign in, verify its one-time role grant and audit record, then remove the bootstrap lists. The one-time record prevents a lingering list from undoing a later demotion. Removing configuration does not revoke existing roles. Record actual sign-in/grant/removal evidence without addresses or secrets in public artifacts. Until this is completed, use the local fictional approvers for presentation; this procedure is not a claim that anyone has been appointed or provisioned.

## Private configuration status - 18 October

The user supplied the initial administrator address and the coordinating workstream configured it through protected `HQ_ADMIN_EMAILS`. The address is intentionally omitted here. First provider sign-in remains pending. No executive identity was assigned because an independent approved reviewer is unidentified. The existing hosting audience is PUBLIC and was preserved; this does not remove application authorization.
