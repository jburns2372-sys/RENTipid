# Global Address System Discovery Registry

**CURRENT PROFILE ROUTE**
`/dashboard/profile`

**CURRENT PROFILE COMPONENT**
`src/app/dashboard/profile/page.tsx` integrating `src/components/profile/ProfileFormClient.tsx`

**CURRENT PROFILE UPDATE METHOD**
`PATCH /api/profile`

**CURRENT PRISMA MODEL**
`UserProfile` and `BusinessProfile`

**CURRENT ADDRESS FIELDS**
- `UserProfile`: `address`, `address_encrypted`, `city`, `province`, `country`
- `BusinessProfile`: `business_address`, `business_address_encrypted`

**CURRENT VALIDATION**
Zod schemas inside `src/app/api/profile/route.ts` (`profileUpdateSchema`).

**CURRENT AUTHORIZATION**
`getServerSession(authOptions)` in Next.js API routes (`src/app/api/profile/route.ts`).

**CURRENT REUSABLE COMPONENTS**
Basic `InputField` in `ProfileFormClient.tsx`. No dedicated address components currently exist.

**CURRENT TESTS**
E2E and Integration tests inside `/tests`.

**EXISTING ADDRESS/GEO PACKAGES**
`react-simple-maps` is present. No explicit country/address data library or Google Maps autocomplete library is currently installed. 

**DATABASE MIGRATION REQUIRED**
Yes. To safely normalize global addresses, the schema must evolve to handle structured fields (addressLine1, addressLine2, sublocality, locality, administrativeArea1, postalCode, countryCode) and validation states (provider, providerPlaceId, validationStatus, validationLevel, manuallyEdited).

**FILES EXPECTED TO MODIFY**
- `prisma/schema.prisma`
- `src/components/profile/ProfileFormClient.tsx`
- `src/app/dashboard/profile/page.tsx`
- `src/app/api/profile/route.ts`
- `package.json` (to add provider dependencies or `world-countries`)
- `.env.local` / `.env.example`

**FILES EXPECTED TO CREATE**
- `src/components/address/AddressForm.tsx`
- `src/components/address/CountrySelect.tsx`
- `src/components/address/AddressAutocomplete.tsx`
- `src/lib/address/types.ts`
- `src/lib/address/normalizer.ts`
- `src/lib/address/providers/google.ts`
- `src/lib/address/countryRegistry.ts`

**KNOWN RISKS**
- Existing user addresses might be lost or corrupted if the data migration is destructive.
- Replacing encrypted fields (`address_encrypted`, `business_address_encrypted`) requires care so PII is still protected safely.
- Modifying `UserProfile` and `BusinessProfile` structure requires updating any read paths that expect the old schema.
