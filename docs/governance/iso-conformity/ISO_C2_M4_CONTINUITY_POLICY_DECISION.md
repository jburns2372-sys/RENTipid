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

### 2.2 Backup / PITR Freshness Threshold
* **Healthy State:** Latest recoverable point age $\le$ **30 minutes**.
* **Stale / Alert State:** Latest recoverable point age > **30 minutes**.
* **Rationale:** The 30-minute operational alerting threshold deliberately provides a 30-minute safety margin before the 60-minute RPO can be breached.

### 2.3 Automated Monitoring Frequency
* **Cadence:** **EVERY 15 MINUTES** (`*/15 * * * *`).
* **Operational Contract:** Backup and Point-In-Time Recovery (PITR) health shall be evaluated continuously via automated scheduling. Polling every 15 minutes ensures at least two automated inspection opportunities before any 30-minute freshness breach occurs.

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

The Project Owner formally approves the architecture recommended in Work Package `ISO-C2-M4-D2`:

### 3.1 Monitoring Execution Model
* **Mechanism:** Scheduled GitHub Actions Workflow.
* **Workflow File Path:** `.github/workflows/backup-freshness-monitor.yml`
* **Trigger:** Scheduled cron (`*/15 * * * *`) with manual fallback (`workflow_dispatch`).
* **Target Interface:** Neon Management Control Plane REST API (`https://console.neon.tech/api/v2/projects/{project_id}/branches/{branch_id}`).
* **Operational Isolation:** Probe operates strictly on the cloud control plane. No SQL connections are made; zero serverless compute wakeups are triggered; zero database credentials are required or exposed.

### 3.2 Monitored Signals & Pass/Fail Criteria
The monitoring probe must evaluate the following signals:

1. **Neon Branch State:** Expected `ready` (Alert if `current_state != 'ready'`).
2. **Backup Freshness Age:** Expected $\le 30\text{ minutes}$ (Alert if $> 30\text{ minutes}$).
3. **Configured History Retention:** Expected $\ge 30\text{ days}$ (Flag non-compliant until provider configuration is updated).
4. **Provider Operations Health:** Expected latest operations `status == 'finished'` and `failures_count == 0` (Alert if failure detected).
5. **Provider Measurement Availability:** Inability to measure health due to API timeout, network error, or invalid credentials must immediately fail closed and trigger an alert.

### 3.3 Alerting Mechanism & Notification Channel
* **Primary Control Channel:** GitHub Actions workflow execution status (native fail-closed non-zero exit code).
* **Persistent Operational Alert Record:** **Deduplicated GitHub Issue** in the RENTipid repository (`jburns2372-sys/RENTipid`).
  * **Labels:** `iso-backup-monitoring`, `operational-risk`
  * **Deduplication Rule:** The automation shall create or update **exactly ONE open issue** for any active backup degradation incident rather than creating redundant issues every 15 minutes.
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

## 7. Multi-Dimensional Governance Dispositions

| Control Element | Current State | Required Target | Compliance Status | Action Required |
|---|---|---|---|---|
| **RPO** | $\le 60$ minutes | $\le 60$ minutes | **COMPLIANT** | Monitored by automation |
| **Freshness Threshold** | Measured < 1 min | $\le 30$ minutes | **COMPLIANT** | Continuous WAL streaming |
| **Monitoring Cadence** | None | Every 15 minutes | **PENDING IMPLEMENTATION** | Deploy GitHub workflow |
| **History Retention** | 6 hours | 30 days | **NON-COMPLIANT (FAIL)** | Commercial authorization & provider config |
| **Alert Destination** | None | GitHub Issues | **APPROVED** | Implement in workflow |
| **Control Ownership** | Designated | Role assigned | **COMPLIANT** | Formally enacted by Owner |

### Risk Register Dispositions:
* **`RSK-22` (Backup Freshness & Monitoring):** Remains **`PARTIAL`**. While policy, thresholds, and architecture are now formally adopted, implementation of the monitor and provider retention remediation remain pending.
* **`RSK-23` (Disaster Recovery Restore Drills):** Remains **`PARTIAL — UNCHANGED`**. No restore drill is conducted in M4.
* **Residual Risk Acceptance:** **`NO`** (Zero residual risk accepted).

---

## 8. Next Authorized Work Package Boundary

To execute the decisions enacted in this baseline, the Project Owner may authorize:

* **Package `ISO-C2-M4-D4-E1` (Monitoring Implementation):**
  1. Add `NEON_API_KEY` to GitHub repository secrets.
  2. Implement `scripts/monitoring/check-backup-freshness.ts`.
  3. Implement `.github/workflows/backup-freshness-monitor.yml`.
  4. Verify end-to-end fail-closed alert generation on GitHub Issues.
* **Separate Provider Configuration Package (Retention Remediation):**
  1. Formally authorize commercial metered storage consumption.
  2. Update Neon `history_retention_seconds` to `2592000` (30 days) on branch `br-proud-sunset-ap0ofil2`.
