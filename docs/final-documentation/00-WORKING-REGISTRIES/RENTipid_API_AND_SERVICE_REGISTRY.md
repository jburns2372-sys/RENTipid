# RENTipid API and Service Registry

Status: `FROZEN_WORKING_REGISTRY`

Inventory: `65` root Next.js API route files. Method labels reflect current
exports; several marketplace routes are compatibility/proxy wrappers, so
their downstream Azure handler remains the behavioral authority.

| API group | Count | Current route surface |
| --- | ---: | --- |
| Admin | 12 | `/api/admin/categories`; `/api/admin/disputes/[id]/resolve`; `/api/admin/documents/verify`; `/api/admin/listings/verify`; `/api/admin/security/cases`; `/api/admin/security/cases/[caseId]`; case assignment/evidence/notes/status children; `/api/admin/security/events`; `/api/admin/verify` |
| AI | 1 | `/api/ai/chat` |
| Authentication | 2 | `/api/auth/[...nextauth]`; `/api/auth/register` |
| Bookings | 9 | `/api/bookings`; agreement, claims/respond, inspection/renter-confirm, provider-agreement, status, turnover children |
| Documents | 2 | `/api/documents/[id]`; `/api/documents/upload` |
| Finance | 1 | `/api/finance/upload` |
| Listings | 4 | `/api/listings`; documents, photos, submit children |
| Payments | 1 | `/api/payments` |
| Privacy | 4 | `/api/privacy/consent`; correction; deletion; export |
| SOC approvals | 7 | request detail; approve; cancel; list; reject; revoke; submit |
| SOC dashboard/intelligence | 5 | `/api/soc/dashboard`; behavioral-risk latest/history/detail; `/api/soc/threat-map` |
| SOC playbooks | 11 | detail/list plus activate, draft create/update, review submit, step add/remove/reorder/update, version create |
| SOC responses | 4 | response detail/list; execute; rollback |
| Webhooks | 2 | `/api/webhooks/paymongo`; health |

## Primary Service Families

| Service family | Paths | Contract |
| --- | --- | --- |
| Authentication | `src/lib/auth.ts`, registration/security helpers | Session, role, input and telemetry controls |
| Marketplace | booking/listing/payment libraries and root APIs | Current monolith plus transitional Azure proxy behavior |
| Privacy | `src/lib/privacy`, privacy APIs | Consent, correction, export, deletion controls |
| AI | `src/lib/ai`, AI API; `apps/api/src/services/aiService.ts` | Guarded advisory/generation behavior; provider modes |
| SOC events/detection | `src/lib/security/events`, `rules`, `detection` | Normalize, deduplicate, evaluate, alert, recover |
| SOC cases | `src/lib/security/cases` | RBAC, lifecycle, notes/evidence, API handlers |
| SOC playbooks/approvals | `src/lib/security/playbooks`, `approvals` | Versioned playbooks, review, approval, scoped grants |
| SOC responses | `src/lib/security/responses/execution.service.ts` | Approved reversible execution, NOOP simulation, rollback |
| SOC dashboard | `src/lib/security/dashboard` | Read-only KPI/feed/response projections |
| Behavioral risk | `src/lib/security/intelligence` and SOC APIs | Investigation and handoff reads |
| Geolocation | `src/lib/security/geolocation`, threat-map API | Privacy-safe enrichment and map output |
| Extracted Azure API | `apps/api/src` | Health, documents, listings, bookings, payments, webhooks, services |
| Worker | `apps/worker/src` | Scheduled/background job entry points |

API documentation rules:

- authentication/authorization and sanitized error behavior are part of the
  contract;
- POST presence does not authorize production use;
- payment endpoints remain subject to Phase 19 NO-GO/live-mode controls;
- route wrappers marked for Azure migration are transitional;
- no dedicated SOC reports export API was found.

Canonical manual cross-reference: `../04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md`
and Master Parts XVI and XXII.
