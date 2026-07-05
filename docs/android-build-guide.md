# Android Build Preparation

## Setup Requirements
1. Install Android Studio.
2. Install Android SDK (Command-line tools & Platform-Tools).
3. Ensure `@capacitor/android` is installed.

## Generating Debug Build
To build and run on a local Android Emulator:
\`\`\`bash
npx cap sync android
npx cap open android
\`\`\`
Inside Android Studio, hit the **Run** button to launch the RENTipid shell.

## Pre-Release Validation
Before distributing to testers:
- Verify icons and splash screen placeholder configurations in `android/app/src/main/res/`.
- Ensure camera/photo file choosers function properly when triggered via the Next.js webview.
- **Privacy URL:** Must match `https://rentipid.com/privacy`
- **Data Safety Form:** Must disclose that files (KYC, Listing Photos) are uploaded to secure storage.
- **Signing:** Do not use the debug keystore for Internal/Closed Testing. Generate a secure Keystore.

## Google Play Console Checklist
- [ ] Internal Testing Track created.
- [ ] Closed Testing rollout prepared.
- [ ] App Privacy & Data Safety labeled.
- [ ] Payment Sandbox disclaimer verified.

> **DO NOT** promote the application to the Production Track without Phase 16 approval.
