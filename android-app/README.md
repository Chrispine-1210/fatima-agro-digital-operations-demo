# Fatima Agro Android application

The Android application opens `https://fatima-agro.vercel.app/account` in a Trusted Web Activity using Google's Android Browser Helper. It uses the same Fatima accounts, permission checks, server-side sessions and business records as the website. It does not embed account passwords or add a third-party sign-in.

The website supplies the interface and business tools. A compatible Android browser handles rendering, camera prompts, browser printing and secure session cookies. There is no WebView JavaScript bridge, additional native analytics SDK, native payment SDK or separate offline transaction database.

## Project identity

- Application ID: `com.fatimaagro.app`
- Version: `1.0.0`, code `1`
- Minimum Android SDK: 24 (Android 7; required by Android Browser Helper 2.7.4)
- Compile and target Android SDK: 36
- Android Gradle Plugin: `8.13.2`
- Gradle: `8.13`
- Android Browser Helper: `2.7.4`
- The launcher accepts HTTPS links only for the exact `fatima-agro.vercel.app` host. Other explicit-intent URLs fall back to the fixed account entry.

## Build

Use JDK 17 or a compatible newer JDK, Android SDK platform 36 and SDK Build Tools 35.0.0. The delivery build uses a portable JDK 21 and SDK outside the repository; these are not bundled with the app.

Set `ANDROID_HOME` to your SDK directory or create ignored `local.properties` with `sdk.dir=...`. Supply these environment variables for a signed release:

```text
FATIMA_ANDROID_KEYSTORE       absolute path to the private PKCS12 keystore
FATIMA_ANDROID_STORE_PASSWORD keystore password
FATIMA_ANDROID_KEY_ALIAS      signing key alias
FATIMA_ANDROID_KEY_PASSWORD   key password
```

Keep the keystore and passwords outside the repository. Do not place passwords in command arguments, Gradle properties, source files or a published APK download manifest. Explicit release tasks fail when the signing environment is incomplete.

```text
gradlew.bat --no-daemon assembleRelease bundleRelease lintRelease
```

Release outputs are produced under ignored `app/build/outputs/`. The delivery operator verifies the APK with SDK `apksigner verify --verbose --print-certs`, verifies its package/version/SDK metadata, and copies only verified distributable files to the external delivery folder.

## Website verification

For fullscreen operation the website must serve a matching Android Digital Asset Links statement at:

```text
https://fatima-agro.vercel.app/.well-known/assetlinks.json
```

The statement must name `com.fatimaagro.app` and the SHA-256 fingerprint of the certificate that actually signed the installed APK. The public release certificate may be committed. The private signing key must never be published. Chrome verifies the website relationship; if it cannot verify, the app opens a browser Custom Tab with browser controls.

Google Play App Signing can use a different distribution certificate. Add the Play signing certificate's fingerprint to the website before verifying a Play-distributed build. An upload-key fingerprint alone does not verify a differently signed Play build.

## Installation and operational acceptance

The signed APK is intended for controlled presentation installation. Android may require the user to allow installation from their chosen download source and may apply device security checks. No Play Store listing, review, publisher verification or paid publisher enrollment is implied by a successful local build.

Before organisational rollout, test on Fatima's actual phones: installation, verified fullscreen launch, deep links, Fatima sign-in/sign-out and role boundaries, camera scanning, receipt/document capture, thermal-printer output and reconnect behavior. A build/signature check does not substitute for these device checks. Cameras, USB scanners and thermal printers depend on the browser, Android device and connected hardware; no universal Bluetooth printer driver is included.

Website deployment updates the interface without an APK update. Android identity, launcher or native wrapper changes require a new version code and an APK signed with the retained signing key. Browser sessions remain subject to the existing single-active-session and expiry controls. Transactions require a connection; the website's generic offline screen does not commit or queue business actions.

## Official references

- [Trusted Web Activity quick start](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
- [Android Browser Helper](https://github.com/GoogleChrome/android-browser-helper)
- [AGP 8.13 compatibility](https://developer.android.com/build/releases/agp-8-13-0-release-notes)
- [Android application signing](https://developer.android.com/studio/publish/app-signing)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
