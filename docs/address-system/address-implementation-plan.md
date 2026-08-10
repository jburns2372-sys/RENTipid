# Global Address System Implementation Plan

## A. Existing architecture
Currently, address data is stored directly on the `UserProfile` (as `address`, `city`, `province`, `country`) and `BusinessProfile` (as `business_address`) models in Prisma. Address data is collected via raw text inputs in `ProfileFormClient.tsx`, updated via `PATCH /api/profile`, and secured with `ProfileFieldProtection`. There is no structured validation for address fields, no autocomplete, and no normalization.

## B. Target architecture
We will introduce a reusable, canonical Address model in Prisma. This model will store normalized global address fields (addressLine1, addressLine2, sublocality, locality, administrativeArea1, postalCode, countryCode) along with provider metadata (provider, providerPlaceId, validationStatus, validationLevel, manuallyEdited).
We will build a provider-independent `AddressService` with a Google Maps Autocomplete adapter. The UI will use a country-first workflow where the user selects a country, searches for an address via Google autocomplete, and the UI normalizes the selected result before saving it.

## C. Exact files to modify
- `prisma/schema.prisma`
- `src/app/api/profile/route.ts`
- `src/components/profile/ProfileFormClient.tsx`
- `src/lib/security/crypto/profile-field-protection.ts` (to support Address encryption if needed, though we may handle it at the Address model level)
- `package.json` (add `@googlemaps/google-maps-services-js` or use raw `fetch` for REST APIs; add `world-countries` for country registry if needed)

## D. Exact files to create
- `docs/address-system/address-implementation-plan.md`
- `src/components/address/AddressForm.tsx`
- `src/components/address/CountrySelect.tsx`
- `src/components/address/AddressAutocomplete.tsx`
- `src/lib/address/types.ts`
- `src/lib/address/normalizer.ts`
- `src/lib/address/countryRegistry.ts`
- `src/lib/address/providers/google.ts`
- `src/lib/address/AddressService.ts`
- `/api/address/countries/route.ts` (optional, or static)
- `/api/address/autocomplete/route.ts`
- `/api/address/details/route.ts`

## E. Prisma changes
Create an `Address` model:
```prisma
model Address {
  id                  String   @id @default(cuid())
  addressLine1        String?
  addressLine2        String?
  sublocality         String?
  locality            String?
  administrativeArea2 String?
  administrativeArea1 String?
  postalCode          String?
  countryCode         String?
  formattedAddress    String?
  latitude            Float?
  longitude           Float?
  provider            String   // "google", "manual", etc.
  providerPlaceId     String?
  validationStatus    String   // "UNVERIFIED", "VALIDATED", "MANUAL", etc.
  validationLevel     String?
  manuallyEdited      Boolean  @default(false)
  validatedAt         DateTime?

  userProfile         UserProfile?
  businessProfile     BusinessProfile?
}
```
Add relations to `UserProfile` (`address_id`) and `BusinessProfile` (`business_address_id`).

## F. Data migration strategy
We will write a non-destructive Prisma migration script.
For each existing `UserProfile`, we will create a new `Address` record:
- `addressLine1` = existing decrypted `address`
- `locality` = existing `city`
- `administrativeArea1` = existing `province`
- `countryCode` = map existing `country` string to ISO code (e.g. 'Philippines' -> 'PH')
- `provider` = 'LEGACY'
- `validationStatus` = 'UNVERIFIED'
Same for `BusinessProfile` using `business_address`.

## G. Provider integration
We will implement a `GoogleAddressProvider` matching the `AddressProvider` interface. It will use the Google Places Autocomplete (New) REST API for `/autocomplete` and `/details`. It will map Google's address components into our `NormalizedAddress` format.

## H. Security strategy
- Server-side validation of country code and address fields.
- Address lookup endpoints (`/api/address/...`) protected by `getServerSession(authOptions)` and rate limited.
- Continue encrypting the `addressLine1` using `SecretEnvelopeService` where necessary, or encrypt the entire payload if PII.
- `GOOGLE_MAPS_API_KEY` stored only in `.env.local` and never exposed to the client bundle. The server handles all Google API requests.

## I. Test strategy
- Unit test the country registry, Google adapter mapping, and normalizer.
- Integration test for `PATCH /api/profile` updating the new Address relation.

## J. Rollback strategy
- Retain the legacy `address` and `city`/`province`/`country` fields on `UserProfile` during this phase so rollback is as simple as reverting the codebase; data will still be there. Once verified, we can drop the old columns in a future PR.
