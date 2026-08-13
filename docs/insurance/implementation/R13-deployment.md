# R13 — DEPLOYMENT REGISTRY

Future promotion requirements:

## LOCAL
- **Env Vars**: `INSURANCE_MOCK_ENABLED=true`
- **Adapter Config**: Pointed to MockInsuranceAdapter
- **Feature Flags**: `NEXT_PUBLIC_FEATURE_INSURANCE=true`
- **Database Migrations**: Apply standard insurance schema
- **Kill Switch**: `false`

## PREVIEW
- **Env Vars**: `INSURANCE_MOCK_ENABLED=true` OR sandbox credentials
- **Adapter Config**: Mock or Sandbox
- **Feature Flags**: `NEXT_PUBLIC_FEATURE_INSURANCE=true`
- **Kill Switch**: `false`

## PRODUCTION
- **Env Vars**: `INSURANCE_PROVIDER_API_KEY=[SENSITIVE]`, `INSURANCE_WEBHOOK_SECRET=[SENSITIVE]`
- **Adapter Config**: Real Partner Adapter (e.g., Igloo/Etiqa)
- **Feature Flags**: Controlled rollout (percentage or specific users)
- **Rollback**: Disable feature flag; trigger kill switch
- **Kill Switch**: Configurable in Super Admin dashboard
- **Database Migrations**: Live deployment

## Technical Foundation Slice 1 Preview Record (2026-08-12)

This record is authoritative for the closed Slice 1 scope and supersedes the
generic Preview activation example above for this fail-closed deployment.

- Deployment ID: dpl_CAZtitCnmuRL2hdf9hEjfT5gxukS.
- Deployment URL:
  https://ren-tipid-dr9tqs391-jburns2372-sys-projects.vercel.app.
- Environment/status: Preview / READY.
- Branch: feature/soc-phase4-threat-response.
- Commit: 2ff068991950de64e3bf0931ed76a5650217dbe2.
- Database: dedicated Preview baseline; 38 migrations; schema up to date.
- Insurance configuration: Insurance disabled, live issuance disabled, Mock
  disabled and kill switch active.
- Build/runtime: PASS; public, auth-session and application route checks returned
  HTTP 200; relevant runtime error/fatal findings 0.
- Production deployment/database action: NONE.

### Slice 1 Rollback / Recovery

1. Keep Insurance disabled and the kill switch active.
2. Roll the Preview alias back to the last accepted deployment if deployment
   behavior regresses.
3. Rebuild only the disposable Preview database from the authoritative migration
   chain if Preview schema/history becomes invalid.
4. Do not roll back or mutate Production as part of a Preview recovery.

## Transaction Block Promotion Attempt (2026-08-12)

- Scoped commit: 6e22684907487d961146661547f29badbcd59dc9.
- Push to feature/soc-phase4-threat-response: PASS.
- Preview Insurance safety configuration: PASS.
- Preview database migration/deployment acceptance: BLOCKED before database
  access because DATABASE_URL and NEXTAUTH_SECRET resolve to non-operational
  placeholders.
- Preview database writes: 0.
- Production actions: 0.
