# RENTipid Admin, Finance, and Compliance Manual

## Role Separation

Administrative authority is divided among Admin, Finance Admin, Compliance
Admin, SOC Analyst, SOC Supervisor, and Super Admin roles. Super-admin breadth
does not cancel the accepted dual-control rules for SOC responses, nor does a
general Admin automatically receive finance, compliance, or SOC authority.

Every privileged operation must rely on server-side permission and state
checks. Navigation visibility and disabled controls are not authorization.

## General Administration

Admin surfaces cover categories, bookings, disputes, support, feedback,
issues, beta/UAT, launch/readiness, marketing, AI settings/logs, system logs,
and selected reports. Operators should record a reason and maintain the
applicable audit trail for state-changing work.

The admin reports page provides current aggregate/metric surfaces, but CSV
export and some AI prompt metrics are placeholders. The super-admin reports
route delegates to that page and inherits the limitation. Neither should be
described as a complete export product.

## Compliance Operations

Compliance operators review KYC, verification documents, and listing
requirements through their dedicated scope. Decisions should use only the
minimum required evidence, follow upload/document safety rules, and avoid
copying sensitive document data into general logs. Compliance review does not
grant payment or SOC-response authority.

## Finance Operations

Finance surfaces cover gateway transactions, reconciliation, deposits,
refunds, payouts, payout batches, ledger/settlement views, and readiness or
training pages. Follow these controls:

1. verify the session and finance role;
2. verify the exact payment/refund/payout state;
3. verify provider event signatures and idempotency where applicable;
4. compare ledger, gateway, webhook, and reconciliation evidence;
5. record a sanitized action reason and outcome;
6. escalate mismatches without manufacturing a compensating transaction.

The accepted Phase 19 decision is `COMPLETE_NO_GO_FROZEN`. No dashboard,
configuration name, or documentation page authorizes live money movement.

## Support, Beta, and Release Operations

Support tickets, feedback, issues, invitations, UAT flows, and readiness
screens support controlled rollout and evidence capture. A readiness screen is
not proof of deployment or external provider activation. Release decisions
must cite the corresponding accepted report and current runtime verification.

## Privacy and Audit

Account deletion, correction, consent, and export requests require identity,
scope, retention, and audit checks. Audit records must contain sanitized
identifiers and outcomes, not tokens, passwords, full credentials, connection
strings, or unnecessary private data.

## Escalation Boundaries

Escalate rather than bypass:

- permission or separation-of-duties failures;
- unmatched payment or webhook evidence;
- conflicting booking/listing states;
- suspected account compromise;
- storage/provider/runtime unavailability;
- any operation requiring production, database, cloud, DNS, or payment
  authority not already granted by an approved operating gate.
