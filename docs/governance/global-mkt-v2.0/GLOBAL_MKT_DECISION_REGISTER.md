# RENTipid GLOBAL-MKT / v2.0 — Architectural Decision Register

## 1. Controlling Executive Authority

The architectural decisions in this register are derived directly from the explicit directives of **Project Owner Federico Diagono Jr.** and form the immutable foundation for all RENTipid GLOBAL-MKT / v2.0 development.

---

## 2. Locked Architectural Decisions

### DECISION 1: ONE GLOBAL MARKETPLACE PLATFORM
- **Status:** **LOCKED & APPROVED**
- **Decision:** RENTipid shall be designed, engineered, and operated as **ONE SINGLE GLOBAL RENTAL MARKETPLACE PLATFORM**.
- **Rationale:** Prevents fragmentation, eliminates redundant maintenance overhead, preserves a single unified user base, and mirrors the proven global architecture of leading international marketplaces.

### DECISION 2: NO COUNTRY APPLICATION FORKS
- **Status:** **LOCKED & APPROVED**
- **Decision:** Prohibit the creation of separate country-specific applications (e.g., \`RentipidPhilippinesApp\`, \`RentipidThailandApp\`, \`RentipidChinaApp\`).
- **Rationale:** Creating 46 separate codebases is commercially and technically unsustainable. A single frontend and backend web/mobile codebase shall serve all jurisdictions.

### DECISION 3: SHARED BUSINESS ENGINES
- **Status:** **LOCKED & APPROVED**
- **Decision:** All core marketplace mechanisms (account authentication, listings, search, bookings, turnover inspection, messaging, reviews, dispute arbitration) must reside in shared global engines.
- **Rationale:** Core marketplace business logic is fundamentally invariant; duplication across countries introduces drift, bugs, and security vulnerabilities.

### DECISION 4: COUNTRY DIFFERENCES THROUGH PROFILES, POLICIES & ADAPTERS
- **Status:** **LOCKED & APPROVED**
- **Decision:** All jurisdictional differences (legal mandates, document types, administrative address formats, tax calculations, category restrictions) must be implemented via declarative \`JurisdictionProfile\` structures, \`PolicyEngine\` rules, and pluggable \`ProviderAdapter\` components.
- **Rationale:** Isolates country-specific logic from the core business engine and allows rapid onboarding of new jurisdictions via configuration rather than custom code.

### DECISION 5: LANGUAGE INDEPENDENT OF COUNTRY
- **Status:** **LOCKED & APPROVED**
- **Decision:** User interface language must remain strictly decoupled from the user's geographic country or transaction jurisdiction.
- **Rationale:** Preserves the foundational GLCC invariant: a traveler or expatriate (e.g. Japanese speaker in Thailand, English speaker in Germany) must be able to navigate the platform in their preferred language while operating within the local legal/market framework.

### DECISION 6: DISPLAY CURRENCY INDEPENDENT OF PAYMENT & SETTLEMENT AUTHORITY
- **Status:** **LOCKED & APPROVED**
- **Decision:** Maintain the strict architectural separation: \`DISPLAY_CURRENCY != TRANSACTION_CURRENCY != SETTLEMENT_CURRENCY\`.
- **Rationale:** Renters may view estimated pricing in any of the 25 supported display currencies, while actual financial charging follows the authorized local transaction currency, and providers receive settlement in their local domestic rail.

### DECISION 7: PAYMENT PROVIDER NEUTRALITY
- **Status:** **LOCKED & APPROVED**
- **Decision:** RENTipid shall maintain a provider-neutral \`GlobalPaymentOrchestrator\`. No single commercial vendor (e.g. PayMongo, Stripe, Adyen) shall define the payment architecture.
- **Rationale:** Ensures payment gateway redundancy, enables regional multi-gateway routing, and protects the platform against vendor lock-in.

### DECISION 8: PAYOUT PROVIDER NEUTRALITY
- **Status:** **LOCKED & APPROVED**
- **Decision:** Implement a provider-neutral \`GlobalPayoutOrchestrator\` capable of routing provider disbursements across diverse domestic and international settlement rails (Stripe Connect, Wise, local ACH/SEPA/PromptPay).
- **Rationale:** Provider payouts cannot be limited to a single domestic banking network if 46 jurisdictions are to achieve commercial viability.

### DECISION 9: FULL 13-CAPABILITY LIFECYCLE REQUIRED FOR COMMERCIAL ACTIVE STATUS
- **Status:** **LOCKED & APPROVED**
- **Decision:** A jurisdiction is NOT commercially active merely because language, currency, or GLCC production availability exists. Active status requires proven end-to-end execution of all 13 core lifecycle capabilities.
- **Rationale:** Prevents false marketing claims, protects user trust, and enforces honest, verifiable operational readiness.

### DECISION 10: ANDROID / IOS USE THE SAME GLOBAL MARKETPLACE BACKEND
- **Status:** **LOCKED & APPROVED**
- **Decision:** Mobile applications (PWA, Capacitor, native iOS/Android shells) shall communicate with the exact same unified Global Marketplace APIs, rather than separate regional backends.
- **Rationale:** Preserves backend consistency, unifies security posture, and allows mobile users to transact across borders seamlessly.
