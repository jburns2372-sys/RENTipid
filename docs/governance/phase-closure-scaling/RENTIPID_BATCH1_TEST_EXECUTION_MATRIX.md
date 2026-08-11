# Batch 1 Test Execution Matrix

Command: `npm run test:soc:integration -- tests/security/cases/gate4f-slice-c2-s2-schema-amendment.integration.test.ts tests/security/cases/gate4f-slice-c2-s4-r2-lifecycle-reconciliation.integration.test.ts tests/security/cases/gate4f-slice-c2-s6-case-writers.integration.test.ts tests/security/cases/gate4f-slice-c3-case-rbac.integration.test.ts tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts`

Output:
```

> rentipid@0.1.0 test:soc:integration
> npm run test:db:guard && cross-env NODE_ENV=test SECURITY_TELEMETRY_HMAC_KEY=0123456789abcdef0123456789abcdef SOC_CORRELATION_HMAC_KEY=0123456789abcdef0123456789abcdef dotenv -e .env.test.local -e .env.test -- jest --runInBand tests/security/cases/gate4f-slice-c2-s2-schema-amendment.integration.test.ts tests/security/cases/gate4f-slice-c2-s4-r2-lifecycle-reconciliation.integration.test.ts tests/security/cases/gate4f-slice-c2-s6-case-writers.integration.test.ts tests/security/cases/gate4f-slice-c3-case-rbac.integration.test.ts tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts


> rentipid@0.1.0 test:db:guard
> cross-env NODE_ENV=test dotenv -e .env.test.local -e .env.test -- tsx scripts/run-test-database-guard.ts

TARGET_HOST_CLASSIFICATION:
LOCALHOST
TARGET_DATABASE:
rentipid_test_soc
TARGET_ENVIRONMENT:
TEST
PRODUCTION_TARGET:
NO
LOCAL_ISOLATED_TEST_TARGET_ACCEPTED
Test database guard passed successfully.

```