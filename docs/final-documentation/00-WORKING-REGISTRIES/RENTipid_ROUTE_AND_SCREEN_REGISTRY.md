# RENTipid Route and Screen Registry

Status: `FROZEN_WORKING_REGISTRY`

Inventory result: `163` `page.tsx` routes. Dynamic segments are shown in
brackets. Presence means the route exists; it does not independently prove
business acceptance, deployment, or full feature completion.

| Route group | Count | Exact current routes |
| --- | ---: | --- |
| Public root | 1 | `/` |
| Account | 1 | `/account/delete` |
| Authentication/registration | 4 | `/login`, `/register`, `/register/business`, `/register/individual` |
| Marketplace discovery | 3 | `/browse`, `/listing/[id]`, `/checkout/[bookingId]` |
| Public guidance/legal/support | 12 | `/beta-guide`, `/contact`, `/feedback`, `/help`, `/how-it-works`, `/install-app`, `/privacy`, `/prohibited-items`, `/safety`, `/support`, `/terms`, `/unauthorized` |
| Dashboard common | 3 | `/dashboard/kyc`, `/dashboard/profile`, `/dashboard/provider/onboarding-checklist` |
| Renter | 8 | `/dashboard/renter`, `/dashboard/renter/bookings`, `/dashboard/renter/bookings/[id]`, `/dashboard/renter/bookings/[id]/claims`, `/dashboard/renter/bookings/[id]/inspection`, `/dashboard/renter/bookings/[id]/refund-request`, `/dashboard/renter/onboarding-checklist`, `/dashboard/renter/payments/[id]/receipt` |
| Provider | 17 | `/dashboard/provider`, `/dashboard/provider/bookings`, `/dashboard/provider/bookings/[id]`, `/dashboard/provider/bookings/[id]/claims`, `/dashboard/provider/bookings/[id]/claims/new`, `/dashboard/provider/bookings/[id]/inspection`, `/dashboard/provider/bookings/[id]/return-inspection`, `/dashboard/provider/bookings/[id]/turnover`, `/dashboard/provider/ledger`, `/dashboard/provider/listings`, `/dashboard/provider/listings/[id]`, `/dashboard/provider/listings/[id]/promote`, `/dashboard/provider/listings/new`, `/dashboard/provider/marketing`, `/dashboard/provider/payouts`, `/dashboard/provider/payouts/[id]/statement`, `/dashboard/provider/social-accounts` |
| Business provider | 4 | `/dashboard/business`, `/dashboard/business/listings/[id]/promote`, `/dashboard/business/marketing`, `/dashboard/business/social-accounts` |
| Compliance | 3 | `/dashboard/compliance`, `/dashboard/compliance/listings`, `/dashboard/compliance/listings/[id]` |
| Finance | 15 | `/dashboard/finance`, `/dashboard/finance/deposits`, `/dashboard/finance/gateway-transactions`, `/dashboard/finance/live-pilot-training`, `/dashboard/finance/live-webhook-monitor`, `/dashboard/finance/payout-batches`, `/dashboard/finance/payout-readiness`, `/dashboard/finance/payouts`, `/dashboard/finance/payouts/[id]`, `/dashboard/finance/reconciliation`, `/dashboard/finance/reconciliation/[id]`, `/dashboard/finance/refund-readiness`, `/dashboard/finance/refunds`, `/dashboard/finance/refunds/[id]`, `/dashboard/finance/settlements` |
| Admin general | 33 | `/dashboard/admin`, `/dashboard/admin/account-deletions`, `/dashboard/admin/ai-logs`, `/dashboard/admin/ai-settings`, `/dashboard/admin/ai-v1-check`, `/dashboard/admin/beta-dashboard`, `/dashboard/admin/beta-invitations`, `/dashboard/admin/beta-readiness`, `/dashboard/admin/beta-users`, `/dashboard/admin/bookings`, `/dashboard/admin/categories`, `/dashboard/admin/disputes`, `/dashboard/admin/disputes/[id]`, `/dashboard/admin/feedback`, `/dashboard/admin/feedback/[id]`, `/dashboard/admin/incident-response`, `/dashboard/admin/issues`, `/dashboard/admin/launch-announcements`, `/dashboard/admin/listings/[id]/promote`, `/dashboard/admin/marketing`, `/dashboard/admin/marketing/campaigns/[id]`, `/dashboard/admin/marketing/campaigns/new`, `/dashboard/admin/mobile-analytics`, `/dashboard/admin/reports`, `/dashboard/admin/social-accounts`, `/dashboard/admin/sop`, `/dashboard/admin/sop/refund-review`, `/dashboard/admin/support`, `/dashboard/admin/support/[id]`, `/dashboard/admin/support-readiness`, `/dashboard/admin/system-logs`, `/dashboard/admin/uat`, `/dashboard/admin/uat/[id]` |
| Admin SOC | 15 | `/dashboard/admin/security`, `/dashboard/admin/security/alerts`, `/dashboard/admin/security/approvals`, `/dashboard/admin/security/approvals/[requestId]`, `/dashboard/admin/security/cases`, `/dashboard/admin/security/cases/[caseId]`, `/dashboard/admin/security/intelligence/behavioral-risk`, `/dashboard/admin/security/maintenance`, `/dashboard/admin/security/playbooks`, `/dashboard/admin/security/playbooks/[playbookId]`, `/dashboard/admin/security/reports`, `/dashboard/admin/security/responses`, `/dashboard/admin/security/responses/[executionId]`, `/dashboard/admin/security/rules`, `/dashboard/admin/security/simulations` |
| Super Admin | 44 | `/dashboard/super-admin`, `/dashboard/super-admin/ai-logs`, `/dashboard/super-admin/ai-settings`, `/dashboard/super-admin/app-version`, `/dashboard/super-admin/aws-deployment-dry-run`, `/dashboard/super-admin/aws-operations-monitor`, `/dashboard/super-admin/beta-categories`, `/dashboard/super-admin/beta-controls`, `/dashboard/super-admin/beta-dashboard`, `/dashboard/super-admin/beta-invitations`, `/dashboard/super-admin/beta-readiness`, `/dashboard/super-admin/beta-users`, `/dashboard/super-admin/data-cleanup`, `/dashboard/super-admin/deposit-policy-review`, `/dashboard/super-admin/finance-approval-settings`, `/dashboard/super-admin/launch-categories`, `/dashboard/super-admin/launch-controls`, `/dashboard/super-admin/launch-monitor`, `/dashboard/super-admin/legal-finance-review`, `/dashboard/super-admin/legal-policy-readiness`, `/dashboard/super-admin/live-payment-execution`, `/dashboard/super-admin/live-payment-pilot`, `/dashboard/super-admin/live-payment-runbook`, `/dashboard/super-admin/live-pilot-smoke-test`, `/dashboard/super-admin/live-pilot-training`, `/dashboard/super-admin/marketing`, `/dashboard/super-admin/mobile-readiness`, `/dashboard/super-admin/payment-launch`, `/dashboard/super-admin/payment-production-readiness`, `/dashboard/super-admin/payment-readiness`, `/dashboard/super-admin/paymongo-activation`, `/dashboard/super-admin/phase19b-dry-run`, `/dashboard/super-admin/pilot-participants`, `/dashboard/super-admin/production-domain-readiness`, `/dashboard/super-admin/release-candidate`, `/dashboard/super-admin/reports`, `/dashboard/super-admin/social-accounts`, `/dashboard/super-admin/social-launch`, `/dashboard/super-admin/social-readiness`, `/dashboard/super-admin/system-backup`, `/dashboard/super-admin/system-logs`, `/dashboard/super-admin/v1-analytics`, `/dashboard/super-admin/v1-launch`, `/dashboard/super-admin/v1-smoke-test` |

## Explicit Route Limitations

| Route | Route status | Capability relationship | Documentation treatment |
| --- | --- | --- | --- |
| `/dashboard/admin/security/simulations` | `NAVIGATION_SHELL_ONLY` | Gate 4I controlled simulation is complete/frozen elsewhere | Disclose shell; direct operators to accepted response workflow and command center |
| `/dashboard/admin/security/reports` | `PLANNED_NOT_IMPLEMENTED` | Dedicated SOC report generation is not in approved baseline | Do not claim report export exists |
| `/dashboard/admin/security/maintenance` | `PLANNED_NOT_IMPLEMENTED` | Gate 4J maintenance/recovery capability is complete/frozen through runbook/services/tests | Disclose absent convenience UI |
| `/dashboard/profile` | `IMPLEMENTED_READ_ONLY_WITH_EDIT_LIMITATION` | Profile display works; edit button says coming soon | Document profile-edit limitation |
| `/dashboard/provider/marketing` | `IMPLEMENTED_WITH_PARTIAL_LIMITATION` | Marketing navigation/generation entry exists; campaign analytics says coming soon | Document analytics limitation |
| `/dashboard/admin/reports` | `IMPLEMENTED_METRICS_WITH_PLACEHOLDER_EXPORTS` | Counts/aggregates render; CSV and some AI metrics are placeholders | Do not claim export completion |
| `/dashboard/super-admin/reports` | `DELEGATED_TO_ADMIN_REPORTS` | Reuses admin reports page | Inherits the same limitations |

Authority note: this registry records current routes honestly while the SOC
placeholder reconciliation prevents optional shells from invalidating accepted
capabilities.

Canonical manual cross-reference: `../02-USER-MANUALS/RENTipid_USER_MANUAL.md`
and Master Appendix A.
