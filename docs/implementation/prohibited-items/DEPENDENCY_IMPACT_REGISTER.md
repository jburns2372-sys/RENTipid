# Dependency Impact Register

- **Listing Models**: Rely heavily on `User` and `Category`. Modifying `Listing` requires checking downstream references like `Booking` and `InspectionReport`.
- **RBAC**: Changes affect `src/lib/permissions.ts` and all secured routes (especially in `/dashboard`).
- **Audit Logging**: Must conform to `src/lib/audit.ts` formats.
- **Security Events**: Must map to `src/lib/security/events/taxonomy.ts` and ensure idempotency and evidence protection rules are adhered to.
- **PWA/Mobile**: Changes to public and provider routes must remain compliant with Capacitor WebView boundaries and mobile responsive requirements.
