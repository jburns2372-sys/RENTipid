# RENTipid — Data & Knowledge Baseline

**Release Baseline:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Accepted Production SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Date:** September 16, 2026  

---

## 1. Compliance & Reference Data: 25 Prohibited Item Policies

The production database is seeded and verified with all 25 canonical prohibited and restricted policies:

| Policy Code | Category Name | Enforcement Level |
|---|---|---|
| `PI-001` | Firearms, Ammunition, Weapons & Explosives | STRICT_PROHIBITION |
| `PI-002` | Illegal Drugs, Narcotics & Controlled Substances | STRICT_PROHIBITION |
| `PI-003` | Counterfeit, Replicas & Pirated Goods | STRICT_PROHIBITION |
| `PI-004` | Stolen Goods & Property | STRICT_PROHIBITION |
| `PI-005` | Hazardous Materials & Toxic Chemicals | STRICT_PROHIBITION |
| `PI-006` | Flammable & Explosive Substances | STRICT_PROHIBITION |
| `PI-007` | Protected Wildlife & Endangered Species Parts | STRICT_PROHIBITION |
| `PI-008` | Human Remains, Organs & Body Parts | STRICT_PROHIBITION |
| `PI-009` | Prescription-Only Medications & Pharmaceuticals | STRICT_PROHIBITION |
| `PI-010` | Adult Services & Sexually Explicit Media | STRICT_PROHIBITION |
| `PI-011` | Surveillance & Wiretapping Devices | STRICT_PROHIBITION |
| `PI-012` | Hacking Hardware & Cracking Software | STRICT_PROHIBITION |
| `PI-013` | Government IDs, Badges & Uniforms | STRICT_PROHIBITION |
| `PI-014` | Fireworks & Pyrotechnics | STRICT_PROHIBITION |
| `PI-015` | Tobacco, E-Cigarettes & Nicotine Delivery | STRICT_PROHIBITION |
| `PI-016` | Alcoholic Beverages | RESTRICTED |
| `PI-017` | Gambling Devices & Lottery Equipment | RESTRICTED |
| `PI-018` | Medical Devices Requiring Certification | RESTRICTED |
| `PI-019` | Heavy Industrial Equipment Requiring Operator License | RESTRICTED |
| `PI-020` | Commercial Drones & Unmanned Aerial Vehicles | RESTRICTED |
| `PI-021` | Live Animals & Livestock | RESTRICTED |
| `PI-022` | Real Estate Properties Subject to Foreclosure Dispute | RESTRICTED |
| `PI-023` | Precious Metals, Bullion & Uncertified Gems | RESTRICTED |
| `PI-024` | Software Licenses Subject to Non-Transferability | RESTRICTED |
| `PI-025` | Commercial Kitchen Equipment Requiring Sanitation Clearance | RESTRICTED |

---

## 2. Unified AI Knowledge Base

- **Canonical Question Catalog:** 12 active seeded customer service inquiries (`/api/ai/suggestions`).
- **Support Topics:** 8 core customer domains (Booking, Security Deposit, Listing Requirements, Prohibited Items, Identity Verification, Claims & Disputes, Turnovers, Cancellations).
- **RAG Grounding:** Evaluated dynamically against verified platform policies and system settings.
- **Fail-Closed Isolation:** Unauthenticated and standard renter personas are strictly partitioned from internal SOC and admin bots.
