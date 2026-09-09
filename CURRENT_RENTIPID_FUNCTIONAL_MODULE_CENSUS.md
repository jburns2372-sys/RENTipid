# CURRENT RENTipid FUNCTIONAL MODULE CENSUS

## 1. Executive Summary

- **Total Discovered App Routes**: 330 (211 Page Routes, 119 API Endpoints)
- **Total Prisma Database Models**: 148
- **Active Customer-Facing Modules**: 189
- **Feature-Flagged Modules**: 5
- **Internal / Admin Modules**: 136

## 2. Functional Domains Breakdown

### Account, Identity & KYC (11 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/account/delete` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/account/sessions` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/forgot-password` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/login` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/mfa-challenge` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/mfa-enroll` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/register/business` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/register/individual` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/register` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/reset-password` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |
| `/verify-email` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | sign up, log in, verify email, enroll MFA, reset password, update profile |

### Core (124 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/api/account/sessions/logout-others` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/account/sessions` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/account/sessions/[sessionId]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/address/autocomplete` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/address/details` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/address/ph/barangays` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/address/ph/cities` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/address/ph/resolve-city` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/ai/feedback` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/ai/mediation/provider` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/ai/mediation/renter` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/ai/suggestions` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/email-verification/resend` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/email-verification/verify` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/link` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/logout` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/methods` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/mfa/activate` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/mfa/enroll` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/mfa/verify` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/oauth/intent` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/otp` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/password-recovery` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/password-reset` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/register` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/unlink` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/auth/[...nextauth]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/agreement` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/claims/respond` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/claims` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/inspection/renter-confirm` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/inspection` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/provider-agreement` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/status` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/bookings/[id]/turnover` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/documents/upload` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/documents/[id]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/health` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/listings` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/listings/[id]/documents` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/listings/[id]/photos` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/listings/[id]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/listings/[id]/submit` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/listings/[id]/withdraw` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/privacy/consent` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/privacy/cookies` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/privacy/correction` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/privacy/deletion` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/privacy/escalate` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/privacy/export` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/privacy/requests` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/profile/change-password` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/profile/photo` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/profile` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/approvals/approve` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/approvals/cancel` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/approvals/list` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/approvals/reject` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/approvals/revoke` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/approvals/submit` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/approvals/[requestId]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/dashboard` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/intelligence/behavioral-risk/history` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/intelligence/behavioral-risk/latest` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/intelligence/behavioral-risk/[assessmentId]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/activate` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/draft-create` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/draft-update` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/list` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/review-submit` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/step-add` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/step-remove` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/step-reorder` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/step-update` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/version-create` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/playbooks/[playbookId]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/reports/export` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/responses/execute` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/responses/list` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/responses/[executionId]/rollback` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/responses/[executionId]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/soc/threat-map` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/social/analytics` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/social/feedback` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/api/social/feedback/[id]` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/beta-guide` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/business/listings/[id]/promote` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/business/marketing` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/business` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/business/social-accounts` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/deposits` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/gateway-transactions` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/live-pilot-training` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/live-webhook-monitor` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/payout-batches` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/payout-readiness` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/payouts` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/payouts/[id]` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/reconciliation` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/reconciliation/[id]` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/refund-readiness` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/refunds` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/refunds/[id]` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/finance/settlements` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/kyc` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/privacy` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/profile` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/accounts` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/analytics` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/approvals` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/approvals/[id]` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/content/new` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/content` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/content/[postId]/edit` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/feedback` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/feedback/[id]` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/dashboard/social/schedule` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/how-it-works` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/install-app` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/support` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |
| `/unauthorized` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | N/A |

### Admin & Governance (136 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/api/admin/ai-customer-service/analytics` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/categories` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/disputes/[id]/resolve` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/documents/verify` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/documents/[id]/approve` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/documents/[id]/reject` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/listings` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/listings/verify` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/listings/[id]/approve` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/listings/[id]/publish` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/listings/[id]/reject` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/listings/[id]` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/listings/[id]/unpublish` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/security/cases` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/security/cases/[caseId]/assignment` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/security/cases/[caseId]/evidence` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/security/cases/[caseId]/notes` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/security/cases/[caseId]` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/security/cases/[caseId]/status` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/security/events` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/users/[userId]/profile` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/api/admin/verify` | API_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/account-deletions` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/ai-customer-service` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/ai-logs` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/ai-settings` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/ai-v1-check` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/beta-dashboard` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/beta-invitations` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/beta-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/beta-users` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/bookings` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/categories` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/compliance` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/disputes` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/disputes/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/feedback` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/feedback/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/incident-response` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/issues` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/launch-announcements` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/listings` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/listings/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/listings/[id]/promote` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/marketing/campaigns/new` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/marketing/campaigns/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/marketing` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/mobile-analytics` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/privacy/consents` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/privacy` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/privacy/policies` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/privacy/requests` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/privacy/requests/[requestId]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/reports` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/alerts` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/approvals` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/approvals/[requestId]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/cases` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/cases/[caseId]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/intelligence/behavioral-risk` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/maintenance` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/playbooks` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/playbooks/[playbookId]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/reports` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/responses` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/responses/[executionId]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/rules` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/security/simulations` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/social-accounts` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/sop` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/sop/refund-review` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/support` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/support/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/support-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/system-logs` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/uat` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/uat/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/users` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/admin/users/[userId]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/listings` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/listings/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/prohibited-items/appeals` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/prohibited-items/appeals/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/prohibited-items/enforcement` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/prohibited-items/enforcement/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/prohibited-items` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/prohibited-items/policies` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/compliance/prohibited-items/policies/[id]` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/security` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/ai-logs` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/ai-settings` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/app-version` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/aws-deployment-dry-run` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/aws-operations-monitor` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/beta-categories` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/beta-controls` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/beta-dashboard` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/beta-invitations` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/beta-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/beta-users` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/data-cleanup` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/deposit-policy-review` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/finance-approval-settings` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/launch-categories` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/launch-controls` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/launch-monitor` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/legal-finance-review` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/legal-policy-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/live-payment-execution` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/live-payment-pilot` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/live-payment-runbook` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/live-pilot-smoke-test` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/live-pilot-training` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/marketing` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/mobile-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/payment-launch` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/payment-production-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/payment-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/paymongo-activation` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/phase19b-dry-run` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/pilot-participants` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/production-domain-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/release-candidate` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/reports` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/social-accounts` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/social-launch` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/social-readiness` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/system-backup` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/system-logs` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/v1-analytics` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/v1-launch` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |
| `/dashboard/super-admin/v1-smoke-test` | PAGE_ROUTE | INTERNAL_ONLY | ADMIN | N/A |

### Customer Service & AI (11 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/api/ai/chat` | API_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/contact` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/feedback` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help/ads-recommendations-transparency` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help/complaints-appeals` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help/intellectual-property` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help/marketplace-safety` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help/privacy` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help/trust-safety-legal/global-legal-compliance` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |
| `/help/trust-safety-legal` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search help, ask AI concierge, submit support ticket, give feedback |

### Payments, Deposits & Payouts (5 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/api/finance/upload` | API_ROUTE | ACTIVE_RESTRICTED | ALL_CUSTOMERS | pay rental fee, hold deposit, release deposit, request refund, disburse payout |
| `/api/payments` | API_ROUTE | ACTIVE_RESTRICTED | ALL_CUSTOMERS | pay rental fee, hold deposit, release deposit, request refund, disburse payout |
| `/api/webhooks/insurance/[partner]` | API_ROUTE | ACTIVE_RESTRICTED | ALL_CUSTOMERS | pay rental fee, hold deposit, release deposit, request refund, disburse payout |
| `/api/webhooks/paymongo/health` | API_ROUTE | ACTIVE_RESTRICTED | ALL_CUSTOMERS | pay rental fee, hold deposit, release deposit, request refund, disburse payout |
| `/api/webhooks/paymongo` | API_ROUTE | ACTIVE_RESTRICTED | ALL_CUSTOMERS | pay rental fee, hold deposit, release deposit, request refund, disburse payout |

### Insurance & Rental Protection (5 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/api/insurance/offers` | API_ROUTE | FEATURE_FLAGGED | ALL_CUSTOMERS | select insurance tier, file damage claim, check claim status |
| `/api/insurance/orders` | API_ROUTE | FEATURE_FLAGGED | ALL_CUSTOMERS | select insurance tier, file damage claim, check claim status |
| `/api/insurance/orders/[id]/issuance` | API_ROUTE | FEATURE_FLAGGED | ALL_CUSTOMERS | select insurance tier, file damage claim, check claim status |
| `/api/insurance/policies/[id]` | API_ROUTE | FEATURE_FLAGGED | ALL_CUSTOMERS | select insurance tier, file damage claim, check claim status |
| `/api/insurance/select` | API_ROUTE | FEATURE_FLAGGED | ALL_CUSTOMERS | select insurance tier, file damage claim, check claim status |

### Marketplace & Listings (3 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/browse` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search items, filter by category, view availability, select rental dates, checkout |
| `/checkout/[bookingId]` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search items, filter by category, view availability, select rental dates, checkout |
| `/listing/[id]` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | search items, filter by category, view availability, select rental dates, checkout |

### Provider Operations (20 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/dashboard/provider/bookings` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/bookings/[id]/claims/new` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/bookings/[id]/claims` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/bookings/[id]/inspection` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/bookings/[id]` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/bookings/[id]/return-inspection` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/bookings/[id]/turnover` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/ledger` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/listings/import` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/listings/new` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/listings` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/listings/[id]/edit` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/listings/[id]` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/listings/[id]/promote` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/marketing` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/onboarding-checklist` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/payouts` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/payouts/[id]/statement` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |
| `/dashboard/provider/social-accounts` | PAGE_ROUTE | ACTIVE | PROVIDER | create listing, view bookings, request payout, view ledger, connect social accounts |

### Renter Operations (8 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/dashboard/renter/bookings` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |
| `/dashboard/renter/bookings/[id]/claims` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |
| `/dashboard/renter/bookings/[id]/inspection` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |
| `/dashboard/renter/bookings/[id]` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |
| `/dashboard/renter/bookings/[id]/refund-request` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |
| `/dashboard/renter/onboarding-checklist` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |
| `/dashboard/renter` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |
| `/dashboard/renter/payments/[id]/receipt` | PAGE_ROUTE | ACTIVE | RENTER | view rental bookings, check payment status, view handover checklist |

### Trust, Safety & Legal (7 endpoints/routes)

| Route / Name | Type | Classification | Persona | Key Customer Actions |
|---|---|---|---|---|
| `/privacy/admin` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | review terms, check prohibited items, submit data subject request, set cookie preferences |
| `/privacy/cookies` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | review terms, check prohibited items, submit data subject request, set cookie preferences |
| `/privacy` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | review terms, check prohibited items, submit data subject request, set cookie preferences |
| `/privacy/request` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | review terms, check prohibited items, submit data subject request, set cookie preferences |
| `/prohibited-items` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | review terms, check prohibited items, submit data subject request, set cookie preferences |
| `/safety` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | review terms, check prohibited items, submit data subject request, set cookie preferences |
| `/terms` | PAGE_ROUTE | ACTIVE | ALL_CUSTOMERS | review terms, check prohibited items, submit data subject request, set cookie preferences |

## 3. Database Entity Surface (148 Models)

The application is backed by 148 Prisma models supporting the full rental lifecycle, financial ledgers, security/SOC event tracking, insurance binding, and AI knowledge grounding.

```text
User, UserMfa, MfaSessionAssurance, PasswordResetToken, PasswordResetRequest, UserSession, EmailCredential, AuthProviderIdentity, PhoneIdentity, PhoneVerificationChallenge, AuthRateLimit, AuthConsentReceipt, AuthIdentityEvent, Address, PsgcSubdivision, AddressApiRateLimit, UserProfile, BusinessProfile, Category, VerificationDocument, CategoryRequirement, Listing, ListingPhoto, ListingDocument, ListingImportJob, ListingImportSource, ListingImportField, ListingImportAsset, ListingImportResolution, ListingImportAuditEvent, Booking, BookingStatusHistory, Payment, GatewayTransaction, PaymentWebhookLog, PaymentReconciliationLog, PaymentActionLog, FinanceLedger, RentalAgreement, SystemSettings, InspectionReport, InspectionPhoto, TurnoverRecord, DamageClaim, DamageClaimPhoto, DisputeCase, DepositAction, Review, Notification, AuditLog, ApiSecurityLog, AIBotLog, SystemSetting, AuthenticationSecurityLog, SystemErrorLog, SocialAccount, MarketingCampaign, CampaignListingLink, CampaignTargetAccount, MarketingPost, CampaignApproval, PromotionAsset, UTMLink, CampaignAnalytics, ProviderPromotionOptIn, SocialPostQueue, SocialPublicationAttempt, AccountDeletionRequest, AppReleaseVersion, MobileAnalytics, BetaInvitation, BetaFeedback, IssueTicket, SupportTicket, UATFlow, RefundRequest, ProviderPayout, PayoutBatch, SecurityEvent, SecurityEventIngestionFailure, SecurityEventIngestionCheckpoint, DetectionRule, SecurityAlert, SecurityAlertEvidence, RuleEvaluationLog, DetectionEvaluationCheckpoint, IncidentCase, IncidentCaseHistory, IncidentCaseNote, IncidentCaseEvidence, SecurityResponsePlaybook, SecurityResponseStep, IncidentCasePlaybookLink, SecurityResponseApprovalRequest, SecurityResponseApprovalDecision, SecurityResponseApprovalGrant, SecurityResponseExecution, SecurityResponseAction, BehavioralRiskAssessment, BehavioralRiskSignal, BehavioralRiskEvidenceLink, SecurityEventGeoEnrichment, ProhibitedItemPolicy, ListingPolicyEvaluation, ListingEnforcementCase, ListingPolicyAppeal, PolicyChangeRecord, CookieConsentReceipt, DataSubjectRequest, InsurancePartner, InsuranceProduct, InsuranceOffer, InsuranceSelection, InsuranceOrder, InsurancePolicy, InsuranceReconciliationLog, InsuranceFinanceException, InsuranceClaim, InsuranceClaimEvidence, InsuranceWebhookEvent, PrivacyPolicyVersion, InsuranceConfig, AiServiceSession, AiConversation, AiMessage, AiSupportCase, AiCaseEntityLink, AiCaseEvidence, AiToolExecution, AiMediationRequest, AiPolicyDecision, AiResolution, AiFollowUp, AiInteractionFeedback, AiInteractionEvent, AiKnowledgeSource, AiKnowledgeChunk, AiProviderSession, SocialMetric, SocialAttribution, SocialProviderEvent, MarketingPostVersion, MarketingPostReview, SocialFeedback, SemanticLearningCandidate, CanonicalQuestionIntent, CanonicalQuestionAlias, CanonicalIntentAccessScope
```
