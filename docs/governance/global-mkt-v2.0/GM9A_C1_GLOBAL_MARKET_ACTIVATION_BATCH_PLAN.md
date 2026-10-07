# RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 Global Market Activation Batch Plan

**Controlling Objective:** ONE global platform supporting full end-to-end rental operation across ALL 46 authoritative jurisdictions.

### Batch 1: Domestic Core (Philippines)
- **Jurisdictions (1):** `PH`
- **Current Status:** LOCAL_ACCEPTED (PASS)
- **Shared Blockers:** AUTOMATED_PAYOUT_RAIL_MISSING, LOCAL_TAX_CLEARANCE_REQUIRED
- **Provider Dependencies:** PayMongo Global Integration; Automated Direct Bank Payout Rail
- **Legal Dependencies:** BIR Internet Transactions Act Review
- **Required Code Work:** Automated payout webhook listener and disbursement reconciliation
- **Owner / External Action Required:** Verify PayMongo production disbursement sub-account
- **Promotion Milestones:** Local (COMPLETED (GM-9A PASS)) ➔ Preview (GM-10A Preview Acceptance) ➔ Production (GM-11A Production Activation)

### Batch 2: Southeast Asia Regional Expansion
- **Jurisdictions (5):** `TH`, `SG`, `MY`, `VN`, `ID`
- **Current Status:** GAP_CLOSURE_REQUIRED
- **Shared Blockers:** REGIONAL_APAC_PAYMENT_GATEWAY_MISSING, LOCAL_CURRENCY_PAYOUT_RAILS_MISSING, REGIONAL_CONSUMER_PROTECTION_REVIEW
- **Provider Dependencies:** Stripe APAC / 2C2P / Adyen; Wise Platform / Local Bank Direct
- **Legal Dependencies:** Thai DBD registration, Singapore MAS exemption review, Malaysian MDEC review
- **Required Code Work:** Adapter for APAC multi-currency acquiring (THB, SGD, MYR, VND, IDR) & PromptPay/PayNow QR rails
- **Owner / External Action Required:** Project Owner selection of APAC payment/payout vendor and merchant agreement execution
- **Promotion Milestones:** Local (GM-9A-B2 Local Acceptance) ➔ Preview (GM-10A-B2 Preview Acceptance) ➔ Production (GM-11A-B2 Production Activation)

### Batch 3: Anglo-American & Developed APAC
- **Jurisdictions (6):** `US`, `GB`, `CA`, `AU`, `JP`, `KR`
- **Current Status:** GAP_CLOSURE_REQUIRED
- **Shared Blockers:** INTERNATIONAL_CREDIT_CARD_GATEWAY_MISSING, CROSS_BORDER_DISBURSEMENT_RAILS_MISSING, SUB_NATIONAL_TAX_COMPLIANCE_REQUIRED
- **Provider Dependencies:** Stripe Global / Adyen; Stripe Connect / Wise
- **Legal Dependencies:** US state sales tax nexus review, UK Consumer Rights Act, Australian Consumer Law
- **Required Code Work:** Multi-currency settlement engine for USD, GBP, CAD, AUD, JPY, KRW and automated 1099-K reporting hooks
- **Owner / External Action Required:** Stripe Global merchant underwriting and API credential provisioning
- **Promotion Milestones:** Local (GM-9A-B3 Local Acceptance) ➔ Preview (GM-10A-B3 Preview Acceptance) ➔ Production (GM-11A-B3 Production Activation)

### Batch 4: European Union / EEA Single Market
- **Jurisdictions (30):** `DE`, `FR`, `IT`, `ES`, `NL`, `BE`, `AT`, `PL`, `SE`, `DK`, `NO`, `FI`, `IE`, `PT`, `GR`, `CZ`, `RO`, `HU`, `BG`, `HR`, `SK`, `SI`, `LT`, `LV`, `EE`, `CY`, `LU`, `MT`, `IS`, `LI`
- **Current Status:** GAP_CLOSURE_REQUIRED
- **Shared Blockers:** EUR_SEPA_ACQUIRING_AND_DISBURSEMENT_MISSING, DAC7_DIGITAL_PLATFORM_REPORTING_INTEGRATION, GDPR_CROSS_BORDER_PROCESSING_REVIEW
- **Provider Dependencies:** Stripe Europe (SEPA Direct Debit / iDEAL / Bancontact / Klarna); SEPA Instant Payout Rail
- **Legal Dependencies:** DAC7 EU tax reporting compliance, GDPR legal representative appointment
- **Required Code Work:** Unified SEPA payment & payout adapter, EUR minor unit calculations, DAC7 annual reporting schema
- **Owner / External Action Required:** EU merchant account registration and DAC7 platform reporting configuration
- **Promotion Milestones:** Local (GM-9A-B4 Local Acceptance) ➔ Preview (GM-10A-B4 Preview Acceptance) ➔ Production (GM-11A-B4 Production Activation)

### Batch 5: Emerging Major Markets (LATAM, Middle East & South Asia)
- **Jurisdictions (3):** `BR`, `AE`, `IN`
- **Current Status:** GAP_CLOSURE_REQUIRED
- **Shared Blockers:** LOCAL_DOMESTIC_PAYMENT_METHODS_MISSING, CROSS_BORDER_EXCHANGE_CONTROLS
- **Provider Dependencies:** Local payment adapters (Brazil Pix, UAE Cards/Wallets, India UPI/Razorpay)
- **Legal Dependencies:** Brazil LGPD, UAE Central Bank Stored Value Facility, India RBI Cross-Border Master Direction
- **Required Code Work:** Pix instant payment adapter (BRL), AED direct acquiring, UPI integration (INR)
- **Owner / External Action Required:** In-country merchant entity or cross-border payment merchant agreement
- **Promotion Milestones:** Local (GM-9A-B5 Local Acceptance) ➔ Preview (GM-10A-B5 Preview Acceptance) ➔ Production (GM-11A-B5 Production Activation)

### Batch 6: Mainland China Special Regulatory Market
- **Jurisdictions (1):** `CN`
- **Current Status:** GAP_CLOSURE_REQUIRED (2 DEFERRED BLOCKERS)
- **Shared Blockers:** ICP_LICENSE_REQUIRED, PIPL_DATA_LOCALIZATION_COMPLIANCE, MAINLAND_CHINA_WECHAT_ALIPAY_ACQUIRING
- **Provider Dependencies:** WeChat Pay / Alipay Cross-Border / In-Country Gateway
- **Legal Dependencies:** MIIT ICP commercial telecom license, CAC personal information localization compliance
- **Required Code Work:** Alipay/WeChat Pay QR scanner, CNY minor unit settlement, dedicated data isolation partition
- **Owner / External Action Required:** Commercial partner joint venture in mainland China for ICP application; CAC data transfer filing and server localization setup
- **Promotion Milestones:** Local (GM-9A-B6 Local Acceptance) ➔ Preview (GM-10A-B6 Preview Acceptance) ➔ Production (GM-11A-B6 Production Activation)

