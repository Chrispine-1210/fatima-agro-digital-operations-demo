# Fatima-owned account operation

Effective account edition: 22 October 2026. This supersedes the earlier ChatGPT/provider sign-in handover. Fatima requested issued usernames/passwords with no self-registration, third-party identity or automated recovery. The public catalogue remains public; customer and staff records require a Fatima session.

## Issued portal identities

| Username | Role | Entry |
| --- | --- | --- |
| fatima.ceo | CEO | `/hq/executive` |
| fatima.admin | Organisation administrator | `/hq/admin` |
| fatima.finance | Finance | `/hq/finance` |
| fatima.finance.director | Finance director | `/hq/finance` |
| fatima.hr | HR | `/hq/hr` |
| fatima.hr.director | HR director | `/hq/hr` |
| fatima.operations | Operations director | `/hq/procurement` |
| fatima.procurement | Procurement | `/hq/procurement` |
| fatima.stores | Storekeeper, demonstration branch | `/hq/procurement` |
| fatima.sales | Sales, demonstration branch | `/hq/procurement` |
| fatima.branch | Branch manager, demonstration branch | `/hq/procurement` |
| fatima.communications | Communications | `/hq/communications` |
| fatima.customer | Customer demonstration | `/account` |

Passwords are individually generated and supplied only in the confidential handover, outside this repository and the web assets. The names represent presentation responsibilities; they do not appoint real staff. Assign each issued identity to a responsible operator. Further customer accounts must be issued individually; the sample customer identity is for synthetic demonstration records.

## Account control

The authorised developer provisions accounts only against a recorded Fatima management / CEO directive. Portal users cannot create accounts, change passwords, apply access roles or recover credentials themselves. `fatima.admin` is an organisation workspace identity, not an account-provisioning back door. Routine financial, HR, procurement, stock and unit reviews retain their existing role and independence controls.

The offline `scripts/prepare-account-directive.mjs` tool accepts JSON through stdin with `operation`, `directive`, `username` and, for existing users, the exact `accountId`. `create` requires `name`, `role` and `unitId`; `assign` requires `role` and `unitId`. `create` and `rotate` also require the protected `pepper` from the developer vault. The tool generates a strong password, writes an ignored private configuration packet and private issued-password note, and prints only paths and non-secret metadata.

Use Node 24 and a private input pipe, never command arguments containing a password or pepper. Protect the output files using the developer operating system account. Review the directive, then configure the packet as a **secret** `FATIMA_ACCOUNT_BATCH_1`, `_2` or `_3` value through the hosting control tools and deploy. Each JSON array must remain below 5 KB. Existing unrelated environment settings remain unchanged. No browser provisioning/reset endpoint exists.

Each operation has a unique ID. A private processed-operation register prevents configuration replay from recreating accounts or undoing a later password change. Creation does not reuse an existing business account ID. Rotation, disabling and role/unit assignment preserve the exact ID and revoke sessions. Remove consumed operation packets from configuration after the controlled handover if desired; the consumed marker remains in the private store.

Never map a typed username/email to an old identity automatically. Historic provider IDs and their business records remain preserved. Linking a historical account needs a separately reviewed migration, rather than creating a duplicate owner or reassigning ownership by email.

## Security and storage

- `password-crypto.ts` uses Web Crypto PBKDF2-SHA256 at 100,000 iterations with a unique 256-bit salt and HMAC prehash using a separate server-held pepper. Issued passwords have 144 bits of random entropy. This work factor is bounded for the Worker runtime; review password hashing and operating limits before production adoption.
- The password pepper and account-operation batches are secret runtime values. They are absent from source, client bundles and hosting manifests. The developer's local recovery vault uses Windows DPAPI for the current Windows identity. Protect the credential handover separately; it intentionally contains the issued passwords.
- Credentials, hashed sessions, attempt records and processed operation IDs live in a separate D1 `fatima_auth_state` row. Public/customer/department snapshots and normal business exports do not include that row. D1 administrators must protect database backups because they contain password hashes.
- Sessions use random 256-bit opaque tokens. Only SHA-256 token hashes are stored. Hosted cookies use `__Host-fatima_session`, Secure, HttpOnly, SameSite=Strict, Path=/ and an eight-hour lifetime. Local HTTP rehearsal uses a separate cookie name without Secure.
- Each request reloads the persisted role/unit and checks expiry, credential enablement/version and `revokedBefore`. A new login replaces the previous session for that identity. Logout invalidates the server-side session, including copied-cookie replay.
- Every login attempt is atomically reserved before password verification. Ten attempts per username or forty per network within fifteen minutes trigger a wait. Username/network keys are HMAC digests; raw passwords and addresses are not recorded. Unknown and incorrect users receive the same failure message and execute the same password derivation path.
- POSTs require the current origin and bounded JSON bodies. Provider identity headers cannot substitute for a Fatima password session. Local persona sign-in remains restricted to loopback and explicit local rehearsal configuration.

## Acceptance and recovery procedure

Verify each issued role, direct navigation/refresh, wrong-role denial, customer ownership, logout and attempt limits. Capture the account-operation directive, release version, approver acknowledgement and operator assignment. The provided tests use a separate local rehearsal database and generated test credentials.

For a lost password, Fatima records a management directive; the developer issues a new random password using `rotate`. For departure or suspected misuse, use `disable`. For a department/unit change, use `assign`. Users receive new credentials privately and are never asked for a third-party password. If the protected server pepper is lost, a developer-controlled credential reissue is required; do not substitute an empty or public value.

Transactions remain synthetic. Live payment, fiscal, payroll, email and carrier services are not connected by this authentication change. Production account governance, backup/restore and operational acceptance remain business launch requirements.
