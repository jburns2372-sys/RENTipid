# PHASE19B Non-Secret Azure/Vercel Identifier Request

## Purpose

This form collects only non-secret identifiers required to prepare future read-only verification commands for the RENTipid Azure/Vercel production environment. These identifiers are used exclusively for constructing Azure CLI metadata queries, Vercel public URL checks, and health-endpoint verification. No secret values are requested.

## Instructions for Trusted Administrator

- Provide literal resource names and identifiers only.
- Do not provide passwords.
- Do not provide tokens.
- Do not provide connection strings.
- Do not provide access keys.
- Do not provide SAS tokens.
- Do not provide database URLs.
- Do not provide PayMongo credentials.
- Do not provide secret environment values.
- Leave a field blank or write `NOT_APPLICABLE` if the resource does not exist.

---

## Azure Subscription and Region

Field: AZURE_SUBSCRIPTION_LABEL_OR_ID
Reason required: Required to execute authorized read-only CLI commands
Acceptable format: string
Example format: "Production Sub" or "00000000-0000-0000-0000-000000000000"
Secret: NO
Current status: OWNER_CONFIRMED

AZURE_REGION:
VERIFIED_FROM_REPOSITORY

Field: AZURE_TENANT_LABEL_OR_ID_IF_NON_SECRET
Reason required: Required to ensure the correct directory context is used
Acceptable format: string
Example format: "00000000-0000-0000-0000-000000000000" or "example.onmicrosoft.com"
Secret: NO
Current status: OWNER_CONFIRMED

---

## Resource Group and Container Apps

AZURE_RESOURCE_GROUP_NAME:
LOCAL_DEFINITION_ONLY

AZURE_CONTAINER_APPS_ENVIRONMENT_NAME:
LOCAL_DEFINITION_ONLY

AZURE_API_CONTAINER_APP_NAME:
LOCAL_DEFINITION_ONLY

AZURE_WORKER_CONTAINER_APP_NAME:
LOCAL_DEFINITION_ONLY

---

## Azure PostgreSQL

POSTGRESQL_FLEXIBLE_SERVER_NAME:
LOCAL_DEFINITION_ONLY

POSTGRESQL_DATABASE_NAME:
LOCAL_DEFINITION_ONLY

POSTGRESQL_RESOURCE_GROUP_NAME:
LOCAL_DEFINITION_ONLY

POSTGRESQL_REGION:
LOCAL_DEFINITION_ONLY

**Not requested** (secret values):
- username
- password
- DATABASE_URL
- DIRECT_URL
- connection string

---

## Azure Blob Storage

AZURE_STORAGE_ACCOUNT_NAME:
NOT_YET_PROVISIONED

AZURE_STORAGE_CONTAINER_NAME:
LOCAL_DEFINITION_ONLY

AZURE_STORAGE_RESOURCE_GROUP_NAME:
LOCAL_DEFINITION_ONLY

**Not requested** (secret values):
- account key
- connection string
- SAS token

---

## Monitoring

APPLICATION_INSIGHTS_RESOURCE_NAME:
LOCAL_DEFINITION_ONLY

LOG_ANALYTICS_WORKSPACE_NAME:
LOCAL_DEFINITION_ONLY

MONITORING_RESOURCE_GROUP_NAME:
LOCAL_DEFINITION_ONLY

ALERT_ACTION_GROUP_NAME_IF_EXISTING:
NOT_YET_PROVISIONED

**Not requested**: instrumentation secret values.

---

## Vercel and Public Routing

Field: VERCEL_PROJECT_NAME
Reason required: Needed for verifying frontend configuration
Acceptable format: string
Example format: "rentipid-production"
Secret: NO
Current status: OWNER_CONFIRMED

Field: VERCEL_TEAM_OR_SCOPE_NAME_IF_APPLICABLE
Reason required: Needed for verifying frontend configuration
Acceptable format: string
Example format: "rentipid-org"
Secret: NO
Current status: OWNER_CONFIRMED

VERIFIED_PUBLIC_APPLICATION_URL:
NOT_YET_PROVISIONED

PUBLIC_HEALTH_ROUTE_PATH:
NOT_YET_PROVISIONED

PAYMENT_WEBHOOK_ROUTE_PATH:
NOT_YET_PROVISIONED

---

## Verification by Trusted Administrator

R4_OWNER_IDENTIFIER_RESPONSE

AZURE_SUBSCRIPTION_LABEL_OR_ID:
0c991f43-1a5e-4228-9157-af106a276f58

AZURE_TENANT_LABEL_OR_ID_IF_NON_SECRET:
a35e68fb-a048-4ab0-9d84-de53e6b44441

VERCEL_PROJECT_NAME:
ren-tipid

VERCEL_TEAM_OR_SCOPE_NAME_IF_APPLICABLE:
jburns2372-sys-projects

CONFIRM_VALUES_CONTAIN_NO_SECRETS:
YES

CONFIRM_NO_PASSWORDS_KEYS_TOKENS_OR_CONNECTION_STRINGS_INCLUDED:
YES

AZURE_SUBSCRIPTION_STATE:
Enabled

VERIFIED_PUBLIC_APPLICATION_URL:
https://www.rentipid.com.ph

VERCEL_DEFAULT_PROJECT_URL:
https://ren-tipid.vercel.app

PUBLIC_URL_VALUE_SOURCE:
OWNER_VERIFIED_VERCEL_DASHBOARD

PUBLIC_URL_OWNER_CONFIRMATION:
YES

PUBLIC_URL_SECRET_CLASSIFICATION:
NON_SECRET

OWNER_RESPONSE_STATUS:
COMPLETE
