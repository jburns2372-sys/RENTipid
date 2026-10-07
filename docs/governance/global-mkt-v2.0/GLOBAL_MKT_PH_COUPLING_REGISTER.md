# RENTipid GLOBAL-MKT / v2.0 — Philippines Coupling Register

## 1. Executive Summary

This register catalogs empirical evidence of domestic Philippine assumptions embedded across the current RENTipid codebase. These couplings reflect the application's historical origin as a Philippine-focused rental platform. Under the **Single Global Marketplace Platform** mandate, each pattern is classified to guide systematic refactoring into shared core engines, jurisdiction profiles, or pluggable provider adapters without breaking existing Philippine operations.

### Scan Metrics Summary
- **Source Files Analyzed:** All TypeScript/JavaScript files under \`src/\`
- **Total Files with Couplings:** **190 files**
- **Total Pattern Occurrences:** **770 occurrences**

| Category | Occurrences | Primary Areas Affected | Primary Target Architecture |
| :--- | :--- | :--- | :--- |
| **Payment Gateway (\`PayMongo\`)** | **450** | Checkout, Webhooks, Reconciliation, Finance | \`GlobalPaymentOrchestrator\` + Provider Adapters |
| **Hardcoded Currency (\`'PHP'\`)** | **133** | Pricing, Ledger, Bookings, Payouts, Checkout | \`MoneyModel\` + Transaction Currency Policy |
| **Address Subdivisions (\`Barangay\`)**| **105** | Address forms, Geocoding, User Profiles | \`JurisdictionAddressProfile\` |
| **Phone Number Prefix (\`+63\`)** | **38** | Registration, SMS OTP, Twilio, WhatsApp | International Phone E.164 Normalizer |
| **Administrative Codes (\`PSGC\`)** | **32** | Database, Address APIs, Location Selectors | \`PsgcProvider\` (as PH-specific adapter) |
| **Tax & Government (\`BIR\` / \`TIN\`)** | **12** | Business registration, Invoicing, Compliance | \`JurisdictionTaxProfile\` |

---

## 2. Classification Taxonomy

1. **\`CORRECT_GLOBAL_DEFAULT\`**: The value represents a valid fallback or platform anchor (e.g. system default fallback when no context is provided).
2. **\`JURISDICTION_PROFILE_REQUIRED\`**: Business rule or field format that varies by country and must be governed by a \`JurisdictionProfile\`.
3. **\`PROVIDER_ABSTRACTION_REQUIRED\`**: Third-party integration (e.g., PayMongo, Twilio) that must be hidden behind a provider-neutral interface.
4. **\`HARDCODED_MARKET_COUPLING\`**: Architectural defect where code directly assumes Philippine behavior, blocking other jurisdictions.
5. **\`TEST_ONLY\`**: Hardcoded values in unit tests, fixtures, or local mock data.
6. **\`LEGAL/COMPLIANCE_CONTENT\`**: Static text or regulatory policies specifically describing Philippine law.

---

## 3. Detailed Coupling Inventory & Architectural Remediation

### 3.1 Payment Orchestration Coupling (\`PayMongo\`)
- **Occurrences:** 450
- **Classification:** **\`PROVIDER_ABSTRACTION_REQUIRED\`**
- **Observed Locations:**
  - \`src/lib/payment-provider-service.ts\`
  - \`src/app/api/webhooks/paymongo/route.ts\`
  - \`src/lib/services/paymongo-live-service.ts\`
  - \`src/lib/services/payment-reconciliation-service.ts\`
  - \`src/app/api/checkout/process/route.ts\`
- **Impact:** Platform cannot accept international cards without domestic routing, PromptPay (Thailand), Alipay/WeChat (China), SEPA (Europe), or UPI (India).
- **Remediation Plan (GM-8):**
  - Implement \`GlobalPaymentOrchestrator\` and \`PaymentProvider\` interface.
  - Refactor PayMongo as one concrete adapter (\`PayMongoProviderAdapter\`) registered for jurisdiction \`PH\`.
  - Introduce dynamic gateway routing based on \`JurisdictionPaymentProfile\`.

### 3.2 Hardcoded Charge Currency (\`'PHP'\`)
- **Occurrences:** 133
- **Classification:** **\`HARDCODED_MARKET_COUPLING\`**
- **Observed Locations:**
  - \`src/lib/glcc/preference-service.ts\` (\`allowedChargeCurrencies: ['PHP']\`)
  - \`src/lib/glcc/finance-authority-guards.ts\` (blocks any non-PHP charge currency)
  - \`src/lib/services/pricing-service.ts\` (assumes PHP amounts)
  - \`prisma/schema.prisma\` (\`GatewayTransaction.currency @default("PHP")\`)
- **Impact:** GLCC correctly displays 25 currencies, but the transaction engine cannot settle in THB, CNY, USD, EUR, etc.
- **Remediation Plan (GM-8 & GM-9):**
  - Establish \`MoneyModel\` with explicit \`currency\` and integer \`minorUnitAmount\`.
  - Add \`currency\` column to \`Listing\`, \`Booking\`, \`Payment\`, and \`ProviderPayout\` tables.
  - Separate \`transactionCurrency\` authority by jurisdiction.

### 3.3 Administrative Address Divisions (\`Barangay\` & \`PSGC\`)
- **Occurrences:** 137 combined (105 Barangay + 32 PSGC)
- **Classification:** **\`JURISDICTION_PROFILE_REQUIRED\`**
- **Observed Locations:**
  - \`src/app/api/address/psgc/route.ts\`
  - \`src/lib/services/address-service.ts\`
  - \`src/components/forms/address-form.tsx\`
  - \`prisma/schema.prisma\` (\`PsgcSubdivision\` table, \`Address.regionPsgcCode\`, etc.)
- **Impact:** Non-Philippine users cannot select appropriate administrative divisions (e.g. US States/Zip Codes, Thai Changwats/Tambons, Japanese Prefectures/Ku).
- **Remediation Plan (GM-4):**
  - Retain \`PsgcSubdivision\` strictly as the Philippine regional dataset.
  - Create \`JurisdictionAddressProfile\` defining country-specific field schemas:
    - US: Address Line, City, State (2-letter code), ZIP Code.
    - TH: Address Line, Tambon (Sub-district), Amphoe (District), Changwat (Province), Postal Code.
    - CN: Province, City, District, Street Address, Postal Code.
    - GB: Address Line, Town/City, County, Postcode.
  - Free-form global address validation with Google Places / Loqate geocoding adapter.

### 3.4 Phone Number Prefix (\`+63\`)
- **Occurrences:** 38
- **Classification:** **\`HARDCODED_MARKET_COUPLING\`**
- **Observed Locations:**
  - \`src/lib/services/auth-service.ts\` (regex default \`+63\`)
  - \`src/app/api/auth/phone/otp/route.ts\`
  - \`src/components/auth/phone-login-form.tsx\`
- **Impact:** Non-Philippine mobile numbers encounter validation rejections or fail SMS OTP delivery.
- **Remediation Plan (GM-2 & GM-7):**
  - Implement E.164 phone number parser using \`libphonenumber-js\`.
  - Country code dropdown bound to user's selected country preference.
  - Dynamic Twilio messaging sender profile by target country code.

### 3.5 Tax Identification (\`BIR\` / \`TIN\`)
- **Occurrences:** 12
- **Classification:** **\`LEGAL/COMPLIANCE_CONTENT\`** & **\`JURISDICTION_PROFILE_REQUIRED\`**
- **Observed Locations:**
  - \`src/lib/services/compliance-service.ts\`
  - \`src/components/provider/business-onboarding-form.tsx\`
- **Impact:** Only Philippine businesses can provide tax registration numbers; blocks global providers from entering local VAT/GST/EIN numbers.
- **Remediation Plan (GM-11):**
  - Create \`JurisdictionTaxProfile\` with localized tax ID formats (e.g. US EIN/SSN, TH Tax ID, EU VAT Number, CN Unified Social Credit Code).
