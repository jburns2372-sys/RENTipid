# RENTipid Documentation Evidence Index

## Method

Major claims in the canonical package must map to current implementation,
schema, test, accepted report, or frozen registry evidence. `CURRENT` describes
repository implementation; `ACCEPTED_FROZEN` describes formal accepted status;
`OWNER_VERIFIED` describes a non-secret Owner declaration; `TARGET_ONLY`
describes direction/definition without deployment proof.

| Evidence ID | Document / chapter | Major claim | Repository path | Symbol, route, model, test, or report | Verification | Limitation |
| --- | --- | --- | --- | --- | --- | --- |
| E-001 | Master Ch. 2 | RENTipid is a multi-role rental marketplace | `src/app`, `prisma/schema.prisma` | public, renter, provider, booking/listing models | `CURRENT` | Deployment not inferred |
| E-002 | Master Ch. 4 | Source-authority hierarchy governs conflicts | `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_SOURCE_AUTHORITY_AND_CONFLICT_REGISTER.md` | hierarchy/conflict table | `CURRENT_DOCUMENTATION_EVIDENCE` | Does not rewrite history |
| E-003 | Master Ch. 5 | Completion premise verified | `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/RENTipid_SOC_PLACEHOLDER_SCOPE_RECONCILIATION.md` | Decision A, 20 checks | `ACCEPTED_RECONCILIATION` | Status-classified completion |
| E-004 | Master Ch. 7 | Direction is Vercel frontend with Azure backend/services | `docs/phase19b`, final deployment registry | Phase 19B direction/status | `FINAL_ACCEPTED_GOVERNANCE` | Not deployment proof |
| E-005 | Master Ch. 8 | Repository is partially split | `src/app/api`, `apps/api`, `apps/worker` | coexisting root/extracted boundaries | `CURRENT` | Runtime routing is transitional |
| E-006 | Master Ch. 10 | Database migration separately governed | Phase 19B governance; final phase register | `PENDING_SEPARATE_OWNER_DECISION` | `FINAL_ACCEPTED_GOVERNANCE` | No migration performed |
| E-007 | Master Ch. 10/94 | Payment activation not authorized | `docs/phase19`, phase registry | Phase 19 final NO-GO | `ACCEPTED_FROZEN` | Code/readiness does not override |
| E-008 | Master Ch. 11 | Ten application role classes documented | `src/lib/security/permissions.ts`, auth/role evidence | role and permission matrices | `CURRENT_AND_ACCEPTED` | Actual assignments not inspected |
| E-009 | Master Ch. 21 | Public registration cannot grant privileged roles | `src/app/api/auth/register/route.ts`, `src/lib/auth.ts` | registration/auth guards | `CURRENT` | No live account tested |
| E-010 | Master Ch. 25 | Profile read works; editing limited | `src/app/dashboard/profile/page.tsx` | coming-soon edit control | `CURRENT` | `IMPLEMENTED_READ_ONLY_WITH_EDIT_LIMITATION` |
| E-011 | Master Ch. 27–28 | KYC/document review surface exists | `src/app/dashboard/kyc`, admin verification APIs | `VerificationDocument` | `CURRENT` | Storage/provider state external |
| E-012 | Master Ch. 29 | Four privacy API families exist | `src/app/api/privacy` | consent/correction/deletion/export routes | `CURRENT` | Exact requests remain authorized |
| E-013 | Master Ch. 31–40 | Public discovery/guidance routes exist | `src/app` | `/`, `/browse`, `/listing/[id]`, help/legal routes | `CURRENT` | Route presence not availability proof |
| E-014 | Master Ch. 41–50 | Listing lifecycle is implemented | `src/app/dashboard/provider/listings`, `src/app/api/listings` | Listing/Photo/Document services/routes | `CURRENT` | Publication remains controlled |
| E-015 | Master Ch. 50 | Provider analytics incomplete | `src/app/dashboard/provider/marketing/page.tsx` | coming-soon campaign analytics | `CURRENT` | Core marketing not generalized to analytics |
| E-016 | Master Ch. 51–62 | Booking lifecycle exists | `src/app/api/bookings`, booking pages/services | Booking and BookingStatusHistory | `CURRENT` | Use exact service states |
| E-017 | Master Ch. 63–72 | Agreement/turnover/inspection flow exists | booking child APIs and dashboard routes | RentalAgreement, TurnoverRecord, InspectionReport | `CURRENT` | Participant/state scoped |
| E-018 | Master Ch. 73–82 | Claims/disputes are human-reviewed workflows | claims APIs/pages, admin dispute route | DamageClaim, DisputeCase | `CURRENT` | Finance effects separate |
| E-019 | Master Ch. 83–93 | Payment/webhook/reconciliation code exists | `src/lib/payments`, webhook API | Payment, GatewayTransaction, payment logs | `CURRENT` | Live activation NO-GO |
| E-020 | Master Ch. 87–90 | Signature/idempotency/amount checks have test evidence | `tests/security/events`, checkout tests | PayMongo/reconciliation suites | `CURRENT_TEST_EVIDENCE` | Historical/current dirty scope disclosed |
| E-021 | Master Ch. 95–104 | Finance operator surfaces exist | `src/app/dashboard/finance`, provider payout routes | FinanceLedger, RefundRequest, ProviderPayout | `CURRENT` | UI does not authorize money movement |
| E-022 | Master Ch. 105–113 | Admin/support/UAT/readiness surfaces exist | `src/app/dashboard/admin`, super-admin routes | SupportTicket, UATFlow, BetaInvitation | `CURRENT` | Readiness not release proof |
| E-023 | Master Ch. 114 | Admin reports have placeholder exports | `src/app/dashboard/admin/reports/page.tsx` | metrics plus CSV/AI placeholders | `CURRENT` | Super-admin delegates/inherits |
| E-024 | Master Ch. 115–124 | Audit/privacy models and services exist | `src/lib/privacy`, `prisma/schema.prisma` | AuditLog and security/error log models | `CURRENT` | No records inspected |
| E-025 | Master Ch. 125–132 | Marketing/social domain exists | marketing/social services and schema | campaign/account/post/queue models | `CURRENT` | External publication unverified |
| E-026 | Master Ch. 133–134 | PWA/Capacitor readiness exists | manifest/service-worker/Capacitor config | install/mobile-readiness routes | `CURRENT` | Store publication unproven |
| E-027 | Master Ch. 135–140 | Guarded AI implementation exists | `src/lib/ai`, `/api/ai/chat`, `apps/api/src/services/aiService.ts` | AI services/settings/logs | `CURRENT` | Provider availability/mode dependent |
| E-028 | Master Ch. 141 | Standalone digital-human runtime is not proven | module/integration registries | absence classification | `CURRENT_EVIDENCE_LIMITATION` | No avatar/voice/biometric claim |
| E-029 | Master Ch. 145 | Schema contains 79 models/29 enums | `prisma/schema.prisma` | schema inventory | `CURRENT` | No database access |
| E-030 | Master Ch. 157 | Root contains 65 API route files | `src/app/api/**/route.ts` | frozen API inventory | `CURRENT` | Some are transitional wrappers |
| E-031 | Master Ch. 169–178 | Security control families have implementation/evidence | security registry; `src/lib/security`; accepted Level 5 reports | auth/RBAC/upload/crypto/audit/payment guards | `CURRENT_AND_ACCEPTED` | Production posture not inferred |
| E-032 | Master Ch. 179–183 | Privacy-safe event ingestion/recovery exists | `src/lib/security/events` | writers, adapters, failures, checkpoints | `CURRENT_AND_ACCEPTED` | Current data not inspected |
| E-033 | Master Ch. 184–187 | Detection and alert lifecycle exists | `src/lib/security/rules`, `detection` | DetectionRule, evaluator, SecurityAlert | `CURRENT_AND_ACCEPTED` | Exact activated rules external/data state |
| E-034 | Master Ch. 188 | Behavioral risk is frozen read-oriented intelligence | `src/lib/security/intelligence`, Phase 5 evidence | latest/history/detail/handoff | `ACCEPTED_FROZEN` | No autonomous enforcement |
| E-035 | Master Ch. 189 | Threat map uses privacy-safe provider modes | `src/lib/security/geolocation`, threat-map API | Phase 6A evidence | `ACCEPTED_FROZEN` | Provider availability unverified |
| E-036 | Master Ch. 190 | SOC command-center read surface exists | SOC dashboard service/API/component | dashboard UI test/report | `CURRENT_AND_ACCEPTED` | Mutation services remain separate |
| E-037 | Master Ch. 191–196 | Incident case lifecycle frozen | `src/lib/security/cases`, Gate 4F reports/tests | case APIs/models | `ACCEPTED_FROZEN` | Evidence remains access-controlled |
| E-038 | Master Ch. 197–202 | Playbook/approval lifecycle frozen | `src/lib/security/playbooks`, `approvals`, Gate 4G | services/APIs/tests | `ACCEPTED_FROZEN` | Activation is not execution |
| E-039 | Master Ch. 203–211 | Reversible response/rollback frozen | `src/lib/security/responses/execution.service.ts`, Gate 4H | execute/rollback APIs/tests | `ACCEPTED_FROZEN` | Approved reversible scope only |
| E-040 | Master Ch. 212–213 | Controlled simulation frozen; page is shell | Gate 4I report/test and simulations page | nine scenarios; placeholder page | `ACCEPTED_FROZEN_WITH_ROUTE_LIMITATION` | Standalone page not implemented |
| E-041 | Master Ch. 214 | Dedicated SOC reporting not implemented/required | SOC reports page and reconciliation | no generator/export API/test | `CURRENT_EVIDENCE_LIMITATION` | `NOT_APPLICABLE` to Phase 4 baseline |
| E-042 | Master Ch. 215–224 | Maintenance/recovery capability frozen | Gate 4J report/runbook; recovery/backfill jobs/tests | leases/checkpoints/UAT | `ACCEPTED_FROZEN` | Maintenance page planned only |
| E-043 | Master Ch. 225 | Vercel project/domain identity Owner-verified | final deployment registry / Owner response | `ren-tipid`, public domains | `OWNER_VERIFIED` | No live/admin access here |
| E-044 | Master Ch. 226–233 | Azure resources are target definitions | `apps/api`, `apps/worker`, `infrastructure` | Container Apps/PostgreSQL/Blob/Key Vault/monitoring | `TARGET_ONLY` | No provisioning/deployment authority |
| E-045 | Master Ch. 228 | Parallel network CIDRs documented | deployment registry / Phase 19B network response | VNet `10.219.0.0/20`, ACA `/23`, PE `/24` | `OWNER_VERIFIED_DESIGN` | Not provisioned by documentation |
| E-046 | Master Ch. 232 | 52 code names vs 19 template names | configuration registry | configuration-name inventory | `CURRENT` | Values excluded; review required |
| E-047 | Master Ch. 234 | AWS/PM2 is superseded history | source conflict and integration registries | AWS-named routes/history | `FINAL_DOCUMENTATION_CLASSIFICATION` | Retained only for traceability |
| E-048 | Master Ch. 235 | Test inventory contains 142 files | test registry | 135 security, 3 checkout, 3 e2e, 1 privacy | `CURRENT_FILE_INVENTORY` | Presence not pass |
| E-049 | Master Ch. 239 | Phase 4/Level 5 frozen evidence remains operative | phase registry and freeze/closure reports | 4F–4J, Level 5, behavior, 6A | `ACCEPTED_FROZEN` | No automatic reopening |
| E-050 | Master Ch. 240 | Phase 19 complete NO-GO frozen | `docs/phase19`, phase registry | final Phase 19 report | `ACCEPTED_FROZEN` | Payment activation prohibited |
| E-051 | Master Ch. 241 | Phase 19B complete with separate decisions reserved | `docs/phase19b`, canonical phase register | final status/direction | `FINAL_ACCEPTED_GOVERNANCE` | Deployment/migration/cutover not implied |
| E-052 | Master Ch. 246 | Eighteen limitations are disclosed | known-gap registry | GAP-001–GAP-018 | `CURRENT_DOCUMENTATION_EVIDENCE` | Operational blockers differ by action |

## Evidence Coverage Result

Major claims indexed: `52`

Implementation claims with evidence: `100%`

Unsupported major claims: `0`

## Gemini Editorial Correction Traceability

The Gemini review introduced no factual claim or classification change. Its
seven authorized editorial findings map to the correction execution register:
`RENTipid_GEMINI_CORRECTION_EXECUTION_REGISTER.md`.

| Finding | Existing evidence IDs preserved | Editorial effect |
| --- | --- | --- |
| F-001 | E-013, E-016–E-018 | User procedure indentation/navigation only |
| F-002 | E-007, E-019–E-021, E-050 | Payment boundary consolidated; status unchanged |
| F-003 | E-031–E-042 | SOC escalation spelling/heading normalization only |
| F-004 | E-007, E-019–E-021 | Developer checklist presentation only |
| F-005 | E-001, E-004–E-005 | Diagram-label spacing only |
| F-006 | E-013, E-016–E-018 | Internal navigation repaired; claim content unchanged |
| F-007 | E-004–E-007, E-051 | Phase 19B wording consolidated; statuses unchanged |

Gemini review status:
`GEMINI_EDITORIAL_REVIEW_PASSED_WITH_NON_BLOCKING_CORRECTIONS`

Authorized automatic corrections: `7`

Automatic corrections applied: `7/7`

Factual classifications changed: `0`
