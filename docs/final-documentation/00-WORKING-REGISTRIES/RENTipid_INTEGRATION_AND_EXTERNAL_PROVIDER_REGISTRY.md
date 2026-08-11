# RENTipid Integration and External Provider Registry

Status: `FROZEN_WORKING_REGISTRY`

| Integration | Current evidence | Status/treatment |
| --- | --- | --- |
| Vercel | Next.js runtime, Owner-verified project `ren-tipid`, domains `www.rentipid.com.ph` and `ren-tipid.vercel.app` | Frontend/auth target; verification does not authorize deployment |
| Azure Container Apps | Terraform compute modules, `apps/api`, `apps/worker` | Target backend/worker runtime; definitions are not provisioning proof |
| Azure Database for PostgreSQL | Terraform database module, Prisma PostgreSQL datasource | Approved target/readiness path; production data state not inferred |
| Azure Blob Storage | storage module and `apps/api/src/services/blobService.ts` | Managed-identity/user-delegation implementation in current worktree; deployment not inferred |
| Azure Key Vault | Terraform/root and `apps/api/src/utils/secrets.ts` | Secret provider boundary; secret values excluded from documentation |
| Azure Application Insights | monitoring/compute and API middleware | Telemetry integration defined; current provisioning must be independently verified |
| Azure OpenAI | extracted API AI service/package | Optional/provider-configured; credentials and deployment availability not assumed |
| Azure AI Search | extracted API dependencies/config names | Planned/configured integration; active index not proven |
| PayMongo | root and extracted webhook/payment services | Sandbox/mock/readiness support; Phase 19 live activation remains NO-GO |
| NextAuth | root auth API and `src/lib/auth.ts` | Authentication remains on Vercel in target split |
| PostgreSQL/Prisma | schema, migrations, database guards | Application persistence; no database queried during documentation |
| MaxMind GeoIP | geolocation provider abstraction/package | Provider can be disabled/fixture/database; privacy rules apply |
| Social platforms | social account/campaign services | Account/promotion workflow; external publication depends on provider authorization |
| Capacitor/PWA | Capacitor config, manifest/service-worker tooling | Mobile/PWA packaging; store publication not implied |
| Email/SMTP | production template variable names | Provider/config contract only; active delivery not proven |
| GitHub Actions | workflow definitions | CI/release automation code; run status not inferred |

Architecture classification:

`AUTHORITATIVE_ARCHITECTURE_DIRECTION: VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`

`CURRENT_REPOSITORY_RUNTIME_TRANSITION_STATE: PARTIALLY_SPLIT_IMPLEMENTATION`

`AZURE_PROVISIONING_OR_DEPLOYMENT_AUTHORIZED_BY_DOCUMENTATION: NO`

Superseded architecture:

- AWS/PM2 materials are `SUPERSEDED_ARCHITECTURE_HISTORY` and must not be
  presented as the current target;
- AWS-labeled readiness screens remain route artifacts, not current
  architecture authority.

External-state rule: local code and Terraform establish intent/capability, not
that a cloud resource, credential, provider account, or production connection
currently exists.

Canonical manual cross-reference: `../04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md`,
`../03-OPERATIONS-MANUALS/RENTipid_OPERATIONS_MANUAL.md`, and Master Chapters
167 and 225–234.
