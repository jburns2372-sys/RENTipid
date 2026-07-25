# RENTIPID LEVEL 5 CONTROL CROSSWALK

## Overview
This crosswalk maps RENTipid Level 5 security domains to adopted target frameworks (NIST CSF 2.0, OWASP ASVS 5.0.0, Zero Trust, ISO 27001, PCI DSS, AISVS).

*Note: Mappings may be broad. Where uncertain, they are marked with MAPPING_REQUIRES_SPECIALIST_VALIDATION.*

| Crosswalk ID | Domain | Control Objective | NIST CSF | OWASP ASVS | Zero Trust Principle | ISO 27001 | PCI DSS | AISVS | Applicability | Current State | Evidence IDs | Gap IDs | Planned Phase | External Assurance | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **CW-001** | Authorization | Ensure all state-changing requests are explicitly authorized. | PR.AC-3 | V4: Access Control | Verify explicitly | A.9.1 | Req 7 | N/A | Applicable | IMPLEMENTED_AND_EVIDENCED | EV-001, EV-007 | N/A | 5D | No | Database-authoritative checks exist. |
| **CW-002** | Identity and Access | Enforce least-privilege boundaries for all user roles. | PR.AC-4 | V4: Access Control | Use least-privileged access | A.9.2 | Req 7 | N/A | Applicable | IMPLEMENTED_AND_EVIDENCED | EV-002 | N/A | 5C | No | Proxy enforces path restrictions. |
| **CW-003** | SOC and Fraud | Centralize security events for continuous monitoring. | DE.CM-1 | V8: Logging and Monitoring | Assume breach | A.12.4 | Req 10 | N/A | Applicable | IMPLEMENTED_AND_EVIDENCED | EV-003, EV-004 | N/A | 5J | No | Normalized events are captured. |
| **CW-004** | Application Security | Protect against concurrency, race conditions, and replays. | PR.DS-1 | V11: Business Logic | Verify explicitly | A.14.1 | Req 6 | N/A | Applicable | IMPLEMENTED_AND_EVIDENCED | EV-009 | N/A | 5E | No | Idempotency handled in execution engine. |
| **CW-005** | Resilience | Ensure critical response actions can be safely rolled back. | RC.RP-1 | N/A | Assume breach | A.16.1 | N/A | N/A | Applicable | PARTIALLY_IMPLEMENTED | EV-008 | GAP-005 | 5L | No | Rollback routes exist but need edge-case testing. |
| **CW-006** | Data Protection | Encrypt sensitive data at rest and in transit. | PR.DS-2 | V6: Cryptography | Assume breach | A.10.1 | Req 3, 4 | N/A | Applicable | DOCUMENTED_NOT_IMPLEMENTED | N/A | GAP-006 | 5F | Yes | MAPPING_REQUIRES_SPECIALIST_VALIDATION |
| **CW-007** | Payment Security | Isolate and protect payment cardholder data. | PR.DS-5 | N/A | Verify explicitly | A.14.1 | Req 1-12 | N/A | Conditionally applicable | NOT_EVIDENCED | EV-010 | GAP-007 | 5G | Yes | External audit required for PCI scoping. |
| **CW-008** | Cloud Zero Trust | Restrict network-level lateral movement in infrastructure. | PR.AC-5 | V14: Configuration | Assume breach | A.13.1 | Req 1 | N/A | Applicable | DOCUMENTED_NOT_IMPLEMENTED | EV-012 | GAP-008 | 5H | Yes | Cloud configs need review. |
| **CW-009** | AI Security | Sanitize AI inputs to prevent prompt injection. | PR.DS-1 | V5: Validation | Verify explicitly | N/A | N/A | AISVS V2 | Conditionally applicable | NOT_IMPLEMENTED | N/A | GAP-009 | 5K | No | Relevant for future autonomous features. |
| **CW-010** | Governance | Maintain formal risk register and exception process. | ID.RM-1 | V1: Architecture | Assume breach | A.18.1 | Req 12 | N/A | Applicable | PARTIALLY_IMPLEMENTED | EV-013 | GAP-010 | 5B | No | ISMS readiness target. |
