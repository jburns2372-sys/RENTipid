---
title: "RENTipid Comprehensive Application Manual"
subtitle: "Users, Operators, Developers, Business Stakeholders, and Philippine Government Compliance"
author: "RENTipid"
date: "13 August 2026"
lang: en-PH
---

# 1. Document control and use

## 1.1 Document identity

| Field | Value |
| --- | --- |
| Edition | 1.0 — multi-audience controlled reference |
| Repository | RENTipid |
| Branch inspected | `feature/soc-phase4-threat-response` |
| Commit inspected | `e37e8e5514cf6bb24618723e66ebb8d36739799a` |
| Module-status baseline | Master Module Register dated 11 August 2026 |
| Jurisdictional focus | Republic of the Philippines |
| Audiences | Users, providers, operators, developers, business leadership, auditors, government/compliance reviewers |
| Classification | Internal operational and compliance-support documentation; selected sections may support external review after approval/redaction |
| Companion module specification | `RENTipid-NUMBERED-APPLICATION-DOCUMENTATION.md` |

## 1.2 Purpose

This manual provides one practical and evidence-aware reference for operating, using, developing, governing, and reviewing RENTipid. It covers the application's business purpose, actors, journeys, modules, screens and service boundaries, data and security controls, operational procedures, developer handover, business governance, and Philippine regulatory considerations.

This manual does **not** certify legal compliance, production deployment, provider activation, financial licensing, insurance authority, or regulatory registration. Legal applicability depends on the final corporate entity, contracts, business model, user population, transaction flow, payment custody, insurance role, and production configuration. Philippine counsel and the competent regulator must confirm those matters before launch.

## 1.3 Authority and conflict rule

Use this order when evidence conflicts:

1. Current executable code and database schema establish implemented behavior.
2. Accepted closure/freeze records establish the exact formally accepted scope.
3. The Master Module Register establishes module IDs, current promotion gate, and open evidence at its baseline.
4. The Master Plan establishes target requirements and acceptance journeys.
5. Current working registries establish detailed route, API, role, data, integration, security, and workflow inventories.
6. Historical plans and worksheets are evidence of prior intent or state, not automatic current truth.
7. Applicable Philippine laws, regulations, regulator issuances, permits, contracts, and official decisions govern legal obligations.

## 1.4 Status vocabulary

| Status | Meaning |
| --- | --- |
| `NOT STARTED` | Required capability was not found for the registered scope |
| `IN IMPLEMENTATION` | Behavior or acceptance evidence remains incomplete |
| `LOCAL ACCEPTANCE PASS` | Accepted local proof exists for the exact scope; preview/production is not implied |
| `CLOSED / FROZEN` | Exact accepted baseline is protected from unrelated change |
| `MOCK_OR_SIMULATION_ONLY` | Safe test/advisory path; not a real provider or live effect |
| `NOT_AUTHORIZED` / `NO-GO` | Activation or operation is expressly prohibited |
| `EXTERNAL STATE NOT VERIFIED` | Local artifacts cannot prove deployment, registration, provider approval, or production health |

## 1.5 Contents

1. Document control and use.
2. Executive and business overview.
3. Roles, responsibilities, and separation of duties.
4. User manual — guests and account holders.
5. Renter manual.
6. Individual and business provider manual.
7. Operator manual — Admin and support.
8. Finance operator manual.
9. Compliance and privacy operator manual.
10. SOC and security operator manual.
11. Developer and maintainer manual.
12. Architecture, data, interfaces, and integrations.
13. Business governance, risks, and KPIs.
14. Philippine government and regulatory compliance framework.
15. Compliance operating calendar and evidence pack.
16. Testing, release, deployment, continuity, and recovery.
17. Complete application module register.
18. Limitations, launch blockers, and prohibited representations.
19. Incident and escalation quick guides.
20. Glossary and authoritative references.

# 2. Executive and business overview

## 2.1 Product definition

RENTipid is a role-based rental marketplace connecting renters with individual and business providers. It is designed to coordinate discovery, provider verification, listings, availability, booking, pricing, agreements, checkout/handover, active rental, return, payments and holding records, claims, disputes, insurance foundations, reviews, communications, administration, privacy, analytics, promotion, and security operations.

The product's central promise is not simply “post an item and collect money.” It is a controlled rental transaction with evidence, state ownership, role separation, auditability, and exception handling.

## 2.2 Business participants

1. **Renters** locate and rent eligible listings.
2. **Individual providers** supply rentable items or services in their own capacity.
3. **Business providers** operate verified commercial accounts and authorized personnel/workflows.
4. **RENTipid marketplace operations** administer general marketplace and support processes.
5. **Finance operations** review transaction, ledger, refund, payout, and reconciliation evidence.
6. **Compliance/privacy operations** review identity/business evidence, listing rules, privacy requests, and legal control records.
7. **SOC/security operations** detect, investigate, respond, recover, and preserve security evidence.
8. **External providers** may supply payment, email, storage, KYC, AI, insurance, search, social, or threat-intelligence services only in explicitly configured and authorized modes.

## 2.3 Intended value proposition

| Stakeholder | Intended value |
| --- | --- |
| Renter | Discover inventory, understand terms and price, reserve safely, preserve transaction evidence, and seek redress |
| Provider | Reach customers, control availability, document fulfillment, and review earnings/settlement evidence |
| Business | Operate a governed rental channel with structured identity, compliance, finance, support, and analytics |
| Government/regulator | Obtain accountable business identity, complaint, privacy, transaction, audit, and security evidence within lawful process |
| Operator | Use role-specific workflows and state transitions rather than informal manual edits |
| Developer | Maintain modular services with authorization, validation, transaction, audit, test, and recovery boundaries |

## 2.4 Primary journeys

### 2.4.1 Renter journey

Register → authenticate → profile/address/KYC → search → listing detail → availability → booking → authoritative price → authorized payment mode → agreement → handover evidence → active rental → return evidence → claim/dispute/refund branch if required → closure → eligible review.

### 2.4.2 Provider journey

Register → provider/business profile → KYC/KYB → activation → create listing → media/policy checks → approval/publication → manage availability → booking fulfillment → handover/return → claim/dispute response → earnings/payout evidence → review/analytics/promotion within scope.

### 2.4.3 Administrative journey

User/provider/listing/booking/support signal → specialist queue → identity/role/state verification → minimum necessary evidence review → authorized decision/action → notification → audit → monitoring and escalation.

### 2.4.4 Security journey

Security signal → normalize/deduplicate → rule evaluation → alert → incident case → evidence → approved playbook/grant → bounded response → verification/rollback → recovery → post-incident review.

## 2.5 Current application posture

The current posture is a mixture of registered `IN IMPLEMENTATION`, `LOCAL ACCEPTANCE PASS`, exact `CLOSED / FROZEN`, mock/disabled, and externally unverified scopes. The application does not have a global `LOCAL-RC1`, preview acceptance, or production-readiness decision under the Master Module Register.

Key constraints include:

1. Live payment activation is prohibited by the accepted Phase 19 `COMPLETE_NO_GO_FROZEN` decision.
2. Direct messaging was `NOT STARTED` at the module-register baseline.
3. Refund and provider-payout execution includes manual/placeholder boundaries.
4. Full insurance booking/policy/claims/finance integration and real insurer activation are not complete.
5. AI tool dispatch and real-provider behavior must not be presented as live when disabled or mocked.
6. PWA offline behavior and native mobile projects/tests are incomplete.
7. Local Vercel/Azure configuration or infrastructure code does not prove production deployment.

# 3. Roles, responsibilities, and separation of duties

## 3.1 User and operator roles

| Role | Permitted scope | Must not do |
| --- | --- | --- |
| Guest | Public browse, public listing information, help, policy, registration/login | Access private records or operational mutations |
| Renter | Own profile, eligible bookings, agreements, inspections, claims/disputes, receipts, reviews | Mutate provider or operator records |
| Individual Provider | Own provider profile, listings, availability, booking fulfillment, evidence, earnings views | Publish/approve own listing where independent review is required |
| Business Provider | Business-scoped profile, team-authorized listings/bookings/promotion consent | Inherit platform Admin privileges from business membership |
| Admin | Categories, marketplace operations, bookings, support, disputes, UAT/readiness | Perform finance, compliance, or SOC-specialist actions without explicit permission |
| Finance Admin | Payment, ledger, deposit, refund, payout, and reconciliation review | Manufacture provider success, bypass NO-GO, or erase discrepancies |
| Compliance Admin | KYC/KYB, documents, listing/prohibited-item decisions, privacy operations | Copy unnecessary sensitive evidence or perform finance/SOC response |
| SOC Analyst | Events, alerts, cases, notes/evidence, response request | Self-approve a privileged response |
| SOC Supervisor | Approval, grants, execution/rollback oversight | Bypass scope, expiry, dual control, or emergency freeze |
| Super Admin | RBAC, system settings, high-risk controls and visibility | Override law, audit history, reserved Owner decisions, or separation of duties |

## 3.2 Universal authorization rule

Every state-changing request must enforce on the server:

1. authenticated session;
2. current account eligibility;
3. role or granular permission;
4. object ownership or organizational scope;
5. allowed current state and transition;
6. input and file validation;
7. concurrency/idempotency where required;
8. sanitized audit evidence;
9. step-up or independent approval for high-risk actions.

Navigation visibility and disabled buttons are usability aids, not security controls.

## 3.3 Responsibility assignment

| Concern | Accountable owner | Responsible operator | Consulted/approver |
| --- | --- | --- | --- |
| Product scope and launch | Business/Product Owner | Product and release management | Legal, finance, security, operations |
| Application behavior | Engineering owner | Development team | QA, security, domain owner |
| Data/schema/migration | Data/engineering owner | Database engineer | Privacy, finance, release owner |
| Marketplace operations | Operations owner | Admin/support | Compliance and finance as needed |
| Money and reconciliation | Finance owner | Finance Admin | Gateway, audit, legal, Owner |
| KYC/listing compliance | Compliance owner | Compliance Admin | Legal/privacy/security |
| Privacy program | Personal Information Controller leadership/DPO | Privacy operations | Legal, SOC, processors |
| Security response | Security owner | SOC Analyst/Supervisor | Privacy, legal, engineering, Owner |
| Deployment/recovery | Platform/release owner | Platform operator | Engineering, DB, SOC, Owner |
| Regulatory filings | Corporate/legal owner | Designated compliance officer | Counsel and competent authority |

# 4. User manual — guests and account holders

## 4.1 Safe-use principles

1. Use only RENTipid's official application address and approved mobile distribution channel.
2. Do not share passwords, MFA codes, reset links, payment credentials, or government-ID images in general messages or support notes.
3. Check the listing, provider identity/status, price components, dates, deposit, cancellation policy, and agreement before confirming.
4. Do not assume a button means the action is available; server state and permissions control the result.
5. Do not repeat payment or state-changing requests after an uncertain result. Preserve the reference and contact support.
6. Report prohibited items, fraud, harassment, account compromise, evidence tampering, and suspicious payment instructions.

## 4.2 Registration and authentication

1. Open the registration page from the official site.
2. Select only an allowed non-privileged user/provider account type.
3. Provide accurate required information and review privacy/terms notices.
4. Use a unique password and enroll MFA when offered or required.
5. Confirm email/other verification only through valid, expected links.
6. Sign out on shared devices.

Admin, Finance Admin, Compliance Admin, SOC, and Super Admin authority cannot be self-selected. Password recovery, where enabled, must use an expiring single-use link. Never provide a reset token to support staff.

## 4.3 Profile, address, and verification

1. Enter accurate contact and personal/business information.
2. Use the structured address selector; Philippine addresses use PSGC-backed region/province/city/barangay data where applicable.
3. Upload only requested KYC/KYB documents through the dedicated secure surface.
4. Do not reuse a KYC upload path for listing or support attachments.
5. Review verification status and respond only through the authorized resubmission workflow.
6. Use the privacy request process for access/correction/export/deletion rather than placing sensitive corrections in general tickets.

## 4.4 User account safety and privacy

1. Review active account/session and security information where available.
2. Change a compromised password immediately and report suspicious access.
3. Use cookie/privacy preferences for optional processing when supported.
4. Data correction, export, and deletion require identity/ownership verification and may be limited by legal hold, finance, fraud, dispute, or security retention obligations.
5. A deletion request is not proof that every record can be immediately erased.

# 5. Renter manual

## 5.1 Search and listing review

1. Search by supported keyword, category, location, price, and availability criteria.
2. Open listing detail and review provider, description, media, specifications, location, price basis, deposit, rental terms, and availability.
3. Treat recommended listings as discovery aids, not guarantees of suitability.
4. Report restricted, unsafe, misleading, infringing, or suspicious listings.
5. Confirm delivery/collection, permitted use, age/identity requirements, and cancellation terms before booking.

## 5.2 Booking and price review

1. Choose a permitted date/time range.
2. Confirm availability and quantity.
3. Review the server-calculated breakdown: rental amount, deposit/holding, platform fee, discount, insurance (if any), tax treatment, and total.
4. Create the booking once and record its identifier.
5. If a timeout occurs, check booking/payment history before retrying.
6. Do not pay outside the authorized RENTipid path or to an unverified personal account.

The intended booking progression is `REQUESTED → ACCEPTED → PAYMENT PENDING → CONFIRMED → ACTIVE → COMPLETED`, with controlled decline, cancellation, expiration, dispute, and refund branches.

## 5.3 Payment boundary

Live payment activation is currently `NOT_AUTHORIZED`. Mock, sandbox, readiness, or training behavior is not live money movement. When a future release authorizes real payment:

1. confirm the environment and gateway page;
2. verify amount/currency/reference before approval;
3. never send card or wallet credentials to a provider or support agent;
4. retain receipt/provider reference;
5. report a mismatch rather than paying again;
6. rely on verified gateway and reconciliation state, not only a browser success page.

## 5.4 Agreement and handover

1. Read the exact agreement version for the booking.
2. Verify parties, item, dates, amounts, deposit, cancellation, damage, late-return, and policy terms.
3. Accept only through the authorized control; preserve the acceptance receipt/time.
4. At handover, inspect the item and capture authorized photos/checklist evidence.
5. Record pre-existing condition and missing accessories.
6. Do not acknowledge a condition record that is materially inaccurate; use the disagreement/support path.

## 5.5 Active rental and return

1. Use the item only as agreed and follow safety instructions.
2. Preserve relevant communication and evidence.
3. Report loss, damage, safety incidents, or extension requests promptly.
4. At return, record condition, photos, missing items, time, and acknowledgements.
5. Review any late/damage charge proposal and use claim/dispute rights if contested.

## 5.6 Cancellation, refund, claim, and dispute

1. Use the booking's authorized action and review the applicable policy result.
2. Provide the booking identifier, clear chronology, and minimum necessary evidence.
3. Do not alter evidence or include unrelated personal data.
4. A refund request is not a completed refund. Track requested, reviewed, approved, submitted, succeeded, and reconciled status separately.
5. Claims/disputes are not resolved solely by AI; material determinations and financial effects require governed review.
6. Escalate an unresolved e-commerce complaint according to the internal redress procedure and applicable law.

## 5.7 Reviews

Submit truthful, transaction-based feedback only after eligibility. Do not disclose private data, threaten, retaliate, manipulate ratings, or submit duplicate reviews. Moderation/reporting does not authorize silent alteration of the original review history.

# 6. Individual and business provider manual

## 6.1 Onboarding

1. Select the correct provider type.
2. Complete personal or business profile and address.
3. Provide accurate identity, registration, representative, and contact information.
4. Submit only requested KYC/KYB evidence.
5. Track verification; correct rejection reasons through resubmission.
6. Wait for activation before publication or fulfillment actions that require it.

For business providers, account membership and representative authority must be documented. Business membership does not grant RENTipid administrative rights.

## 6.2 Listing creation

1. Select the correct category.
2. Provide an accurate title, description, specifications, condition, location, price, deposit, terms, and availability.
3. Upload owned or licensed media without personal data, malware, misleading edits, or prohibited content.
4. Declare material defects, restrictions, safety requirements, and included accessories.
5. Run/submit prohibited-item and compliance checks.
6. Save draft, review, and submit for approval/publication.

Expected lifecycle: `DRAFT → VALIDATION → APPROVED → PUBLISHED → PAUSED → UNPUBLISHED/ARCHIVED`. Material edits may require re-review.

## 6.3 Provider obligations

1. Keep business identity, contact, registration, and listing information current.
2. Do not list illegal, prohibited, unsafe, counterfeit, infringing, or materially misrepresented items.
3. Honor advertised and agreed terms unless a lawful exception applies.
4. Maintain accurate availability and respond to booking/fulfillment tasks.
5. Issue or support required invoice/receipt processes according to the provider/platform tax model.
6. Cooperate with complaints, recalls/takedowns, safety, privacy, and regulatory requests through lawful channels.
7. Do not redirect users to unsafe/off-platform payment to evade controls.

## 6.4 Booking fulfillment

1. Review renter/booking eligibility and dates.
2. Accept/decline only within policy and state.
3. Prepare the correct item and documented accessories.
4. Complete handover checklist/photos and obtain acknowledgement.
5. On return, document condition objectively.
6. Create a claim only with a factual basis and proportionate evidence.
7. Do not make or collect an unapproved financial adjustment outside the recorded workflow.

## 6.5 Earnings, payouts, and records

1. Review booking amount, fees, deposits, deductions, refunds, and payable calculation.
2. Verify payout identity/readiness through authorized processes.
3. Treat payout status as pending until externally verified and reconciled.
4. Preserve invoices, receipts, statements, and tax/accounting records.
5. Escalate mismatches; do not request duplicate payout or fabricate settlement.

Automated real payout is not currently available as a proven live capability.

## 6.6 Social promotion

The supplemental Social Media module uses: AI suggestion → human review → authorization check → approval → scheduler → adapter → result → audit. AI cannot approve or publish. Promotion of a provider listing requires the relevant permission and provider opt-in. Real social-provider credentials are not implied by mock acceptance.

# 7. Operator manual — Admin and support

## 7.1 Start-of-shift checklist

1. Confirm environment/lifecycle and official operating gate.
2. Check truthful health/readiness and critical dependency notices.
3. Review incident, payment, provider, storage, email, and worker status.
4. Confirm personal privileged session and MFA/step-up readiness.
5. Read open handover, freeze, change, and regulatory notices.
6. Never use shared administrator credentials.

## 7.2 General Admin queue handling

1. Identify the object and stable reference.
2. Confirm assigned role/ownership and current state.
3. Review only minimum necessary data.
4. Select an authorized outcome and record a factual reason.
5. Verify resulting state, notification, and audit record.
6. Escalate specialist work to Finance, Compliance, Privacy, or SOC.

Admin surfaces may include users, providers, categories, listings, bookings, disputes, support, feedback, issues, marketing, AI logs/settings, UAT, beta, and readiness. Some report/export metrics remain incomplete; do not represent them as a complete regulator or accounting report.

## 7.3 Support intake

Required fields should include:

1. case/reference identifier;
2. authenticated requester and contact channel;
3. category and affected booking/listing/payment/account;
4. chronology and expected/actual result;
5. minimum necessary attachment/evidence;
6. urgency/safety/privacy/security indicator;
7. consent/authority for account-specific investigation where required.

Do not ask users to provide passwords, MFA codes, full card data, tokens, private keys, or unnecessary government-ID content.

## 7.4 Complaint and redress handling

1. Acknowledge and timestamp the complaint.
2. Determine platform, merchant/provider, payment, privacy, insurance, or safety ownership.
3. Preserve the transaction and communication record.
4. Prevent retaliation and duplicate financial action.
5. Investigate under the applicable service level and legal deadline.
6. Provide a clear outcome, action, and escalation route.
7. Track unresolved internet-transaction complaints against the seven-calendar-day internal-redress exhaustion rule where applicable under the Internet Transactions Act.

## 7.5 End-of-shift checklist

1. Resolve or formally hand over all high-risk queues.
2. Verify no unowned security, privacy, money, or safety case remains.
3. Record provider outages and retry state.
4. Preserve sanitized identifiers and decisions.
5. Sign out and revoke temporary elevation when used.

# 8. Finance operator manual

## 8.1 Non-negotiable boundary

Phase 19 is `COMPLETE_NO_GO_FROZEN`; `PAYMENT_ACTIVATION` is `NOT_AUTHORIZED`. A gateway adapter, environment variable, dashboard, test transaction, or readiness flag does not authorize live money movement.

## 8.2 Checkout/payment review

1. Verify environment and gateway mode.
2. Confirm booking state, amount, currency, and unique reference.
3. Validate provider evidence and signature status.
4. Confirm idempotency and absence of an earlier authoritative success.
5. Compare transaction, event, booking, and ledger state.
6. Preserve discrepancies and escalate; never force success to match a UI expectation.

## 8.3 Refund review

1. Verify requester, booking, policy, amount, and prior refund history.
2. Confirm whether full/partial/cancellation refund is permitted.
3. Obtain required approval/separation of duties.
4. Distinguish internal approval from gateway submission and success.
5. Post/link the authorized ledger effect only once.
6. Reconcile provider evidence and notify the user.

Current PayMongo refund behavior includes a placeholder/manual boundary; it must not produce a claim of completed live refund.

## 8.4 Payout review

1. Verify provider identity, beneficiary readiness, and payable state.
2. Recalculate gross amount, platform fee, deposit/damage/refund/dispute adjustments, and net payable.
3. Confirm booking completion/holding-release rules.
4. Approve/batch under separation of duties.
5. Record external settlement reference only from authoritative evidence.
6. Reconcile and issue the statement.

Real payout execution is currently manual/placeholder; dashboard status is not bank settlement.

## 8.5 Reconciliation

Reconcile at minimum:

1. booking price snapshot;
2. gateway payment intent/charge/event;
3. internal payment transaction;
4. ledger debit/credit or holding entries;
5. refund and chargeback entries;
6. provider payable/payout;
7. gateway/bank settlement evidence;
8. fees, tax/invoice evidence, and period totals.

No unexplained variance may be closed. Correction uses a new attributable adjustment, not deletion or rewriting of source evidence.

## 8.6 Payment-regulatory classification gate

Before live design approval, Philippine counsel and a BSP regulatory specialist must determine whether RENTipid is only a merchant/user of a licensed payment gateway, a technical service provider, a payment-system participant, or an operator under Republic Act No. 11127 and BSP rules. RENTipid must not call itself a licensed escrow agent or payment-system operator without the applicable legal basis and registration.

# 9. Compliance and privacy operator manual

## 9.1 KYC/KYB review

1. Confirm reviewer role and assignment.
2. Open documents only in the dedicated restricted interface.
3. Verify identity/business data against declared requirements.
4. Record decision, reason, evidence identifiers, and expiry/review date.
5. Reject/resubmit without copying raw document contents into general logs.
6. Audit every view and decision where required.
7. Escalate suspected forgery, sanctions/AML concern where legally applicable, compromise, or unsafe storage.

## 9.2 Listing compliance

1. Review category, description, media, claims, restrictions, and provider eligibility.
2. Apply current prohibited/restricted rules.
3. Treat AI classification as assistance only.
4. Block prohibited/unsafe/illegal/infringing items and record the rule/reason.
5. Apply required appeal/re-review workflow.
6. Process lawful takedown, recall, or agency requests with legal verification and preserved evidence.

The prohibited-item module contains conflicting historical freeze/failed-closeout evidence and an enforcement placeholder; it remains `IN IMPLEMENTATION` under the authoritative register.

## 9.3 Privacy request procedure

1. Receive access, correction, objection, portability/export, deletion/blocking, complaint, or consent request.
2. Generate a reference without revealing whether another person's record exists.
3. Authenticate identity and verify request ownership/authority.
4. Locate data categories, systems, processors, and legal/contractual retention.
5. Check legal hold, open booking, finance, fraud, dispute, insurance, audit, and security exceptions.
6. Approve, partially fulfill, deny, or request clarification with reason and applicable rights.
7. Fulfill securely, record evidence, and notify the requester.
8. Coordinate processor action and retain the minimum required proof.

## 9.4 Privacy program controls

1. Maintain the personal-data inventory and processing activity register.
2. Document purpose and lawful basis per processing activity.
3. Publish current privacy notice, controller identity, DPO contact, data-subject rights, recipient/transfer information, retention, and automated-processing information.
4. Record specific/versioned consent where consent is the selected basis.
5. Maintain processor contracts, transfer safeguards, subprocessors, and change review.
6. Conduct privacy impact assessments for high-risk or materially changed processing.
7. Maintain retention/legal-hold/disposal rules and proof.
8. Train personnel and test data-subject and breach procedures.

## 9.5 Privacy evidence reconciliation warning

Later records state that a bounded Privacy v1 scope was accepted locally, while some underlying worksheets still contain `Content pending validation`, `INCOMPLETE`, `NOT_IMPLEMENTED`, or `NOT TESTED` fields. Compliance reviewers must:

1. identify the exact accepted Privacy v1 control list;
2. distinguish superseded/historical worksheets from current controlled records;
3. verify DPO/DPS registration and current public notice externally;
4. confirm retention implementation rather than relying on an approved manual process;
5. avoid presenting local closure as deployment or full statutory compliance.

## 9.6 Personal data breach response

1. Activate the security incident response team and DPO/legal lead.
2. Contain without destroying evidence.
3. Determine affected systems, data, subjects, processors, acquisition, harm, and chronology.
4. Preserve incident, decision, communication, and remediation records.
5. Assess mandatory notification using current NPC rules.
6. Where mandatory, submit through the NPC Data Breach Notification Management System and notify affected data subjects within the applicable period; the current NPC guidance states 72 hours upon knowledge or reasonable belief for a reportable breach.
7. Document incidents not meeting mandatory notification and include them in applicable annual security incident reporting.
8. Review processors, recovery, root cause, control improvements, and regulator/user follow-up.

# 10. SOC and security operator manual

## 10.1 Security operations lifecycle

1. Normalize privacy-safe events with environment and lifecycle.
2. Deduplicate and correlate.
3. Evaluate controlled detection rules.
4. Review alert and create/link incident case.
5. Add bounded evidence and sanitized notes.
6. Select/version an approved playbook.
7. Request the minimum reversible scope.
8. Obtain independent time-bound approval.
9. Execute with idempotency, concurrency, freeze, and audit controls.
10. Verify result or perform separately authorized rollback.
11. Recover ingestion using leases/checkpoints/bounded replay.
12. Close with lessons learned and compliance/privacy handoff.

## 10.2 Emergency freeze

Use emergency freeze only under authorized conditions to stop unsafe execution. It must:

1. preserve investigation and audit evidence;
2. stop prohibited new response execution;
3. preserve safe rollback/recovery paths as designed;
4. identify approver, scope, start, reason, and exit criteria;
5. require controlled unfreeze and validation.

## 10.3 Security-event categories

Monitor at minimum authentication, recovery, MFA, authorization denial, ownership/IDOR attempts, privileged changes, upload failures, prohibited listings, payment/webhook anomalies, refund/payout changes, privacy access, AI tool use, provider integration failure, malicious input, data export/deletion, configuration changes, and SOC-response activity.

## 10.4 Evidence handling

1. Use stable record/correlation IDs.
2. Minimize personal data and tokenize/hash IP or identity where designed.
3. Do not record secrets, raw credentials, full payment data, or unnecessary KYC content.
4. Maintain chain, timestamp, source, integrity, access, and retention evidence.
5. Separate simulation/test from live evidence.
6. Share with government/law enforcement only under verified lawful authority and legal/privacy review.

## 10.5 Capability limitations

Gate 4I controlled simulation and Gate 4J maintenance/recovery are accepted capabilities in their defined service/runbook scope. The standalone simulations page is a navigation shell; reports and maintenance pages are planned shells. Those pages are not execution, export, or recovery consoles.

# 11. Developer and maintainer manual

## 11.1 Repository orientation

| Area | Responsibility |
| --- | --- |
| `src/app` | Next.js App Router pages, layouts, and root route handlers |
| `src/components` | Public, dashboard, form, domain, and security UI |
| `src/lib` | Auth, marketplace, privacy, payment, AI, social, security, and shared services |
| `prisma/schema.prisma` | Authoritative relational model definition |
| `prisma/migrations` | Ordered schema migration history |
| `apps/api` | Extracted Express/Azure-target API service |
| `apps/worker` | Extracted background worker target |
| `infrastructure` | Desired-state cloud infrastructure; not deployment evidence |
| `tests` and domain test folders | Unit, integration, security, acceptance, and E2E evidence |
| `docs` | Plans, registers, evidence, runbooks, manuals, and release records |

## 11.2 Framework rule

This repository uses Next.js `16.2.12`, whose APIs and conventions may differ from older Next.js versions. Before changing Next.js code, read the relevant guide under `node_modules/next/dist/docs/` and follow its deprecation guidance.

## 11.3 Local setup

1. Read `AGENTS.md`, `README.md`, environment setup, database safety, and current change/freeze records.
2. Establish ownership of the dirty working tree; preserve unrelated changes.
3. Install locked dependencies with the repository's approved Node/npm version.
4. Create local/test environment files from examples without committing secrets.
5. Run the test-database guard before database test setup/reset.
6. Apply the approved migration/seed/bootstrap path to an isolated database.
7. Run the application and verify truthful health/readiness.
8. Use focused tests before broader regression.

Relevant scripts include `npm run dev`, `npm run build`, `npm run lint`, `npm run test:db:guard`, `npm run test:db:migrate`, `npm run test:e2e`, and application verification/release scripts. Do not run a reset against an unverified target.

## 11.4 Change workflow

1. Identify requirement, approver, module ID, and current gate.
2. Map affected screen, API, service, model, migration, state, job, integration, permission, audit event, privacy/legal control, test, and runbook.
3. Classify root versus extracted route ownership.
4. Read relevant Next.js documentation and domain evidence.
5. Implement the smallest coherent change.
6. Enforce server authorization, ownership, validation, transaction/idempotency/concurrency, and audit.
7. Add migration/required data only when necessary and rehearse safely.
8. Test happy, negative, edge, role, ownership, retry, and dependency failure.
9. Update registries/manuals/evidence.
10. Promote only through the next permitted gate.

## 11.5 API design checklist

1. Route and authoritative service owner identified.
2. Authentication/account state enforced.
3. Role/permission and object ownership enforced.
4. Path/query/body/file validated with bounded schemas.
5. State transition precondition enforced.
6. Critical effect protected by transaction, unique constraint, optimistic version, lock, or idempotency key.
7. External timeouts/retries/provider errors mapped safely.
8. Error response consistent and non-sensitive.
9. Audit/correlation written.
10. Tests include denial, IDOR, duplicate, and concurrency behavior.

## 11.6 Database and migration procedure

1. Review current schema and migration history.
2. Prefer additive/backward-compatible changes.
3. Define nullability, defaults, constraints, indexes, foreign keys, and delete behavior.
4. Protect finance, evidence, audit, privacy, and accepted agreement records from destructive loss.
5. Validate Prisma schema/client generation.
6. Run against an isolated fresh database and an approved existing-state rehearsal.
7. Validate required data and application startup.
8. Document rollback/forward-fix and backup checkpoint.
9. Production migration requires separate authority and evidence.

## 11.7 Security and privacy coding rules

1. Never trust client role, price, owner, state, filename, MIME type, provider outcome, or AI output.
2. Never include secret values in source, errors, logs, support, AI prompts, or audit.
3. Use approved encryption/key management for designated data.
4. Prevent IDOR with scoped database queries or explicit ownership checks.
5. Minimize personal data passed to processors and record provider mode.
6. Validate upload paths/content and reject traversal/unauthorized URLs.
7. Keep AI advisory; deterministic tools authorize actions.
8. Maintain separation of duties and step-up for privileged paths.

## 11.8 Testing and evidence

Record command, date, commit/worktree context, environment, database target, relevant configuration mode, result, failures, artifact path, and scope limitation. A test file is not proof of a pass; an old pass is not proof for later modified code.

## 11.9 Developer handover

Handover must list:

1. requirement and module IDs;
2. files and migrations changed;
3. state/API/data compatibility;
4. permissions and audit changes;
5. tests run/results;
6. known defects and unsupported modes;
7. deployment/config/provider prerequisites;
8. rollback/recovery path;
9. documentation/evidence updates;
10. reserved decisions not authorized by the change.

# 12. Architecture, data, interfaces, and integrations

## 12.1 Runtime architecture

The target direction is a Vercel-hosted Next.js frontend with Azure backend/services, PostgreSQL/Prisma, blob/object storage, managed secrets/identity, telemetry, and optional search/AI integrations. The repository is partially split: root route handlers coexist with an extracted API and worker. Each route must be classified before modification or retirement.

## 12.2 Trust boundaries

1. Browser/mobile client ↔ frontend/server handlers.
2. Frontend ↔ extracted API/worker.
3. Application services ↔ PostgreSQL.
4. Application ↔ object storage.
5. Application ↔ payment/email/KYC/AI/insurance/social/geolocation providers.
6. Public/user roles ↔ privileged operator roles.
7. Admin ↔ Finance/Compliance/SOC specialist separation.
8. Test/mock/sandbox ↔ preview/production environment separation.

## 12.3 Data domains

1. Identity/session/profile/address/RBAC/consent.
2. Provider/business/KYC/KYB/documents.
3. Categories/listings/media/location/availability/compliance.
4. Booking/pricing/agreement/handover/inspection/return/cancellation.
5. Payment/gateway/webhook/ledger/deposit/refund/payout/reconciliation.
6. Insurance/claims/disputes/reviews.
7. Notifications/support/feedback/AI cases and conversations.
8. Marketing/social accounts/posts/metrics/attribution.
9. Admin/settings/UAT/release evidence.
10. Audit/privacy/security events/rules/alerts/cases/playbooks/approvals/responses/recovery.

## 12.4 State and transaction rules

1. Server/database state is authoritative.
2. Only permitted transitions may occur.
3. Accepted agreement, policy, audit, ledger, and evidence history must remain immutable or versioned.
4. Repeated logical requests must not repeat business effects.
5. Concurrent booking, payment, approval, publication, and response requests must preserve invariants.
6. External success must be verified and reconciled.

## 12.5 Integration status matrix

| Integration | Intended use | Current truth/boundary |
| --- | --- | --- |
| PayMongo | Checkout, webhook, transaction evidence | Mock/sandbox/code exist; live activation prohibited; refund/payout gaps remain |
| Email/SMTP | Recovery and transactional communications | Configuration/template does not prove accepted delivery |
| Azure storage/backend | KYC and media/backend target | Runtime/deployment must be externally proven; some Vercel routes return 410 by design |
| Azure AI Search/OpenAI | Search and AI assistance | Provider mode and target deployment require verification; AI tools remain bounded |
| Insurance provider | Quote/policy/claim | Foundation slice only; no live coverage/insurer activation claim |
| KYC provider | Verification automation | External provider recorded inactive in privacy registry |
| Social providers | Promotion publishing/metrics/feedback | Mock is acceptance provider; real adapters/credentials vary and are not generally active |
| Threat/geolocation | SOC enrichment | Privacy-safe modes; external availability must be verified |
| Vercel/Azure | Hosting/runtime target | Local configuration/IaC is not provisioning, deployment, DNS, or traffic proof |

## 12.6 Interface documentation standard

Every material screen must identify purpose, actor, permission, data source, fields/actions, validation, state transitions, audit/notification effects, loading/empty/denied/conflict/dependency errors, accessibility, responsive behavior, and known limitations.

# 13. Business governance, risks, and KPIs

## 13.1 Business operating model decisions required

Leadership must approve and document:

1. corporate/operator identity and trade name;
2. geographic and customer scope;
3. marketplace classification and provider contracting model;
4. platform fees, taxes, invoicing, deposits, cancellation, refunds, and payouts;
5. whether RENTipid ever holds/controls funds or only uses a licensed gateway;
6. whether RENTipid is only an insurance technology facilitator or performs regulated solicitation/procurement;
7. KYC/KYB requirements and prohibited categories;
8. privacy controller/processor roles and DPO;
9. complaint/redress, support, safety, and government request ownership;
10. launch environment, provider activation, risk appetite, and shutdown authority.

## 13.2 Principal business risks

| Risk | Example | Required treatment |
| --- | --- | --- |
| Regulatory classification | Marketplace, payment, escrow, insurance, tax role misunderstood | Counsel/regulator assessment before activation |
| Consumer harm | Misleading listing, hidden fee, unsafe item, unresolved complaint | Merchant verification, clear disclosure, moderation, redress, takedown |
| Double booking | Concurrent availability acceptance | Database invariant and concurrency acceptance |
| Money mismatch | Gateway success without ledger/booking parity | Signature, idempotency, reconciliation, exception queue |
| Provider fraud | False identity/business/listing/evidence | KYC/KYB, compliance review, monitoring, dispute/hold rules |
| Privacy harm | Excessive KYC access, ungoverned processor, breach | Minimization, RBAC, encryption, PIA, contracts, incident response |
| Security compromise | Credential theft or privileged abuse | MFA/step-up, least privilege, SOC, freeze, recovery |
| Misrepresentation | Mock/preview represented as live | Controlled status vocabulary and release approval |
| Platform dependency | Cloud/provider outage or lock-in | Adapter, health, fallback, backup/recovery, exit plan |
| Evidence inconsistency | Old worksheet conflicts with later closure | Authority hierarchy and reconciliation register |

## 13.3 KPI governance

Every KPI must state definition, owner, source query, time zone/period, inclusion/exclusion, currency and rounding, privacy classification, refresh cadence, reconciliation, and limitation.

Suggested KPI families:

1. verified renter/provider activation;
2. active/approved listings and prohibited-item rate;
3. search-to-booking conversion and availability conflict rate;
4. booking acceptance, cancellation, expiration, completion;
5. GMV, platform fee, refund, payout, and unexplained variance;
6. claim/dispute incidence and resolution time;
7. complaint acknowledgement/resolution and escalation;
8. privacy request and breach response timeliness;
9. security alert/case/containment/recovery metrics;
10. system availability, dependency health, recovery objectives, and release defects.

Current analytics are `IN IMPLEMENTATION`; mock data and unreconciled definitions must not be used for statutory, investor, tax, or audited financial reporting.

# 14. Philippine government and regulatory compliance framework

## 14.1 Legal disclaimer and methodology

This section is a compliance engineering map, not a legal opinion. It links likely obligations to RENTipid controls and evidence. Applicability must be confirmed against the final operating entity and facts by Philippine counsel and, where necessary, DTI, NPC, BIR, SEC/DTI/CDA/LGU, BSP, Insurance Commission, DICT/DOJ/law enforcement, PCC, IPOPHL, and sector regulators.

Status labels:

1. **Applicable baseline:** strongly relevant to a Philippine online marketplace processing personal data.
2. **Conditional:** depends on business activity, threshold, product/category, payment control, insurance role, or corporate facts.
3. **External proof required:** registration, permit, certificate, filing, provider contract, or regulator decision cannot be proven from source code.
4. **Gap/reconciliation:** repository evidence does not support a complete compliance claim.

## 14.2 Core legal and regulatory matrix

| Authority/instrument | Relevance to RENTipid | Required organizational/application evidence | Current documentation posture |
| --- | --- | --- | --- |
| Republic Act No. 11967, Internet Transactions Act of 2023, and 2024 IRR | B2B/B2C internet transactions, digital platforms/e-marketplaces, online merchants, disclosures, consumer remedies, internal redress, privacy/security, invoices/receipts, takedown/cooperation | Marketplace/merchant classification; verified merchant identity/contact; clear transaction/promotions/price/terms; complaint mechanism; records; prohibited-item/takedown procedure; privacy/security; invoice/receipt allocation | Applicable baseline; module features exist but global acceptance and some complaint/support/compliance paths are incomplete |
| Republic Act No. 7394, Consumer Act, Civil Code obligations/contracts | Fair/deceptive practices, warranties/remedies, representations, contract and damages | Accurate listings/advertising; terms; price/fee disclosure; agreement; complaint/refund/repair/replacement rules; evidence preservation | Policy and workflow surfaces exist; complete mutation/refund/legal-version evidence remains open |
| Republic Act No. 8792, Electronic Commerce Act | Legal recognition/integrity/retention of electronic documents/signatures and e-commerce conduct | Agreement/acceptance version, identity, time, integrity, accessibility, retention, lawful access, audit | Agreement APIs/models exist; immutable agreement and policy version recording incomplete |
| Republic Act No. 10173, Data Privacy Act, IRR, NPC issuances | Personal/sensitive data, transparency, lawful basis, rights, security, processors/transfers, breach, accountability | PIC/PIP role; DPO; DPS registration when covered; privacy notice; ROPA; PIA; rights workflow; retention; processor agreements; security; breach records/notification; training | Local Privacy v1 acceptance exists for bounded scope, but deployment/external registration and underlying worksheet reconciliation remain required |
| NPC Circular No. 2022-04 and current registration rules | DPO and DPS registration for covered PIC/PIP, thresholds and high-risk processing | Current NPCRS registration/certificate/seal; update/renewal calendar; system/DPO changes | External proof required; repository appointment/approval records do not prove current NPC registration |
| NPC breach-management rules and DBNMS/ASIR guidance | Incident documentation, mandatory breach notification and annual reporting | Incident team; assessment; 72-hour clock for reportable breach; DBNMS evidence; user notices; ASIR; processor coordination | SOC/privacy alignment exists; production drill, filing authority, and external submission proof required |
| Republic Act No. 10175, Cybercrime Prevention Act | Illegal access, interference, misuse and preservation/cooperation issues | Security monitoring, incident evidence, lawful request protocol, preservation, access control, anti-abuse | Strong local SOC scope; production effectiveness and lawful-government-request SOP require operational proof |
| Republic Act No. 11127 and BSP payment rules | Operators/participants/service providers in payment systems; registration and oversight | Formal payment-flow and regulatory classification; gateway contracts/licenses; funds/custody/settlement map; registration or documented non-OPS basis; security/continuity/reconciliation | Conditional; live payment prohibited; legal/BSP review required before activation |
| Republic Act No. 11765, Financial Products and Services Consumer Protection Act | Applies if RENTipid becomes a regulated financial service provider/authorized representative | Product governance, disclosure, complaint assistance, data/security, training, regulator-specific obligations | Conditional; do not claim regulated financial service status without classification |
| Amended Insurance Code (RA 10607) and Insurance Commission rules | Solicitation/procurement, insurance agent/broker/platform/e-commerce activity | Role classification; licensed insurer/intermediary; IC approval where applicable; product/policy approvals; disclosures; complaint/claims; contracts | Conditional but high risk; technical foundation only and no live insurer/coverage claim |
| BIR registration, invoicing, e-commerce rules, RR/RMC issuances including 2026 Registration Seal guidance | Business/tax registration, online proof, invoices/receipts, marketplace/merchant reporting/withholding depending on facts | TIN/COR/eCOR/Seal; registered trade/store names; invoice design/system; books/records; withholding/reporting determination; provider tax allocation | External proof required; tax policy in older payment review was deferred and needs professional reconciliation |
| SEC/DTI/CDA and LGU business registration/permits | Legal entity/trade name and authority to operate | SEC incorporation or DTI business name/CDA registration; BIR; barangay/mayor/business permits; registered address and activities; renewals | External proof required; do not infer from repository/company name |
| Intellectual Property Code (RA 8293, as amended) | Brand, software/content ownership, listing media, counterfeit/infringing goods, takedown | Trademark/domain rights; licenses/assignments; provider warranties; notice/takedown; repeat abuse; OSS license inventory | Conditional controls; prohibited/restricted review exists but complete enforcement acceptance is open |
| Accessibility and anti-discrimination obligations | Equal access, disability accommodations, fair treatment | WCAG-based design/testing, keyboard/screen-reader/contrast/mobile/print evidence, accessible support and notices | Some accessibility evidence exists; full application conformance must be tested and legally reviewed |
| Product/service sector rules (DTI, DOH/FDA, DA, DENR, LTO/OTC/other) | Certain rental categories may be prohibited, restricted, licensed, safety-regulated, recalled, hazardous, or environmentally controlled | Category legal inventory, permit/document requirements, recalls/takedown, age/use restrictions, disposal/environment rules | Conditional per category; requires legal category register and independent compliance acceptance |
| Competition law (RA 10667) | Platform terms, ranking, provider access, pricing/tying/exclusivity, data advantage | Fair platform rules, conflict/ranking transparency, competition review for exclusivity/MFN/tying and acquisitions | Conditional; business/legal review required |
| Employment/contractor and labor rules | Operators, support personnel, provider classification | Employment/contractor agreements, statutory benefits, workplace/security/privacy training, labor compliance | Outside code evidence; business/legal/HR responsibility |
| Government/law-enforcement requests | Subpoena/order, preservation, disclosure, takedown, emergency requests | Identity/authority verification, legal review, scope/minimization, preservation, response log, challenge/escalation, secure transfer | SOP required; never disclose based on informal request or dashboard access |

## 14.3 Internet Transactions Act control checklist

Before public launch, confirm with counsel whether RENTipid is an e-marketplace, digital platform, e-retailer, or combination. The likely controls include:

1. identify RENTipid's legal/business name, address, and effective contact channels;
2. verify and retain required provider/online-merchant identity, contact, and registration information before onboarding/publishing;
3. make transactions and the person on whose behalf they occur clear;
4. disclose price, fees, deposits, promotions, eligibility, conditions, cancellation, delivery/handover, warranties/remedies, and material terms clearly;
5. protect privacy and meet applicable information-security requirements;
6. support required invoice/receipt issuance and retention;
7. provide accessible complaint/internal redress and track the seven-calendar-day exhaustion condition where applicable;
8. provide consumer remedies and merchant accountability without using platform terms to unlawfully waive rights;
9. implement prohibited-item, unsafe-item, recall, infringement, and lawful takedown procedures;
10. maintain transaction/merchant/complaint evidence and regulator cooperation procedure;
11. assess current DTI Online Business Database/Trustmark/other registration obligations rather than relying on older voluntary language;
12. train providers and operators and review changes to ITA/IRR/DTI issuances.

## 14.4 Data Privacy Act control checklist

1. Confirm personal information controller/processor roles for each data flow.
2. Appoint a qualified DPO and establish privacy governance.
3. Determine and complete current DPO/DPS registration and renewal obligations.
4. Maintain ROPA/data inventory, purposes, lawful bases, categories, recipients, transfers, retention, and security measures.
5. Publish a complete, versioned, understandable notice before or at collection.
6. Obtain and record valid consent only where consent is the correct basis; support withdrawal.
7. Apply transparency, legitimate purpose, proportionality, accuracy, retention, and security.
8. Support rights: informed, access, correction, objection, erasure/blocking subject to lawful limits, damages/complaint, and portability where applicable.
9. Execute processor/outsourcing agreements and review subprocessors/cross-border safeguards.
10. Conduct PIAs for high-risk, profiling, AI, KYC, payment, insurance, biometrics/document, geolocation, or large-scale changes.
11. Implement organizational, physical, and technical security measures.
12. Maintain breach response, 72-hour assessment/notification clock for reportable breaches, documentation, DBNMS/ASIR, and training.
13. Govern retention, legal hold, deletion/anonymization, backups, and processor deletion.
14. Restrict automated decision-making; do not make prohibited or significant legal decisions solely through ungoverned AI.

## 14.5 Payment and “escrow” compliance gate

RENTipid should use neutral terms such as “holding,” “deposit,” or “payment status” until counsel confirms legal/payment-provider semantics. Before real money:

1. diagram who receives, owns, controls, safeguards, transfers, refunds, and settles funds;
2. obtain provider contract, license/registration evidence, prohibited-business review, and webhook/security requirements;
3. determine whether RENTipid is an operator/participant/service provider under payment laws and BSP rules;
4. confirm AML/KYC/reporting responsibilities and reliance arrangements where applicable;
5. approve consumer disclosure, complaint/chargeback/refund, deposit, payout, and insolvency/segregation treatment;
6. approve accounting, tax, reconciliation, and audit evidence;
7. complete sandbox and controlled production-readiness acceptance;
8. obtain an explicit replacement of the current NO-GO before activation.

## 14.6 Insurance compliance gate

The Insurance Commission's January 2025 opinion on a different technology facilitator emphasizes that classification depends on actual conduct: technology-only facilitation may differ from sale, solicitation, negotiation, or procurement. RENTipid must obtain advice for its exact model. Before insurance activation:

1. contract only with authorized insurer/intermediary entities;
2. define whether RENTipid is technology provider, referral channel, agent, broker, or other regulated role;
3. obtain required license/approval and product/e-commerce approvals;
4. prevent unlicensed personnel/AI from solicitation or binding advice;
5. disclose insurer, coverage, exclusions, premium, cancellation/refund, claims, and complaint routes;
6. separate premium/settlement from marketplace funds and reconcile;
7. protect insurance/health/sensitive data;
8. test issuance, cancellation, claims, provider outage, and complaint handling;
9. obtain explicit activation authorization.

## 14.7 Tax and business registration gate

Before commercial launch, the corporate/tax owner and Philippine tax adviser must confirm:

1. legal entity/trade/store names and business activities;
2. SEC/DTI/CDA and local permits;
3. BIR registration and current online-display rules, including the 2026 Registration Seal where applicable;
4. invoice/receipt responsibility for platform fees, rentals, deposits, refunds, and provider transactions;
5. VAT/percentage/income and withholding treatment;
6. e-marketplace withholding/reporting and provider-information duties, if applicable;
7. books, electronic records, retention, and audit trail;
8. treatment of promotions, insurance, chargebacks, bad debt, and provider payouts;
9. registration/update/renewal calendar and evidence owner.

## 14.8 Government request protocol

1. Route every request to the designated legal/compliance contact.
2. Verify agency, official, authority, signature, jurisdiction, scope, deadline, and legal instrument.
3. Preserve relevant records under controlled legal hold.
4. Challenge or seek clarification for overbroad, informal, unlawful, or technically unsafe requests.
5. Minimize disclosure and redact unrelated data.
6. Transfer through a secure approved channel.
7. Record request, decision, approver, data disclosed, time, recipient, and retention.
8. Notify affected persons when lawful/required and not prohibited.
9. Never give a regulator or law-enforcement party direct unrestricted production/admin access as a substitute for lawful disclosure.

# 15. Compliance operating calendar and evidence pack

## 15.1 Pre-launch evidence pack

1. Corporate registration, beneficial/authorized signatory records, trade name, address, and permits.
2. BIR registration, invoicing decision, registration seal/display evidence, books/record policy, and tax memo.
3. DTI Internet Transactions Act classification and compliance assessment.
4. Provider/merchant onboarding requirements and sample verified record.
5. Terms, privacy notice, rental/cancellation/refund/deposit/prohibited-item/complaint policies with versions and approvals.
6. DPO appointment, NPC DPO/DPS registration proof where covered, ROPA, PIA, processor register/contracts, transfer assessment, retention, DSR and breach runbooks.
7. Payment/OPS/escrow classification memo, gateway contracts/licenses, sandbox results, reconciliation and NO-GO replacement authorization.
8. Insurance classification/legal opinion, insurer/intermediary authority and product/e-commerce approval before activation.
9. Security risk assessment, test evidence, incident response, vulnerability remediation, backup/restore, continuity/disaster recovery.
10. Accessibility assessment, consumer/support training, operator competency, and escalation contacts.
11. Release manifest, migrations, configuration validation, provider health, monitoring, rollback, and accepted global journeys.

## 15.2 Recurring compliance calendar

| Frequency/trigger | Required review |
| --- | --- |
| Continuous | Security alerts, prohibited listings, provider health, financial mismatches, user safety |
| Per transaction/event | Agreement/consent version, invoice/receipt, payment/webhook/ledger, audit, complaint evidence |
| Daily/shift | Critical queues, health, unresolved complaints, finance/privacy/security escalation |
| Monthly | Access/privileged-role review, provider/merchant exceptions, reconciliation, complaint and incident trend |
| Quarterly | Vulnerability/dependency, processor/subprocessor, retention/legal hold, KPI definition, backup sample restore |
| Annually or regulator schedule | Corporate/LGU/BIR/NPC/industry registration renewal, ASIR/reporting, policy/training/PIA/BCP review |
| Material change | New module/provider/data/category/AI decision/payment/insurance/country; PIA, threat/legal/tax/regulatory review |
| Incident | Breach/security/regulatory clock, containment, notification decision, recovery and lessons learned |

Actual statutory filing dates must be maintained by the responsible professional using current regulator issuances.

## 15.3 Evidence quality requirements

Evidence must be attributable, dated, scoped, reproducible, access-controlled, unaltered or integrity-protected, privacy-minimized, and retained under policy. A screenshot alone is weak evidence unless it includes environment, actor, record, time, and corroborating system/provider record.

# 16. Testing, release, deployment, continuity, and recovery

## 16.1 Mandatory test layers

1. Lint/static/type checks.
2. Unit tests for calculation, policy, mapping, validation, and permissions.
3. Database/service integration tests for transaction, ownership, idempotency, concurrency, audit, and adapter behavior.
4. API authentication/RBAC/IDOR/input/error tests.
5. Browser journeys for renter, provider, Admin, Finance, Compliance, Privacy, support, SOC, and social promotion.
6. Fresh-database migration and required-data replay.
7. Upload, webhook, replay, rate-limit, privilege escalation, injection, secret-leak, and AI tool-boundary security tests.
8. Health, deployment rehearsal, rollback, backup/restore, worker recovery, monitoring, and dependency outage tests.
9. Privacy DSR/breach, consumer complaint/refund, invoice/receipt, and government-request tabletop tests.

## 16.2 Global local acceptance

All must pass before `LOCAL-RC1`:

1. renter journey;
2. provider journey;
3. damage/claim/dispute journey;
4. insurance journey within an authorized non-live provider mode;
5. finance/reconciliation journey;
6. Admin/compliance/privacy journey;
7. security event-to-response/rollback journey;
8. migration/seed/build/security/documentation and no open P0/P1 defects.

## 16.3 Promotion sequence

`CODE COMPLETE → LOCAL FUNCTIONAL → LOCAL DATABASE MIGRATED → LOCAL REQUIRED DATA SEEDED/SYNCED → LOCAL ACCEPTANCE PASS → COMPLETED → CLOSED → FROZEN → PREVIEW MIGRATED → PREVIEW ACCEPTANCE PASS → PRODUCTION-READY`.

No gate may be skipped or inferred from a later-looking artifact.

## 16.4 Deployment checklist

1. Approved release/version/commit and clean ownership of changes.
2. Production build and dependency/security review.
3. Environment variables present and validated without exposing values.
4. Backup/checkpoint and migration forward/rollback decision.
5. Required data/configuration version.
6. Provider credentials, legal approvals, modes, and health.
7. Monitoring, alerting, runbooks, on-call, freeze, and rollback.
8. Preview acceptance and change approval.
9. Separate production database/cloud/traffic/DNS/payment/insurance authorization.
10. Post-deployment smoke, data, provider, security, privacy, and reconciliation verification.

## 16.5 Continuity and recovery

Define and approve service/data recovery objectives. Maintain encrypted backups, restore tests, access control, provider outage playbooks, bounded replay, worker leases/checkpoints, reconciliation recovery, incident communications, manual safe-mode procedures, and tested rollback. Backup existence is not recovery proof.

# 17. Complete application module register

## 17.1 Group A — Platform Foundation

1. **FND-01 Architecture/configuration/PostgreSQL/Prisma:** `IN IMPLEMENTATION`; split configuration and incomplete production contract.
2. **FND-02 Migrations:** `IN IMPLEMENTATION`; whole-application fresh migration proof incomplete at baseline.
3. **FND-03 Seeds/required data:** `IN IMPLEMENTATION`; no unified deterministic required-data manifest.
4. **FND-04 Health/errors/logging:** `LOCAL ACCEPTANCE PASS`; preview chain held by global barrier.
5. **FND-05 Audit trail:** `LOCAL ACCEPTANCE PASS`; whole-application sensitive-mutation coverage unproven.

## 17.2 Group B — Identity and Account Management

1. **IDN-01 Registration/login/logout/sessions:** `IN IMPLEMENTATION`; recovery/delivery path incomplete at baseline.
2. **IDN-02 MFA/session step-up:** `LOCAL ACCEPTANCE PASS`; new preview evidence pending.
3. **IDN-03 Profile/account settings:** `IN IMPLEMENTATION`; later frozen profile evidence requires exact-scope reconciliation.
4. **IDN-04 Global Address/PSGC:** `CLOSED / FROZEN` with accepted full chain.
5. **IDN-05 RBAC/permissions:** `IN IMPLEMENTATION`; dual role systems and full route/API mapping unresolved.

## 17.3 Group C — Provider System

1. **PRV-01 Individual provider onboarding:** `IN IMPLEMENTATION`; focused E2E acceptance missing.
2. **PRV-02 Business provider onboarding/KYB:** `IN IMPLEMENTATION`; complete business path and real social activation absent.
3. **PRV-03 KYC/KYB documents:** `IN IMPLEMENTATION`; extracted Azure runtime/deployment unproven.

## 17.4 Group D — Listings and Marketplace

1. **MKT-01 Categories/required data:** local seed/sync evidence; whole marketplace acceptance open.
2. **MKT-02 Listing lifecycle/publication:** `IN IMPLEMENTATION`; edit and Next/Azure parity gaps.
3. **MKT-03 Listing media/storage:** `IN IMPLEMENTATION`; unsupported adapters and Azure proof gaps.
4. **MKT-04 Prohibited/restricted compliance:** `IN IMPLEMENTATION`; conflicting closure evidence and placeholder enforcement.
5. **MKT-05 Search/filter/discovery:** `IN IMPLEMENTATION`; acceptance, auth boundaries, and fallback proof missing.
6. **MKT-06 Availability/locking:** `IN IMPLEMENTATION`; lifecycle concurrency proof missing.

## 17.5 Group E — Rental Transaction Engine

1. **TXN-01 Booking/pricing:** `IN IMPLEMENTATION`; authoritative pricing and complete journey evidence missing.
2. **TXN-02 Agreement/acceptance:** `IN IMPLEMENTATION`; immutable agreement/policy version incomplete.
3. **TXN-03 Handover/active/return:** `IN IMPLEMENTATION`; complete state/recovery/E2E evidence missing.
4. **TXN-04 Cancellation/expiration:** `IN IMPLEMENTATION`; worker deployment/scheduling and focused proof missing.

## 17.6 Group F — Payments and Escrow/Holding

1. **PAY-01 Checkout/gateway:** `IN IMPLEMENTATION`; live activation prohibited.
2. **PAY-02 Webhooks/idempotency:** `IN IMPLEMENTATION`; complete finance callback matrix not accepted.
3. **PAY-03 Holding/ledger:** `IN IMPLEMENTATION`; legal semantics and invariants incomplete.
4. **PAY-04 Refunds:** `IN IMPLEMENTATION`; live provider method placeholder/manual.
5. **PAY-05 Payouts:** `IN IMPLEMENTATION`; real execution manual/placeholder.
6. **PAY-06 Reconciliation:** `IN IMPLEMENTATION`; end-to-end equality/discrepancy handling unproven.

## 17.7 Group G — Trust and Protection

1. **TRU-01 Insurance:** Foundation Slice 1 `CLOSED / FROZEN`; full module `IN IMPLEMENTATION` and non-live.
2. **TRU-02 Damage claims/evidence:** `IN IMPLEMENTATION`; determination-to-ledger journey missing.
3. **TRU-03 Disputes:** `IN IMPLEMENTATION`; party workflow/tests incomplete.
4. **TRU-04 Reviews/reputation:** `IN IMPLEMENTATION`; mutation workflow/focused tests missing.

## 17.8 Group H — Communications and Autonomous Support

1. **COM-01 Direct messaging:** `NOT STARTED` at register baseline.
2. **COM-02 Notifications:** `IN IMPLEMENTATION`; inbox/API/read-state incomplete.
3. **COM-03 AI Help Center:** `IN IMPLEMENTATION`; Vercel endpoint disabled and tools/mock limitations.
4. **COM-04 Support/transactional communications:** `IN IMPLEMENTATION`; user mutations/email acceptance missing.

## 17.9 Group I — Admin and Operations

1. **ADM-01 Admin operations:** `IN IMPLEMENTATION`; complete role/ownership/audit acceptance missing.
2. **ADM-02 Finance Admin:** `IN IMPLEMENTATION`; real-money automation/reconciliation unavailable.
3. **ADM-03 Compliance Admin:** `IN IMPLEMENTATION`; prohibited-item placeholder/conflict remains.
4. **ADM-04 Super Admin:** `IN IMPLEMENTATION`; initialization/whole-scope authorization evidence missing.

## 17.10 Group J — Security and Privacy

1. **SEC-01 Security/SOC:** `LOCAL ACCEPTANCE PASS`; extensive frozen slices, new preview chain pending.
2. **SEC-02 Privacy/consent v1:** `LOCAL ACCEPTANCE PASS`; no deployment inference; external/legal/deferral limits remain.

## 17.11 Group K — Analytics and Mobile

1. **ANA-01 Analytics/KPIs:** `IN IMPLEMENTATION`; mock data and unreconciled definitions.
2. **MOB-01 PWA:** `IN IMPLEMENTATION`; no service worker/offline behavior.
3. **MOB-02 Capacitor/mobile:** `IN IMPLEMENTATION`; native projects/tests and hardening missing.

## 17.12 Group L — Legal and Documentation

1. **LEG-01 Legal/policy:** `IN IMPLEMENTATION`; versioned acceptance and transaction consents incomplete.
2. **DOC-01 Manuals/interfaces:** `IN IMPLEMENTATION`; historical documents require runtime reconciliation.

## 17.13 Group M — Release

1. **REL-01 Global acceptance/LOCAL-RC1/closure/deployment:** `IN IMPLEMENTATION`; no global release candidate.

## 17.14 Supplemental extension

1. **SOC-01 Social Media, Promotion, and Feedback Intelligence:** recorded `PASS / FROZEN` engineering scope with mock acceptance provider; real-provider activation/credentials remain separate.

# 18. Limitations, launch blockers, and prohibited representations

## 18.1 Launch blockers

1. Required modules below code complete/local acceptance.
2. No global local acceptance or `LOCAL-RC1`.
3. Live-payment NO-GO and incomplete refund/payout/reconciliation.
4. Full insurance integration and legal/provider activation absent.
5. Direct messaging absent and support/notification mutations incomplete.
6. Prohibited-item enforcement evidence conflict.
7. Marketplace, payment, insurance, tax, privacy-registration, and permit classification/external proof incomplete.
8. No inferred cloud/production deployment or global migration evidence.

## 18.2 Statements that must not be made without new evidence

Do not claim:

1. “RENTipid is fully complete/live/production-ready.”
2. “RENTipid is a licensed escrow service/payment operator.”
3. “Payments, refunds, or payouts are live and automated.”
4. “Insurance coverage is active” or “RENTipid is a licensed insurance intermediary.”
5. “All social, KYC, AI, email, storage, or threat providers are active.”
6. “The mobile app is published” or “offline mode is complete.”
7. “The application is legally compliant/certified by DTI, NPC, BIR, BSP, IC, SEC, or another agency.”
8. “A historical test/freeze applies to all current dirty changes.”
9. “Terraform/environment variables prove deployment or security.”
10. “AI autonomously approves financial, compliance, insurance, or security decisions.”

# 19. Incident and escalation quick guides

## 19.1 User/account compromise

Freeze or secure account within authority → revoke/reset sessions/credentials → preserve security evidence → assess affected records/actions → notify user/privacy lead as applicable → remediate → monitor → close with audit.

## 19.2 Payment mismatch

Stop duplicate action → preserve booking/payment/event/ledger references → verify signature/idempotency/amount/environment → reconcile gateway evidence → finance escalation → controlled correction only after approval → notify parties.

## 19.3 Unsafe/prohibited listing

Restrict visibility where authorized → preserve listing/provider/rule evidence → compliance/safety review → lawful takedown/recall/notification → provider appeal where applicable → regulator/law-enforcement escalation through legal protocol.

## 19.4 Privacy incident

Contain → activate SIRT/DPO/legal → preserve/minimize evidence → determine data/subjects/acquisition/harm → start notification clock → processor coordination → NPC/data-subject notification where required → recovery → ASIR/post-incident evidence.

## 19.5 Cloud/provider outage

Confirm dependency and mode → fail closed for high-risk writes → communicate degraded status → activate retry/fallback/manual safe mode → preserve queues/idempotency → validate recovery/reconciliation → post-incident review.

## 19.6 Government request

Do not disclose informally → verify authority → legal/privacy review → preserve under hold → minimize/secure disclosure → audit recipient/scope/time → notify when lawful → close/retain under policy.

# 20. Glossary and authoritative references

## 20.1 Glossary

1. **Acceptance:** Evidence-backed proof of stated behavior/control in a named scope and environment.
2. **DPO:** Data Protection Officer.
3. **DPS:** Data Processing System for NPC registration/records context.
4. **DSR:** Data Subject Request.
5. **E-marketplace:** A digital platform classification defined by applicable e-commerce law; counsel must classify RENTipid's exact model.
6. **Idempotency:** Repeating one logical request does not repeat the business effect.
7. **IDOR:** Unauthorized object access caused by missing ownership/scope enforcement.
8. **KYC/KYB:** Customer/business identity verification.
9. **LOCAL-RC1:** First global local release candidate after every prerequisite passes.
10. **NO-GO:** Activation is prohibited even when code exists.
11. **OPS:** Operator of Payment System under applicable BSP/payment law classification.
12. **PIA:** Privacy Impact Assessment.
13. **PIC/PIP:** Personal Information Controller/Personal Information Processor.
14. **PSGC:** Philippine Standard Geographic Code.
15. **RBAC:** Role-based access control, supplemented by ownership, state, and step-up.
16. **Reconciliation:** Matching internal state with authoritative external/financial evidence and resolving differences.
17. **ROPA:** Record of Processing Activities.
18. **SIRT:** Security Incident Response Team.
19. **Step-up:** Stronger authentication required for a high-risk action.

## 20.2 Internal authoritative references

1. `docs/RENTipid-Master/01-MASTER-MODULE-REGISTER.md`.
2. `docs/governance/RENTipid-Master-Plan.md`.
3. `docs/system-documentation/RENTipid-NUMBERED-APPLICATION-DOCUMENTATION.md`.
4. `docs/system-documentation/RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.md`.
5. `docs/final-documentation/00-WORKING-REGISTRIES/`.
6. `docs/final-documentation/00-DOCUMENT-CONTROL/`.
7. `docs/final-documentation/privacy-module/` controlled/final records, subject to exact-status reconciliation.
8. `docs/security/`, `docs/soc/`, `docs/phase19/`, `docs/insurance/`, and social-media evidence.

## 20.3 Official legal and regulatory references reviewed

1. [Republic Act No. 11967 — Internet Transactions Act of 2023](https://lawphil.net/statutes/repacts/ra2023/ra_11967_2023.html).
2. [DTI — Implementing Rules and Regulations of the Internet Transactions Act](https://ecommerce.dti.gov.ph/implementing-rules-and-regulations/).
3. [Republic Act No. 7394 — Consumer Act of the Philippines](https://lawphil.net/statutes/repacts/ra1992/ra_7394_1992.html).
4. [Republic Act No. 8792 — Electronic Commerce Act](https://www.lawphil.net/statutes/repacts/ra2000/ra_8792_2000.html).
5. [Republic Act No. 10173 — Data Privacy Act of 2012](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html).
6. [National Privacy Commission — DPA Implementing Rules and Regulations](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/).
7. [NPC — DPO and DPS registration reminder under Circular No. 2022-04](https://privacy.gov.ph/reminder-on-mandatory-data-protection-officer-and-data-processing-system-registration/).
8. [NPC — Breach reporting, DBNMS, and ASIR guidance](https://privacy.gov.ph/pips-and-pics/breach-reporting/).
9. [Republic Act No. 10175 — Cybercrime Prevention Act](https://lawphil.net/statutes/repacts/ra2012/ra_10175_2012.html).
10. [Republic Act No. 11127 — National Payment Systems Act](https://lawphil.net/statutes/repacts/ra2018/ra_11127_2018.html).
11. [BSP Manual of Regulations for Payment Systems](https://www.bsp.gov.ph/Regulations/Issuances/2024/1191.pdf).
12. [Republic Act No. 11765 — Financial Products and Services Consumer Protection Act](https://lawphil.net/statutes/repacts/ra2022/ra_11765_2022.html).
13. [Insurance Commission — Amended Insurance Code](https://www.insurance.gov.ph/amended-insurance-code-r-a-10607/).
14. [Insurance Commission Legal Opinion No. 2025-01 — digital platform licensing facts](https://www.insurance.gov.ph/wp-content/uploads/2025/01/IC-LO-No.-2025-01_Query-on-Applicability-of-Licensing-Requirements-for-Digital-Platform-Providers-in-the-Insurance-Sector_REPD.pdf).
15. [BIR RMC No. 38-2026 digest — online BIR Registration Seal](https://bir-cdn.bir.gov.ph/BIR/pdf/RMC%20No.%2038-2026%20Digest.pdf).

## 20.4 Final statement

RENTipid has a substantial, modular marketplace and security foundation, but the truthful governance position is not “everything is live.” Users and providers must follow state- and evidence-based transaction workflows; operators must remain within specialist roles; developers must preserve authorization, data, migration, and evidence controls; leadership must own risk and regulatory classification; and compliance reviewers must require current external proof rather than infer it from code or historical documentation.

This manual becomes suitable for controlled launch support only after the business, legal, tax, privacy, finance, security, and release owners complete the listed gates and approve a version tied to the actual production entity, configuration, providers, and release baseline.
