# Fatima-owned account release evidence

Prepared by Aothothe, 22 October 2026, Africa/Blantyre, for Fatima Agro Dealers and General Suppliers, Kanengo, Lilongwe. This release implements the user's explicit instruction to replace provider sign-in with developer-issued Fatima usernames and passwords, without self-registration or automated account recovery.

## Delivered scope

Thirteen distinct presentation identities cover CEO, organisation administration, accounting, finance review, HR, HR review, operations review, procurement, stores, sales, branch management, communications and the customer demonstration. Passwords are individually generated; the issued register stays outside the repository and hosted assets. The developer vault is encrypted with Windows DPAPI and local handover files are restricted to the current Windows identity.

Hosted identity headers do not authenticate these accounts. The native session resolver loads the current persisted role/unit and enforces session expiry, credential enablement/version and revocation. Managed users cannot create accounts, reset passwords, apply role assignments or reset the presentation. Developer configuration supports create, rotate, disable and role/unit assignment against a recorded directive. Existing financial, HR, procurement, stock, unit and customer-ownership checks remain enforced. Historical account IDs and business records are retained without automatic reassignment by email.

The login endpoint accepts bounded JSON bodies up to 2,500 bytes. It consumes bounded bodies before origin denial to keep subsequent requests usable, then validates the origin before interpreting or applying a login. No account-provisioning endpoint is exposed. Unknown/incorrect account failures remain generic and every password attempt uses the same derivation path.

## Final verification

| Check | Result |
| --- | --- |
| Source suite | 67 tests passed, including password hashing/pepper/salt, opaque sessions, expiry/revocation/rotation, return-path safety and developer-only account capabilities |
| TypeScript | Passed |
| Production build | Passed |
| Release artifact checks | 3 passed: server identity/password configuration absent from client assets, complete preloads, pinned self-hosted OCR assets |
| Browser acceptance | 34 scenarios passed in one final run: 6 real native account journeys, 8 executive, 11 devices/inventory/receipts and 9 public-help scenarios |
| Native identity coverage | All 13 generated rehearsal roles authenticated through the actual password API and accessed their permitted portal; customer profile was pre-provisioned |
| Access controls | Wrong-role access, provider-header spoofing, cross-site login, public provisioning/reset/assignment and managed role self-application were rejected |
| Session controls | Direct navigation/refresh, eight-hour policy, server logout, copied-cookie replay denial and replacement-login revocation verified |
| Login limits | Known/unknown failures behave alike; persistent per-username attempt limit verified |
| Confidentiality scan | 279 current source/build text files checked; issued passwords and server pepper absent. Source credential patterns clean. Earlier release-history verification retained; a redundant full-history rerun was stopped, not counted as a new pass |
| Visual handover | Desktop and 390 px login layouts reviewed. Two-page access guide and two-page confidential register rendered/reviewed; password areas redacted only in QA images |

Native browser tests use a dedicated `.wrangler/native-auth-qa` database, generated test credentials and a separate ignored environment file. They do not reset or mutate the prior business rehearsal database. Business regression scenarios retain their isolated in-memory fixtures. Initial acceptance found a local environment serialization issue and an early-body-denial runtime issue; both were corrected before the final single-run pass.

## Release and acceptance record

The deployment preserves the existing Site ID, public catalogue audience and D1 binding. Secret environment revision 4 supplies the password pepper and three bounded operation batches; the source and archive contain no issued credentials. Source/GitHub commits, deployment/version IDs and hosted account acceptance are recorded in the delivered external `RELEASE.json` after publication. Version 10 is the pre-change rollback reference; a rollback must also restore its intended environment and access procedure.

The confidential register supersedes the prior provider-based account guide. Fatima should record each operator assignment and keep CEO directives for account changes. The identities and transactions are for presentation; no appointment, bank settlement, payroll release, fiscal submission, email delivery or carrier dispatch is asserted. See [account procedures](FATIMA_ACCOUNTS.md) for operator steps and limitations.
