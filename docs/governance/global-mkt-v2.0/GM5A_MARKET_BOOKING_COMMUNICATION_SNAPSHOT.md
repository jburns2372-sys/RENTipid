# RENTipid GLOBAL-MKT / v2.0 — Market Booking & Communication Snapshot
## Action GM-5A: 46-Country Architecture Status Snapshot

**Date:** 2026-10-07  
**Application Baseline:** `3fa2f6b90f710258a04a4a44827f01335de9d6fe`  
**Authoritative Countries:** 46/46  
**Commercially Active Countries:** 0  
**China Deferred Blockers:** 2 (Preserved)  

---

### Summary Invariants
- **Global Booking Engine:** One unified state machine with 15 typed states.
- **Availability Engine:** Unified interval non-overlap protection across canonical UTC instants.
- **Messaging Architecture:** One global conversation model with participant integrity and anti-forgery guards.
- **Notification Core:** Neutral delivery layer with failure isolation, localized templates, and idempotency deduplication.
- **Commercial Status:** 0 countries active. Payment and payout orchestration deferred strictly to GM-6A.

---

### Authoritative 46-Country Status Matrix

| Code | Jurisdiction Name | Region | Booking Policy | Primary Timezone | Renter KYC | Channels | Commercial Active | Known Blockers |
|:---:|:---|:---:|:---:|:---|:---:|:---|:---:|:---|
| **PH** | Philippines | APAC | DEFINED | `Asia/Manila` | MANDATORY | IN_APP, EMAIL, SMS | **NO** | PH-BLK-001 |
| **US** | United States | AMERICAS | DEFINED | `America/New_York` | MANDATORY | IN_APP, EMAIL, SMS | **NO** | None |
| **GB** | United Kingdom | EMEA | DEFINED | `Europe/London` | MANDATORY | IN_APP, EMAIL, SMS | **NO** | None |
| **CA** | Canada | AMERICAS | DEFINED | `America/Toronto` | MANDATORY | IN_APP, EMAIL, SMS | **NO** | None |
| **AU** | Australia | APAC | DEFINED | `Australia/Sydney` | MANDATORY | IN_APP, EMAIL, SMS | **NO** | None |
| **SG** | Singapore | APAC | DEFINED | `Asia/Singapore` | MANDATORY | IN_APP, EMAIL, SMS | **NO** | None |
| **MY** | Malaysia | APAC | DEFINED | `Asia/Kuala_Lumpur` | MANDATORY | IN_APP, EMAIL, SMS | **NO** | None |
| **ID** | Indonesia | APAC | DEFINED | `Asia/Jakarta` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **VN** | Vietnam | APAC | DEFINED | `Asia/Ho_Chi_Minh` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **JP** | Japan | APAC | DEFINED | `Asia/Tokyo` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **KR** | South Korea | APAC | DEFINED | `Asia/Seoul` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **IN** | India | APAC | DEFINED | `Asia/Kolkata` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **CN** | China | APAC | DEFINED | `Asia/Shanghai` | MANDATORY | IN_APP, EMAIL | **NO** | CN-BLK-001, CN-BLK-002 |
| **TH** | Thailand | APAC | DEFINED | `Asia/Bangkok` | MANDATORY | IN_APP, EMAIL | **NO** | TH-BLK-001, TH-BLK-002 |
| **AE** | United Arab Emirates | EMEA | DEFINED | `Asia/Dubai` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **BR** | Brazil | AMERICAS | DEFINED | `America/Sao_Paulo` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **DE** | Germany | EU_EEA | DEFINED | `Europe/Berlin` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **FR** | France | EU_EEA | DEFINED | `Europe/Paris` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **IT** | Italy | EU_EEA | DEFINED | `Europe/Rome` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **ES** | Spain | EU_EEA | DEFINED | `Europe/Madrid` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **NL** | Netherlands | EU_EEA | DEFINED | `Europe/Amsterdam` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **BE** | Belgium | EU_EEA | DEFINED | `Europe/Brussels` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **AT** | Austria | EU_EEA | DEFINED | `Europe/Vienna` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **IE** | Ireland | EU_EEA | DEFINED | `Europe/Dublin` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **PT** | Portugal | EU_EEA | DEFINED | `Europe/Lisbon` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **PL** | Poland | EU_EEA | DEFINED | `Europe/Warsaw` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **SE** | Sweden | EU_EEA | DEFINED | `Europe/Stockholm` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **DK** | Denmark | EU_EEA | DEFINED | `Europe/Copenhagen` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **FI** | Finland | EU_EEA | DEFINED | `Europe/Helsinki` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **GR** | Greece | EU_EEA | DEFINED | `Europe/Athens` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **CZ** | Czech Republic | EU_EEA | DEFINED | `Europe/Prague` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **RO** | Romania | EU_EEA | DEFINED | `Europe/Bucharest` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **HU** | Hungary | EU_EEA | DEFINED | `Europe/Budapest` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **NO** | Norway | EU_EEA | DEFINED | `Europe/Oslo` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **IS** | Iceland | EU_EEA | DEFINED | `Atlantic/Reykjavik` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **LU** | Luxembourg | EU_EEA | DEFINED | `Europe/Luxembourg` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **BG** | Bulgaria | EU_EEA | DEFINED | `Europe/Sofia` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **HR** | Croatia | EU_EEA | DEFINED | `Europe/Zagreb` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **CY** | Cyprus | EU_EEA | DEFINED | `Asia/Nicosia` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **EE** | Estonia | EU_EEA | DEFINED | `Europe/Tallinn` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **LV** | Latvia | EU_EEA | DEFINED | `Europe/Riga` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **LT** | Lithuania | EU_EEA | DEFINED | `Europe/Vilnius` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **MT** | Malta | EU_EEA | DEFINED | `Europe/Malta` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **SK** | Slovakia | EU_EEA | DEFINED | `Europe/Bratislava` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **SI** | Slovenia | EU_EEA | DEFINED | `Europe/Ljubljana` | MANDATORY | IN_APP, EMAIL | **NO** | None |
| **LI** | Liechtenstein | EU_EEA | DEFINED | `Europe/Vaduz` | MANDATORY | IN_APP, EMAIL | **NO** | None |

---

### Jurisdictional Specific Notes
1. **Philippines (PH):** Primary launch baseline. Booking, location, pricing, and notification profiles verified. Commercial active status remains NO until GM-11A.
2. **China (CN):** 2 deferred regulatory blockers preserved (`CN-BLK-001` ICP Filing, `CN-BLK-002` CAC Data Transfer). Public network operability not claimed.
3. **Thailand (TH):** Booking policy and notification profile resolved. Domestic settlement adapter pending GM-6A.
4. **United States (US) & Europe (EU/EEA 30 States):** Canonical timezones and notification channel configurations resolved.
