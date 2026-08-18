# RENTipid Repository Evidence Registry

Status: `FROZEN_WORKING_REGISTRY`

| Evidence ID | Current path | Evidence role | Classification |
| --- | --- | --- | --- |
| REPO-001 | `src/app` | Next.js page and route surface | Primary current implementation |
| REPO-002 | `src/components` | UI components by domain | Primary current implementation |
| REPO-003 | `src/lib` | Root application services and policies | Primary current implementation |
| REPO-004 | `apps/api` | Extracted Azure API application | Current transitional implementation |
| REPO-005 | `apps/worker` | Extracted Azure worker | Current transitional implementation |
| REPO-006 | `prisma/schema.prisma` | 79-model database and 29-enum state contract | Primary data contract |
| REPO-007 | `prisma/migrations` | Migration history | Primary schema history; modification prohibited |
| REPO-008 | `tests` | 142 Jest/Playwright test/spec files | Primary validation evidence |
| REPO-009 | `infrastructure` | Azure Terraform definitions | Current desired-state code; not proof of provisioning |
| REPO-010 | `.github/workflows` | CI/release workflows | Current automation evidence |
| REPO-011 | `.env.production.example` | Production variable-name template | Names only; never a secret source |
| REPO-012 | `package.json` | Root scripts and dependency contract | Primary build/runtime evidence |
| REPO-013 | `docs/security/phase4` | SOC Phase 4 plans, gates, evidence, final UAT, runbook | Accepted SOC authority |
| REPO-014 | `docs/security/level5` | Level 5 evidence and authorization | Accepted security authority |
| REPO-015 | `docs/governance/phase-freeze` | Strict freeze manifests | Higher-priority frozen status authority |
| REPO-016 | `docs/governance/phase-closure` | Closure reports | Higher-priority accepted status authority |
| REPO-017 | `docs/governance/phase-audit` | Cross-phase audit registries | Audit aid; resolve conflicts against freeze/closure records |
| REPO-018 | `docs/phase19` | Live-payment pilot evidence | Current Phase 19 authority |
| REPO-019 | `docs/phase19b` | Azure/Vercel readiness and R-series evidence | Current Phase 19B authority |
| REPO-020 | `docs/RENTipid-Master-Manual` | Earlier generated manual | Historical secondary source; not current truth |
| REPO-021 | `docs/final-documentation` | Reconciled final documentation | Current documentation output |

Inventory counts at freeze:

- page routes: `163`;
- API route files: `65`;
- Prisma models: `79`;
- Prisma enums: `29`;
- test/spec files: `142` (`135` security, `3` checkout, `3` e2e,
  `1` privacy).

Evidence exclusions:

- `.next`, `node_modules`, generated caches, ZIP evidence packages, local
  uploads, and secret-bearing environment files are not documentation sources;
- infrastructure declarations do not prove deployed resource state;
- a route filename does not prove an accepted complete module;
- earlier manuals do not override current code or accepted freeze evidence.

Canonical manual cross-reference: `../06-DEVELOPER-HANDOVER/RENTipid_DEVELOPER_HANDOVER_MANUAL.md`
and Master Chapters 1–10 and 245.
