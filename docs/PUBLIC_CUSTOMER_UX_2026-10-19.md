# Public customer experience update - 19 October 2026

Contact, About, Careers and Customer Feedback now use consistent task cards, clearer actions and responsive layouts. Customer-facing copy identifies Kanengo, Lilongwe and Fatima Agro's main operating area in Lilongwe. Collection enquiries prefill and focus the subject field; successful enquiry submission displays its reference for follow-up. Enquiry subject and message limits match server validation. Delivery wording asks for coverage, timing and charge confirmation without exposing implementation details or promising coverage.

Service cards lead to customer care, products and order tracking. Careers shows that no vacancies are published on this site, with public updates and recruitment safety guidance. No staff appointments, opening hours, exact premises, carrier partnerships or vacancies were invented.

Feedback waits for session lookup and supports signed-out visitors, incomplete customer profiles, customers without orders, eligible orders and already-submitted feedback. Orders with existing feedback are excluded from the form. Publication consent remains required and feedback awaits moderation. The sign-in return allowlist now accepts the exact `/reviews` route; external destinations remain rejected. Profile completion returns to reviews only when that exact local destination was requested.

Verification on the final build:

- TypeScript and production build passed.
- 34 source/domain/boundary tests and 2 release-artifact checks passed.
- All 9 focused public-help browser tests passed in one final run, including the enquiry reference confirmation. A preceding run passed 7 and failed a label-based test selector; the test now selects the accessible combobox role. The earlier eight-test run also passed before the reference check was added.
- Contact, About, Careers and Reviews were checked at 1440 px and 390 px, including direct navigation and refresh. Screenshots were visually reviewed; numbered feedback steps, 44 px task actions and mobile feedback priority were corrected before the final run.
- Business requests in the focused browser tests use isolated synthetic fixtures. The session redirect checks make read-only requests. These tests did not reset or write the database or send external messages.

Screenshots and the local test report are retained in ignored working directories. Historical presentation-pack evidence remains associated with its original release. Hosted provider-backed sign-in and production business integrations are separate verification gates.
