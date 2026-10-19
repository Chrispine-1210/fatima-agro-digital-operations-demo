# Deployment, health and rollback

Reviewed 18 October 2026. The current release is pending final tests, source/version identity and deployment evidence. Follow [the exact local operations runbook](../aothothe-pack/03-operations-runbook.md). The September tag, hash routes, screenshots and pass record are historical.

## Release procedure

1. Review source status and diff in the opened Sites checkout. Preserve unrelated changes. Keep client-pack documents, secrets, ignored local configuration and private records outside public artifacts.
2. Run the appropriate final static, domain, browser, build and secret checks. Include the new `tests/portal-domain.test.mjs` suite; do not assume a package script contains it. Record revision, commands, timestamps, exit results and remaining warnings.
3. Verify that the D1 `DB` binding and packaged migration match the target environment. Apply hosted migrations only through the supported, authorized Sites/provider workflow; do not point a local demonstration command at remote data.
4. Configure identity/bootstrap values through the host's protected mechanism. Local rehearsal secrets/personas must never become hosted staff access. Provider-authenticated customer flow and approved hosted staff assignments need separate checks.
5. Save the exact reviewed source revision and packaged build as a Sites version. Deploy only an authorized version and preserve the current access policy unless an access change is separately authorized. Do not publish private source or automatically create a public GitHub release.
6. Record saved version, deployment identifier, URL, source revision and actual outcome in [the release evidence record](../aothothe-pack/09-release-evidence.md).
7. Check public content, provider customer sign-in/profile, own-order refresh, protected direct requests and persistence on the deployed version. An accepted build/deployment is not proof of every business workflow.

## Health and presentation checks

- Confirm actual HTTPS response, deployed version and absence of a stale local server.
- Check `/`, `/catalogue`, a `/products/` detail, `/account`, `/cart` and a customer-owned `/account/orders/` route.
- Confirm public/customer sessions cannot read `/hq` modules or private API snapshots.
- Verify `/rehearsal` is unavailable on hosting; use loopback for unassigned synthetic internal roles.
- Confirm email, payments, tax, payroll and delivery remain captured demonstrations.
- Use actual current screenshots, not `docs/screenshots/` September captures.

## Rollback and data recovery

Retain the last working source revision and Sites version. Roll back by redeploying that known version and recording its scope. A source rollback does not restore D1 data, and an older build may require a compatible schema. Review schema/data compatibility before rollback; never reset hosted records as a substitute.

Database export, isolated restoration and reconciliation are separate checks in the operations runbook. No automated backup or tested recovery guarantee is claimed. Use the verified loopback presentation build if hosting or identity is unavailable, and state clearly when showing captured evidence.
