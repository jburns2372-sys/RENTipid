import type { CapacitorConfig } from '@capacitor/cli';

// Phase 15 Note: Because RENTipid relies heavily on Next.js Server Components, Server Actions,
// and protected server-side APIs (Prisma), a full static export (out/) is not fully viable for the app architecture.
// Instead, Capacitor acts as a secure native shell that points to the deployed production web app.
// For local development, point this to your local machine IP.

const config: CapacitorConfig = {
  appId: 'com.rentipid.app',
  appName: 'RENTipid',
  webDir: 'public', // This is ignored when server.url is used
  server: {
    // Replace with the actual production URL when building for release
    url: process.env.CAPACITOR_SERVER_URL || 'https://rentipid.com',
    cleartext: true, // Allow HTTP for local dev
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
