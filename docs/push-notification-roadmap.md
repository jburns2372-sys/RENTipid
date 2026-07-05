# Push Notification Roadmap

As RENTipid transitions into Phase 16 (Full Public Launch), implementing native Push Notifications will be critical for realtime booking alerts, chat messages, and dispute updates.

## Recommended Technology Stack
- **Firebase Cloud Messaging (FCM):** Standard across iOS and Android via Capacitor.
- **Capacitor Push Notifications Plugin:** `@capacitor/push-notifications`

## Implementation Steps
### 1. Backend Preparation (Next.js)
- Create a `DeviceToken` table in Prisma to map User IDs to FCM Tokens.
- Build an API endpoint `/api/user/device-tokens` to register and deregister tokens.
- Update the Notification Service to trigger FCM calls alongside in-app notifications.

### 2. Mobile Client Setup (Capacitor)
- Install `@capacitor/push-notifications`.
- Request permissions on app load (iOS requires explicit user consent).
- Register the device token with the RENTipid Next.js backend.
- Handle incoming notifications (Foreground vs. Background routing).

### 3. Key Notification Events
- Booking Requests received (Provider).
- Booking Approved/Rejected (Renter).
- Inspection confirmed.
- Payment successful.
- Dispute opened.

### 4. Apple specific requirements
- Configure APNs keys in Apple Developer Portal.
- Link APNs to Firebase Console.
