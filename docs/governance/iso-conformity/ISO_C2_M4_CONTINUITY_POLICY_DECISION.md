# ISO-C2-M4-D3 Project Owner Continuity Policy Decision & Monitoring/Alerting Control Baseline

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M4-D3`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Work Package:** `ISO-C2-M4-D3 — Project Owner Continuity Policy Decision + Monitoring/Alerting Control Baseline`  
**Package Class:** `POLICY_DECISION_AND_GOVERNANCE_BASELINE`  
**Executor:** Antigravity / Gemini 3.8 Flash High  
**Authoritative Baseline:** `053ef957d7cd840a1264a3886e6e1fa3e18b1e90`  
**Date:** `2026-10-23`  
**Status:** `APPROVED — POLICY DECISION ADOPTED / IMPLEMENTATION AUTHORIZATION PENDING`  

---

## 1. Executive Authority & Scope of Policy Decision

Under the supreme authority of the Project Owner for `RENTIPID-ISO-CONFORMITY-001`, this document formally adopts and codifies the internal business-continuity and backup-monitoring requirements for the RENTipid Production database (`RSK-22` / `TRT-F02`).

> [!IMPORTANT]
> **Internal Standard Clarification:**  
> These continuity thresholds are internal RENTipid organizational policy decisions. Neither ISO/IEC 27001:2022 nor ISO/IEC 27701:2019 mandates these specific numeric durations; rather, the standards mandate that the organization define, document, approve, and operate continuity controls appropriate to its context and risks.

---

## 2. Formally Adopted Continuity Thresholds

The Project Owner formally enacts the following controlling requirements:

### 2.1 Recovery Point Objective (RPO)
* **Adopted RPO:** **$\le$ 60 MINUTES**
* **Operational Contract:** At all times during normal production operations, RENTipid shall maintain a provider-supported recoverable database point no more than 60 minutes behind current operation, except during a formally recorded and isolated third-party cloud provider outage.

### 2.2 Provider-Native Monitoring Evidence Freshness Threshold (Amended)
* **Reconciliation Context:** In Neon's serverless PostgreSQL architecture, data changes stream continuously as Write-Ahead Logs (WAL) to multi-AZ Safekeepers and Pageservers, enabling Point-In-Time Recovery (PITR) across the entire configured retention window (`history_retention_seconds`). Neon's Management Control Plane API does **not** expose a discrete snapshot generation timestamp or "latest recoverable point timestamp" (`RECOVERABLE POINT TIMESTAMP: NOT EXPOSED BY PROVIDER API`). Control-plane metadata field `branch.updated_at` reflects only control-plane metadata modifications and **IS NOT A DATABASE RECOVERABILITY OR WAL COMMIT TIMESTAMP**.
* **Amended Threshold Definition:** The previously defined 30-minute backup freshness threshold is formally amended to **`MONITORING EVIDENCE FRESHNESS THRESHOLD: <= 30 MINUTES`**.
* **Operational Contract:** The monitoring system must successfully execute and obtain valid provider health evidence at least once within every 30-minute window.
* **Fail-Closed Alert Condition:** If no valid provider evidence has been obtained for more than 30 minutes: **`ALERT / FAIL CLOSED`**.
* **Boundary Clarification:** This 30-minute value represents the maximum allowable age of active provider health evidence; it must **never** be misrepresented or claimed as a Neon "latest recoverable backup timestamp".

### 2.3 Automated Monitoring Frequency
* **Cadence:** **EVERY 15 MINUTES** (`*/15 * * * *`).
* **Operational Contract:** Provider continuity and control-plane health shall be evaluated continuously via automated scheduling. Polling every 15 minutes guarantees at least two automated inspection opportunities within every 30-minute monitoring evidence freshness window before an alert triggers.

### 2.4 Production Backup & PITR Retention Requirement
* **Adopted Requirement:** **$\ge$ 30 DAYS** (`2,592,000 seconds`).
* **Governance Transition:** Formally converts the operational runbook recommendation in `docs/backup-and-restore.md` Section 1 (*"We recommend a 30-day retention period"*) into a binding RENTipid continuity policy mandate.
* **Current Operational State:** Live Neon branch `rentipid-production` (`br-proud-sunset-ap0ofil2`) is configured with `history_retention_seconds: 21600` (**6 hours**).
* **Compliance Disposition:** **FAIL — NON-COMPLIANT WITH NEWLY ADOPTED INTERNAL RETENTION REQUIREMENT**.
* **Remediation Boundary:** Neon configuration is NOT changed in this package. Zero residual risk is accepted. The 6-hour retention condition must be resolved via a separately authorized provider configuration package.

### 2.5 Recovery Time Objective (RTO) Boundary
* **Status:** **`NOT_DEFINED_BY_M4`**
* **Rationale:** In accordance with program boundaries, RTO relates to active disaster recovery and database restore execution speed. RTO targets and measurements are governed strictly under milestone `ISO-C3` (operational provider restore drills).

---

## 3. Approved Monitoring & Alerting Architecture

The Project Owner formally approves the reconciled provider-native architecture for Work Package `ISO-C2-M4`:

### 3.1 Monitoring Execution Model
* **Mechanism:** Scheduled GitHub Actions Workflow.
* **Workflow File Path:** `.github/workflows/backup-freshness-monitor.yml`
* **Trigger:** Scheduled cron (`*/15 * * * *`) with manual fallback (`workflow_dispatch`).
* **Target Interface:** Neon Management Control Plane REST API (`https://console.neon.tech/api/v2/projects/{project_id}/branches/{branch_id}`).
* **Operational Isolation:** Probe operates strictly on the cloud control plane. No SQL connections are made; zero serverless compute wakeups are triggered; zero database credentials are required or exposed.

### 3.2 Provider-Native Monitored Signals & Pass/Fail Criteria
The monitoring probe must evaluate strictly provider-supported fields:

1. **Project Identity Match:** Exact match (`project_id == 'holy-shape-01357429'`).
2. **Branch Identity Match:** Exact match (`branch_id == 'br-proud-sunset-ap0ofil2'`).
3. **Branch Control-Plane State:** Expected `ready` (Alert if `current_state != 'ready'`).
4. **Branch Protection State:** Expected `protected == true`.
5. **Configured History Retention:** Expected `history_retention_seconds >= 2,592,000` (Flag non-compliant until provider configuration is updated).
6. **API Access & Authentication:** Successful authenticated HTTP 200 response from Neon Management API.
7. **Provider Response Schema:** Valid JSON response with all required branch metadata fields.
8. **Provider Operations Signal Review:** Evaluated against `GET /projects/{project_id}/operations`. Finding: Neon operations list tracks asynchronous control-plane operations (e.g. `start_compute`, `suspend_compute`) rather than storage/WAL persistence. Recorded finding: `PROVIDER OPERATION FAILURE SIGNAL: NOT RELIABLE FOR M4`.
9. **Monitoring Evidence Freshness Age:** Age of last successful monitoring execution $\le$ 30 minutes. (Alert / fail-closed if $> 30\text{ minutes}$).

Zero fabricated restore timestamps. Zero reliance on `branch.updated_at`, deployment timestamps, or application activity as backup freshness metrics.

### 3.3 Alerting Mechanism & Notification Channel
* **Primary Control Channel:** GitHub Actions workflow execution status (native fail-closed non-zero exit code).
* **Persistent Operational Alert Record:** **Deduplicated GitHub Issue** in the RENTipid repository (`jburns2372-sys/RENTipid`).
  * **Labels:** `iso-backup-monitoring`, `operational-risk`
  * **Deduplication Rule:** The automation shall create or update **exactly ONE open issue** for any active backup degradation or monitoring outage incident rather than creating redundant issues every 15 minutes.
  * **Auto-Resolution Rule:** The workflow shall automatically close or resolve the tracking issue when consecutive healthy evidence is re-established, recording the recovery timestamp and audit trace.

---

## 4. Operational Ownership Assignment

The Project Owner formally enacts the following role-based assignments:

* **Backup Control Owner:** `Database Administrator`
* **Monitoring & Alert Response Owner:** `Cloud Operations Lead`
* **Security Oversight:** `Security Operations / ISO Governance`

### Human Evidence Evaluation:
* **Governance Status:** **`COMPLETE — PROJECT OWNER ROLE ASSIGNMENT`**
* **Rationale:** In accordance with ISO 27001 Clause 5.3 and RENTipid program governance, top management authorization formally establishes organizational role accountability. No unevidenced personal employee names are fabricated.
* **Operational Routing Identity:** If automated GitHub issue assignment requires a specific GitHub username (`@username`), this routing identifier shall be provided upon workflow implementation (`HUMAN ROUTING IDENTITY REQUIRED`).

---

## 5. Provider Capability & Commercial Retention Analysis

A read-only investigation of the active Neon PostgreSQL provider environment established:

1. **Current Subscription Plan:** `scale_v3` (Account: `j.burns2372@gmail.com`, Organization: `org-sweet-fog-42432629` / Vercel Projects).
2. **Current Plan Maximum Supported Retention:** Up to **30 days** (`2,592,000 seconds`) is natively supported on the Neon Scale plan.
3. **Can Configuration Alone Achieve 30 Days?:** **YES**. Neon allows setting `history_retention_seconds` up to `2592000` via the Console or Management API without changing subscription tiers.
4. **Plan / Tier Upgrade Required?:** **NO**.
5. **Commercial / Billing Implications:** Neon bills synthetic change history (WAL storage required for PITR) at **$0.20 per GB-month** for root branches. Given RENTipid's current logical database size of ~55 MB, the incremental storage cost is expected to be nominal (< $1–$5/month), but because it introduces a metered billing consumption increase, a formal **`COMMERCIAL AUTHORIZATION REQUIRED`** gate is recorded prior to applying the configuration update.

---

## 6. Authentication & Secrets Architecture

1. **Existing GitHub Automation Credentials:** **`NO`** (`gh secret list` confirms only `RENTIPID_PREVIEW_DATABASE_URL` is present; zero Neon management credentials exist in GitHub Actions).
2. **Provider Automation Credential Required:** **`YES`**.
3. **Proposed GitHub Secret Name:** `NEON_API_KEY`
4. **Minimum Privilege Scope:** Read-only access to Neon Project `holy-shape-01357429`.
5. **Issue Creation Privilege:** Native `secrets.GITHUB_TOKEN` provided by GitHub Actions runner with `issues: write` workflow permission. Zero external GitHub API tokens required.

---

## 7. RPO Evidence Model & RSK-22 / RSK-23 Boundary

A clear architectural and governance separation is maintained between monitoring capability and restore drill execution:

### 7.1 What M4 / RSK-22 Proves:
* Provider-native PITR/history capability is enabled and operational;
* Required history retention ($\ge 30$ days) is configured;
* Provider/control-plane health is monitored continuously (every 15 minutes);
* Inability to establish provider health triggers fail-closed alert;
* Monitoring evidence age remains $\le 30$ minutes.

M4 does **not** alone prove a completed restore, and must not claim to do so.

### 7.2 What RSK-23 Proves:
* Actual restore / Point-In-Time Recovery execution assurance;
* Verification of database recovery consistency against live provider backups;
* Governed strictly under later phase `ISO-C3` (operational provider restore drills).

### 7.3 Risk Register Dispositions:
* **`RSK-22` (Backup Freshness & Monitoring):** Remains **`PARTIAL`**.
* **`RSK-23` (Disaster Recovery Restore Drills):** Remains **`PARTIAL — UNCHANGED`**.
* **Residual Risk Acceptance:** **`NO`** (Zero residual risk accepted).

---

## 8. RSK-22 Acceptance Model for Operating Conformity

To transition `RSK-22` from `PARTIAL` to **`PROVEN — OPERATING CONFORMITY`**, the following concrete evidence is strictly required:

1. **30-Day Retention Configured:** Live Neon production branch `br-proud-sunset-ap0ofil2` configured with `history_retention_seconds: 2592000`.
2. **Provider Target Verified:** Control plane confirms project `holy-shape-01357429` and branch `br-proud-sunset-ap0ofil2`.
3. **Monitoring Workflow Implemented:** `.github/workflows/backup-freshness-monitor.yml` and `scripts/monitoring/check-backup-freshness.ts` implemented and committed.
4. **Active on Default Branch:** Monitoring workflow present on `main` branch.
5. **Scheduled Runs Observed:** Real GitHub Actions scheduled cron runs observed and recorded.
6. **Alert Path Verified:** Deduplicated GitHub Issue creation on failure and auto-resolution on healthy recovery verified.
7. **Operating Run Evidence:** At least one healthy scheduled operating run successfully recorded.
8. **Failure/Unknown Contract Proven:** Automated monitor demonstrably fails closed (exit code 1) on missing API key, network timeout, unhealthy branch state, or retention breach.
9. **Zero Silent Failures:** No scenario exists where monitoring failure is suppressed or converted to PASS.

---

## 9. Next Authorized Work Package Boundary

To execute the decisions enacted in this baseline, the Project Owner may authorize:

* **Package `ISO-C2-M4-D4-E1` (Monitoring Implementation):**
  1. Add `NEON_API_KEY` to GitHub repository secrets.
  2. Implement `scripts/monitoring/check-backup-freshness.ts`.
  3. Implement `.github/workflows/backup-freshness-monitor.yml`.
  4. Verify end-to-end fail-closed alert generation on GitHub Issues.
* **Separate Provider Configuration Package (Retention Remediation):**
  1. Formally authorize commercial metered storage consumption.
  2. Update Neon `history_retention_seconds` to `2592000` (30 days) on branch `br-proud-sunset-ap0ofil2`.
