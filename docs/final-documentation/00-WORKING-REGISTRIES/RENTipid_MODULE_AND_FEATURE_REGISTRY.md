# RENTipid Module and Feature Registry

Status: `FROZEN_WORKING_REGISTRY`

| Domain | Primary implementation | Current documentation status | Important boundary |
| --- | --- | --- | --- |
| Identity/session | `src/lib/auth.ts`, auth API, registration pages | Implemented | NextAuth remains on Vercel in split target |
| Profiles/account lifecycle | profile, account deletion, privacy services | Implemented with limitations | Profile editing UI is coming soon; account deletion is controlled |
| KYC/compliance | KYC pages, verification documents, admin/compliance review | Implemented workflow surface | Storage/backend transition remains environment-dependent |
| Listings/catalog | listing pages, listing services, photos/documents/categories | Implemented | Publication/verification remains role-controlled |
| Booking/rental lifecycle | booking services/pages, agreement, turnover, inspections, claims | Implemented | Exact states come from Prisma/current services |
| Payments | checkout, payment library, PayMongo webhook/reconciliation | Implemented in guarded modes | Phase 19 is complete NO-GO; live activation is not authorized |
| Finance operations | finance dashboards, ledger, refunds, payouts, deposits, settlement | Implemented operator surfaces | Real money actions remain gated/manual/disabled where labeled |
| Reviews/notifications | Prisma models and application surfaces | Implemented supporting domain | Use current route/service evidence |
| Admin operations | admin and super-admin dashboards | Mixed implemented/readiness surfaces | A dashboard route may be a readiness checklist, not active infrastructure |
| Privacy/data rights | `src/lib/privacy`, `/api/privacy/*`, account deletion | Implemented controls | Export/deletion/correction require authorization and auditing |
| Support/UAT/beta | support tickets, feedback, issues, UAT, beta controls | Implemented | Beta/release labels remain authoritative |
| Marketing/social | social services, campaigns, promotion pages | Partially implemented | Provider campaign analytics is explicitly coming soon |
| AI assistant | `src/lib/ai`, AI routes/components/settings | Guarded implementation | Mock/disabled/provider modes; AI cannot make prohibited decisions |
| Mobile/PWA | manifest/PWA/Capacitor configuration and readiness pages | Implemented packaging/readiness | Store publication is not implied |
| SOC telemetry/detection | security event writers/adapters/rules/evaluator | Complete accepted capability | Privacy-safe, lifecycle-aware, test-guarded |
| SOC incident cases | cases service/API/UI | Complete and frozen | Gate 4F authority |
| SOC playbooks/approvals | lifecycle services/APIs/UIs | Complete and frozen | Gate 4G authority and separation of duties |
| SOC responses | execution, rollback, response API/UI | Complete and frozen | Reversible approved scope only |
| SOC controlled simulation | Gate 4I service/test and command-center visibility | Complete and frozen capability | Standalone simulations page is only a navigation shell |
| SOC reporting | no dedicated generator/export service found | Not in approved baseline | Standalone reports page is planned, not implemented |
| SOC maintenance/recovery | runbook, response UAT, recovery/backfill/checkpoints | Complete and frozen capability | Standalone maintenance page is planned, not required |
| Behavioral risk | intelligence services/API/UI | Complete/frozen by Phase 5 slices | Read-only investigation/handoff boundaries apply |
| Threat map/geolocation | threat-map API/UI and Phase 6A evidence | Implemented/frozen | Privacy-safe IP handling/provider modes |
| Root web runtime | Next.js application | Current | 163 page routes and 65 API route files |
| Extracted API | `apps/api` | Transitional/current implementation | Azure target; does not prove deployment |
| Worker | `apps/worker` | Transitional/current implementation | Azure job target; operational state not inferred |
| Infrastructure | Terraform root/modules/environments | Defined, partially evolving | Plan/apply/provisioning not authorized by documentation |

Completion premise:

`EVERY_APPROVED_MODULE_AND_PHASE` is documented according to its accepted
status. Optional, future, readiness, placeholder, and NO-GO surfaces remain
visible without being promoted to completed features.

Canonical manual cross-reference: `../01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md`
Parts III–XXII.
