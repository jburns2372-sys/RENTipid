# RENTipid User and Marketplace Manual

## Audience and Access

Public visitors can browse general information, help, safety, legal, and
marketplace discovery surfaces. Authenticated workflows are role-specific:
renters use rental and payment views; providers manage listings and fulfillment;
business providers use business-scoped operations; privileged operator roles
use separate protected dashboards.

Never infer access from a visible link. The server session, role, ownership,
record state, and service authorization determine whether an action is allowed.

## Registration and Account Use

Users register as supported non-privileged account types and authenticate
through the application session flow. Privileged finance, compliance, SOC, or
super-admin authority cannot be self-selected. Users can view account/profile
information and follow KYC or verification-document workflows where required.

Current limitation: the profile page exposes profile information, but its edit
function is marked coming soon. Privacy correction, export, deletion, and
consent operations are controlled workflows rather than unrestricted direct
data mutation.

## Finding and Renting an Item

1. Browse available listings and open a listing detail.
2. Use the booking/checkout flow allowed by the current listing and account
   state.
3. Review agreement and booking details.
4. Follow inspection and confirmation steps assigned to the renter.
5. Use the claim, dispute, refund-request, receipt, and review surfaces when
   their business rules permit.

The application may show payment readiness or checkout functionality, but the
accepted Phase 19 live-payment decision is NO-GO. A screen must never be read
as authority to initiate an unauthorized live transaction.

## Provider Operations

Providers create and manage listings, supporting photos/documents, bookings,
turnover, return inspections, claims, ledger views, promotions, and payout
views. Business-provider screens reuse or extend provider-oriented marketing
and listing workflows.

Current limitations and dependencies:

- provider campaign analytics is marked coming soon;
- external social publication depends on authorized provider connections;
- payout and settlement views do not independently authorize money movement;
- listing publication and document verification remain admin/compliance
  controlled.

## Safety, Claims, and Support

Use the inspection, turnover, claim, dispute, feedback, issue, and support
flows to preserve a reviewable record. Do not place passwords, access tokens,
private keys, or unnecessary sensitive information in notes or evidence.
Uploaded evidence is subject to type, content, size, ownership, and permission
controls.

## Status and Help

User-visible labels summarize state; the service and stored state remain
authoritative. If an operation is blocked, record the applicable booking or
support identifier without copying secrets, and use the support flow. Readiness,
beta, and UAT screens describe controlled stages and do not imply general
production release.
