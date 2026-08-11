# RENTipid User Manual

## Purpose and Safety

This manual trains guests, renters, individual providers, and business
providers on the repository-supported RENTipid application surface. A visible
route or button is not authority: session, role, ownership, record state, and
server-side validation determine each action. Never enter passwords, tokens,
payment credentials, or unnecessary personal/KYC data into support notes.

## Guest and Account Journey

Guests use `/`, `/browse`, `/listing/[id]`, help, safety, legal, contact, and
registration pages. Registration supports non-privileged account types;
finance, compliance, SOC, admin, and super-admin authority cannot be
self-selected. Authenticated users can view profile and KYC surfaces. Profile
editing is currently limited, while privacy correction/export/deletion are
controlled request workflows.

## Renter Quick Procedure

1. Browse and inspect a listing.
2. Sign in and complete required profile/KYC steps.
3. Use the allowed booking/checkout path.
4. Review booking and agreement status.
5. Complete renter inspection/confirmation steps.
6. Use claim, dispute, refund-request, receipt, review, or support paths only
    when the stored state permits.

For safe evidence handling and escalation, follow the
[Trust and Safety guidance](../01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md)
in Master Manual Chapter 37.

Live payment activation is `NOT_AUTHORIZED`; Phase 19 is
`PHASE19_COMPLETE_NO_GO_FROZEN`. Payment UI and provider integrations do not
override that status.

## Provider Quick Procedure

1. Complete provider/business onboarding and verification requirements.
2. Create a listing with authorized photos/documents and category data.
3. Submit for required publication/compliance review.
4. Manage booking, agreement, turnover, inspection, return, and claim tasks.
5. Review ledger, payout, marketing, and social-operation surfaces within the
    provider scope.

Providers also follow the
[Trust and Safety guidance](../01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md)
in Master Manual Chapter 37 when collecting turnover, inspection, claim, or
dispute evidence.

Provider campaign analytics is incomplete. External social publication and
provider connections require separate provider authorization/state.

## Claims, Disputes, and Support

Preserve exact booking/listing identifiers and provide only necessary,
sanitized evidence. Claims and disputes are human-reviewed. A UI status is a
summary; the service state/history is authoritative. Use support, feedback,
and issue routes for errors rather than attempting duplicate payments or
state-changing retries.

## Trust and Safety

Use the minimum necessary evidence, confirm the booking/listing relationship,
and keep passwords, tokens, raw KYC documents, payment credentials, and
unrelated personal data out of notes and uploads. Escalate suspected fraud,
account compromise, unsafe items, evidence tampering, or state divergence
through the authorized support, compliance, finance, or SOC workflow.

## Privacy and Account Lifecycle

Consent, correction, export, and deletion are authorized workflows with
identity, scope, audit, and retention constraints. Uploaded verification
documents remain restricted. Do not copy raw document contents into general
support or marketplace notes.

## Known User-Facing Limitations

- profile editing is marked coming soon;
- provider campaign analytics is incomplete;
- live payments are not authorized;
- mobile/PWA packaging does not prove app-store publication;
- external social connections/publication are provider-dependent;
- beta, UAT, and readiness screens do not mean a general production release.

## Evidence and Related Manuals

See the route, workflow, role, data, integration, and gap registries under
`../00-WORKING-REGISTRIES/`, and Parts III through VIII of the complete master
manual.
