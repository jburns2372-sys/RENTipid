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
