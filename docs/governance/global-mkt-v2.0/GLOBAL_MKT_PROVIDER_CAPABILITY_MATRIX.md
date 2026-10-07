# RENTipid GLOBAL-MKT / v2.0 — Provider Capability Matrix

## 1. Executive Summary

Under the **Single Global Marketplace Platform** architecture, third-party services must be integrated through provider-neutral interfaces. This prevents any single commercial vendor from dictating RENTipid's business logic and enables pluggable multi-provider failover and jurisdiction-specific provider routing.

---

## 2. Capability State Classifications

- \`VERIFIED\`: Provider integrated, tested, and operational in production.
- \`PARTIAL\`: Provider integrated for specific regions or sandbox/manual flows only.
- \`NOT_CONFIGURED\`: Architectural interface planned, but no commercial provider adapter active.
- \`UNKNOWN\`: Vendor capability unverified against RENTipid regulatory requirements.

---

## 3. Global Provider Architecture Slots

| Capability Domain | Target Architectural Interface | Existing Active Provider | Existing Status | Candidate Global / Regional Providers | Target Production Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Payment Collection** | \`PaymentProvider\` | **PayMongo** (PHP only) | \`PARTIAL\` | Stripe, Adyen, 2C2P, PromptPay, Alipay, WeChat Pay | Multi-gateway routing by jurisdiction profile |
| **Provider Payouts** | \`PayoutProvider\` | **Manual Bank Transfer** | \`PARTIAL\` | Stripe Connect, Wise Platform, PayPal Payouts, Local ACH/SEPA/PromptPay | Automated multi-currency provider settlement |
| **KYC & Identity** | \`GlobalKycProvider\` | **Internal Manual Review** | \`PARTIAL\` | Persona, Veriff, Onfido, Sumsub, Jumio | Automated OCR, liveness check, and sanctions screening |
| **FX & Quoting** | \`FxRateProvider\` | **CurrencyAPI Adapter** | \`VERIFIED\` | CurrencyAPI, OpenExchangeRates, Central Bank APIs | Real-time quoted multi-currency display rates |
| **Maps & Geocoding** | \`GeocodingProvider\` | **Google Maps API** | \`VERIFIED\` | Google Places, Mapbox, Loqate | Address auto-complete, pin drop, and radius discovery |
| **Tax Calculation** | \`TaxCalculationProvider\` | **None (Internal Formula)** | \`NOT_CONFIGURED\` | Avalara, Vertex, Stripe Tax, Internal Profile Tables | Automated VAT/GST/Sales Tax calculation & filing export |
| **SMS Notifications** | \`SmsNotificationProvider\` | **Twilio** | \`PARTIAL\` | Twilio, AWS SNS, Vonage, Sinch | Localized transactional SMS & 2FA OTP delivery |
| **WhatsApp Messages** | \`WhatsAppProvider\` | **Twilio Messaging API** | \`PARTIAL\` | Twilio WhatsApp Business API, Meta Cloud API | Real-time booking alerts and customer support chat |
| **Email Delivery** | \`EmailNotificationProvider\` | **SMTP / Resend** | \`VERIFIED\` | Resend, AWS SES, SendGrid | Localized transactional receipts, agreements, notices |
| **Fraud & Risk** | \`FraudRiskProvider\` | **Internal SOC Rules** | \`PARTIAL\` | Sift, Castle, FingerprintJS, Internal Rules Engine | Account takeover prevention, payment risk scoring |

---

## 4. Regional Provider Allocation Strategy

### 4.1 Philippines (\`PH\`)
- **Payment Collection:** PayMongo (Cards, GCash, Maya, GrabPay) — \`VERIFIED\`
- **Payout:** Local Bank Transfer / PESONet / InstaPay via automated rail — \`PARTIAL\` (Manual currently)
- **KYC:** Local Philippine IDs (Passport, Driver's License, UMID) via pluggable automated provider — \`PARTIAL\`

### 4.2 Thailand (\`TH\`)
- **Payment Collection:** 2C2P / Stripe Thailand / Omise (PromptPay QR, Thai Credit Cards) — \`NOT_CONFIGURED\`
- **Payout:** Thai Baht Domestic Transfers via PromptPay / Local Bank API — \`NOT_CONFIGURED\`
- **KYC:** Thai National ID card OCR + DOPA verification — \`NOT_CONFIGURED\`

### 4.3 Mainland China (\`CN\`)
- **Payment Collection:** Alipay / WeChat Pay / UnionPay via licensed cross-border PSP — \`NOT_CONFIGURED\`
- **Payout:** Cross-border settlement or domestic CNY rail — \`NOT_CONFIGURED\`
- **KYC:** PRC Resident Identity Card verification — \`NOT_CONFIGURED\`
- **Governance Deferred Blockers:** \`CN-BLK-001\` (ICP), \`CN-BLK-002\` (CAC security assessment) must be resolved prior to commercial operation.

### 4.4 North America (\`US\`, \`CA\`)
- **Payment Collection:** Stripe / Adyen (Cards, Apple Pay, Google Pay, ACH) — \`NOT_CONFIGURED\`
- **Payout:** Stripe Connect / Direct ACH / Interac e-Transfer — \`NOT_CONFIGURED\`
- **KYC:** Driver's License / State ID / Passport via automated biometric provider — \`NOT_CONFIGURED\`

### 4.5 Europe / EEA (29 Member States + \`GB\`)
- **Payment Collection:** Stripe / Adyen (SEPA Direct Debit, iDEAL, Bancontact, Sofort, Cards) — \`NOT_CONFIGURED\`
- **Payout:** SEPA Credit Transfer / Bacs — \`NOT_CONFIGURED\`
- **KYC:** EU eID / National ID cards compliant with AML5 directives — \`NOT_CONFIGURED\`
- **Tax:** EU DAC7 reporting adapter — \`NOT_CONFIGURED\`
