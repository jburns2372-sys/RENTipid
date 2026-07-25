# RENTIPID EXCEPTION, CHANGE CONTROL, AND PHASE 5B ACCEPTANCE

## 1. Phase 5B Purpose
To establish the authoritative governance, system context, asset, data flow, threat model, and trust boundary foundation for the RENTipid Continuous Adaptive Zero-Trust Security Program.

## 2. Security Exception Workflow
1. Request submitted by System Owner.
2. Initial review by Security Architect.
3. Formal documentation of compensating controls.
4. Approval by Security Program Owner and Executive Sponsor.
5. Registration in Risk Register.

## 3. Required Exception Fields
- Requestor
- Affected Asset / Flow
- Bypassed Control
- Business Justification
- Compensating Controls
- Expiration Date
- Authorizing Signatures

## 4. Risk-Acceptance Workflow
Identified risks exceeding risk appetite must be either mitigated, transferred, or formally accepted by the Executive Sponsor via the Exception Workflow.

## 5. Maximum Exception Duration
Exceptions must not exceed 12 months. Short-term operational exceptions default to 90 days.

## 6. Compensating Controls
Every exception must include compensating controls that mitigate the likelihood or impact of the bypassed primary control.

## 7. Revalidation and Expiration
Exceptions are automatically flagged for review 30 days prior to expiration. Expired exceptions mandate immediate control enforcement or system suspension.

## 8. Architecture Decision Records
Any architectural change modifying a trust boundary must be documented via a formal Architecture Decision Record (ADR) and approved by the Architecture Review Board.

## 9. Security-Significant Change Classification

### CLASS S0 — Documentation only
- **Required reviewer:** Peer reviewer
- **Required tests:** None
- **Required evidence:** PR review
- **Rollback requirements:** Standard git revert
- **Production approval:** N/A
- **Independent assurance requirement:** No

### CLASS S1 — Low-risk internal implementation
- **Required reviewer:** Lead Engineer
- **Required tests:** Unit tests
- **Required evidence:** CI success
- **Rollback requirements:** Standard revert
- **Production approval:** Lead Engineer
- **Independent assurance requirement:** No

### CLASS S2 — Authentication, authorization or sensitive-data behavior
- **Required reviewer:** Security Architect
- **Required tests:** Integration tests, targeted security tests
- **Required evidence:** CI success, security test pass
- **Rollback requirements:** Documented rollback plan
- **Production approval:** Security Program Owner
- **Independent assurance requirement:** Post-deployment review

### CLASS S3 — Payment, privileged operation, production infrastructure or cryptographic boundary
- **Required reviewer:** Security Architect, Payment Security Owner
- **Required tests:** Full regression, security tests, staging validation
- **Required evidence:** End-to-end evidence log
- **Rollback requirements:** Automated state rollback or extensive data restoration plan
- **Production approval:** Executive Sponsor
- **Independent assurance requirement:** Pre-deployment penetration test or audit

### CLASS S4 — Emergency security response or incident containment
- **Required reviewer:** SOC Lead (post-incident review)
- **Required tests:** Minimal operational tests
- **Required evidence:** Incident declaration log
- **Rollback requirements:** Reversible containment playbooks
- **Production approval:** Security Program Owner or Executive Sponsor
- **Independent assurance requirement:** No (Prioritizes containment)

## 10. Emergency Change Procedure
During active incidents (Class S4), standard CI/CD barriers may be bypassed via "break-glass" procedures, provided all actions are logged and retroactively reviewed within 48 hours.

## 11. Production-Change Approvals
Approvals are strictly governed by the RACI matrix and Change Classification requirements. Developers may not self-approve S2, S3, or S4 changes.

## 12. Rollback Requirements
All production changes must include a verified method of reversion without permanent data loss.

## 13. Evidence Requirements
Evidence must be reproducible, version-controlled, and tied directly to repository code, configuration, or operational logs.

## 14. Independent-Review Triggers
- Introduction of new payment flows.
- Changes to cryptographic primitives.
- Major architectural overhauls.
- Pre-requisite to Level 5 Launch Authorization.

## 15. Phase 5B Validation Results
- Governance charter established.
- Trust boundaries mapped.
- Threat model completed.
- RACI matrix published.

## 16. Phase 5B Residual Limitations
- Governance roles (Security Program Owner, Privacy Officer, etc.) are pending formal assignment.
- Several identified threats lack implemented controls (mapped to later phases).

## 17. Phase 5C Entry Criteria
1. Phase 5B documents accepted.
2. Executive Sponsor assignment evidenced or formally pending with written interim authority.
3. Security Program Owner assignment evidenced or interim authority approved.
4. Engineering Lead identified.
5. Identity and privileged-access scope approved.
6. Current authentication and session architecture inventoried.
7. Privileged-role inventory approved.
8. P1 risks RSK-001 and RSK-003 have named owner roles.
9. No unresolved Phase 5B documentation-integrity blocker.
10. Any governance exception has owner, expiry and compensating controls.

Where assignments remain pending, Phase 5C implementation cannot reach operational acceptance until the required authorities are appointed.

## 18. Phase 5B Acceptance Decision
Phase 5B documentation is formally recognized as the baseline for program governance, triggering progression to implementation phases.

**Status:**
- Phase 5B documentation baseline status: DOCUMENTATION_BASELINE_ACCEPTED
- Operational-governance status: No (Pending required role assignments)
- Phase 5C documentation/planning entry status: APPROVED
- Phase 5C operational-acceptance prerequisites: Governance authorities must be formally appointed.
