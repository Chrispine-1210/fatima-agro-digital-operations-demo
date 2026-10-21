# Management tools release evidence — 21 October 2026

This release extends the public visual version 8 with internal SKU/barcode tools, controlled branch stock counts/transfers, verified premises locations, local receipt OCR/metadata and receipt printing. The Sites source baseline was `86a1783c158e59b5169c932ed0f40d17a04b2ab6`; its matching GitHub baseline was `3fa915b34960a560bd04bdfe5cd1f9686d7fc776`. Final source, GitHub tree, saved version and deployment identifiers are recorded in the delivered `RELEASE.json` after publication rather than recursively embedded in this source commit.

## Completed checks

| Check | Result and scope |
| --- | --- |
| Source suites | 51 passed: original unit/domain/bootstrap/release-boundary suites plus 17 inventory tests. Tests cover additive migration, identifier uniqueness, unit access, independent approvals, stale counts, matched transfers, numeric bounds, receipt ownership and metadata-only evidence. |
| TypeScript | Passed for the application and new browser suites. |
| Production build | Passed after the scoped barcode-width repair. Build reports plugin timing warnings and cannot statically classify some dynamic routes; these are not failed route tests. |
| Packaged assets | 3 passed: browser/server boundary, route preload existence, and exact OCR asset version/size/SHA-256 validation. Eleven OCR/license assets total 14,804,621 bytes; each is below 25 MiB. |
| Management/device browser suite | One final run: 11 passed in 2.9 minutes on the built local Worker, Chromium, `http://127.0.0.1:5175`. |
| Public UX regression | 9 passed in a separate run on this implementation, covering seven public routes at desktop/mobile sizes, refresh, enquiry references, profile completion and feedback states. The final subsequent CSS repair is scoped to barcode elements and thermal receipt sheets. |
| Installed production dependency audit | Zero reported vulnerabilities at verification time. This is an installed-production audit, not a claim about the whole development toolchain. |
| Current-source secret-pattern scan | 206 tracked/unignored text files checked; zero findings. This bounded check does not claim a fresh scan of every historical commit. |
| Visual review | Seven public pages at 1440/390 px, mobile inventory/locations, and 58 mm/80 mm/A4 receipt layouts. The first visual pass caught the global icon-width rule shrinking barcode SVGs; the final scoped override is verified by width assertions and actual image decoding. |

Commands used: `npm test` (the inventory suite is included), `npm run typecheck`, `npm run build`, `npm run test:release`, and Playwright against `inventory-tools.spec.ts`, `receipt-tools.spec.ts`, `device-tools.spec.ts` and `public-help.spec.ts`. Windows verification used the retained absolute Node/npm CLI paths because the ordinary npm shim was not reliable in this environment. Install development tooling with `npm ci --include=dev`.

## What the browser evidence establishes

- Keyboard-style Enter selects a SKU; generated Code 128 SVG produces a readable PNG that is decoded by the actual local ZXing fallback.
- A synthetic camera stream exercises the native camera path and stops its track after a match. Denied camera permission leaves manual lookup available. These are software checks, not phone hardware certification.
- Stock-count submission leaves stock unchanged until a different operations reviewer approves. A refreshed balance while a count is entered forces clear/recount. Transfers select active Inventory units and remain pending before review; domain tests verify atomic matched posting and duplicate protection.
- Explicit mocked device location fills coordinates without saving automatically. Saving records the checked address and coordinates; refresh retains them. Mocked coordinates are not asserted to be Fatima premises.
- A synthetic receipt image is processed by the actual same-origin Tesseract worker/core/model. Only a deliberately entered reference/note and file metadata/hash are submitted; the test observes no external HTTP request. Original images are not uploaded or archived.
- 58 mm, 80 mm and A4 receipt sheets isolate the printable record, include the demonstration/fiscal status, and open a user-controlled print dialog. Reprinting/cancelling creates no payment. Customer-owned receipt joins survive direct navigation and refresh.

Browser business requests use isolated in-memory fixtures backed by the real domain functions. Only local authentication uses the rehearsal API; these tests do not reset or post business records to D1. Screenshots and synthetic print PDFs are supplied as evidence, not fiscal documents.

## Handover and remaining acceptance

Use [inventory execution](INVENTORY-EXECUTION.md) for operator steps and Chrispine/Wilson/unfilled-role assignments. Use [device integration details](DEVICE-INTEGRATIONS.md) for privacy, licensing and hardware configuration. The Aothothe management execution PDF supplements the existing presentation pack.

On-site acceptance must still identify the actual phone/scanner/printer models, verify paper width and drivers, print and rescan a physical receipt, verify branch/depot premises coordinates, and rehearse with the assigned business reviewers. Hosted business-role sign-in requires approved role assignments; local personas do not establish those assignments. No fiscal/EIS, settlement, carrier, live payroll or email sending integration is claimed.
