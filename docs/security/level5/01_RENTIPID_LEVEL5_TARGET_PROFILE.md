# RENTIPID LEVEL 5 TARGET PROFILE

## 1. Document Control
**Designation:** RENTipid Cybersecurity Level 5
**Status:** Baseline Established
**Scope:** Target Profile Definition

## 2. Purpose
This document defines the Level 5 target security profile for the RENTipid Continuous Adaptive Zero-Trust Security Program. It serves as the authoritative baseline against which all controls, risks, and implementation roadmaps are assessed.

## 3. Scope
The scope encompasses all RENTipid applications, APIs, backend services, database environments, deployment infrastructure, payment gateways, and autonomous/AI integrations.

## 4. System Context
RENTipid is a cloud-based application. Its context includes tenant data, user identities, payment processing, third-party integrations, and automated threat-response capabilities.

## 5. Security Assumptions
- Zero-trust architecture is foundational.
- The environment operates under constant adversarial threat.
- Third-party dependencies are untrusted by default.
- Identities must be continually verified.

## 6. Explicit Exclusions
- General physical office security (unless directly impacting system infrastructure).
- Non-RENTipid corporate networks outside the production boundaries.

## 7. Adopted Security Targets

### 1. NIST Cybersecurity Framework (CSF)
- **Official title:** NIST Cybersecurity Framework
- **Edition or version:** 2.0
- **Official publisher:** National Institute of Standards and Technology (NIST)
- **Official source reference:** https://www.nist.gov/cyberframework
- **Date accessed:** 2026-07-26
- **Applicability to RENTipid:** Core framework for governance and risk management.
- **Mapping limitations:** Mappings are broad. RENTipid targets operating characteristics comparable to NIST CSF 2.0 Implementation Tier 4 — Adaptive. It is a future operating target, not a current attainment, equivalence, certification or compliance claim.

### 2. OWASP Application Security Verification Standard (ASVS)
- **Official title:** Application Security Verification Standard
- **Edition or version:** 5.0.0
- **Official publisher:** OWASP Foundation
- **Official source reference:** https://owasp.org/www-project-application-security-verification-standard/
- **Date accessed:** 2026-07-26
- **Applicability to RENTipid:** Target verification depth is Level 3 for application and API security.
- **Mapping limitations:** No ASVS Level 3 compliance is claimed until every requirement is independently verified.

### 3. NIST Zero Trust Architecture
- **Official title:** Zero Trust Architecture (SP 800-207)
- **Edition or version:** SP 800-207
- **Official publisher:** National Institute of Standards and Technology (NIST)
- **Official source reference:** https://csrc.nist.gov/publications/detail/sp/800-207/final
- **Date accessed:** 2026-07-26
- **Applicability to RENTipid:** Identity, device, workload, network, data, and transaction-level trust decisions.
- **Mapping limitations:** Architectural guidance only; specific enforcement relies on implementation-specific controls.

### 4. ISO/IEC 27001
- **Official title:** Information security, cybersecurity and privacy protection — Information security management systems — Requirements
- **Edition or version:** ISO/IEC 27001:2022 with Amendment 1:2024
- **Official publisher:** International Organization for Standardization (ISO) / International Electrotechnical Commission (IEC)
- **Official source reference:** https://www.iso.org/standard/82875.html
- **Date accessed:** 2026-07-26
- **Applicability to RENTipid:** Alignment and ISMS readiness are targeted.
- **Mapping limitations:** Certification is not currently claimed. Certification would require an accredited independent certification process. Repository inspection alone cannot establish certification readiness.

### 5. PCI DSS
- **Official title:** Payment Card Industry Data Security Standard
- **Edition or version:** 4.0.1
- **Official publisher:** PCI Security Standards Council (PCI SSC)
- **Official source reference:** https://www.pcisecuritystandards.org/
- **Date accessed:** 2026-07-26
- **Applicability to RENTipid:** Applies only to the actual payment-data and cardholder-data scope. Scope will not be expanded unnecessarily.
- **Mapping limitations:** No compliance is claimed.

### 6. OWASP AI Security and Privacy Guide / AISVS
- **Official title:** OWASP AI Security and Privacy Guide / AI Security Verification Standard
- **Edition or version:** 1.0
- **Official publisher:** OWASP Foundation
- **Official source reference:** https://owasp.org/www-project-ai-security-and-privacy-guide/
- **Date accessed:** 2026-07-26
- **Applicability to RENTipid:** Applies to AI-enabled RENTipid functions and future autonomous capabilities.
- **Mapping limitations:** Framework mappings are best-effort given the evolving nature of AI security.

## 8. Risk Appetite
RENTipid maintains a very low risk appetite for unauthorized data disclosure, payment manipulation, and identity compromise. Moderate risk appetite is accepted for feature availability during active threat responses (e.g., emergency freezes).

## 9. Trust Principles
- Verify explicitly.
- Use least-privileged access.
- Assume breach.

## 10. Zero-Trust Policy Statement
RENTipid enforces zero-trust principles across all layers. Network location does not imply trust. Every transaction, data request, and operational command must be explicitly authorized based on verified identity, context, and least privilege.

## 11. Security Outcomes
- Continuous risk monitoring.
- Automated anomaly detection and threat response.
- Verifiable cryptographic data protection.
- Resilient recovery operations.

## 12. Security Domains
- Governance and cybersecurity risk
- Asset and dependency inventory
- Identity and privileged access
- Authentication and session security
- Authorization and relationship-based access
- Application and API security
- File and content security
- Data protection and cryptography
- Secrets and key management
- Payment and financial security
- Cloud and infrastructure zero trust
- Software supply-chain security
- Security monitoring and detection
- Fraud and abuse prevention
- Incident response and recovery
- AI security and model governance
- Privacy and data governance
- Resilience, backup and disaster recovery
- Vendor and third-party risk
- Security assurance and launch authorization

## 13. Control-Verification Requirements
All controls must be verified through automated testing, focused integration tests, operational exercises, and independent audits where required.

## 14. Evidence Standards
Evidence must be reproducible, version-controlled, and tied directly to repository code, configuration, or operational logs. Documentation alone does not prove implementation.

## 15. Metrics and Key Risk Indicators
- Unmitigated critical vulnerabilities.
- Mean time to detect (MTTD) and mean time to respond (MTTR).
- Number of emergency-freeze invocations.

## 16. Exception-Management Process
Exceptions require formal risk assessment, temporary mitigating controls, defined expiration dates, and executive approval.

## 17. Independent-Assurance Requirements
External assurance (penetration testing, audit, cloud inspection) is required for critical boundaries (e.g., PCI scope, cryptographic boundaries) before claiming compliance.

## 18. Definition of Level 5 Readiness
Level 5 readiness is defined exclusively as evidence-based achievement of the target profile across all defined security domains, supported by repository artifacts, tests, and operational exercises. It is not the completion of a document checklist.

## 19. Definition of Level 5 Launch Authorization
Launch authorization requires formal review of the Level 5 readiness evidence by the designated approval authority, closure of all P0 and P1 risks, and successful independent assurance.

## 20. Prohibited Claims
- No ISO, PCI, NIST, ASVS, or AISVS compliance or certification is claimed without formal independent audit evidence.
- No production readiness is inferred purely from local development or staging tests.
