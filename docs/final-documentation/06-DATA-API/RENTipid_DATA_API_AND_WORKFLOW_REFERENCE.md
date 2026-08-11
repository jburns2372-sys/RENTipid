# RENTipid Data, API, and Workflow Reference

## Data Authority

`prisma/schema.prisma` is the schema authority for 79 models and 29 enums.
Models cover identity/profile, catalog/listings, bookings and trust, KYC,
payments/finance, platform audit, marketing/social, release/support, SOC
telemetry/detection, incident cases, response control, behavioral risk, and
geolocation.

Model presence is not proof of production data, deployment, or permission.
The applicable service and server-side authorization determine mutation
authority. No database content was accessed for this documentation.

## API Surface

The root application contains 65 Next.js API route files grouped into:

- authentication and registration;
- admin listing/document/category/dispute operations;
- bookings, agreements, turnover, inspection, claims, and status;
- documents, listings, finance upload, payments, and PayMongo webhooks;
- privacy consent, correction, deletion, and export;
- SOC cases and case evidence/notes/status/assignment;
- SOC playbook lifecycle and step/version operations;
- SOC approval request/decision/grant lifecycle;
- SOC response execution and rollback;
- SOC dashboard, behavioral-risk, and threat-map reads;
- AI chat and webhook health.

Some marketplace route handlers act as transitional compatibility/proxy
wrappers toward `apps/api`. Their current downstream handler and configuration
mode must be checked before changing behavior.

## Core State Workflows

### Listing and booking

Provider listing creation and submission flow through publication/verification
controls. Booking state coordinates agreements, inspections, turnover, claims,
refund requests, and disputes. Use the service guard and current state history;
do not infer allowed transitions from buttons alone.

### Payments and finance

Payment, gateway, webhook, action, reconciliation, ledger, refund, payout, and
batch records form a controlled evidence chain. Webhook signature validation,
idempotency, exact amount/currency handling, reconciliation, role separation,
and the Phase 19 NO-GO boundary are part of the contract.

### Privacy

Consent, correction, export, and deletion are authorized workflows. They must
preserve required audit/retention constraints and avoid leaking protected data
in logs or response errors.

### SOC event and detection

Source adapters normalize events into a lifecycle/environment-aware security
event, record failures, advance checkpoints under a lease, evaluate controlled
rules, deduplicate/correlate results, and create reviewable alerts. Recovery is
bounded and idempotent.

### SOC cases, playbooks, and responses

Cases progress through triage, investigation, assignment, evidence,
containment, resolution, closure, reopening, or escalation. Playbooks progress
from draft/versioning through review and activation. A response progresses
through request, independent decision, time-bound grant, execution, outcome,
and separately authorized rollback where allowed.

## Error and Evidence Contract

APIs should return stable sanitized outcomes while recording authorized audit
context. Public responses and logs must not expose secrets, private keys,
authorization headers, provider credentials, database URLs, raw connection
strings, or unnecessary private evidence. Retries must respect idempotency and
must not manufacture duplicate financial or response actions.

## Known API Limitation

No dedicated SOC report-generation/export API was found. The SOC reports
route and permission vocabulary are not implementation evidence. Existing
dashboard, event, case, and audit reads retain their individual contracts.

For exact route groups, models, enums, and service families, use the frozen API,
database, workflow, audit, and status registries in
`../00-WORKING-REGISTRIES/`.
