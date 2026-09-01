# RENTipid ListingBridge v1.0 — Operations & Security Runbook

**Document ID:** `RENTIPID-LB-V1.0-OPS-RUNBOOK-001`  
**Status:** `LOCKED / OPERATIONAL BASELINE`  
**Target Audience:** Site Reliability Engineers, Security Operations Center (SOC), System Administrators, and On-Call Engineers  

---

## 1. Executive Summary & Purpose

This runbook provides authoritative operating procedures, diagnostics, alerting thresholds, incident response protocols, and rollback playbooks for **RENTipid ListingBridge v1.0**.

ListingBridge enables providers to import and normalize property listings from external sources into native RENTipid draft listings. All operational procedures enforce the core architectural principle:
> **"AI ASSISTS. POLICY DECIDES."** Deterministic validation, server-side authorization, duplicate guards, and human confirmation remain authoritative at all times.

---

## 2. Health Checks & Diagnostic Views

ListingBridge exposes structured operational diagnostics via `ListingBridgeHealthDiagnosticsService`:

### 2.1 Component Health Indicators
| Component | Healthy State | Degraded / Failure State | Diagnostic Action |
| :--- | :--- | :--- | :--- |
| **Global ListingBridge** | `globalEnabled: true` | `globalEnabled: false` | Check `SystemSetting` table for `LISTINGBRIDGE_GLOBAL`. |
| **Connector Registry** | `OPERATIONAL` | `DISABLED` or `UNHEALTHY` | Verify connector credentials, rate limits, and network egress. |
| **Media Processing** | `mediaProcessingEnabled: true` | `mediaProcessingEnabled: false` | Inspect `StorageService` connectivity and preflight validator. |
| **AI Semantic Mapping** | `aiMappingEnabled: true` | `aiMappingEnabled: false` (Optional fallback) | Verify Unified AI command layer; core flow continues via deterministic fallback. |
| **Draft Creation** | `draftCreations > 0` | `draftCreationFailures >= 5` | Inspect native `ListingService` database constraints. |

---

## 3. Feature Flags & Kill Switches

ListingBridge implements granular, zero-downtime kill switches managed via `SystemSetting`:

```bash
# Global Kill Switch (Disables import wizard while preserving manual listing creation)
LISTINGBRIDGE_GLOBAL=false

# Subsystem Kill Switches
LISTINGBRIDGE_URL_IMPORT=false          # Disables direct URL ingestion
LISTINGBRIDGE_API_CONNECTORS=false      # Disables OAuth/API-based platform connectors
LISTINGBRIDGE_MEDIA_IMPORT=false        # Disables external photo retrieval (allows text-only import)
LISTINGBRIDGE_AI_MAPPING=false          # Disables AI assistance (reverts to deterministic taxonomy)
LISTINGBRIDGE_AVAILABILITY_IMPORT=false # Disables external calendar synchronization
LISTINGBRIDGE_FILE_IMPORT=false         # Disables CSV/JSON structured file imports
```

### 3.1 Independence Guarantee of Manual Listing Creation
* **Critical Rule:** Disabling `LISTINGBRIDGE_GLOBAL` or any individual connector **NEVER** affects or degrades the native RENTipid manual listing creation wizard (`src/components/listings/ListingWizard.tsx`).

---

## 4. Alerting Thresholds & Operational Conditions

| Alert ID | Alert Name | Severity | Condition Threshold | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| `LB_ALERT_SSRF_SPIKE` | SSRF Security Block Spike | **CRITICAL** | $\ge 10$ SSRF blocks in 5m | Inspect recent import payloads, block malicious IP/actor, review DNS resolution. |
| `LB_ALERT_DRAFT_CREATION_FAILURES` | Native Draft Creation Failure | **HIGH** | $\ge 5$ draft commit failures in 10m | Check native `ListingService.createDraft` database logs and constraint violations. |
| `LB_ALERT_CONNECTOR_OUTAGE` | External Connector Outage | **HIGH** | $\ge 15$ connector errors in 15m | Verify upstream provider API status, token validity, and rate limits. |
| `LB_ALERT_MEDIA_STORAGE_ERROR` | Media Processing Glitch | **MEDIUM** | $\ge 10$ storage errors in 10m | Check bucket storage availability and preflight MIME filters. |

---

## 5. Failure Categorization & Recovery Playbooks

### 5.1 Failure Classification Matrix
* **`FINAL_SECURITY_BLOCKED`** (Never retried automatically): SSRF block, cross-tenant ownership mismatch, prohibited source data, unauthorized actor.
* **`FINAL_PROVIDER_ACTION`** (Requires provider intervention via UX): Missing required field, unconfirmed rights, duplicate property conflict, invalid Philippine location bounds.
* **`RETRYABLE`** (Bounded background retry): Upstream 5xx error, network timeout, temporary rate limiting, transient storage timeout.

### 5.2 Stuck Import Triage Procedure
1. Query durable import job record: `SELECT id, status, provider_id, retry_count FROM "ListingImportJob" WHERE id = '<JOB_ID>';`
2. If `status = 'CREATING_DRAFT'` and `created_listing_id` is populated:
   * The draft was already committed. Update status to `'COMPLETED'` safely.
3. If `status = 'FETCHING'` or `'PROCESSING_MEDIA'` and worker died:
   * Invoke `ListingBridgeRetryEngine.evaluatePartialProgressRecovery(job)`.
   * Resumes safely from existing persisted assets without duplicate writes.
4. If retry count $\ge 3$:
   * Transition job to `FAILED_FINAL` and direct provider to manual fallback banner.

---

## 6. Security Incident Response Protocols

### 6.1 Suspected Credential / Token Exposure
1. Containment: Immediately rotate connector OAuth secrets or API keys in environment/vault.
2. Verify Logs: Confirm that `ListingBridgeStructuredLogger` redacted authorization headers, bearer tokens, and secrets.
3. Query Audit Trail: Inspect `AuditLog` where `module = 'ListingBridgeSecurity'` for unauthorized invocations.

### 6.2 SSRF / Internal Scanning Attack
1. Containment: The SSRF protection layer (`ListingBridgeSsrfProtectionService`) automatically denies private IPv4, link-local, loopback, AWS/GCP metadata endpoints (`169.254.169.254`), and mapped IPv6 addresses.
2. Triage: If a malicious provider repeatedly triggers SSRF, suspend provider account via SOC admin console.

### 6.3 Prompt-Injection Attempt in Listing Descriptions
1. Containment: `ListingBridgeSafeAiContextBuilder` isolates all external text within explicit `<untrusted_source_data>` tags.
2. AI Guardrail: The AI is restricted to advisory tools (`suggestListingBridgeAmenityMapping`, etc.) and has **ZERO** direct mutation, publication, or approval authority.

---

## 7. Safe Rollback Procedure

In the event of an operational anomaly requiring rollback:

1. **Step 1 — Isolate:** Flip `LISTINGBRIDGE_GLOBAL=false` in `SystemSetting`. (Takes effect immediately).
2. **Step 2 — Preserve In-Flight Data:** Do **NOT** purge the `ListingImportJob` table. Provenance and audit records must be retained.
3. **Step 3 — Native Draft Protection:** Do **NOT** delete existing native `Listing` records created with `status: 'Draft'`. Providers can continue editing them manually.
4. **Step 4 — Code Reversion:** Revert deployment commit via standard CI/CD deployment rollback.
5. **Step 5 — Controlled Reopening:** Re-enable flags incrementally (`URL_IMPORT`, `MEDIA_IMPORT`) after verifying hotfix in Preview.

---

## 8. Preview vs. Production Safety Rules

* **Database Isolation:** Never execute database reset or seed commands against Preview or Production databases.
* **Connector Isolation:** Production environments must strictly disable internal Mock/Test connectors (`MOCK_URL_CONNECTOR_ENABLED=false`).
* **Audit Trail:** All security events and draft creations must emit durable audit entries (`DRAFT_COMMITTED`, `RIGHTS_CONFIRMED`).
