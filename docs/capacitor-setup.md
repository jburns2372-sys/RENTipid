# Capacitor Setup Guide

RENTipid relies on a robust Next.js server-side backend (Prisma, Auth, Server Actions). Due to this architecture, a fully offline static bundle via `output: 'export'` is not recommended as it limits the secure backend integration.

Instead, RENTipid uses a **Native Wrapper Strategy** via Capacitor.

## How it works:
1. Capacitor provides the native iOS and Android shells.
2. The `capacitor.config.ts` points `server.url` to your live RENTipid domain (e.g. `https://rentipid.com`).
3. When the user opens the mobile app, it acts as a secure WebView communicating directly with the production environment.
4. No sensitive `.env` secrets are packaged into the APK or IPA, maximizing security.

## Installation Commands
\`\`\`bash
npm install @capacitor/core @capacitor/ios @capacitor/android
npm install -D @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
\`\`\`

## Syncing
Whenever you update `capacitor.config.ts` or any native plugins, run:
\`\`\`bash
npx cap sync
\`\`\`
