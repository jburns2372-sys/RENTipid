# RENTipid ISO Compliance & Conformity Scope and Boundaries

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-SB`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `APPROVED SCOPE BASELINE`  

---

## 1. Formal Certification Scope Statement

The authoritative proposed certification scope for the RENTipid Information Security and Privacy Information Management System (ISMS/PIMS) is formally defined as:

> **"Design, development, operation, maintenance, security, privacy management, support, and continual improvement of the RENTipid global rental marketplace and its supporting information systems, cloud infrastructure, data processing services, and relevant operational processes."**

*Scope Rule:* This scope statement is controlled. No automated agent or developer may modify, restrict, or expand this scope without formal Project Owner authorization.

---

## 2. Organizational Boundaries

The management system encompasses:
* **RENTipid Core Operations:** Executive management, product engineering, security operations (SOC), privacy governance (DPO office), infrastructure engineering, and customer support.
* **Roles and Responsibilities:**
  * **Program Owner / Management:** Ultimate responsibility for information security, risk acceptance, and resource allocation.
  * **Chief Information Security Officer (CISO) / Security Lead:** Operational security, SOC oversight, incident management, vulnerability handling, and cryptographic controls.
  * **Data Protection Officer (DPO):** Privacy management, data protection impact assessments, data subject rights fulfillment, and regulatory compliance.
  * **Engineering Lead:** Secure software development lifecycle (SDLC), code review, build pipelines, and technical remediation.
  * **Cloud Operations Lead:** Infrastructure provisioning, environment separation, secrets storage, backup/restore, and cloud zero-trust configurations.

---

## 3. Physical & Environmental Boundaries

Cloud hosting, developer endpoints and relevant offices remain within the risk assessment boundary. C0 does not establish the absence of physical offices/data centers, universal MFA, a Vercel Enterprise plan, or operating AWS services. EVD-20 records historical Vercel PRO/Azure processing; later EVD-08 records Vercel deployments with Neon branches. Preserve evidence dates and reconcile current inventory in a later authorized package without changing the controlled scope statement.

---

## 4. Technical and System Boundaries

The system boundaries include all software components, pipelines, and data stores comprising the RENTipid platform:
1. **Frontend & Application Shell:** Next.js (App Router), React UI components, client-side session handlers, and PWA capabilities.
2. **Backend Services & APIs:** Next.js Server Components, API routes, mutation services, domain validators (Zod), and webhook ingestion endpoints.
3. **Database & Persistence:** PostgreSQL via Prisma ORM, tenant isolation structures, encryption at rest, field-level envelope encryption, and audit event logs.
4. **Security & SOC Engine:** Autonomous SOC event ingestion, detection rule engine (DSL evaluator), incident case management, automated response playbooks, and reversible action controls.
5. **Global Market & Compliance Engine (GLCC):** Multi-jurisdiction compliance matrix, currency and localization layers, tax/invoice engines, and cross-border data transfer controls across 46 targeted countries.
6. **Delivery & CI/CD Pipelines:** GitHub repository worktrees, linting/typechecking, dependency management and deployment isolation evidence; remote branch-protection enforcement remains unverified under EVD-13.

---

## 5. External Integration & Third-Party Boundaries

RENTipid interfaces with external cloud and service providers under strict trust-boundary controls:
* **Identity & Verification (KYC):** **Sumsub** (identity proofing, document verification, biometric liveness, and AML screening). Data boundary: RENTipid handles reference tokens and verification statuses; the scoped synthetic sandbox record does not establish real document processing, an executed DPA or supplier certification (EVD-21).
* **Payment & Payout Gateways:**
  * **Xendit:** Primary Southeast Asia payment gateway and payout provider. Sandbox callback-token verification and durable replay controls have fixture evidence; real sandbox execution remains pending (EVD-22).
  * **PayMongo:** Philippine local payment processing (e-wallets, cards).
  * **MannyPay:** Separate localized payment/payout integration workstream; operating provider approval is not inferred.
* **Cloud Infrastructure Providers:**
  * **AWS:** historical design targets for IAM, RDS PostgreSQL, CloudWatch and S3; deployment not established by these guides.
  * **Vercel:** Edge middleware, serverless runtime, edge network caching.
* **Third-Party Boundary Rule:** All integrations require verified TLS 1.3/1.2 in transit, product-specific callback authentication on ingress, credential isolation in environment secrets/vaults, and least-privilege API token scoping.

---

## 6. Applicability Boundary Safeguards

No automatic control exclusions are approved by C0. Outsourced physical hosting retains supplier/shared-responsibility obligations. Developer endpoints and corporate networks remain subject to risk assessment. Tokenized payment design does not itself establish a PCI attestation or remove applicable duties. Provider certification and contract coverage require provider evidence. Any proposed exclusion or scope change requires Project Owner approval; the formal scope statement above remains unchanged.

---

## 7. Targeted Standards Framework

```
                          ┌──────────────────────────────────────────────┐
                          │         RENTipid ISMS / PIMS SCOPE           │
                          └──────────────────────┬───────────────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────────┐
                     ▼                                                       ▼
      ┌─────────────────────────────┐                         ┌─────────────────────────────┐
      │   ISO/IEC 27001:2022        │                         │   ISO/IEC 27701:2019        │
      │   Information Security      │                         │   Privacy Information       │
      │   Management System (ISMS)  │                         │   Management System (PIMS)  │
      └──────────────┬──────────────┘                         └──────────────┬──────────────┘
                     │                                                       │
                     └───────────────────────────┬───────────────────────────┘
                                                 │
            ┌────────────────────────────────────┼───────────────────────────────────┐
            ▼                                    ▼                                   ▼
┌─────────────────────────┐          ┌─────────────────────────┐         ┌─────────────────────────┐
│ ISO/IEC 27017:2015      │          │ ISO/IEC 27018:2019      │         │ ISO 22301:2019          │
│ Cloud Security Controls │          │ Public Cloud PII Prot.  │         │ Business Continuity     │
└─────────────────────────┘          └─────────────────────────┘         └─────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│ ISO/IEC 20000-1:2018    │          │ ISO 9001:2015           │
│ Service Management      │          │ Quality Management      │
└─────────────────────────┘          └─────────────────────────┘
```

---

## 8. Certification Claim Policy

1. **No External Certification Claim:** The RENTipid platform, management, and associated documentation make no claim of accredited third-party ISO certification.
2. **Current Status:** RENTipid is actively establishing its **Internal Compliance & Conformity Baseline** under project `RENTIPID-ISO-CONFORMITY-001`.
3. **Auditor Requirement:** Third-party certification claims are strictly prohibited until an accredited Conformity Assessment Body (CAB) completes formal Stage 1 and Stage 2 certification audits and issues a certificate of registration.
