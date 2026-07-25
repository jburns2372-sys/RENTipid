# RENTIPID LEVEL 5 GAP ASSESSMENT

## Overview
This document identifies evidenced-based gaps against the Level 5 Target Profile.

*Note on sparse numbering: Identifiers such as GAP-001 through GAP-004, and GAP-011 through GAP-014 correspond to controls that are currently IMPLEMENTED_AND_EVIDENCED (see Control Crosswalk and Evidence Register) and are therefore reserved and not reported as gaps.*

---

## 1. Actual Implementation Gaps

### GAP-006: Data Encryption at Rest
- **Gap ID:** GAP-006
- **Security domain:** Data Protection
- **Target outcome:** Sensitive data is encrypted at rest using strong cryptography.
- **Current state:** Data fields in database are primarily plaintext.
- **Current-state classification:** DOCUMENTED_NOT_IMPLEMENTED
- **Supporting evidence IDs:** N/A (NOT_EVIDENCED)
- **Missing evidence:** KMS configuration, encrypted Prisma field extensions.
- **Technical gap:** Missing application-level encryption for PII.
- **Operational gap:** Missing key rotation procedures.
- **Governance gap:** Missing cryptographic policy.
- **Privacy impact:** High
- **Financial impact:** Medium
- **Marketplace abuse impact:** Low
- **Likelihood:** Medium
- **Impact:** High
- **Risk severity:** HIGH
- **Priority:** P1 — Required before expanded production exposure
- **Exploitability or failure mode:** Database compromise exposes plain text PII.
- **Recommended treatment:** Implement Prisma field-level encryption for sensitive columns.
- **Target Level 5 phase:** Phase 5F
- **Dependencies:** Key Management Service integration.
- **Owner role:** Lead Engineer
- **Exit criteria:** Tests prove PII cannot be read from raw DB queries.
- **Independent assurance requirement:** Yes (Penetration Test)

### GAP-005: Playbook Rollback Edge Cases
- **Gap ID:** GAP-005
- **Security domain:** Resilience
- **Target outcome:** Autonomous actions can be cleanly reversed.
- **Current state:** Rollback API exists but lacks state-machine transaction proofs.
- **Current-state classification:** PARTIALLY_IMPLEMENTED
- **Supporting evidence IDs:** EV-008
- **Missing evidence:** Integration tests for concurrent rollback scenarios.
- **Technical gap:** Unknown behavior during partial rollback failures.
- **Operational gap:** Lack of runbooks for failed rollbacks.
- **Governance gap:** None
- **Privacy impact:** Low
- **Financial impact:** Medium
- **Marketplace abuse impact:** Medium
- **Likelihood:** Low
- **Impact:** Medium
- **Risk severity:** MEDIUM
- **Priority:** P2 — Required for Level 5 target completion
- **Exploitability or failure mode:** Admin triggers rollback during a transient network failure, resulting in corrupted state.
- **Recommended treatment:** Add strict state-machine checks and distributed transaction sagas for rollbacks.
- **Target Level 5 phase:** Phase 5L
- **Dependencies:** None
- **Owner role:** Security Engineer
- **Exit criteria:** All rollback edge cases covered by integration tests.
- **Independent assurance requirement:** No

---

## 2. Evidence Gaps

### GAP-007: PCI Scope Isolation
- **Gap ID:** GAP-007
- **Security domain:** Payment Security
- **Target outcome:** Payment cardholder data environment (CDE) is completely isolated.
- **Current state:** Integration with PayMongo exists, but network isolation is not proven.
- **Current-state classification:** NOT_EVIDENCED
- **Supporting evidence IDs:** EV-010
- **Missing evidence:** Network diagrams, VPC configuration, data flow diagrams.
- **Technical gap:** CDE boundaries are undefined in code.
- **Operational gap:** PCI compliance monitoring missing.
- **Governance gap:** Formal PCI scope declaration missing.
- **Privacy impact:** High
- **Financial impact:** High
- **Marketplace abuse impact:** Low
- **Likelihood:** Low
- **Impact:** High
- **Risk severity:** HIGH
- **Priority:** P1 — Required before expanded production exposure
- **Exploitability or failure mode:** Application vulnerability leads to unauthorized access of the payment network segment.
- **Recommended treatment:** Map data flows, ensure client-side tokenization bypasses server infrastructure.
- **Target Level 5 phase:** Phase 5G
- **Dependencies:** PayMongo integration finalizing.
- **Owner role:** Architecture
- **Exit criteria:** Data flow diagrams prove server never touches raw PAN data.
- **Independent assurance requirement:** Yes (PCI QSA Review)

---

## 3. Operational-Process Gaps

### GAP-015: Temporary Credential Ephemeral Logs
- **Gap ID:** GAP-015
- **Security domain:** Secrets Management
- **Target outcome:** No credentials exist in external or ephemeral logs.
- **Current state:** A temporary invalidated credential was exposed in local platform task logs.
- **Current-state classification:** PARTIALLY_IMPLEMENTED
- **Supporting evidence IDs:** EV-015
- **Missing evidence:** Log sanitization filters.
- **Technical gap:** Task output echoing variables.
- **Operational gap:** Developer environment handling of ephemeral secrets.
- **Governance gap:** Process for handling platform-level logs.
- **Privacy impact:** Low
- **Financial impact:** Low
- **Marketplace abuse impact:** Low
- **Likelihood:** Low
- **Impact:** Low
- **Risk severity:** OBSERVATION
- **Priority:** P3 — Continuous improvement
- **Exploitability or failure mode:** A developer's local log could expose a temporary string.
- **Recommended treatment:** Implement secret scanning and automated masking in local dev tools.
- **Target Level 5 phase:** Phase 5F
- **Dependencies:** None
- **Owner role:** DevSecOps
- **Exit criteria:** Secrets are masked in console output.
- **Independent assurance requirement:** No

---

## 4. Independent-Assurance Gaps

### GAP-008: Cloud Misconfiguration
- **Gap ID:** GAP-008
- **Security domain:** Cloud Zero Trust
- **Target outcome:** Infrastructure is hardened against lateral movement.
- **Current state:** Deployed to Vercel/Azure, but no independent audit exists.
- **Current-state classification:** DOCUMENTED_NOT_IMPLEMENTED
- **Supporting evidence IDs:** EV-012
- **Missing evidence:** External cloud security assessment report.
- **Technical gap:** Cannot be verified from repository source alone.
- **Operational gap:** No recurring cloud audit.
- **Governance gap:** Assurance mandate missing.
- **Privacy impact:** High
- **Financial impact:** High
- **Marketplace abuse impact:** Medium
- **Likelihood:** Low
- **Impact:** High
- **Risk severity:** HIGH
- **Priority:** P2 — Required for Level 5 target completion
- **Exploitability or failure mode:** Misconfigured IAM roles allow attacker to pivot from web tier to database.
- **Recommended treatment:** Commission third-party cloud security assessment.
- **Target Level 5 phase:** Phase 5H
- **Dependencies:** Production deployment.
- **Owner role:** Executive
- **Exit criteria:** Clean audit report.
- **Independent assurance requirement:** Yes (Cloud Security Assessment)

---

## 5. Future-Scope Gaps

### GAP-009: AI Prompt Injection
- **Gap ID:** GAP-009
- **Security domain:** AI Security
- **Target outcome:** Autonomous capabilities are immune to prompt injection.
- **Current state:** No AI currently implemented.
- **Current-state classification:** NOT_APPLICABLE
- **Supporting evidence IDs:** N/A
- **Missing evidence:** AI safety integration tests.
- **Technical gap:** No sanitization layers exist for LLMs.
- **Operational gap:** AI monitoring missing.
- **Governance gap:** AI acceptable use policy missing.
- **Privacy impact:** Medium
- **Financial impact:** Medium
- **Marketplace abuse impact:** High
- **Likelihood:** Low
- **Impact:** High
- **Risk severity:** MEDIUM
- **Priority:** P2 — Required for Level 5 target completion
- **Exploitability or failure mode:** Attacker manipulates AI bot into revealing internal data or bypassing logic.
- **Recommended treatment:** Integrate AISVS v1.0 controls when AI features are built.
- **Target Level 5 phase:** Phase 5K
- **Dependencies:** AI feature development.
- **Owner role:** Product Security
- **Exit criteria:** AISVS L2 controls verified.
- **Independent assurance requirement:** No

### GAP-010: ISMS Readiness
- **Gap ID:** GAP-010
- **Security domain:** Governance
- **Target outcome:** Maintain formal risk register and exception process.
- **Current state:** Risk register created, but full ISMS process missing.
- **Current-state classification:** PARTIALLY_IMPLEMENTED
- **Supporting evidence IDs:** EV-013
- **Missing evidence:** Exception management workflow documentation.
- **Technical gap:** No automated risk tracking.
- **Operational gap:** Exception process is not enforced.
- **Governance gap:** ISMS policies are drafts.
- **Privacy impact:** Low
- **Financial impact:** Low
- **Marketplace abuse impact:** Low
- **Likelihood:** Low
- **Impact:** Medium
- **Risk severity:** LOW
- **Priority:** P2 — Required for Level 5 target completion
- **Exploitability or failure mode:** Unmanaged exceptions lead to prolonged vulnerabilities.
- **Recommended treatment:** Formalize exception approval workflows.
- **Target Level 5 phase:** Phase 5B
- **Dependencies:** None
- **Owner role:** CISO
- **Exit criteria:** Approved ISMS charter.
- **Independent assurance requirement:** No
