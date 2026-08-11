# RENTipid Complete Master Manual

Version: `1.1`  
Confidentiality: `RENTipid Internal`  
Repository: `C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid`  
Branch: `feature/soc-phase4-threat-response`  
Inspected HEAD: `5804d4cceafc74e5e51b554be6f84a1b9c80e8be`  
Generation date: `2026-07-31`  

## How to Use This Manual

This manual consolidates the 18 frozen registries and ten preliminary manuals.
Each chapter states the supported behavior or governance boundary and points to
the applicable evidence family. Current code establishes implementation;
accepted closure/freeze records establish phase status; external state is
never inferred from local definitions.

## Part I — Document Foundation and Product Context

### Chapter 1 — Manual Purpose and Scope

This manual supports Owner review, training, operations, engineering,
governance, and handover for every approved RENTipid module and phase. It
documents implemented, frozen, planned, limited, NO-GO, transitional, and
separately governed states without converting one status into another.
Evidence: document-control, module, phase, terminology, and gap registries.

### Chapter 2 — Product Identity and Business Mission

RENTipid is a role-based rental marketplace connecting renters with individual
and business providers while supporting trust, finance, compliance, support,
privacy, and security operations. Its business goal is a reviewable rental
lifecycle rather than an uncontrolled listing or payment channel. Evidence:
module and route registries.

### Chapter 3 — Documentation Audiences

Audiences are guests, renters, providers, business providers, Admin, Finance
Admin, Compliance Admin, SOC Analyst, SOC Supervisor, Super Admin, support,
developers, reviewers, and the Owner. Each audience follows its role-specific
manual; server authorization remains authoritative. Evidence: role and
documentation-traceability registries.

### Chapter 4 — Source-Authority Hierarchy

Current implementation and data contracts outrank manuals and plans; final
accepted/frozen governance controls phase status. Historical sources remain
traceable when superseded. Conflicts are recorded rather than silently erased.
Evidence: source-authority/conflict register.

### Chapter 5 — Completion Premise

`VERIFIED_WITH_STATUS_CLASSIFICATION` means every approved module and phase can
be documented honestly. Optional, placeholder, deferred, disabled, NO-GO, and
not-provisioned work may remain. Only an absent exact accepted requirement is
a premise blocker. Evidence: SOC placeholder reconciliation.

### Chapter 6 — Status Vocabulary

Route, capability, operational, and evidence statuses are separate dimensions.
Examples include `NAVIGATION_SHELL_ONLY`, `COMPLETE_AND_FROZEN`,
`PARTIALLY_SPLIT_IMPLEMENTATION`, and `EXTERNAL_STATE_NOT_VERIFIED`. Never infer
completion from a route, permission, model, test file, or Terraform resource.

### Chapter 7 — Authoritative Architecture Direction

The accepted direction is
`VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`: Vercel hosts the frontend
and authentication direction while Azure is the backend/services direction.
This is architecture authority, not evidence of provisioning or cutover.
Evidence: deployment/integration registries and Phase 19B status.

### Chapter 8 — Current Runtime Transition State

The repository state is `PARTIALLY_SPLIT_IMPLEMENTATION`. Root Next.js APIs
coexist with `apps/api` and `apps/worker` targets; individual handlers must be
classified as authoritative, compatibility/proxy, or target implementations
before change. Evidence: API, module, and deployment registries.

### Chapter 9 — External-State Boundary

Local code, domains, configuration names, Terraform, and readiness screens do
not prove current cloud resources, production health, database contents,
provider accounts, monitoring, traffic, or DNS. External verification requires
a separate authorized operation. No external system was accessed here.

### Chapter 10 — Separately Governed Decisions

Database migration is `PENDING_SEPARATE_OWNER_DECISION`; payment activation is
`NOT_AUTHORIZED`. Azure provisioning/deployment, traffic migration, DNS
cutover, and production data actions are not authorized by documentation.
Evidence: document control and phase/freeze register.

## Part II — Roles, Access, and Responsibility

### Chapter 11 — Role Model Overview

RENTipid separates public, marketplace, operational, finance, compliance, SOC,
and super-admin responsibilities. Server-side session, role, permission,
ownership, and state checks are the access boundary; navigation visibility is
only presentation. Evidence: role/permission and security-control registries.

### Chapter 12 — Guest Responsibilities

Guests may use public discovery, guidance, safety, legal, support, login, and
registration surfaces. They have no privileged dashboard, private marketplace,
finance, compliance, or SOC authority. Public inputs remain validated and
rate/security controls apply.

### Chapter 13 — Renter Responsibilities

Renters operate within their own booking, agreement, inspection, claim,
refund-request, receipt, and review scope. They cannot mutate provider,
finance, compliance, or SOC records. Ownership and booking state govern each
action. Evidence: renter routes and booking services.

### Chapter 14 — Individual Provider Responsibilities

Individual providers manage their listings, booking fulfillment, turnover,
return inspection, claims, ledger views, promotion opt-in, and payout views.
Publication, compliance decisions, and money movement remain separately
controlled. Evidence: provider route and workflow registries.

### Chapter 15 — Business Provider Responsibilities

Business providers use business-scoped listing and marketing surfaces while
remaining subject to organization verification and record ownership. Business
status does not grant Admin, Finance, Compliance, or SOC rights. Evidence:
role, route, and data registries.

### Chapter 16 — Admin Responsibilities

Admin manages allowed categories, bookings, disputes, support, feedback,
issues, beta/UAT, marketing, AI settings/logs, and operational dashboards.
General Admin does not implicitly inherit finance, compliance, or SOC
supervisor authority. Every mutation requires audit context.

### Chapter 17 — Finance Admin Responsibilities

Finance Admin reviews payment, webhook, gateway, reconciliation, ledger,
deposit, refund, payout, batch, and settlement evidence. The role does not
override Phase 19 NO-GO or permit unapproved live transfers. Evidence:
finance routes, payment services, and workflow registry.

### Chapter 18 — Compliance Admin Responsibilities

Compliance Admin reviews KYC, verification documents, listing requirements,
and applicable policy evidence using minimum-necessary access. The role does
not automatically approve financial or security-response actions. Evidence:
verification routes, models, and role registry.

### Chapter 19 — SOC Analyst Responsibilities

SOC Analysts investigate authorized events/alerts, manage cases and evidence,
draft playbooks, and request bounded responses. They cannot approve their own
request, execute/rollback outside assigned permissions, administer roles, or
make finance/compliance decisions. Evidence: Phase 4 RBAC tests.

### Chapter 20 — SOC Supervisor and Super Admin Responsibilities

SOC Supervisors review cases, playbooks, grants, execution, and rollback while
preserving separation of duties. Super Admin has broad platform visibility but
cannot bypass accepted dual-control constraints, live-payment NO-GO, or
separately governed infrastructure/database decisions.

## Part III — Identity, Profiles, KYC, and Account Lifecycle

### Chapter 21 — Registration Workflow

Registration validates supported user input and creates only permitted
non-privileged account types. Public users cannot self-select operational or
administrative roles. Failures return sanitized feedback without credential or
internal-detail leakage. Evidence: auth registration route and service.

### Chapter 22 — Authentication Workflow

NextAuth and root authentication services establish the session used by pages
and APIs. Authentication success does not itself authorize a business action;
role, ownership, permission, and state checks follow. Authentication telemetry
must remain privacy-safe.

### Chapter 23 — Session and Route Protection

Protected pages and APIs validate the server session and redirect or reject
unauthorized users. Proxy, page, route, and service checks must agree. Hidden
links and client-side conditions are not security controls. Evidence: auth,
proxy, and authorization tests.

### Chapter 24 — Privileged Role Assignment

Admin, Finance Admin, Compliance Admin, SOC roles, and Super Admin require a
controlled administrative process outside public registration. Assignment
must preserve least privilege, review, and audit evidence; documentation never
grants runtime authority.

### Chapter 25 — User Profile Read Surface

Authenticated users can view profile information within their account scope.
The current profile-edit control is marked coming soon, so the route is
`IMPLEMENTED_READ_ONLY_WITH_EDIT_LIMITATION`. Privacy correction is a separate
controlled workflow. Evidence: route and gap registries.

### Chapter 26 — Business Profile

Business-provider identity is represented separately from the individual user
record and supports business-scoped operations. Verification and ownership
must be established before business actions; model presence alone does not
prove a verified organization.

### Chapter 27 — KYC Submission

KYC routes allow an authenticated subject to provide required verification
evidence under upload, access, and privacy controls. Users should submit only
required data. Storage/provider availability is environment-dependent and is
not inferred from the route.

### Chapter 28 — Verification Document Review

Authorized compliance/admin services review verification documents and record
decisions without exposing raw content broadly. File type, MIME/content,
ownership, size, and permission controls apply. Audit evidence should use
sanitized identifiers rather than document contents.

### Chapter 29 — Privacy Requests

Consent, correction, export, and deletion endpoints form authorized privacy
workflows. Identity, subject scope, retention, and audit requirements apply;
requests must not expose unrelated records. Evidence: `/api/privacy/*` and
privacy services.

### Chapter 30 — Account Deletion

Account deletion is a controlled request lifecycle, not an immediate
unreviewed database delete. It must account for identity, retention, legal or
transaction obligations, auditability, and safe completion/error reporting.
Evidence: account-deletion page/model and privacy services.

## Part IV — Public Marketplace and Discovery

### Chapter 31 — Public Landing Experience

The root route introduces RENTipid and directs visitors toward discovery,
guidance, authentication, and support. It is a public presentation surface and
does not establish availability, verification, payment activation, or external
provider state.

### Chapter 32 — Browse Experience

`/browse` exposes marketplace discovery subject to current listing state and
server queries. Users should treat displayed results as discovery data, not a
guarantee of future availability or transaction authorization.

### Chapter 33 — Search and Filter Behavior

Search/filter inputs narrow visible listings and must be validated and safely
encoded. Filters do not bypass publication, verification, ownership, or
availability rules. Exact query behavior is governed by current listing
services.

### Chapter 34 — Listing Detail

`/listing/[id]` presents an individual listing and its permitted public data.
The dynamic identifier must resolve to an accessible listing; restricted,
unpublished, or absent records must fail safely without leaking private
provider information.

### Chapter 35 — Categories and Requirements

Categories and category requirements organize marketplace inventory and may
drive listing evidence expectations. Authorized administrators control them;
providers consume the current requirements during listing preparation.
Evidence: Category and CategoryRequirement models and admin routes.

### Chapter 36 — Availability and Pricing Presentation

Displayed availability and pricing are inputs to the guarded booking/checkout
workflow, not an irrevocable promise. The server revalidates record state,
dates, amounts, and conflicts before accepting a permitted transaction.

### Chapter 37 — Safety Guidance

Public safety guidance supports careful item, identity, handover, inspection,
and dispute behavior. It complements but does not replace server controls,
verification, evidence capture, or support escalation.

### Chapter 38 — Prohibited Items

The prohibited-items surface states marketplace policy boundaries. Providers
remain responsible for compliant listings, and authorized review may prevent
publication or require action. A listing route does not override policy.

### Chapter 39 — Help, Contact, and Support Entry

Help, contact, feedback, and support routes direct users to controlled
assistance. Reports should include safe identifiers and reproducible facts,
not passwords, tokens, raw KYC records, or payment credentials.

### Chapter 40 — Legal and Privacy Notices

Terms, privacy, and related public pages communicate the applicable user-facing
policy. Technical documentation does not replace legal review. Policy changes
must follow document ownership, acceptance, and implementation alignment.

## Part V — Provider Catalog and Listing Lifecycle

### Chapter 41 — Provider Onboarding

Provider onboarding and checklist routes guide account, profile, verification,
and readiness tasks. Completion labels summarize evidence; server state and
required review remain authoritative. Business and individual scope must not
be mixed.

### Chapter 42 — Listing Creation

Providers create listings within their own scope using validated catalog,
description, pricing, and policy fields. Creation does not equal publication;
the listing enters the service-defined lifecycle and may require evidence or
review.

### Chapter 43 — Listing Photos

Photo upload routes associate authorized media with a provider-owned listing.
Upload controls cover size, extension/MIME/content, ownership, and safe storage
behavior. Public access depends on listing and media state.

### Chapter 44 — Listing Documents

Listing documents support category, compliance, or verification requirements
and are more restricted than public listing content. Authorization, upload
validation, storage safety, and review evidence apply.

### Chapter 45 — Category Requirement Fulfillment

Providers match current category requirements before submission. Missing or
invalid evidence prevents a compliant transition. Administrators must change
requirements through authorized configuration rather than editing provider
records directly.

### Chapter 46 — Listing Edit and Ownership

Only the owning provider or explicitly authorized operator may alter a
listing, and only in service-allowed states. Edits must preserve validation,
publication/review invariants, related media, and audit behavior.

### Chapter 47 — Listing Submission

Submission moves a prepared listing toward review/publication under exact
service guards. The API must revalidate completeness and ownership. A submit
button cannot create a state transition the server rejects.

### Chapter 48 — Listing Verification and Publication

Authorized admin/compliance operations verify or publish according to current
requirements. Decisions should be reasoned and auditable. Verification does
not grant provider, finance, or unrelated administrative authority.

### Chapter 49 — Listing Promotion

Provider/business promotion surfaces and opt-in records support controlled
marketing participation. Promotion assets or routes do not prove external
publication, provider connection, or campaign performance.

### Chapter 50 — Provider Marketing Limitation

The provider marketing surface includes entry/navigation behavior, while
campaign analytics is explicitly coming soon. It is
`IMPLEMENTED_WITH_PARTIAL_LIMITATION`; documentation must not claim completed
provider analytics. Evidence: route and GAP-005.

## Part VI — Booking and Rental Initiation

### Chapter 51 — Booking Request

An authenticated renter requests a booking for an eligible listing and date
range. The server validates identity, listing state, ownership conflict,
availability, and required transaction inputs before creating a record.

### Chapter 52 — Booking Input Validation

Booking routes/services validate identifiers, dates, amounts, roles, and
state. Invalid or unauthorized requests fail with sanitized outcomes and must
not leak another user's booking or provider data.

### Chapter 53 — Booking State Authority

The Booking model, status history, and current service transition guards are
the state authority. UI labels summarize state but cannot introduce a
transition. History preserves who changed state, when, and why where supported.

### Chapter 54 — Provider Booking Review

Providers review only bookings for their listings and perform allowed
acceptance/fulfillment actions. Review does not bypass agreement, inspection,
payment, claim, or policy requirements.

### Chapter 55 — Renter Booking Dashboard

Renter booking list/detail routes show own-scope status, agreement,
inspection, claim, refund, and receipt navigation. Dynamic identifiers remain
ownership-checked on the server.

### Chapter 56 — Provider Booking Dashboard

Provider booking routes present fulfillment tasks for provider-owned
listings. Actions such as turnover, return inspection, and claim response are
available only in compatible service states.

### Chapter 57 — Booking Price and Amount Integrity

Amounts and currency must be revalidated at the trusted service/payment
boundary and recorded consistently across booking, payment, gateway, and
ledger evidence. Client-displayed totals are not mutation authority.

### Chapter 58 — Availability Conflict Handling

Concurrent or overlapping requests must be resolved by the authoritative
booking/availability logic. A conflict returns a safe failure and should not
create duplicate reservations or payment actions.

### Chapter 59 — Booking Cancellation

Cancellation is allowed only for roles and states defined by current services
and policy. It must preserve status history, related financial/claim effects,
notifications, and audit reasoning.

### Chapter 60 — Booking Notifications

Notifications communicate state changes to relevant participants without
granting action rights. Delivery/provider state may vary; stored state remains
authoritative if a notification is delayed or unavailable.

### Chapter 61 — Booking History and Audit

BookingStatusHistory and related audit evidence support investigation of the
rental lifecycle. Logs should record safe identifiers, actor, transition, and
result without credentials or unnecessary private content.

### Chapter 62 — Booking Failure and Recovery

On a failed booking mutation, preserve the prior valid state, return a
sanitized error, avoid duplicate retries through idempotent design where
applicable, and direct the user to safe retry or support. Financial side
effects require reconciliation before recovery.

## Part VII — Agreements, Turnover, and Inspections

### Chapter 63 — Rental Agreement Purpose

The rental agreement records participant commitments tied to an authorized
booking. It is not a free-standing public document: access follows booking
ownership/role and the service-defined lifecycle. Evidence: RentalAgreement
model and booking agreement routes.

### Chapter 64 — Provider Agreement Action

Provider agreement actions are limited to the provider's booking scope and
compatible booking state. The service validates actor, record, and transition;
the UI cannot manufacture agreement acceptance.

### Chapter 65 — Renter Agreement Review

Renters review the agreement associated with their booking and complete only
their assigned confirmation. Failure or disagreement should preserve the
record and move through support/dispute policy rather than an out-of-band edit.

### Chapter 66 — Agreement State Integrity

Agreement and booking state must remain consistent across participant actions.
Concurrent updates require safe conflict handling, and audit/history evidence
must identify the effective transition without exposing private content.

### Chapter 67 — Turnover Preparation

Providers use the turnover route to prepare handoff evidence for an eligible
booking. Confirm identity, item, booking state, expected condition, and minimum
necessary evidence before completion.

### Chapter 68 — Turnover Record

TurnoverRecord preserves handoff facts linked to the booking. Access is
participant/operator scoped, and uploaded evidence follows the inspection and
upload controls. A record must not contain credentials or unrelated personal
data.

### Chapter 69 — Initial Inspection

Renter/provider inspection routes capture permitted condition evidence at the
appropriate lifecycle point. InspectionReport and InspectionPhoto records are
authorization-bound and support later claim/dispute review.

### Chapter 70 — Renter Inspection Confirmation

Renter confirmation is an explicit state action, not an assumption from page
viewing. The service validates booking ownership, inspection existence, and
current state before recording confirmation.

### Chapter 71 — Return Inspection

The provider return-inspection route records post-rental condition evidence
for an eligible booking. Differences must be described factually and may feed
claim/dispute review; the route does not adjudicate liability by itself.

### Chapter 72 — Inspection Failure and Evidence Safety

Upload or state failures must leave prior valid evidence intact and provide a
sanitized recovery path. Preserve identifiers, timestamps, and safe metadata;
avoid duplicate photos, unsupported file types, and unnecessary private data.

## Part VIII — Claims, Deposits, Disputes, and Trust

### Chapter 73 — Damage Claim Initiation

An eligible participant starts a damage claim against a booking using the
authorized route and minimum necessary evidence. The server validates actor,
booking relationship, claim window/state, and input. Evidence: DamageClaim and
DamageClaimPhoto models.

### Chapter 74 — Claim Evidence

Claim photos and descriptions document alleged condition differences; they do
not automatically prove liability. File safety, ownership, privacy, and audit
rules apply, and reviewers should avoid copying raw media into general logs.

### Chapter 75 — Claim Response

The claim-response API permits the assigned participant/operator response in
an allowed state. It records the response without bypassing dispute, deposit,
refund, or finance authority.

### Chapter 76 — Dispute Case Creation

DisputeCase records organize contested rental facts for human review. A claim,
payment mismatch, inspection difference, or support escalation may supply
evidence, but the dispute lifecycle remains separately authorized.

### Chapter 77 — Dispute Review

Authorized administrators review participant scope, booking history,
agreement, inspections, claims, communications, and relevant financial
evidence. Decisions must be reasoned, sanitized, and auditable.

### Chapter 78 — Dispute Resolution

`/api/admin/disputes/[id]/resolve` performs a controlled resolution transition.
Resolution does not automatically authorize a gateway transaction, payout, or
refund; finance effects follow their own controls.

### Chapter 79 — Deposit Actions

DepositAction records support controlled deposit decisions tied to the rental
and dispute evidence. Exact policy, role, amount, currency, and state must be
verified before any permitted action.

### Chapter 80 — Reviews and Trust Signals

Reviews support marketplace trust after an eligible rental state. Ownership,
participation, timing, and content controls should prevent unrelated or unsafe
submissions. Reviews do not replace formal claims or disputes.

### Chapter 81 — Notifications in Trust Workflows

Notifications inform participants about claim, dispute, deposit, or review
state. They are not the record of authority; stored service state and audit
history control when delivery is delayed or fails.

### Chapter 82 — Claims and Dispute Recovery

On conflicts or partial failures, stop duplicate mutations, preserve all prior
evidence, reconcile related booking/payment state, and escalate to authorized
review. Recovery must not erase contested history or fabricate a financial
correction.

## Part IX — Checkout, Payments, and Provider Events

### Chapter 83 — Checkout Entry

`/checkout/[bookingId]` is a guarded transaction surface linked to an
authorized booking. The server revalidates session, ownership, booking state,
amount, currency, provider mode, and payment policy before any allowed step.

### Chapter 84 — Payment Model

Payment records represent application payment state; GatewayTransaction and
webhook/reconciliation records provide provider evidence. No single UI status
or provider callback is sufficient to establish final financial truth.

### Chapter 85 — Payment Provider Modes

Repository configuration supports guarded mock/sandbox/readiness/live-mode
concepts. Variable names document the contract only. Phase 19 NO-GO controls
activation regardless of code presence or dashboard readiness.

### Chapter 86 — PayMongo Request Safety

Permitted provider requests must use server-held credentials, trusted amount
and currency, safe idempotency, and sanitized error handling. Documentation
does not contain provider secret values or authorize live requests.

### Chapter 87 — Webhook Reception

`/api/webhooks/paymongo` receives provider events under signature, payload,
event identity, and replay controls. Receipt does not equal accepted mutation;
the handler validates compatibility and records safe processing evidence.

### Chapter 88 — Webhook Signature Verification

Signature verification uses configured secret material without logging or
returning it. Invalid, malformed, duplicate, or unsupported events fail safely
and remain available for authorized investigation.

### Chapter 89 — Webhook Idempotency

Provider event identity and current financial state prevent duplicate effects.
Retries should converge on the recorded result rather than create repeated
payments, refunds, ledger entries, or notifications.

### Chapter 90 — Amount and Currency Integrity

Trusted server values must match gateway and booking evidence exactly. Amount
or currency mismatches are recorded for reconciliation and must not be rounded,
silently corrected, or accepted from the client.

### Chapter 91 — Payment Reconciliation

Reconciliation compares booking/payment, gateway transaction, webhook, action,
and ledger evidence. Operators classify matches and mismatches, preserve a
sanitized reason, and escalate unresolved differences.

### Chapter 92 — Payment Audit Trail

PaymentWebhookLog, PaymentActionLog, and PaymentReconciliationLog preserve
safe financial evidence. Logs exclude signatures, keys, authorization headers,
full credentials, and unnecessary personal data.

### Chapter 93 — Payment Failure Handling

On provider, validation, or persistence failure, avoid duplicate attempts,
preserve the last reliable state, and reconcile before a permitted retry.
User-facing errors remain sanitized; internal evidence remains access-controlled.

### Chapter 94 — Phase 19 NO-GO Boundary

`PHASE19_COMPLETE_NO_GO_FROZEN` is an accepted operational prohibition.
Checkout code, training pages, smoke-test/readiness routes, or provider
configuration names cannot authorize live payment activation.
`PAYMENT_ACTIVATION: NOT_AUTHORIZED`.

## Part X — Finance, Refunds, Payouts, and Settlement

### Chapter 95 — Finance Dashboard

Finance dashboards summarize permitted gateway, reconciliation, refund,
payout, deposit, and settlement evidence for Finance Admin. Counts and status
cards are read surfaces and do not themselves authorize financial mutation.

### Chapter 96 — Finance Ledger

FinanceLedger records support consistent accounting evidence tied to business
transactions. Entries must preserve amount/currency precision, source
references, and authorized creation; direct ad hoc correction is unsafe.

### Chapter 97 — Refund Request

Renter refund requests capture a request and reason within an eligible booking
state. Submission is not approval or gateway execution. Finance review checks
booking, payment, dispute, and policy evidence.

### Chapter 98 — Refund Review

Authorized finance operators classify the request, validate amount/currency
and prior provider evidence, and record a reason. Readiness/SOP routes train or
guide review but do not enable live processing.

### Chapter 99 — Provider Payout

ProviderPayout records represent payout state for an eligible provider and
settled business basis. Provider dashboard visibility is read-only with respect
to authorization of money movement.

### Chapter 100 — Payout Batch

PayoutBatch groups controlled payout work for finance review and evidence.
Batch presence does not mean provider transmission occurred; exact state,
approval, and external result must be verified.

### Chapter 101 — Payout Statements

Payout statement routes present provider-scoped evidence for a payout record.
Access checks prevent cross-provider disclosure. A statement reflects stored
state and is not proof of external settlement.

### Chapter 102 — Settlement Review

Settlement surfaces compare internal ledger/payment/payout evidence with the
available gateway state. Unmatched items remain unresolved and require
reconciliation rather than forced completion.

### Chapter 103 — Finance Separation of Duties

Finance authority remains separate from Admin, Compliance, SOC, provider, and
renter roles. A dispute or SOC incident may provide evidence but cannot alone
approve a refund, payout, deposit, or settlement action.

### Chapter 104 — Finance Failure and Escalation

Stop on signature failure, amount/currency mismatch, duplicate event,
unreconciled state, permission failure, or NO-GO conflict. Preserve sanitized
evidence and escalate; never manufacture a live compensating transaction.

## Part XI — Administration, Compliance, Support, and Release

### Chapter 105 — Admin Dashboard Scope

The Admin dashboard aggregates authorized platform operations. Each child
route retains its own permission and service rules; broad dashboard access is
not universal mutation authority.

### Chapter 106 — Category Administration

Authorized category changes affect provider requirements and discovery.
Operators validate naming, policy, dependencies, and impact on existing
listings, and retain audit evidence for mutations.

### Chapter 107 — Booking Administration

Admin booking views support oversight and exception handling within current
permissions. Operators must preserve participant rights, state history, and
finance/compliance boundaries rather than directly forcing incompatible state.

### Chapter 108 — Compliance Listing Review

Compliance listing routes review listing evidence against category and policy
requirements. Approval/publishing uses exact authorized transitions and
sanitized reasons; provider ownership remains intact.

### Chapter 109 — KYC Administration

Verification review restricts document access to authorized roles and minimum
necessary evidence. Decisions are auditable and do not expose raw documents in
general admin or support logs.

### Chapter 110 — Support Ticket Operations

SupportTicket routes organize user problems with safe identifiers, status, and
assigned follow-up. Support does not grant direct database, finance, compliance,
or SOC override authority.

### Chapter 111 — Feedback and Issue Management

BetaFeedback and IssueTicket records capture product evidence separate from
production incident/security cases. Classify severity and ownership, avoid
secret/personal content, and link a controlled change when required.

### Chapter 112 — UAT Operations

UATFlow routes record controlled user-acceptance evidence. A UAT pass applies
to its exact build, environment, and scope; it does not prove production
deployment, external services, or later dirty edits.

### Chapter 113 — Beta and Release Readiness

Invitations, beta controls, readiness dashboards, and release versions support
staged governance. `READY` is scoped prerequisite evidence, not deployment or
general availability authority.

### Chapter 114 — Admin Reports Limitation

`/dashboard/admin/reports` contains implemented aggregates but placeholder CSV
export and some AI prompt metrics. The super-admin report route delegates and
inherits the limitation. Status:
`IMPLEMENTED_METRICS_WITH_PLACEHOLDER_EXPORTS`.

## Part XII — Privacy, Audit, Support, and Data Rights

### Chapter 115 — Privacy Principles

RENTipid documentation applies data minimization, purpose limitation,
role/subject scope, retention awareness, safe evidence, and sanitization.
Implementation evidence includes privacy services, audit stores, crypto/profile
controls, and accepted Level 5 records.

### Chapter 116 — Consent Workflow

`/api/privacy/consent` records an authenticated subject's permitted consent
state. The service validates the subject and request; consent records do not
grant access to unrelated data or override legal retention.

### Chapter 117 — Correction Workflow

`/api/privacy/correction` provides a controlled correction request path where
direct profile editing is limited or inappropriate. Identity, field scope,
review, audit, and safe response rules apply.

### Chapter 118 — Data Export Workflow

`/api/privacy/export` prepares authorized subject data under identity,
scope, minimization, and secure-delivery controls. Export content must exclude
other subjects, secrets, internal credentials, and unauthorized security data.

### Chapter 119 — Deletion Workflow

Deletion requests use controlled state, retention checks, and audit evidence.
Required transaction, security, legal, or dispute records may have separate
retention treatment; deletion must not corrupt referential/business integrity.

### Chapter 120 — AuditLog

AuditLog records authorized application/operator actions using safe actor,
subject, operation, result, and reason metadata. It must not become a store for
credentials, raw documents, or unbounded payloads.

### Chapter 121 — Authentication and API Security Logs

AuthenticationSecurityLog and ApiSecurityLog preserve bounded identity/API
security evidence. Access is privileged and outputs remain sanitized so logs
do not amplify an incident or privacy exposure.

### Chapter 122 — AI and System Error Logs

AIBotLog records AI policy/action evidence, while SystemErrorLog records
failures. Prompts, stack details, and provider errors require sanitization;
secrets and prohibited personal data are excluded.

### Chapter 123 — Support Privacy Handling

Support staff request the minimum diagnostic facts and use stable record IDs
rather than copying full KYC, payment, or security artifacts. Suspected
security/privacy events are escalated to the correct controlled workflow.

### Chapter 124 — Privacy Failure and Recovery

On an unauthorized, incomplete, or failed privacy action, preserve prior valid
state, record a safe outcome, prevent cross-subject disclosure, and escalate
through privacy/security review. Do not bypass retention or authorization for
speed.

## Part XIII — Marketing, Social, Mobile, and Public Communication

### Chapter 125 — Marketing Domain

MarketingCampaign, MarketingPost, CampaignApproval, PromotionAsset, UTMLink,
CampaignAnalytics, ProviderPromotionOptIn, and SocialPostQueue represent the
current marketing/social domain. Model presence describes data capability, not
external account activation or publication.

### Chapter 126 — Campaign Creation

Authorized admin/provider workflows create campaign intent, content, audience,
timing, and related assets within their scope. Inputs require validation and
must not include provider credentials or unapproved personal data.

### Chapter 127 — Campaign Approval

CampaignApproval separates drafting from review/publication authority where
implemented. Review considers content, ownership, platform policy, and external
provider readiness; approval in RENTipid is not proof of external publication.

### Chapter 128 — Social Accounts

SocialAccount records represent connection/configuration state without
documenting secret values. Users should never expose provider tokens in pages,
logs, support records, or documentation. External validity remains unverified.

### Chapter 129 — Social Post Queue

SocialPostQueue supports controlled scheduling/state for intended publication.
Retries must avoid duplicate posts and preserve provider error evidence in
sanitized form. Queue state is not external-post proof.

### Chapter 130 — Promotion Assets and UTM Links

PromotionAsset and UTMLink records support attributable campaign content.
Links and public assets require safe construction, ownership, and policy review;
analytics availability depends on implemented/provider data.

### Chapter 131 — Campaign Analytics Limitation

Analytics models/surfaces may hold supported data, but provider-facing campaign
analytics is marked coming soon. Documentation must not describe a complete
provider analytics product without new implementation/evidence.

### Chapter 132 — Launch Announcements

Launch-announcement and readiness routes support controlled communication
planning. A drafted announcement does not authorize production release,
payment activation, provider publication, or DNS change.

### Chapter 133 — PWA Architecture

Manifest and service-worker/PWA tooling support installable web behavior where
the current runtime/browser permits. Packaging does not prove offline coverage,
store distribution, or production deployment. Evidence: PWA configuration and
install route.

### Chapter 134 — Capacitor and Mobile Readiness

Capacitor configuration and mobile-readiness/analytics routes support packaging
and readiness evidence. App-store publication and current mobile-provider state
are external and not proven. Evidence: mobile/PWA registry entries and GAP-012.

## Part XIV — AI Assistant and Digital-Human Boundaries

### Chapter 135 — AI Capability Scope

`src/lib/ai`, the AI API, components, settings, and extracted API service
support guarded advisory/generation behavior in configured modes. AI cannot
make prohibited financial, compliance, security-response, or privileged access
decisions.

### Chapter 136 — AI Chat Route

`/api/ai/chat` validates the authenticated/request context and applies the
current AI policy/provider mode. User-facing errors remain sanitized; prompts
must not be used to transmit secrets, raw KYC records, or payment credentials.

### Chapter 137 — AI Provider Modes

AI behavior may be mock, disabled, or provider-backed according to current
configuration. Environment-variable names and packages do not prove Azure
OpenAI deployment, credentials, model availability, or production use.

### Chapter 138 — AI Settings

Admin/super-admin settings surfaces expose only authorized application policy
controls. A configuration screen cannot bypass server guardrails or establish
an external provider resource. Changes require audit and safe defaults.

### Chapter 139 — AI Logs

AIBotLog supports review of safe AI actions, policy decisions, and outcomes.
Logs must avoid full secrets, authorization data, unnecessary personal content,
and unsafe prompt/response retention.

### Chapter 140 — AI Decision Boundaries

AI output is advisory or generative within the accepted policy. Human and
service authorization control listing, KYC, payment, dispute, SOC response,
role, deletion, and deployment decisions.

### Chapter 141 — Digital-Human Presentation Boundary

The documentation contract uses “digital human” as a potential presentation
layer over the guarded AI/support interface. The evidence layer does not prove
a standalone avatar, voice, biometric, or autonomous-agent runtime; those
capabilities remain unclaimed.

### Chapter 142 — AI Tool Gateway

Any AI-invoked tool must pass an explicit allowlist, authenticated actor,
validated input, least privilege, audit, and deterministic service guard. The
current evidence does not authorize AI to call finance, compliance, SOC
execution, database, cloud, or deployment tools autonomously.

### Chapter 143 — AI Support-Case Handoff

AI may assist with safe guidance or summarization where implemented, but a
support issue requiring state change is handed to the authorized support,
admin, finance, compliance, privacy, or SOC workflow. Human ownership and
stored service state remain authoritative.

### Chapter 144 — AI Failure and Recovery

On provider failure, unsafe output, or policy rejection, fail closed for
prohibited actions, return a sanitized message, preserve safe audit evidence,
and offer a non-AI support path. Never expose provider keys or raw internal
errors.

## Part XV — Data Model and Ownership

### Chapter 145 — Schema Authority

`prisma/schema.prisma` is the documented data-contract authority with 79
models and 29 enums. No database was queried. A model proves a repository
contract, not production rows, migration completion, or deployment.

### Chapter 146 — Identity Data Domain

User, UserMfa, UserProfile, BusinessProfile, and AccountDeletionRequest hold
identity/account-lifecycle state. Access is subject/role scoped and protected
fields follow crypto/privacy controls.

### Chapter 147 — Catalog Data Domain

Category, CategoryRequirement, Listing, ListingPhoto, and ListingDocument
represent the catalog. Providers own listing preparation; admin/compliance
controls publication and verification according to service state.

### Chapter 148 — Rental and Trust Data Domain

Booking, status history, agreements, inspections, turnover, claims, disputes,
deposit actions, reviews, and notifications form the rental/trust graph.
Participant scope and operator permissions govern access.

### Chapter 149 — Verification Data Domain

VerificationDocument represents restricted user evidence reviewed by
authorized compliance operations. Storage, encryption/protection, retention,
and access policies apply; raw contents are not documentation evidence.

### Chapter 150 — Finance Data Domain

Payment, gateway, webhook, reconciliation, action, ledger, refund, payout, and
batch records form a controlled financial evidence chain. AI and SOC cannot
autonomously mutate financial authority.

### Chapter 151 — Platform and Audit Data Domain

AuditLog, ApiSecurityLog, AIBotLog, SystemSetting/SystemSettings,
AuthenticationSecurityLog, and SystemErrorLog support governed platform
evidence. Payloads must remain bounded and sanitized.

### Chapter 152 — Marketing and Release Data Domain

Social/marketing models plus release, mobile, beta, feedback, issue, support,
and UAT models support communication and rollout workflows. External provider
and release state are not inferred from records alone.

### Chapter 153 — SOC Telemetry Data Domain

SecurityEvent, ingestion failure/checkpoint, DetectionRule, SecurityAlert,
evidence, evaluation log, and detection checkpoint models support privacy-safe
event-to-alert processing with lifecycle/environment separation.

### Chapter 154 — SOC Case and Response Data Domain

Incident case/history/note/evidence/link and playbook/step/approval/grant/
execution/action models preserve the controlled investigation and reversible
response lifecycle. Server RBAC and separation of duties govern mutations.

### Chapter 155 — Intelligence and Geolocation Data Domain

BehavioralRiskAssessment, signals, evidence links, and geo-enrichment records
support read-oriented investigation. Privacy-safe correlation/IP handling and
authorized handoff boundaries apply.

### Chapter 156 — Data Migration Boundary

Schema and migration artifacts do not prove production migration. No database
was connected or modified during documentation.
`DATABASE_MIGRATION: PENDING_SEPARATE_OWNER_DECISION`.

## Part XVI — API, Services, Integrations, and Errors

### Chapter 157 — Root API Inventory

The root Next.js application contains 65 API route files across admin, AI,
auth, bookings, documents, finance, listings, payments, privacy, SOC, and
webhooks. Route presence does not grant production or mutation authority.

### Chapter 158 — Authentication APIs

`/api/auth/[...nextauth]` and `/api/auth/register` establish session and
registration behavior. Inputs, privileged-role restrictions, error
sanitization, and authentication telemetry are part of their contract.

### Chapter 159 — Marketplace APIs

Booking, document, listing, finance-upload, and payment routes validate
session, role, ownership, input, and state. Transitional wrappers require
classification against the extracted API before maintenance.

### Chapter 160 — Privacy APIs

Consent, correction, deletion, and export routes operate only for an
authorized subject and policy scope. Responses must not expose other users,
internal storage details, or secret configuration.

### Chapter 161 — SOC Case APIs

Admin SOC case list/detail and assignment/evidence/notes/status child routes
implement Gate 4F case operations. Exact permissions, case state, safe evidence,
and audit history govern each mutation.

### Chapter 162 — SOC Playbook APIs

Playbook list/detail, draft, version, review, activation, and step operations
implement the versioned Gate 4G lifecycle. Active versions require accepted
review; concurrent/stale edits must fail safely.

### Chapter 163 — SOC Approval APIs

Approval request, submit, decision, cancel, revoke, and list/detail routes
maintain requester/approver separation, time-bound scope, grant state, and
auditable outcomes.

### Chapter 164 — SOC Response APIs

Response list/detail, execute, and rollback routes expose accepted reversible
Gate 4H behavior. Execution consumes valid approval, enforces freeze/scope/
idempotency/concurrency, and records sanitized results.

### Chapter 165 — Dashboard and Intelligence APIs

SOC dashboard, behavioral-risk latest/history/detail, and threat-map routes
are authorized read surfaces. Test/simulation lifecycle, privacy-safe details,
and technical-detail permissions constrain output.

### Chapter 166 — Extracted API and Worker

`apps/api` and `apps/worker` are current target implementations for Azure
backend/services. Their existence does not prove provisioning, release, job
schedule, connectivity, or traffic. Root and extracted boundaries coexist.

### Chapter 167 — External Integrations

Vercel, Azure Container Apps/PostgreSQL/Blob/Key Vault/monitoring/OpenAI/Search,
PayMongo, NextAuth, MaxMind, social providers, Capacitor, SMTP, and CI have
documented repository evidence with distinct active/target/dependent statuses.

### Chapter 168 — API Error and Recovery Contract

APIs validate early, return stable sanitized outcomes, preserve last valid
state, and record authorized evidence. Retries must respect idempotency and
cannot fabricate duplicate financial, booking, privacy, or SOC-response
effects.

## Part XVII — Security, Cryptography, and Control Framework

### Chapter 169 — Authentication and Authorization Controls

NextAuth/session handling plus page/API/service guards implement identity and
authorization. Server checks are authoritative; public registration cannot
grant privileged roles, and proxy/route/session rules must agree.

### Chapter 170 — Least Privilege

Marketplace ownership, finance/compliance separation, and SOC Analyst/
Supervisor permission matrices restrict access to the minimum required scope.
Broad roles cannot bypass accepted dual-control constraints.

### Chapter 171 — Input Validation

Zod/domain validators and service guards reject malformed identifiers,
unsupported transitions, unsafe values, and unauthorized scope before
mutation. Safe validation outcomes avoid internal-detail leakage.

### Chapter 172 — Upload Security

Upload controls validate extension, MIME, magic/content, size, ownership, and
purpose for listing, verification, inspection, and claim evidence. Storage
errors fail safely; raw private documents remain restricted.

### Chapter 173 — Cryptographic Protection

Accepted Level 5 evidence covers encryption envelopes, key-provider concepts,
blind indexes, profile protection/rotation, and MFA encryption. Variable/key
names may be documented; values and retired key material may not.

### Chapter 174 — MFA and Step-Up

MFA/session evidence and UserMfa support stronger identity controls where the
accepted implementation applies. Step-up does not replace role, ownership,
state, approval, or separation-of-duties checks.

### Chapter 175 — Audit Sanitization

Audit, security, AI, system, payment, and SOC records use bounded safe metadata
and stable failure codes. Passwords, tokens, private keys, authorization
headers, connection strings, and raw protected evidence are excluded.

### Chapter 176 — Payment Security

Signature validation, exact amount/currency checks, idempotency,
reconciliation, role separation, and live-mode controls protect payment flows.
Phase 19 NO-GO remains the operative activation boundary.

### Chapter 177 — Database Safety

Test-database guards and explicit mutation/restore-target controls prevent
accidental production operations. These safeguards are not deployment
switches. Documentation does not connect to or change a database.

### Chapter 178 — Cloud Identity and Supply Chain

Managed-identity, Key Vault, storage RBAC, lockfiles, and CI/dependency evidence
describe intended controls. Local definitions do not prove assigned roles,
resource health, provider credentials, or deployed artifacts.

## Part XVIII — SOC Telemetry, Detection, Alerts, and Intelligence

### Chapter 179 — Security Event Sources

Supported adapters cover authentication, audit, API, AI, system errors,
payments, verification, bookings, claims, disputes, inspections, and settings
as registered. Source compatibility is validated before normalization.

### Chapter 180 — Event Normalization

Writers/adapters create bounded SecurityEvent records with source, domain,
classification, severity, lifecycle, environment, processing state, and
privacy-safe summary/correlation fields.

### Chapter 181 — Lifecycle and Environment Separation

`LIVE`, `TEST`, and `SIMULATION` evidence is classified explicitly. Simulation
and test data are excluded from operational views by default unless an
authorized query intentionally includes them.

### Chapter 182 — Event Idempotency and Deduplication

Source identities and configured deduplication prevent repeated ingestion and
alert amplification. Retries converge on valid event/checkpoint state and
record failures rather than silently duplicating evidence.

### Chapter 183 — Ingestion Failure Recording

SecurityEventIngestionFailure preserves safe processing context for recovery.
It excludes secret/raw payload leakage and links to bounded retry/checkpoint
logic so operators can distinguish recoverable from incompatible sources.

### Chapter 184 — Detection Rule Lifecycle

Detection rules progress through controlled draft/initialize/update/activate/
archive states. Validation of rule definition, creator type, lifecycle, and
authorization precedes evaluation.

### Chapter 185 — Detection Evaluation

The evaluator applies the supported rule contract deterministically to
compatible events and records RuleEvaluationLog outcomes. Unsupported or
invalid rules fail safely rather than creating unreviewable alerts.

### Chapter 186 — Alert Creation and Deduplication

Eligible rule outcomes create/reuse SecurityAlert according to configured
deduplication/correlation. Alert evidence links remain bounded and privacy-safe;
severity and confidence support review rather than autonomous punishment.

### Chapter 187 — Alert Review

Authorized SOC users review alert status, evidence, source context, lifecycle,
and related events. Review may lead to dismissal, monitoring, or incident-case
creation under exact service rules.

### Chapter 188 — Behavioral Risk Intelligence

Behavioral risk assessments, signals, evidence links, and latest/history/detail
APIs support investigation and handoff. The capability is read-oriented and
does not autonomously block accounts, transfer money, or decide compliance.

### Chapter 189 — Threat Map and Geolocation

Threat-map output uses privacy-safe geo-enrichment and provider modes such as
disabled, fixture, or database-backed where configured. Raw/private IP
handling and HMAC/correlation controls apply; provider availability is not
inferred.

### Chapter 190 — SOC Dashboard

The command center presents authorized KPIs, event/alert feeds, response
summaries, lifecycle filters, simulation visibility, and intelligence links.
It is a read/coordination surface; service APIs and permissions control
mutations.

## Part XIX — SOC Incident Cases, Evidence, Playbooks, and Approvals

### Chapter 191 — Incident Case Creation

Authorized SOC users create IncidentCase records from alerts, investigations,
or qualified manual context under Gate 4F rules. Origin, severity, actor, and
initial reason are recorded without copying raw credentials or unbounded event
payloads.

### Chapter 192 — Case Triage

Triage confirms environment/lifecycle, severity, scope, ownership, related
alerts/events, and immediate safety needs. The triager may adjust only allowed
fields and preserves history for every state change.

### Chapter 193 — Case Assignment

Assignment/reassignment APIs enforce case permission, target eligibility, and
current state. Assignment establishes work ownership but does not grant
response execution, finance, compliance, or role-administration authority.

### Chapter 194 — Case Notes

Case notes record sanitized analysis, decisions, and follow-up using the
supported note type. They must not contain tokens, credentials, raw KYC,
unnecessary personal data, or uncontrolled copies of protected evidence.

### Chapter 195 — Case Evidence

IncidentCaseEvidence stores bounded references and metadata under evidence
type/source controls. Access is authorized independently from a public or
marketplace route; linked evidence remains governed by its source domain.

### Chapter 196 — Case Status Lifecycle

Cases move through open, triage/investigation, assignment, containment request,
resolution, closure, reopening, or escalation only as service guards permit.
IncidentCaseHistory preserves actor, reason, and transition evidence.

### Chapter 197 — Playbook Drafting

Authorized users create a SecurityResponsePlaybook draft and ordered steps for
a defined security scenario. Draft presence does not authorize execution; step
types and scope must fit the reversible accepted baseline.

### Chapter 198 — Playbook Versioning

Version creation preserves reviewed history while allowing a controlled new
draft. Edits target the intended version, and stale/concurrent changes fail
safely. Activated evidence is not overwritten in place.

### Chapter 199 — Playbook Review and Activation

Submission, approval/rejection, and activation follow Gate 4G permissions and
review state. Activation makes an approved version eligible for later response
requests; it does not create an approval grant or execute an action.

### Chapter 200 — Approval Request

A requester selects the minimum approved playbook/action scope, target, reason,
and duration required. The service validates actor, playbook state, case
context, and reversibility before entering review.

### Chapter 201 — Approval Decision and Grant

An independent authorized decision creates or rejects a time-bound, scoped
grant. The requester cannot self-approve. Grant consumption, expiration,
revocation, cancellation, and decision history remain auditable.

### Chapter 202 — Approval Failure and Concurrency

Invalid scope, expired/revoked grant, duplicate decision, requester/approver
conflict, or stale concurrent update fails closed. Preserve the prior valid
approval state and return a sanitized stable result.

## Part XX — SOC Response, Rollback, Simulation, and Freeze

### Chapter 203 — Reversible Response Baseline

Gate 4H accepts only the approved reversible response scope, including NOOP
simulation and reversible account restriction as evidenced. Response presence
does not authorize destructive, financial, compliance, or infrastructure
actions.

### Chapter 204 — Response Execution Preconditions

Execution validates actor permission, requester/approver separation, active
playbook, compatible action, target scope, usable grant, emergency-freeze
state, idempotency key, and current resource state.

### Chapter 205 — Grant Consumption

A valid approval grant is consumed according to its exact time, scope, target,
and action constraints. Reuse, expiry, revocation, or mismatch prevents
execution and remains visible in sanitized approval/execution evidence.

### Chapter 206 — Execution State Lifecycle

SecurityResponseExecution and Action records progress through pending/running
to success/failure and, where permitted, rollback states. Partial failure is
recorded explicitly rather than promoted to success.

### Chapter 207 — Execution Idempotency

Repeated requests with the same authorized identity/scope converge on the
existing execution outcome. Idempotency prevents duplicate restrictions,
audits, and side effects while allowing safe result retrieval.

### Chapter 208 — Execution Concurrency

Concurrency controls prevent conflicting executions against the same protected
scope. Losing requests return controlled outcomes, and operators investigate
the authoritative execution rather than forcing parallel state.

### Chapter 209 — Emergency Freeze

Emergency freeze blocks unsafe new execution while preserving visibility and
separately authorized rollback. Activation and release require the accepted
permission/process; a UI toggle alone is insufficient.

### Chapter 210 — Rollback Preconditions

Rollback requires its own permission, an eligible reversible execution, a
valid current-state comparison, and no unacceptable divergence. It cannot be
assumed from prior execution authority.

### Chapter 211 — Divergence Protection

Before rollback, the service compares protected before/after/current state.
Unexpected independent change causes a safe rollback refusal so recovery does
not overwrite legitimate current state.

### Chapter 212 — Controlled Simulation Capability

Gate 4I validates nine scenarios covering NOOP, reversible restriction, scope,
freeze, concurrency/idempotency, partial failure/recovery, divergence,
authorization/separation, and audit sanitization. Status:
`COMPLETE_AND_FROZEN`.

### Chapter 213 — Simulations Route Classification

`/dashboard/admin/security/simulations` is `NAVIGATION_SHELL_ONLY` with no
service/API integration. Operators use the accepted response workflow and
command-center simulation views; the tray intentionally does not create an
unapproved shortcut.

### Chapter 214 — Reports Route Classification

`/dashboard/admin/security/reports` is `PLANNED_NOT_IMPLEMENTED`. Dashboard,
event, case, response, and audit reads exist, but no dedicated SOC report
generator/export API or exact approved requirement was found.

## Part XXI — Maintenance, Recovery, Monitoring, and Resilience

### Chapter 215 — Maintenance Capability

Gate 4J accepts maintenance, technical UAT, and the SOC operations/recovery
runbook as operational capability. The standalone maintenance page is not an
accepted requirement and contains no maintenance service.

### Chapter 216 — Maintenance Route Classification

`/dashboard/admin/security/maintenance` is `PLANNED_NOT_IMPLEMENTED`. It is not
a recovery console. Operators use the accepted runbook, response controls,
recovery/backfill jobs, tests, and separately authorized operational process.

### Chapter 217 — Recovery Checkpoints

SecurityEventIngestionCheckpoint and detection checkpoints record bounded
progress so recovery can resume without replaying uncontrolled ranges. Advance
occurs only after valid processing under the current lease.

### Chapter 218 — Worker Leases

Recovery acquires an exclusive lease before processing a bounded range. Lease
loss or conflict stops unsafe continuation; failure handling releases or
expires control without falsely advancing the checkpoint.

### Chapter 219 — Bounded Replay

Recovery replays an explicitly bounded source range through normal validation,
normalization, idempotency, and failure recording. It is not a raw bulk write
or production database shortcut.

### Chapter 220 — Backfill

The backfill job supports controlled historical event ingestion with the same
privacy, lifecycle, deduplication, checkpoint, and safe-failure expectations.
Operator scope and environment must be explicit.

### Chapter 221 — Response Recovery

For failed/partial response execution, preserve approval/execution/action
evidence, apply emergency freeze if authorized, inspect divergence, and use
separately authorized rollback or corrective gates. Do not rewrite history.

### Chapter 222 — Monitoring Direction

Application Insights and Log Analytics definitions plus middleware describe
the monitoring target. Local code does not prove workspace provisioning,
telemetry ingestion, alert configuration, retention, or production health.

### Chapter 223 — Backup and Database Recovery Boundary

Readiness/runbook artifacts may describe checkpoints and recovery intent, but
production backup state and restore viability require external authorized
verification. Database migration/restore remains separately governed.

### Chapter 224 — Technical UAT and Historical Evidence

Gate 4J technical UAT and other accepted test reports prove their recorded
checkpoint. They do not validate unrelated current dirty edits or production
state. New changes require selected current tests in an authorized environment.

## Part XXII — Architecture, Configuration, Infrastructure, and Delivery

### Chapter 225 — Vercel Frontend Direction

The Owner-verified Vercel project identity is `ren-tipid` under
`jburns2372-sys-projects`, with public domains documented in the deployment
registry. Identity evidence does not authorize deployment or prove a current
live response.

### Chapter 226 — Azure Backend and Services Direction

`apps/api`, `apps/worker`, and Azure-target infrastructure define the backend,
worker, database, storage, identity, registry, network, and monitoring
direction. `AZURE_PROVISIONING_OR_DEPLOYMENT_AUTHORIZED_BY_DOCUMENTATION: NO`.

### Chapter 227 — Partially Split Implementation

Root Next.js handlers and extracted Azure targets coexist. Runtime routing may
depend on current configuration and compatibility wrappers. Change analysis
must identify both sides and preserve authentication/data/error contracts.

### Chapter 228 — Network Design Boundary

The owner-approved parallel network design recorded in the deployment registry
uses VNet `10.219.0.0/20`, an ACA `/23`, and private-endpoint `/24`. These are
non-secret design identifiers, not provisioning, peering, or traffic evidence.

### Chapter 229 — Database Target

Prisma targets PostgreSQL and Phase 19B describes Azure PostgreSQL direction.
No production database was inspected. Migration, connection, data validation,
and cutover require a separate Owner decision and guarded plan.

### Chapter 230 — Object Storage Target

Azure Blob Storage, private access, managed identity/user-delegation, and RBAC
are the target direction represented by current files. Local implementation
does not prove account/container/endpoints/roles are deployed.

### Chapter 231 — Secrets and Key Vault

Key Vault is the target secret-provider boundary. Documentation lists only
configuration names; it excludes tokens, keys, passwords, HMAC material,
connection strings, SAS values, and secret-bearing URLs.

### Chapter 232 — Environment Contracts

Runtime routing, auth/data, Azure, payment, security/SOC, CI, and provider
configuration names form the environment contract. The 52 code references and
19 template names require review; no missing value is invented.

### Chapter 233 — Terraform and Deployment Control

Terraform is desired-state code. No plan or apply occurred. Provisioning,
deployment, migration, traffic, DNS, and production operations require exact
authorization, external verification, rollback, and evidence.

### Chapter 234 — Superseded AWS Architecture

AWS/PM2 documents and AWS-named readiness routes remain historical artifacts
classified `SUPERSEDED_ARCHITECTURE_HISTORY`. They are not the current target
and must not be restored as architecture authority without a new decision.

## Part XXIII — Testing, Governance, Phase Status, and Release Control

### Chapter 235 — Test Inventory

The evidence layer inventories 142 test/spec files: 135 security, three
checkout/payment-pilot, three end-to-end, and one privacy. File presence is not
a current pass; accepted reports record exact historical results.

### Chapter 236 — Test Environment Safety

Database-backed tests require the local test-database guard and explicit
non-production target. Production databases are never test targets. Test,
simulation, and live security events remain classified separately.

### Chapter 237 — Validation Selection

Select tests from affected routes, services, models, roles, states,
integrations, security/privacy controls, and recovery paths. Record the exact
artifact, environment class, command, outcome, and limitation.

### Chapter 238 — Phase Status Authority

Formal freeze/closure outranks final accepted evidence, historical reports,
and plans for phase status. Current code remains the authority for current
implementation. Conflicts stay disclosed in the source register.

### Chapter 239 — Phase 4 and Level 5 Freeze

Incident cases, playbooks/approvals, reversible response, controlled
simulation, maintenance/UAT, Level 5, behavioral intelligence, and threat map
retain their accepted/frozen classifications. Optional routes do not reopen
them.

### Chapter 240 — Phase 19 Status

Phase 19 is `PHASE19_COMPLETE_NO_GO_FROZEN`. The phase is complete as a
decision/evidence program while live payment activation is prohibited. Any
future activation needs an explicit new gate.

### Chapter 241 — Phase 19B Status

`PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED` preserves the
Vercel/Azure direction and completed documentation/readiness decisions without
claiming deployment. Database migration and operational cutovers remain
reserved.

### Chapter 242 — Release and Change Governance

A release/change requires exact scope, artifact, approvals, tests, privacy and
security review, configuration validation, migration/cutover authority,
rollback, monitoring, evidence, and documentation updates. Readiness labels do
not replace these controls.

## Part XXIV — Training, Handover, Limitations, and Future Change

### Chapter 243 — User Training

Train users by role and journey: identity/KYC, listing discovery, booking,
agreement, inspection, claim/dispute, privacy, and support. Emphasize server
state, safe evidence, known limitations, and live-payment prohibition.

### Chapter 244 — Operator Training

Train Admin, Finance, Compliance, Support, SOC, and Super Admin separately.
Exercises must preserve least privilege, separation of duties, sanitized audit,
NO-GO boundaries, and non-production safety.

### Chapter 245 — Developer Onboarding

Developers begin with baseline/dirty-work ownership, source authority,
architecture layering, route/service/model maps, test guards, status vocabulary,
and separately governed decisions. They must classify transitional handlers
before editing.

### Chapter 246 — Known Limitations

Material limitations include three SOC route shells, profile edit, provider
analytics, admin report exports, payment NO-GO, deployment/database boundaries,
transitional APIs, environment-name alignment, external provider/mobile state,
historical status conflict, and dirty-tree test scope.

### Chapter 247 — Future Change Intake

Future work begins with an exact accepted requirement and classification of
current capability, affected evidence, risk, permissions, data, states,
external decisions, tests, rollback, and documentation. Speculative route
names are not requirements.

### Chapter 248 — Formal Handover and Reopen Criteria

The final package hands over evidence, procedures, diagrams, claim index,
validation, hashes, renders/tooling status, archive, and reserved decisions. A
freeze reopens only for an approved factual change, identified defect,
security/privacy correction, or newly authorized operational decision.

## Appendix A — Route and Screen Index

The authoritative route registry inventories 163 pages by public, account,
auth, marketplace, dashboard role, admin SOC, and super-admin groups:
`../00-WORKING-REGISTRIES/RENTipid_ROUTE_AND_SCREEN_REGISTRY.md`. Presence does
not prove completion; explicit route limitations control simulations, reports,
maintenance, profile edit, provider analytics, and admin report exports.

## Appendix B — Role and Permission Matrix

Guest, Renter, Individual Provider, Business Provider, Admin, Finance Admin,
Compliance Admin, SOC Analyst, SOC Supervisor, and Super Admin boundaries are
defined in `../00-WORKING-REGISTRIES/RENTipid_ROLE_AND_PERMISSION_REGISTRY.md`.
Server authorization and separation of duties are mandatory.

## Appendix C — Database Model and Enum Index

The data registry groups all 79 Prisma models and lists all 29 enums:
`../00-WORKING-REGISTRIES/RENTipid_DATABASE_AND_DATA_OWNERSHIP_REGISTRY.md`.
It records ownership and privacy boundaries without production rows.

## Appendix D — API and Service Index

The API registry groups 65 root API route files and their primary service
families: `../00-WORKING-REGISTRIES/RENTipid_API_AND_SERVICE_REGISTRY.md`.
POST/API presence is not deployment or operational authority.

## Appendix E — Configuration Name Index

The configuration registry lists permitted variable names by runtime, auth/
data, Azure, payment, security/SOC, CI, and provider category:
`../00-WORKING-REGISTRIES/RENTipid_CONFIGURATION_AND_ENVIRONMENT_REGISTRY.md`.
Values remain excluded.

## Appendix F — Workflow and State Index

The workflow registry maps registration, marketplace, finance, privacy, SOC,
release, Phase 19, and Phase 19B transitions:
`../00-WORKING-REGISTRIES/RENTipid_WORKFLOW_AND_STATE_TRANSITION_REGISTRY.md`.
Service guards outrank UI labels.

## Appendix G — Audit and Security Event Index

The audit/event registry defines audit stores, safe treatment, event sources,
lifecycle/environment, idempotency, privacy, failures, checkpoints, and the
report/export distinction:
`../00-WORKING-REGISTRIES/RENTipid_AUDIT_AND_SECURITY_EVENT_REGISTRY.md`.

## Appendix H — Security Control Index

The security registry maps authentication, authorization, least privilege,
uploads, telemetry, response, crypto, MFA, payment, database, cloud-identity,
supply-chain, AI, and privacy controls:
`../00-WORKING-REGISTRIES/RENTipid_SECURITY_CONTROL_REGISTRY.md`.

## Appendix I — Test and Validation Index

The test registry records 142 test/spec files and canonical accepted suites:
`../00-WORKING-REGISTRIES/RENTipid_TEST_AND_VALIDATION_EVIDENCE_REGISTRY.md`.
Historical checkpoint and dirty-tree limitations remain explicit.

## Appendix J — Phase and Freeze Index

The canonical phase/freeze register is
`../07-PHASE-HISTORY-AND-FREEZE/RENTipid_PHASE_COMPLETION_AND_FREEZE_REGISTER.md`.
It preserves Phase 19 NO-GO, Phase 19B reserved decisions, and formal reopen
criteria.

## Appendix K — Status Vocabulary

Canonical meanings and forbidden promotions are in
`../00-WORKING-REGISTRIES/RENTipid_STATUS_TERMINOLOGY_AND_CLASSIFICATION_REGISTRY.md`.
Architecture direction and transition state remain separate.

## Appendix L — Known Gaps and Limitations

GAP-001 through GAP-018 are maintained in
`../00-WORKING-REGISTRIES/RENTipid_KNOWN_GAP_AND_LIMITATION_REGISTRY.md`.
Limitations are disclosed without incorrectly reopening approved phases.

## Appendix M — Architecture Decision Summary

Authoritative direction:
`VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`. Current repository state:
`PARTIALLY_SPLIT_IMPLEMENTATION`. Azure provisioning/deployment authorization:
`NO`. AWS/PM2: `SUPERSEDED_ARCHITECTURE_HISTORY`.

## Appendix N — Evidence and Traceability Map

Major claims map to repository paths, symbols, routes, models, tests, or
accepted reports in
`../11-EVIDENCE-AND-VALIDATION/RENTipid_DOCUMENTATION_EVIDENCE_INDEX.md`.
Unsupported major claims are not permitted.

## Appendix O — Handover, Reopen, and Decision Checklist

Before reopening documentation or a frozen capability, identify the exact
approved requirement, affected evidence IDs/chapters, status change, roles,
data, security/privacy, tests, rollback, operational authority, and approver.
Database migration, payment activation, deployment, traffic, and DNS decisions
remain separately governed until explicitly changed.
