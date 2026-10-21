# RENTipid ISO Risk Assessment Methodology

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-RM`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `REVIEWED ASSESSMENT CONVENTION; OWNER APPROVAL NOT ASSERTED`  
**Standard Alignment:** ISO/IEC 27001:2022 Clauses 6.1.2, 6.1.3, 8.2, 8.3, ISO/IEC 27005:2022, ISO 31000:2018  

---

## 1. Objective & Authority

This document defines the formal information security and privacy risk assessment methodology for RENTipid. It provides a repeatable, objective, and auditable framework to identify, analyze, evaluate, treat, and monitor risks across all systems, cloud environments, and data processes within the approved certification scope.

> **Project Owner Authority Rule:** Automated agents and technical personnel are strictly prohibited from accepting residual risks on behalf of the organization. Where a risk treatment option involves risk acceptance, the formal designation must be recorded as `PROJECT OWNER AUTHORIZATION REQUIRED`.

---

## 2. Risk Assessment Process Workflow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Context & Asset Identification                      │
   │    - Identify assets, data flows, and systems          │
   └──────────────────────────┬─────────────────────────────┘
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 2. Threat & Vulnerability Identification               │
   │    - Catalogue realistic threat events and weaknesses  │
   └──────────────────────────┬─────────────────────────────┘
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 3. Inherent Risk Scoring (Likelihood x Impact)         │
   │    - Assess raw risk in the absence of controls        │
   └──────────────────────────┬─────────────────────────────┘
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 4. Control Identification & Effectiveness Evaluation   │
   │    - Map implemented technical & operational controls  │
   └──────────────────────────┬─────────────────────────────┘
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 5. Residual Risk Scoring (Post-Control Evaluation)     │
   │    - Determine remaining risk severity                 │
   └──────────────────────────┬─────────────────────────────┘
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 6. Risk Treatment Decision                             │
   │    - Mitigate, Avoid, Transfer, or Accept (Owner Gate) │
   └────────────────────────────────────────────────────────┘
```

---

## 3. Likelihood & Impact Scoring Scales

### 3.1 Likelihood Scale (1 to 5)

| Level | Descriptor | Probability / Frequency | Technical Criteria |
|---|---|---|---|
| **1** | **Rare** | Once every 5+ years | Requires extraordinary resources, theoretical vulnerability, or multiple defense layers breached. |
| **2** | **Unlikely** | Once every 2 to 5 years | Complex attack scenario, low adversary motivation, or significant pre-conditions required. |
| **3** | **Possible** | Once a year | Known vulnerability pattern, moderate capability required, standard attack surface exposure. |
| **4** | **Likely** | Multiple times per year | Readily exploitable flaw, automated scanning detection, high incentive (e.g. credential stuffing). |
| **5** | **Almost Certain** | Weekly or continuous | Active automated adversarial probing, public endpoint abuse, or constant internet exposure. |

### 3.2 Impact scale (1 to 5)

1 Negligible: minor bounded inconvenience.
2 Minor: localized recoverable disruption.
3 Moderate: material feature disruption or limited sensitive-data harm.
4 Major: critical marketplace disruption or substantial privacy/financial harm.
5 Severe: systemic outage, widespread sensitive-data loss or severe organizational harm.

Use the highest credible impact dimension. These are assessment estimates, not approved dollar thresholds, breach-reporting legal conclusions or actual loss forecasts. Likelihood frequency labels above are illustrative anchors, not measured rates or precise probability intervals; the ordinal level is the numeric scoring input.

---

## 4. Risk Scoring Matrix & Explicit Severity Bands

$$\text{Risk Score} = \text{Likelihood} \times \text{Impact} \quad (\text{Range: } 1 \text{ to } 25)$$

| Likelihood \ Impact | 1 (Negligible) | 2 (Minor) | 3 (Moderate) | 4 (Major) | 5 (Severe) |
|---|---|---|---|---|---|
| **5 (Almost Certain)** | 5 (MODERATE) | 10 (HIGH) | 15 (HIGH) | 20 (CRITICAL) | 25 (CRITICAL) |
| **4 (Likely)** | 4 (LOW) | 8 (MODERATE) | 12 (HIGH) | 16 (HIGH) | 20 (CRITICAL) |
| **3 (Possible)** | 3 (LOW) | 6 (MODERATE) | 9 (MODERATE) | 12 (HIGH) | 15 (HIGH) |
| **2 (Unlikely)** | 2 (LOW) | 4 (LOW) | 6 (MODERATE) | 8 (MODERATE) | 10 (HIGH) |
| **1 (Rare)** | 1 (LOW) | 2 (LOW) | 3 (LOW) | 4 (LOW) | 5 (MODERATE) |

### Explicit Risk Severity Bands

* **1 – 4: LOW RISK (Green)**
  * *Tolerance:* Low estimated severity; no automatic acceptance by AI.
  * *Action:* Monitor through standard automated logging and periodic review.
* **5 – 9: MODERATE RISK (Yellow)**
  * *Tolerance:* Treatment and human review required; no automatic acceptance by AI.
  * *Action:* Maintain existing controls; review quarterly during SOC and ISMS operational cycles.
* **10 – 16: HIGH RISK (Orange)**
  * *Tolerance:* Unacceptable for prolonged operation without active treatment plan.
  * *Action:* Mandatory corrective wave assignment; requires formal Project Owner residual risk acceptance if not reduced to Moderate within treatment window.
* **17 – 25: CRITICAL RISK (Red)**
  * *Tolerance:* Completely unacceptable. Halts promotion gates or triggers emergency freeze.
  * *Action:* Immediate containment, priority remediation, and mandatory executive notification.

---

## 5. Control Effectiveness Evaluation

Existing controls are evaluated against three benchmarks:
1. **Effective:** Control is fully implemented, verified, and prevents or detects the threat with high reliability (reduces likelihood by 2–3 levels or mitigates impact).
2. **Partially Effective:** Control exists in code or documentation but lacks operational automation or continuous testing (reduces likelihood by 1 level).
3. **Ineffective / Planned:** Control is undocumented, unverified, or does not address the core vulnerability.

---

## 6. Risk Treatment Options

1. **Mitigate (Treat):** Implement technical or operational controls to reduce likelihood and/or impact to an acceptable level.
2. **Avoid:** Eliminate the risk by altering architecture, decommissioning the feature, or terminating the high-risk activity.
3. **Transfer (Share):** Shift financial or operational risk to an external third party (e.g. cyber insurance, PCI-DSS tokenization delegation).
4. **Accept:** Retain residual risk where treatment cost exceeds potential loss, or where operational necessity dictates. **Requires explicit Project Owner authorization.**

---

## 7. Review Cadence & Monitoring

* **Continuous Monitoring:** Real-time SOC event correlation and detection rule evaluation.
* **Monthly Review:** Engineering Lead review of open dependency vulnerabilities and third-party security advisories.
* **Quarterly Review:** Formal ISMS operational review covering access reviews, incident trends, and risk register updates.
* **Annual Review:** Comprehensive ISMS risk assessment re-evaluation prior to internal audit and management review.

## 8. Review and approval limits

EVD-24 Phase 5M qualitative assessment remains historical evidence; C1 adds a 5x5 convention without replacing or retroactively approving prior decisions. Residual scores are reviewer estimates, not empirical operating measurements. A guide, inactive provider, unimplemented service or unobserved backup configuration receives no reduction credit. Code/synthetic evidence may support an estimated likelihood reduction requiring human validation; impact is retained unless evidence limits harm. High/Critical risks and proposed Accept treatments require Project Owner decision. Explicit acceptance at any severity requires Project Owner authorization; Mitigate does not silently accept residual risk. Cadences are proposed duties, not completed operational cycles. No current score authorizes operation, promotion or treatment execution.

## Licensed-source boundary

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Every edition/clause label is provisional inherited alignment, not verified licensed text or legal conclusions.
