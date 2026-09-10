# Deployment, health and rollback

## Release procedure

1. Confirm the public boundary with `git status --ignored` and `npm run scan:secrets`.
2. Run lint, type checking, tests, browser tests, production build and production dependency audit.
3. Push the exact sanitized commit to the public repository.
4. Save a Sites version against that full commit SHA.
5. Deploy the saved version with public access and record the deployment identifier.
6. Verify `/`, representative hash deep links, responsive layouts, downloads, role boundaries, error handling and HTTPS.
7. Tag the exact commit `v1.0.0-demo` and create the GitHub Release with evidence.

## Health checks

- HTTPS root returns a successful response.
- The page displays `v1.0.0-demo` and the release date.
- Public, customer, seller, inventory, finance, content, management, system and agent screens render.
- Browser console has no uncaught errors in critical journeys.
- No authentication wall prevents evidence-demo access.

## Rollback

Retain the previous successful Sites deployment and the `v1.0.0-demo` Git tag. Roll back by redeploying the last known-good saved version; never rebuild an untagged working tree as a rollback.
