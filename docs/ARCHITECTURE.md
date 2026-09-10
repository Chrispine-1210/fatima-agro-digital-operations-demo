# Architecture and control boundaries

## Runtime shape

- React 19 and TypeScript user interface.
- Next-compatible app structure compiled by Vinext and Vite.
- Cloudflare Worker-compatible output hosted through the configured Sites project.
- Reusable UI primitives under `components/ui`.
- No D1 database, R2 bucket, external API or runtime secret in the public demo.

## State model

The interface uses typed in-memory React state plus session storage for the selected demonstration role. Reset removes temporary demo state. No cross-user or persistent business record is created.

## Role boundary

The role switcher demonstrates navigation and action authorization. It is not real authentication. The production design requires server-side identity, authorization on every read/write, MFA for privileged roles, session expiry, audit attribution and customer ownership filters.

## Separation of duties

- Seller prepares sales and counts; supervisor approves the close and variance.
- Finance prepares deposits and reconciliation; authorized finance/management approves.
- Storekeeper prepares counts/adjustments; supervisor approves.
- Editor drafts; a separate reviewer approves regulated, legal, commercial or product claims.
- Agent/dealer applicant cannot approve its own readiness.

## Bank integration boundary

1. Verified business-account statement import.
2. Approved read-only bank feed where supported.
3. Payment initiation only as a separately authorized production change.

The demo never requests or stores online-banking passwords. Production payment initiation requires client-owned accounts, bank support, secure tokens, MFA, transaction limits and dual approval.
