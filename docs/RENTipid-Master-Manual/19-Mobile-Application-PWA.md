# Chapter 19 — Mobile Application and PWA

## 19.1 Mobile Strategy

RENTipid utilizes a hybrid mobile strategy to maximize reach while minimizing separate codebases. The primary web application is built with responsive web design principles and Progressive Web App (PWA) capabilities. For native device deployment (App Store / Google Play), RENTipid utilizes **Capacitor.js**.

## 19.2 Progressive Web App (PWA)

The PWA implementation allows users to install RENTipid directly from their mobile browser (Chrome/Safari) without visiting an app store.
- **Service Workers:** (Planned/Partial) Caching static assets for faster subsequent load times.
- **Manifest:** The `manifest.json` defines the app's display name, icons, and theme color for home-screen installation.

## 19.3 Capacitor Native Integration

Capacitor wraps the web application in a native WebView, allowing the codebase to access native device APIs.
- **Configuration:** Managed via `capacitor.config.ts`.
- **Target Platforms:** iOS and Android.
- **Native Capabilities Supported (Planned):**
  - Camera (for KYC uploads and Inspection Reports).
  - Push Notifications (for booking alerts and SOC interventions).
  - Geolocation (for mapping nearby rentals).

## 19.4 Mobile Analytics

The `MobileAnalytics` database model is designed to capture telemetry specific to the mobile application layer, including device type, OS version, and app version (`AppReleaseVersion`).

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-001 | `capacitor.config.ts` | Capacitor settings | Native Wrapper | Verified |
| REPO-002 | `prisma/schema.prisma` | `AppReleaseVersion`, `MobileAnalytics` | DB tracking | Verified |

## Known Limitations
- **Push Notifications:** The backend schema for notifications exists, but native Apple APNs and Firebase Cloud Messaging (FCM) integrations are not yet fully active in the production sandbox.

## Related Chapters
- Chapter 20: Technical Architecture
