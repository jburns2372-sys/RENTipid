# RENTIPID SECURITY RACI AND DECISION RIGHTS

## 1. Overview
This document defines decision rights and operational responsibilities across the RENTipid cybersecurity program.

**RACI Key:**
- **R (Responsible):** The role doing the work.
- **A (Accountable):** The singular role with final decision authority and ownership.
- **C (Consulted):** Roles providing input before a decision or action.
- **I (Informed):** Roles notified after a decision or action.

## 2. RACI Matrix

| Activity / Decision | System Owner | Security Program Owner (ROLE_ASSIGNMENT_PENDING) | Executive Sponsor | Security Architect | Lead Engineer | SOC Lead | Privacy Officer (ROLE_ASSIGNMENT_PENDING) | Payment Security Owner (ROLE_ASSIGNMENT_PENDING) | Developer |
|---|---|---|---|---|---|---|---|---|---|
| **Security-policy approval** | C | A | I | R | C | C | C | C | I |
| **Risk ownership** | A | R | I | C | C | C | C | C | I |
| **Risk acceptance (requires expiry/controls)** | C | C | A | I | I | I | I | I | I |
| **Architecture approval** | C | A | I | R | C | C | I | C | I |
| **Threat-model approval** | I | A | I | R | C | C | I | C | I |
| **Production deployment** | A | I | I | C | R | I | I | I | I |
| **Emergency production change** | A | C | I | C | R | I | I | I | I |
| **Identity and privileged-access approval** | C | A | I | R | C | I | C | C | I |
| **Payment-live-mode approval** | C | C | I | C | I | I | I | A | I |
| **Emergency freeze** | I | A | I | I | C | R | I | C | I |
| **Response-playbook approval** | I | A | I | C | C | R | I | I | I |
| **Security-response execution** | I | I | I | I | C | A | I | I | I |
| **Rollback authorization** | I | A | I | C | R | C | I | I | I |
| **Incident declaration** | I | A | C | I | I | R | I | I | I |
| **Breach escalation** | I | R | A | I | I | I | C | I | I |
| **Privacy notification** | I | C | A | I | I | I | R | I | I |
| **Vendor onboarding** | C | A | I | R | C | I | C | C | I |
| **Cloud-security review** | I | A | I | R | C | I | I | I | I |
| **Dependency exception** | I | A | I | R | C | I | I | I | I |
| **AI feature activation** | C | A | I | R | C | I | C | I | I |
| **Penetration-test commissioning** | I | A | C | R | I | I | I | I | I |
| **Disaster-recovery exercise** | C | A | I | I | R | I | I | I | I |
| **Level 5 phase acceptance** | C | A | I | R | C | C | C | C | I |
| **Final launch authorization** | C | C | A | C | C | I | I | C | I |

## 3. Decision Rules
1. **Exactly One Accountable Role:** No activity may have zero or multiple "A" designations.
2. **Developer Separation:** Developers must not self-approve high-risk production changes.
3. **Payment Separation:** Payment activation requires Finance or Payment Security Owner authority.
4. **Execution Separation:** Security-response execution (SOC Lead) is separated from playbook approval (Security Program Owner).
5. **Risk Acceptance Constraint:** Executive Sponsor risk acceptance is strictly contingent on documented expiration, compensating controls, and periodic review.
6. **Launch Constraint:** Final Level 5 launch authorization is held by the Executive Sponsor, not the implementer or engineering lead.
