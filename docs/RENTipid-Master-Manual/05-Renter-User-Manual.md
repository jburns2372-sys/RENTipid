# Chapter 5 — Renter Getting Started

## 5.1 Account Creation and Profile Setup

To begin renting on RENTipid, users must first create a Renter account:
1. Navigate to the RENTipid homepage and select **Sign Up**.
2. Provide a valid email address, name, and secure password.
3. Once registered, log into the dashboard and complete your profile.
4. **Verification:** Navigate to the KYC section and upload a valid government ID. Your account will remain in a limited state until a Compliance Admin approves your identity.

## 5.2 Searching and Filtering Listings

The `Browse Rentals` page allows Renters to discover available assets:
- **Search Bar:** Enter keywords to find specific items.
- **Categories:** Filter by predefined categories (e.g., Tools, Cameras, Vehicles).
- **Filters:** Adjust price ranges, location constraints, and deposit requirements.

*Technical Note: The search functionality queries the `Listing` database model where the status is `PUBLISHED`.*

## 5.3 Reviewing Listing Details

When selecting a listing, Renters can view:
- **Item Description & Photos:** Detailed specifications and visual condition.
- **Provider Details:** The Provider's name, rating, and verification status.
- **Pricing & Fees:** Daily rental rate, required security deposit, and platform service fees.
- **Availability Calendar:** Selectable dates for the rental period.
- **Conditions:** Specific rules set by the Provider (e.g., "No off-road use").

## 5.4 Using the Dashboard

Once logged in, the Renter Dashboard provides access to:
- **My Bookings:** Track pending, active, and completed rentals.
- **Payments:** View receipts and refund status.
- **Claims & Disputes:** Manage ongoing issues with Providers.
- **Inbox/Messages:** (If supported) Communicate regarding active bookings.

## 5.5 Mobile and PWA Access

RENTipid is designed as a Progressive Web App (PWA). Renters can access the platform via desktop or mobile browsers. For an app-like experience, users can "Add to Home Screen" on iOS (Safari) or Android (Chrome), which enables offline caching and a full-screen interface.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-005 | `src/app/browse/page.tsx` | Search and Filter UI | Core renter discovery | Verified |
| REPO-005 | `src/app/dashboard/renter` | Renter Dashboard Routes | User portal | Verified |

## Known Limitations
- **Favorites/Saving:** The ability to "save" or "favorite" listings is currently UI-only or partially implemented and may not persist across sessions.

## Related Chapters
- Chapter 6: Booking and Rental Process
- Chapter 30: Mobile and PWA Capabilities
