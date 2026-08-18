# RENTipid API Register

Next.js Route Handlers and the separately hosted Express API are both part of the application contract. A `410` migration stub is not counted as a functional endpoint.

| Domain | Route handlers / API families | Methods or behavior | Status / finding |
| --- | --- | --- | --- |
| Address | `/api/address/autocomplete`, `/api/address/details`, `/api/address/ph/cities`, `/api/address/ph/barangays`, `/api/address/ph/resolve` | POST/GET | CLOSED / FROZEN |
| Authentication | `/api/auth/[...nextauth]`, `/api/auth/register` | NextAuth handlers; POST | IN IMPLEMENTATION |
| Profile | `/api/profile`, `/api/profile/photo`, `/api/profile/change-password` | GET/PATCH; POST/DELETE; POST | IN IMPLEMENTATION |
| Listings | `/api/listings`, `/api/listings/[id]`, `/api/listings/[id]/documents`, `/api/listings/[id]/photos`, `/api/listings/[id]/submit` | GET/POST and lifecycle mutations | IN IMPLEMENTATION |
| Admin listings/categories | `/api/admin/categories`, `/api/admin/listings/[id]/verify` | GET/POST; GET/POST | IN IMPLEMENTATION |
| Documents/KYC | `/api/documents/upload`, `/api/documents/[id]`, `/api/admin/documents/[id]/verify` | Vercel upload/read stubs return 410; admin verify exists | IN IMPLEMENTATION |
| Bookings | `/api/bookings`, `/api/bookings/[id]/status`, `/api/bookings/[id]/agreement`, `/api/bookings/[id]/provider-agreement`, `/api/bookings/[id]/inspection`, `/api/bookings/[id]/renter-confirm`, `/api/bookings/[id]/turnover`, `/api/bookings/[id]/claims`, `/api/bookings/[id]/claims/[claimId]/respond` | GET/POST lifecycle | IN IMPLEMENTATION |
| Payments | `/api/payments` | GET/POST | IN IMPLEMENTATION |
| PayMongo webhook | `/api/webhooks/paymongo`, `/api/webhooks/paymongo/health` | POST; GET/POST health | IN IMPLEMENTATION |
| Application health | `/api/health` | GET; real database probe, non-cached 200/503 | LOCAL ACCEPTANCE PASS |
| Finance upload | `/api/finance/upload` | Vercel stub returns 410 | IN IMPLEMENTATION |
| Admin disputes | `/api/admin/disputes/[id]/resolve` | GET/POST | IN IMPLEMENTATION |
| Admin user mutation | `/api/admin/users/[id]/profile` | PATCH | IN IMPLEMENTATION |
| Privacy | `/api/privacy/consent`, `/api/privacy/cookies`, `/api/privacy/requests`, `/api/privacy/correction`, `/api/privacy/deletion`, `/api/privacy/export`, `/api/privacy/escalate` | GET/POST as applicable | LOCAL ACCEPTANCE PASS |
| AI | `/api/ai/chat` | GET/POST return 410 migration response | IN IMPLEMENTATION |
| SOC dashboard/events | `/api/soc/dashboard`, `/api/soc/events`, `/api/soc/events/[eventId]`, `/api/soc/threat-map` | Protected reads/actions | LOCAL ACCEPTANCE PASS |
| SOC cases | `/api/soc/cases`, `/api/soc/cases/[caseId]`, nested assignment/note/evidence/lifecycle actions | Protected lifecycle APIs | LOCAL ACCEPTANCE PASS |
| SOC playbooks | `/api/soc/playbooks/list`, `/api/soc/playbooks/[playbookId]`, version/review/activate actions | Protected lifecycle APIs | LOCAL ACCEPTANCE PASS |
| SOC approvals/responses | `/api/soc/approvals/list`, `/api/soc/approvals/[requestId]`, `/api/soc/responses`, `/api/soc/responses/[executionId]` and action routes | Protected separation-of-duties APIs | LOCAL ACCEPTANCE PASS |
| SOC intelligence/reports | `/api/soc/intelligence/behavioral-risk/latest`, `/history`, `/[assessmentId]`, `/api/soc/reports` | Protected reads/reports | LOCAL ACCEPTANCE PASS |
| Admin security | `/api/admin/security/events`, `/api/admin/security/cases`, `/api/admin/security/cases/[caseId]` and administrative action routes | Protected SOC administration | LOCAL ACCEPTANCE PASS |
| Express health | `/health/live`, `/health/ready` | GET; liveness plus real database probe | LOCAL ACCEPTANCE PASS |
| Express marketplace | `/api/listings`, `/api/bookings`, prohibited-item enforcement families | REST via `apps/api` | IN IMPLEMENTATION: deployment/parity acceptance missing |
| Express uploads/AI | document, finance-upload and AI families under `apps/api` | REST intended to replace 410 Vercel routes | IN IMPLEMENTATION: production compute runtime unproven |

## Required API reconciliation work

1. Correct the existing Express API TypeScript baseline before its package can be promoted.
2. Decide and document one authoritative runtime for every 410-migrated endpoint.
3. Prove ownership/IDOR and role enforcement for every mutation family.
4. Add the missing password reset, messaging, notification, review, support and feedback contracts.
5. Preserve Address and historically frozen security/privacy API behavior unless an explicit change record is opened.
