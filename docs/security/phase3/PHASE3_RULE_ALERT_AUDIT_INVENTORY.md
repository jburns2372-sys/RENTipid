# Phase 3 Rule, Alert, and Audit Inventory

## Controlled Gate 3G Rules

### 1. PAY-WEBHOOK-FAIL-01
- **Version**: 1
- **Status**: DRAFT
- **Source type**: SYSTEM
- **Classification**: FRAUD
- **Severity**: HIGH
- **DSL summary**: Detects specific `WEBHOOK_` event markers indicating a failure or anomaly.
- **Event-code marker**: WEBHOOK_
- **Correlation strategy**: IP or Session
- **Window**: 1h
- **Threshold**: 3
- **Cooldown**: 24h
- **Compatibility result**: Validated against typed DSL via Gate 3D schema.
- **Activation status**: DRAFT (Not ACTIVE)
- **Automatic countermeasure status**: None (Advisory only)

### 2. SECURITY-SETTING-CHANGE-01
- **Version**: 1
- **Status**: DRAFT
- **Source type**: USER
- **Classification**: SECURITY
- **Severity**: MEDIUM
- **DSL summary**: Detects sensitive account or security setting modifications (`SETTING_` markers).
- **Event-code marker**: SETTING_
- **Correlation strategy**: User ID
- **Window**: 24h
- **Threshold**: 5
- **Cooldown**: 1h
- **Compatibility result**: Validated against typed DSL via Gate 3D schema.
- **Activation status**: DRAFT (Not ACTIVE)
- **Automatic countermeasure status**: None (Advisory only)

## Alert and Audit Workflows

- **Alert-generation boundary**: Generates advisory SecurityAlert records without mutating business logic.
- **Alert deduplication**: Enforced via correlation subjects and cooldown periods.
- **Alert-review authorization**: Handled via `security.rules.view` or equivalent protected review access.
- **SOC_RULE_INITIALIZED audit behavior**: Triggered upon successful DRAFT rule creation.
- **INITIALIZATION_CONFLICT audit behavior**: Triggered when attempting to initialize a rule with differing semantics; logs the conflict without overriding the existing version.
- **Atomic transaction behavior**: Rule creation and AuditLog entries are committed in a single Prisma transaction.
- **Rollback behavior**: A failure in AuditLog creation seamlessly rolls back the DetectionRule creation.
- **Sanitized audit-field requirements**: Only privacy-safe payloads and deduplicated keys are stored.

## Prohibited Audit Content
- Raw event payloads
- Passwords
- Tokens
- Credentials
- API keys
- Secrets
- Correlation subjects
- Suppression keys
- Stack traces exposed to users
