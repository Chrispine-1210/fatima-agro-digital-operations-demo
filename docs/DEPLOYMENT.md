# Deployment, health and rollback

Current procedure: 23 October 2026. Target [Fatima Agro](https://fatima-agro-operations-demo.chrispine-ala.chatgpt.site), preserving the existing Sites project, public catalogue audience and D1 `DB` binding. [The system upgrade](SYSTEM_UPGRADE_2026-10-23.md) records current verification; exact source/version/deployment identity belongs in the external `RELEASE.json`. Earlier provider-login instructions are superseded by [Fatima account operation](FATIMA_ACCOUNTS.md).

## Release procedure

1. Review source status and diff in the opened Sites checkout. Preserve unrelated changes. Keep client-pack documents, secrets, ignored local configuration and private records outside public artifacts.
2. Run the appropriate final static, domain, browser, build and secret checks. Include the new `tests/portal-domain.test.mjs` suite; do not assume a package script contains it. Record revision, commands, timestamps, exit results and remaining warnings.
3. Verify that the D1 `DB` binding and packaged migration match the target environment. Apply hosted migrations only through the supported, authorized Sites/provider workflow; do not point a local demonstration command at remote data.
4. Preserve protected environment revision 4, the existing password pepper and consumed native account-operation batches. Do not regenerate credentials during feature work. Local rehearsal secrets/personas must never become hosted staff access. Developer account changes require a recorded management directive.
5. Save the exact reviewed source revision and packaged build as a Sites version. Deploy only an authorized version and preserve the current access policy unless an access change is separately authorized. Do not publish private source or automatically create a public GitHub release.
6. Record saved version, deployment identifier, URL, source/GitHub commits, matching tree, archive digest and actual outcome in the external release manifest. The Sites source helper owns source commit/push/packaging. Keep the archive unchanged until saving succeeds; poll only nonterminal deployments and reuse the existing attempt when resuming.
7. Check public content, Fatima-issued customer/staff sign-in, own-order refresh, protected direct requests and persistence on the deployed version. Use a private helper without logging passwords/session cookies and sign out test sessions. An accepted build/deployment is not proof of every business workflow.

## Health and presentation checks

- Confirm actual HTTPS response, deployed version and absence of a stale local server.
- Check `/`, `/catalogue`, product details, `/account`, `/cart` and customer-owned order views, including direct navigation and refresh.
- Confirm public/customer sessions cannot read `/hq` modules or private API snapshots.
- Verify `/rehearsal` is unavailable on hosting; use loopback only for isolated synthetic QA. Hosted users enter with issued Fatima credentials.
- Confirm email, payments, tax, payroll and delivery remain captured demonstrations.
- Use actual current screenshots, not `docs/screenshots/` September captures.

## Rollback and data recovery

Version 11 is the prior application reference for this system upgrade and uses the same Fatima-owned accounts. Preserve its intended environment and review data compatibility before rollback; do not reset D1 to repair UI source. Version 10 or earlier crosses the identity migration and needs a separately reviewed environment/access procedure. Never reassign historical business ownership by typed email.

Retain the last working source revision and Sites version. Roll back by redeploying that known version and recording its scope. A source rollback does not restore D1 data, and an older build may require a compatible schema. Review schema/data compatibility before rollback; never reset hosted records as a substitute.

Database export, isolated restoration and reconciliation are separate checks in the operations runbook. No automated backup or tested recovery guarantee is claimed. Use the verified loopback presentation build if hosting or identity is unavailable, and state clearly when showing captured evidence.
