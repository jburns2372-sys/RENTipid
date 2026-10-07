# RENTipid GLOBAL-MKT / v2.0 — Initial Risk Register

## 1. Executive Summary

This register identifies, assesses, and establishes mitigation controls for the top architectural, operational, regulatory, and technical risks associated with transforming RENTipid into **ONE GLOBAL RENTAL MARKETPLACE PLATFORM** across 46 jurisdictions.

---

## 2. Risk Evaluation Matrix

| Risk ID | Risk Domain | Description | Severity | Likelihood | Mitigation Strategy | Ownership Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | Architecture | **Country-Fork & Engine Duplication Risk:** Teams create jurisdiction-specific codebases (e.g. \`RentipidTH\`, \`booking-cn\`), fragmenting maintenance. | CRITICAL | HIGH | Non-negotiable architectural decision locking single core engine with pluggable \`JurisdictionProfile\` and provider adapters. | \`GM-0\`, \`GM-1\` |
| **RSK-02** | Finance | **Payment / Settlement Mismatch & FX Loss:** Renters paying in currency A while providers settle in currency B leading to unhedged volatility. | HIGH | MEDIUM | Implement strict \`MoneyModel\` separating display quoting from authoritative transaction and settlement currencies. No floating-point math. | \`GM-8\`, \`GM-9\` |
| **RSK-03** | Finance | **Payout Rail Fragmentation:** Inability to automate payouts in all 46 markets, forcing manual bank operations and operational bottlenecks. | HIGH | HIGH | Provider-neutral \`GlobalPayoutOrchestrator\` integrating multi-market payout networks (Stripe Connect, Wise, local ACH/SEPA/PromptPay). | \`GM-9\` |
| **RSK-04** | Compliance | **KYC & Identity Document Fragmentation:** Heterogeneous national identity documents, formats, and regulatory verification standards across 46 countries. | HIGH | HIGH | Introduce pluggable \`GlobalKycProvider\` adapter pattern allowing tier-1 identity verification services (Persona, Veriff, etc.) per market profile. | \`GM-3\` |
| **RSK-05** | Legal | **Regulatory & Restricted Category Violations:** Prohibited rental items (e.g. firearms, drones, surveillance tools, vehicles) varying by jurisdiction. | HIGH | MEDIUM | Centralize category policies into \`JurisdictionPolicyEngine\` with localized category permission flags (\`ALLOWED\`, \`PROHIBITED\`, \`PERMIT_REQUIRED\`). | \`GM-1\`, \`GM-11\` |
| **RSK-06** | Regulatory | **Mainland China Regulatory Blockers:** ICP Filing requirements, cross-border security reviews, and domestic PRC hosting (\`CN-BLK-001\`, \`CN-BLK-002\`). | HIGH | HIGH | Maintain explicit deferred boundary in governance. Mainland China public network operability remains strictly NOT CLAIMED until licensed. | \`GM-12\`, \`GM-17\` |
| **RSK-07** | Tax | **Cross-Border Tax & Reporting Complexity:** Marketplace facilitator laws (EU DAC7, US 1099-K, UK reporting, local VAT/GST withholding). | HIGH | MEDIUM | Provider-neutral \`GlobalTaxComplianceEngine\` driven by \`JurisdictionTaxProfile\`, maintaining audit ledgers per transaction jurisdiction. | \`GM-11\` |
| **RSK-08** | Operations | **Address & Geographic Normalization:** Enforcing Philippine PSGC codes onto global addresses causing validation crashes or unverified locations. | MEDIUM | HIGH | Decouple \`Address\` model from PSGC; create country-specific address profiles and integrate global geocoding (Google Places / Loqate). | \`GM-4\` |
| **RSK-09** | Security | **Cross-Border PII & Data Residency:** Strict data sovereignty laws (e.g. EU GDPR, PRC PIPL, Thai PDPA) requiring regional data governance. | HIGH | MEDIUM | Field-level encryption for PII, dedicated regional data retention policies, and automated Data Subject Request (DSR) workflows. | \`GM-1\`, \`GM-11\` |
| **RSK-10** | Fraud | **Chargebacks, False Claims & Deposit Escrow:** Cross-border renters disappearing without returning items or disputing credit card charges. | HIGH | MEDIUM | Shared \`GlobalDisputeAndRefundEngine\` with localized damage inspection protocols, photo turnover evidence, and pre-authorized deposit holds. | \`GM-10\` |
| **RSK-11** | Mobile | **App Store Policy Coupling:** Apple App Store / Google Play rejecting the app due to unsupported markets or unclear financial disclosures. | MEDIUM | LOW | Decouple global mobile client from per-country commercial availability. Market activation gated on backend; apps display compliant states. | \`GM-MOBILE\` |
| **RSK-12** | Database | **Destructive Database Mutations:** Premature schema migrations corrupting existing production rental and financial data. | CRITICAL | LOW | Strict zero-mutation policy in GM-0; non-destructive, additive migrations strictly enforced throughout all future implementation phases. | All Phases |

---

## 3. Governance Review & Audit Schedule

The risk register shall be formally reviewed at the completion of each major Global Marketplace milestone (e.g., following GM-1, GM-4, GM-8, GM-9, and GM-13). Any newly identified jurisdictional compliance blocker must be immediately logged and evaluated by the Legal/Compliance Officer.
