# Phase 3 Evidence Matrix

| Gate | Scope | Relevant Files | Models | Migrations/Constraints | Auth Boundary | Audit Evidence | Focused Tests | Accepted Result | Source Changed | Evidence Reusable | Gap Classification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3A | Rule-domain and lifecycle foundation | `prisma/schema.prisma` | DetectionRule, SecurityDomain, RuleStatus | Initial Schema | - | - | - | PASS | NO | YES | NO_GAP |
| 3B | Storage and validation foundation | CRUD services, basic validation | DetectionRule | - | Initial rules | - | - | PASS | NO | YES | NO_GAP |
| 3C | Schema, enum and constraint corrections | `prisma/schema.prisma` | DetectionRule | `QUARANTINED` check constraint | - | - | - | PASS | NO | YES | NO_GAP |
| 3C-R1 | Schema constraint fix | `prisma/schema.prisma` | DetectionRule | Corrected `QUARANTINED` check constraint | - | - | - | PASS | NO | YES | NO_GAP |
| 3D | Typed DSL schema, validation & contract | `src/lib/security/rules/dsl/*` | - | - | - | - | DSL validators | PASS | NO | YES | NO_GAP |
| 3E | Controlled rule-evaluation worker | Evaluator services | SecurityEvent, DetectionRule | - | - | - | Evaluator tests | PASS | NO | YES | NO_GAP |
| 3F | Alert generation & protected review | Alert services | SecurityAlert | - | Alert view | - | Alert gen tests | PASS | NO | YES | NO_GAP |
| 3G | Controlled initialization of DRAFT rules | `rule-initialization.service.ts`, `actions.ts`, `gate3g-initialization.test.ts` | DetectionRule, AuditLog | - | Super Admin only | Atomic AuditLog creation | 36/36 | PASS (6eb4669) | NO | YES | NO_GAP |

**Gate 3G Accepted Evidence:**
- TypeScript passed
- Scoped ESLint passed
- 36/36 focused tests passed
- PostgreSQL rollback passed
- Residual triggers/functions: 0
- Production was not queried or mutated
- Commit: 6eb46699b2e6a343dd3dcfa1ac9ea39f934483ff
- Tag: rentipid-soc-gate3g-complete
