# iOS Build Preparation

## Setup Requirements
1. MacOS device is required.
2. Install Xcode.
3. Ensure `@capacitor/ios` is installed.

## Generating Simulator Build
To build and run on a local iOS Simulator:
\`\`\`bash
npx cap sync ios
npx cap open ios
\`\`\`
Inside Xcode, select a simulator target (e.g. iPhone 15) and hit **Run**.

## Pre-Release Validation
Before distributing to TestFlight:
- Verify icons and splash screen placeholders in Xcode Assets.
- **Account Deletion Flow:** Apple heavily enforces the requirement that apps supporting account creation MUST support account deletion within the app itself. Ensure `/account/delete` is accessible.
- **Privacy Nutrition Labels:** Must be filled out accurately in App Store Connect.
- **Signing & Provisioning:** Set up an Apple Developer account and configure provisioning profiles.

## App Store Connect Checklist
- [ ] App Record created in App Store Connect.
- [ ] TestFlight internal track created.
- [ ] App Privacy questions completed.
- [ ] Account Deletion flow verified functional.
- [ ] Sandbox Payment disclaimer added to tester notes.

> **DO NOT** submit for Production App Store Review until Phase 16 approval.
