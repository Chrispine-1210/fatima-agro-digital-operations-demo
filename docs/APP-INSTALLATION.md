# Fatima Agro app installation

The installable website app and Android application use the existing Fatima accounts, permissions, operating-unit restrictions and business records. The application is an online presentation system with synthetic records. Installation does not connect payment, payroll, fiscal, carrier or external email providers.

## Website installation

Open [Install Fatima Agro](https://fatima-agro.vercel.app/install) in the device's browser. Supported browsers may offer an **Install Fatima Agro** button. Otherwise use the instructions on that page:

- Android Chrome/Edge: browser menu, **Install app** or **Add to Home screen**.
- iPhone/iPad Safari: **Share**, **Add to Home Screen**, **Add**.
- Desktop Chrome/Edge: address-bar install icon or browser menu, **Install this site as an app**.

The app starts at `/account`. Use the existing issued Fatima username/password; no Google or ChatGPT account is required. An account's role continues to control permitted workspaces and actions. Installing an app does not create another staff identity or expand access. Logout and the single-active-session control remain effective.

Install through the primary Vercel address for a consistent app identity. The Cloudflare secondary hostname requires its own session and, if installed, is a separate browser app.

## Online and offline behavior

An internet connection is required to sign in, load current records and submit transactions. The service worker stores only a verified, identity-free public offline screen fetched without credentials. It does not cache account pages, department pages, API responses, receipts or documents, and does not queue writes or background financial actions. Network failures during page navigation can show a generic reconnect screen with HTTP503. Actual HTTP401/403/404/500 responses remain unchanged.

API, mutation, RSC and document/download requests bypass offline handling. APK/AAB downloads never receive an offline HTML substitute. Updates wait for existing app windows to close; they do not force a reload of unsaved forms.

Phone camera capture, compatible keyboard-input barcode scanners and browser receipt printing use the existing workspace tools. Device permissions, scanning accuracy and thermal-printer output must be checked on the intended hardware. Universal native Bluetooth printer support is not included.

## Android package

The Android project is in `android-app/`. It uses a Trusted Web Activity to open the primary Vercel account page in a compatible browser. It does not contain staff passwords, a WebView JavaScript bridge, a separate account database or native payment credentials. See [Android build and signing instructions](../android-app/README.md).

Publish an APK download only after a successful build, package/version inspection and signature verification. The installation page displays a download only when `lib/fatima-app-release.ts` contains metadata for a verified artifact. Publish `/.well-known/assetlinks.json` with the certificate fingerprint that actually signed that APK to enable website/app verification.

Google Play distribution requires Fatima's publisher account and store submission. Play App Signing may use a different signing certificate; its fingerprint must also be reflected in the site's Digital Asset Links statement. A direct APK build does not imply a Play Store listing or approval.

Keep the private signing key and its password vault outside the repository and public files. Retain them securely for signed updates; do not regenerate the release identity for routine updates.

## Release checks

Run the normal type check, production build and test suite. `tests/pwa-worker.test.mjs` verifies cache restrictions, credential omission, private response preservation, request bypass rules, safe offline errors and update behavior. After publication check the actual Vercel `/install`, manifest, icons, service-worker MIME type, offline screen and any Android package/asset-links routes.

Complete installation and standalone launch checks on target browsers/phones, then verify Fatima sign-in, role boundaries, logout, camera scanning and thermal receipt printing. Build/signature and HTTP checks do not substitute for hardware testing.

## References

- [MDN: making web apps installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Chrome: Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity)
