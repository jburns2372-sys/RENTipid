# RENTipid Configuration and Environment Registry

Status: `FROZEN_WORKING_REGISTRY`

Only variable names are documented. No value was read from `.env`, `.env.local`,
cloud configuration, or any secret store.

## Public/runtime routing names

`APP_BASE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AZURE_API_URL`,
`NEXT_PUBLIC_USE_AZURE_BACKEND`, `NEXT_PUBLIC_VERCEL_URL`, `PRODUCTION_DOMAIN`,
`PORT`, `NODE_ENV`.

## Authentication/data names

`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `SOURCE_DATABASE_URL`,
`RESTORE_DATABASE_URL`, `EXPLICIT_RESTORE_TARGET_REQUIRED`,
`ALLOW_TEST_DATABASE_MUTATION`.

## Azure names

`APPLICATIONINSIGHTS_CONNECTION_STRING`, `AZURE_STORAGE_ACCOUNT_NAME`,
`AZURE_STORAGE_ACCOUNT_KEY`, `KEY_VAULT_NAME`, `AZURE_OPENAI_ENDPOINT`,
`AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_CHAT_DEPLOYMENT`,
`AZURE_OPENAI_EMBEDDING_DEPLOYMENT`, `AZURE_SEARCH_ENDPOINT`,
`AZURE_SEARCH_API_KEY`, `AZURE_SEARCH_INDEX`, `STORAGE_PROVIDER`.

`AZURE_STORAGE_ACCOUNT_KEY` remains a referenced legacy name in repository
history/current source searches; the Phase 19B managed-identity work removes
that dependency from the extracted blob service. Documentation never requests
or prints the value.

## Payment names

`PAYMENT_LIVE_MODE`, `PAYMENT_PROVIDER_MODE`, `PAYMONGO_LIVE_ENABLED`,
`PAYMONGO_PUBLIC_KEY_LIVE`, `PAYMONGO_SECRET_KEY_LIVE`,
`PAYMONGO_WEBHOOK_SECRET_LIVE`, `PAYMONGO_SECRET_KEY`,
`PAYMONGO_WEBHOOK_SECRET`, `PAYMONGO_SANDBOX`, `SYNTHETIC_ACKNOWLEDGEMENT`.

Live mode remains controlled by the accepted Phase 19 NO-GO boundary.

## Security/crypto/SOC names

`BLIND_INDEX_KEY`, `BLIND_INDEX_KEY_ID`, `MFA_ENCRYPTION_KEY`,
`MFA_ENCRYPTION_KEY_ID`, `PROFILE_FIELD_PROTECTION_MODE`,
`RETIRED_FIELD_ENCRYPTION_KEYS`, `SECURITY_TELEMETRY_HMAC_KEY`,
`SECURITY_TELEMETRY_HMAC_KEY_VERSION`, `SOC_CORRELATION_HMAC_KEY`,
`SOC_GEOIP_DATABASE_PATH`, `SOC_GEOLOCATION_HMAC_SECRET`,
`SOC_GEOLOCATION_PROVIDER`.

## CI/job names

`GITHUB_REF`, `GITHUB_RUN_ID`, `JOB_NAME`.

## Production-template-only provider names

`EMAIL_FROM`, `EMAIL_PROVIDER`, `NEXTAUTH_URL`, `SMTP_HOST`, `SMTP_PASSWORD`,
`SMTP_PORT`, `SMTP_USER`.

Classification rules:

- public-prefixed values are not automatically safe if they carry sensitive
  data; only documented intended public routing values belong there;
- passwords, keys, tokens, HMAC material, connection strings, database URLs,
  SAS values, and secrets are `SECRET_VALUE_NEVER_DOCUMENT`;
- templates are contracts, not evidence that a value is configured;
- local/test/production environments must remain isolated;
- database-guard variables are safety controls, not deployment switches.

Canonical manual cross-reference: `../04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md`
and Master Chapters 231–233.
