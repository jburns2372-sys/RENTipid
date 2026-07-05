# Phase 15 Roadmap: Mobile App / PWA Packaging

## Overview
RENTipid is currently a responsive Web Application. Phase 15 prepares the platform for installation on mobile devices.

## Progressive Web App (PWA) First
Before dealing with App Stores, we will implement PWA capabilities:
1. `manifest.json` for home screen installation.
2. Service Workers for offline caching of static assets.
3. Push API integration for native notifications.

## App Store Packaging (Capacitor vs Tauri)
We recommend using **Capacitor** (by Ionic) to wrap the Next.js export.
- **Pros**: Access to native APIs (Camera, GPS), easiest integration with React/Next.js.
- **Cons**: Requires building a static export (`output: 'export'`), which may require rewriting some dynamic Server Components.

## Distribution Requirements
- **Google Play Console**: $25 one-time fee. Less strict on wrapped web apps.
- **Apple Developer**: $99/year fee. Highly strict UI/UX guidelines (must not look like a website).

## Estimated Integration Steps
1. Finalize mobile responsive CSS tweaks.
2. Install Capacitor and configure iOS/Android projects.
3. Implement native push notification handling.
4. Build and submit to stores.
