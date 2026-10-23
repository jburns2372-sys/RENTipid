# ISO-C2-M4-D2 Backup Monitoring & Alerting Remediation Design + Governance Threshold & Ownership Reconciliation

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M4-D2`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Work Package:** `ISO-C2-M4-D2 — Backup Monitoring & Alerting Remediation Design + Governance Threshold / Ownership Reconciliation`  
**Package Class:** `DESIGN_AND_CHANGE_CONTROL`  
**Executor:** Antigravity / Gemini 3.8 Flash High  
**Authoritative Baseline:** `55fc3d5f0dbda0298f312de0b7019c1d9484dd9e`  
**Date:** `2026-10-23`  
**Status:** `DESIGN COMPLETE — PROJECT OWNER POLICY DECISION & HUMAN EVIDENCE REQUIRED`  

---

## 1. Executive Summary & Design Scope

Following the successful read-only evidence collection in Work Package `ISO-C2-M4-D1-E1` (commit `55fc3d5`), this work package delivers the technical and governance design required to move `RSK-22` (Silent snapshot generation failure resulting in stale backups) from `PARTIAL` toward operating conformity.

### Strict Governance Boundary:
* **Scope:** Design, architectural evaluation, and governance threshold reconciliation only.
* **Prohibitions:** Zero modification to Neon configuration, retention periods, snapshots, PITR state, monitoring jobs, alert channels, or production application code/database.
* **Risk Dispositions:** `RSK-22` remains **`PARTIAL`**; `RSK-23` remains **`PARTIAL — UNCHANGED`**; Zero residual risk is accepted; ISO certification is not claimed.

---

## 2. Baseline M4-D1 Operational Evidence Summary

The read-only baseline established in `ISO_C2_M4_BACKUP_FRESHNESS_MONITORING_OPERATING_EVIDENCE.md` verified:

| Dimension | Observed State | Classification |
|---|---|---|
| **Production Provider** | Neon Serverless PostgreSQL (`holy-shape-01357429`, AWS `us-east-1`, PostgreSQL 17) | **VERIFIED** |
| **Production Branch** | `rentipid-production` (`br-proud-sunset-ap0ofil2`, `protected: true`) | **VERIFIED** |
| **Automated Backup** | Continuous multi-AZ Write-Ahead Log (WAL) replication to Safekeepers & Pageservers | **PROVEN** |
| **Point-In-Time Recovery (PITR)** | Active natively across the continuous retention window | **PROVEN** |
| **PITR History Retention** | `21,600 seconds` (**6 hours**) continuous window | **PARTIAL** |
| **Discrete Snapshots** | `0` scheduled snapshots configured (`neon snapshots schedule get` = `[]`) | **GAP** |
| **Backup Freshness** | Real-time continuous streaming (< 1 minute measured age at observation) | **PROVEN** |
| **Automated Failure Monitoring** | No proactive monitor or watcher active | **GAP** |
| **Failure Alerting** | No notification channel configured | **GAP** |
| **Operational Ownership** | Roles defined (`Database Admin`, `Cloud Ops Lead`); named staff unassigned | **REQUIRES HUMAN EVIDENCE** |

---

## 3. Continuity Requirements Reconciliation (RPO, RTO, Freshness, Retention)

An exhaustive review of repository governance artifacts (`ISO_RISK_REGISTER.md`, `ISO_RISK_TREATMENT_PLAN.md`, `STATUS.json`, `EVD-15`), historical operational plans (`docs/backup-and-restore.md`, `docs/aws-backup-and-restore-plan.md`), and Phase 19B/Phase 5L runbooks was conducted to identify accepted continuity thresholds.

### Detailed Requirements Audit:

| Requirement Parameter | Governance Document Finding | Status / Classification | Analysis & Impact |
|---|---|---|---|
| **Recovery Point Objective (RPO)** | Mentioned in `EVD-15` plan title and `PHASE19B_SLICE_R3` as `RPO_TARGET: OWNER_APPROVAL_REQUIRED`. No numeric threshold codified in risk registers. | **NOT_DEFINED** | A numeric RPO threshold has never been formally approved by the Project Owner. |
| **Recovery Time Objective (RTO)** | Listed in `PHASE19B_SLICE_R3` as `RTO_TARGET: OWNER_APPROVAL_REQUIRED`. | **NOT_DEFINED** | RTO depends on restore execution speed (scheduled for Phase `ISO-C3` restore drills). |
| **Backup Freshness** | `docs/backup-and-restore.md` specifies "Automated Daily Backups". Live Neon streams WAL continuously (< 1 min). | **DEFINED_BUT_NONCONTROLLING** | Daily cadence is documented as an operational runbook guideline, but not codified as a formal contractual ISO threshold. |
| **Backup Frequency** | Operational runbooks specify daily; live infrastructure operates real-time continuous streaming. | **DEFINED_BUT_NONCONTROLLING** | Live continuous replication exceeds the noncontrolling daily guideline. |
| **PITR Retention Window** | Live Neon is configured for 6 hours (`history_retention_seconds: 21600`). No specific PITR window size is codified in ISO risk registers. | **NOT_DEFINED** | Neon defaults to a 6-hour continuous window on current project settings. |
| **Backup Retention Period** | `docs/backup-and-restore.md` Section 1: *"Retention: We recommend a 30-day retention period."* `PHASE5L_BACKUP_RECOVERY_RUNBOOK.md` mentions 30 days for legacy Azure. | **CONFLICTING / DEFINED_BUT_NONCONTROLLING** | The 30-day value is explicitly documented as a *recommendation* in runbooks, not a binding contract. 6 hours live retention conflicts with this recommendation. |
| **Monitoring Interval** | No document defines how frequently backup health must be polled. | **NOT_DEFINED** | Requires architectural derivation based on selected RPO. |
| **Alert Escalation Timing** | Phase 5L runbooks state failures escalate to Incident Commander, but specify no automated alert timing or SLA. | **NOT_DEFINED** | Alert dispatch must be immediate upon failure detection. |

### Retention & Freshness Compliance Decision:
* **Freshness Compliance:** **PASS — PROVEN** against operational daily intent (measured age < 1 minute via continuous WAL streaming).
* **Retention Compliance:** **UNDETERMINED** (or **PARTIAL**). While continuous 6-hour PITR is operational, it does not satisfy the 30-day archival recommendation in `docs/backup-and-restore.md`. Because no formal contractually binding retention threshold is codified in the ISO risk register, this requires a **Project Owner Policy Decision**.

---

## 4. Analysis of Existing Repository & Monitoring Infrastructure

To avoid creating redundant monitoring platforms, existing repository and deployment infrastructure was evaluated:

1. **GitHub Actions Workflows (`.github/workflows/`):**
   * Currently active: `security-supply-chain.yml`, `glcc-ci.yml`, `azure-deploy.yml`.
   * Scheduled cron capability: Native GitHub Actions `schedule: - cron: '...'` is supported and proven in GitHub-hosted Ubuntu runners.
   * Authentication: Repository secrets (`secrets.NEON_API_KEY`) can securely authenticate against external APIs without repo exposure.
2. **Vercel Hosting Platform:**
   * `vercel.json` currently only configures `"installCommand": "npm install --legacy-peer-deps"`.
   * Vercel Crons exist on Vercel Pro/Enterprise, but require deploying new serverless functions to production and exposing an HTTP cron endpoint.
3. **Application Codebase (`src/app/api/`, `src/lib/`):**
   * `src/lib/auth/unified/email-delivery.ts` provides transactional SMTP email for user auth (verification, password reset). It is scoped strictly to user onboarding and not integrated with operations alerts.
   * `src/lib/security/rules/alert-generator.service.ts` provides SOC threat detection over application database events, not infrastructure provider health.
4. **Cloud / Provider Native:**
   * Neon currently logs operations (`neon operations list`), but does not have native push alerting (no built-in email or SNS dispatch mechanism in Neon project settings).

---

## 5. Minimum Monitored Signal Specification (Reconciled Provider-Native Model)

To monitor Neon backup and PITR health without incurring serverless compute spin-up costs or waking suspended databases, the monitoring probe MUST interact strictly with the **Neon Management Control Plane API** (not SQL connections).

### Architectural Reconciliation Finding:
* **Recoverable Point Timestamp:** An exhaustive audit of the Neon Management API and CLI confirmed that Neon does **not** expose any field named or semantically equivalent to "latest recoverable point", "latest restore point", "WAL freshness timestamp", or "restore-window head timestamp" (`RECOVERABLE POINT TIMESTAMP: NOT EXPOSED BY PROVIDER API`).
* **Branch Updated At:** Neon API field `branch.updated_at` reflects only control-plane metadata changes (e.g. config updates, compute associations). It **IS NOT A DATABASE RECOVERABILITY OR WAL COMMIT TIMESTAMP** and must never be used as a fabricated freshness signal.
* **Provider Operations Signal:** Neon operations list (`GET /projects/{project_id}/operations`) tracks asynchronous control-plane operations (e.g., `start_compute`, `suspend_compute`) rather than storage engine WAL replication health. Formally recorded finding: `PROVIDER OPERATION FAILURE SIGNAL: NOT RELIABLE FOR M4`.

### Reconciled Provider-Supported Monitored Signals:
The probe shall evaluate strictly provider-supported fields against authoritative baselines:

1. **Production Project Identity:** Exact match (`project_id == 'holy-shape-01357429'`).
2. **Production Branch Identity:** Exact match (`branch_id == 'br-proud-sunset-ap0ofil2'`).
3. **Branch Health & State:** `current_state == 'ready'`.
4. **Branch Protection:** `protected == true`.
5. **Configured History Retention:** `history_retention_seconds >= 2,592,000` (30 days) (flag non-compliant until provider configuration update is applied).
6. **Provider Control Plane API Access:** Authenticated HTTP 200 response from Neon Management API.
7. **Response Structural Validity:** Valid JSON schema containing required branch metadata.
8. **Monitoring Evidence Freshness Age:** Age of last successful monitoring execution $\le$ 30 minutes. If no valid provider evidence has been acquired within 30 minutes, fail closed and alert immediately.

Zero fabricated restore timestamps. Zero inference of WAL timestamps from application activity or deployment times.

---

## 6. Monitoring Frequency Design

Because RPO is currently `NOT_DEFINED` in controlling governance, an exact polling interval cannot be unilaterally fixed. The following safe operational envelope is submitted for Project Owner selection:

| Project Owner RPO Policy Decision | Recommended Polling Frequency | Rationale | Resource / Cost Impact |
|---|---|---|---|
| **Option A: 24-Hour RPO** (Aligned with runbook daily backup guideline) | **Every 4 hours** (`0 */4 * * *`) | Detects failures with 20 hours of remediation buffer before RPO violation. | Minimal GitHub Actions usage (~180 runs/month; well within free tier). |
| **Option B: 6-Hour RPO** (Aligned with current 6-hour continuous PITR window) | **Every 1 hour** (`0 * * * *`) | Detects degradation 5 hours before continuous history window rolls over. | ~720 runs/month (~72 minutes/month). |
| **Option C: 1-Hour RPO** (Aggressive real-time recovery guarantee) | **Every 15 minutes** (`*/15 * * * *`) | Rapid alerting for high-velocity transaction protection. | ~2,880 runs/month (~288 minutes/month). |

*Determination:* **PROJECT OWNER THRESHOLD DECISION REQUIRED** between Options A, B, and C. *(Adopted by Project Owner in M4-D3: Option C — Cadence: Every 15 minutes; RPO: <= 60 minutes)*.

---

## 7. Operational Alerting Design & Notification Channel

### Existing Channel Audit:
* **Existing Approved Operational Notification Channel:** **`NO`**
* **Finding:** `HUMAN/OPERATIONAL DESTINATION REQUIRED`.
* **Context:** RENTipid currently possesses no approved PagerDuty, Opsgenie, operational Slack/Teams webhook, or dedicated infrastructure operations mailbox documented in the governance repository.

### Proposed Alert Delivery Architecture:
The monitoring system must dispatch alerts when backup degradation or API failure is detected:
1. **Primary Alert Sink (Recommended):** An operational webhook (e.g., Slack, Discord, or Microsoft Teams channel dedicated to `#rentipid-ops-alerts` or `#security-alerts`).
2. **Secondary Alert Sink:** Operational email notification to an approved administrative mailbox (e.g., `ops@rentipid.com.ph` or `alerts@rentipid.com.ph`) via existing SMTP capabilities or GitHub Action notification hooks.
3. **Tertiary Alert Sink (Native):** Fail-closed GitHub Actions job failure (automatically triggers GitHub notification to repository administrators on workflow failure).

*Requirement:* The Project Owner must designate the operational alert destination (webhook URL or mailbox) before alert integration can be enabled. *(Adopted by Project Owner in M4-D3: Native GitHub Actions workflow status + Deduplicated GitHub Issue in repository)*.

---

## 8. Fail-Closed & Fail-Safe Operational Behavior

In accordance with RENTipid universal security standards, the monitoring control must **never silently report success** when evidence cannot be acquired. Inability to verify backup health is itself an operational incident.

| Operational Scenario | Internal Evaluation | Exit Code | Alert Dispatched? | Severity | Remediation Action |
|---|---|---|---|---|---|
| **A. Healthy State** | All signals valid, state == 'ready', evidence age $\le$ 30m | `0` | No | `NONE` | Log metric to execution summary. |
| **B. Stale Monitoring Evidence / Unhealthy State** | Evidence age > 30m OR `current_state != 'ready'` OR retention < 30 days | `1` | **YES** | `CRITICAL` | Create/update tracking issue; alert operations lead. |
| **C. Provider API Unavailable** | HTTP 5xx, gateway timeout, DNS failure after 3 retries | `1` | **YES** | `HIGH` | Alert: "Neon Control Plane API unreachable; backup health unverified". |
| **D. Credentials Unavailable / Invalid** | HTTP 401 / 403 or missing `NEON_API_KEY` | `1` | **YES** | `CRITICAL` | Alert: "Monitoring authentication failure; API key revoked or expired". |
| **E. Malformed Provider Response** | JSON parse failure or unexpected schema mutation | `1` | **YES** | `HIGH` | Alert: "Provider API schema contract violation". |
| **F. Monitoring Runner Execution Failure** | GitHub Actions runner cancellation or memory error | Non-zero | **YES (Native)** | `HIGH` | GitHub native workflow failure notification dispatches to admin. |

---

## 9. Human Ownership & Operational Accountability Reconciliation

### Governance Control Matrix Alignment (`ISO_CONTROL_OWNERSHIP_MATRIX.md`):
* **Control Domain 18 (Backup & Recovery):**
  * Accountable Role: `Database Administrator`
  * Supervisory Support: `Cloud Operations Lead`
  * Current Repository State: `ROLE ASSIGNMENT REQUIRED`
* **Control Domain 17 / 20 (Cloud Operations & Incident Response):**
  * Accountable Role: `Cloud Operations Lead`
  * Current Repository State: `ROLE ASSIGNMENT REQUIRED`

### Human Evidence Reconciliation Requirements:
1. **Decision Authority:** The Project Owner holds sole constitutional authority to accept risk, approve thresholds, and authorize technical changes. Project Owner authorization is **sufficient to implement technical monitoring tooling**.
2. **Control Closure Requirement:** To close the human operational governance gate of `RSK-22` / `SOA-18`, formal documented evidence assigning named personnel to the `Database Administrator` and `Cloud Operations Lead` roles (or an explicit formal delegation memorandum) is required.

---

## 10. Evaluation of Implementation Options

Three technical architectures were evaluated for executing the monitoring control:

| Evaluation Dimension | Option 1: Scheduled GitHub Actions Workflow (Recommended) | Option 2: Vercel Cron Endpoint | Option 3: AWS EventBridge + Lambda + SNS |
|---|---|---|---|
| **Mechanism** | GitHub Actions workflow (`.github/workflows/backup-freshness-monitor.yml`) running scheduled Node.js script. | Next.js API route (`src/app/api/cron/backup-freshness`) triggered by Vercel Cron. | AWS EventBridge cron triggering Lambda function with SNS topic alerts. |
| **Affected Files** | `.github/workflows/backup-freshness-monitor.yml`, `scripts/monitoring/check-backup-freshness.ts`. | `vercel.json`, `src/app/api/cron/backup-freshness/route.ts`. | Terraform files in `infrastructure/`, Lambda handler script. |
| **Production App Affected?** | **NO** (Zero application code or production deployment impact). | **YES** (Requires deploying code to production Vercel application). | **NO** (Independent AWS cloud infrastructure). |
| **Production DB Affected?** | **NO** (Interacts strictly with Neon Management API read-only). | **NO** (Management API read-only). | **NO** (Management API read-only). |
| **Secrets Required** | `NEON_API_KEY` (read-only project token in GitHub secrets) + Alert Webhook. | `NEON_API_KEY` + `CRON_SECRET` in Vercel environment variables. | AWS IAM roles, Secrets Manager secret, SNS subscriber permissions. |
| **New Service Provisioned?** | **NO** (Reuses existing GitHub Actions infrastructure). | **NO** (Uses existing Vercel project). | **YES** (Requires provisioning AWS Lambda, EventBridge, SNS). |
| **Operating Cost** | **$0.00** (Free within GitHub Actions tier). | Minimal serverless execution. | ~$1–$5/month for Secrets Manager, Lambda, and CloudWatch. |
| **Failure Detection** | **High** (Directly evaluates Neon API status and calculates age). | **Medium** (Subject to Vercel runtime constraints). | **High** (Independent cloud monitor). |
| **Alert Capability** | **High** (Webhooks, email, and native GitHub failure alerts). | **Medium** (Webhook/email dispatch from serverless function). | **Very High** (SNS SMS, email, PagerDuty, EventBridge). |
| **ISO Auditability** | **Extremely High** (Permanent, tamper-evident GitHub Actions execution logs). | **Medium** (Transient serverless logs require external log drain). | **High** (CloudWatch logs). |
| **Maintenance Burden** | **Very Low** (Self-contained script in version control). | **Medium** (Integrated into web application build/bundle). | **High** (Separate cloud infrastructure to manage). |

### Selected Architecture:
**Option 1: Scheduled GitHub Actions Workflow** is unanimously selected as the minimum safe, cost-free, auditable, and non-disruptive implementation.

---

## 11. Change-Control & Decision Classification

In accordance with Section 11 of the governing mandate, the resulting M4 remediation status is classified as:

### **`E. MULTIPLE OF B/C/D REQUIRED`**
Specifically:
* **Item B — Project Owner Policy Decision Required:**
  1. Adoption of formal RPO threshold (e.g. 24 hours vs 6 hours).
  2. Adoption of retention policy (accepting 6-hour continuous PITR vs authorizing extension to 7/30 days via Neon subscription or scheduled snapshots).
* **Item C — Human Operational Evidence Required:**
  1. Provision of an approved operational notification destination (webhook URL or operational email address).
  2. Formal personnel assignment to `Database Administrator` and `Cloud Operations Lead` roles.

---

## 12. Prior Milestone Progression Summary

Following the adoption of Project Owner policy decisions in Work Package `ISO-C2-M4-D3`:
1. RPO is codified at $\le 60$ minutes.
2. Monitoring cadence is codified at 15 minutes.
3. Retention requirement is codified at $\ge 30$ days (2,592,000 seconds).
4. Operational role accountability was enacted by top management.
5. GitHub Actions + deduplicated GitHub Issues architecture was approved.

---

## 13. Reconciled Provider-Native Implementation Model & Acceptance Criteria (ISO-C2-M4-D4-R1)

### 13.1 Root Cause of Codex Package ISO-C2-M4-D4-E1 Blocker
The preceding technical implementation package `ISO-C2-M4-D4-E1` halted correctly because no supported Neon control-plane field could be validated as a "latest recoverable point timestamp". The system properly refused to invent a synthetic metric from `branch.updated_at`, deployment timestamps, or application activity.

### 13.2 Architectural Reconciliation: Provider-Native Continuity State
Neon does not operate on periodic snapshot creation; it continuously streams WAL to distributed Safekeepers and Pageservers. Consequently:
* **`RECOVERABLE POINT TIMESTAMP: NOT EXPOSED BY PROVIDER API`** is recognized as an accepted architectural fact, not a defect in RENTipid.
* **`branch.updated_at` IS NOT A RECOVERABILITY SIGNAL**: It reflects only control-plane configuration changes.
* **`PROVIDER OPERATION FAILURE SIGNAL: NOT RELIABLE FOR M4`**: `operations list` tracks compute lifecycle tasks (e.g. `start_compute`, `suspend_compute`) and does not reflect WAL persistence.
* **Amended Meaning of 30-Minute Threshold:** Formally amended from backup snapshot freshness to **`MONITORING EVIDENCE FRESHNESS THRESHOLD: <= 30 MINUTES`**. The automated monitor must obtain valid provider health evidence at least once within every 30-minute window; failure to do so fails closed and triggers an alert.

### 13.3 Architectural Separation of RSK-22 and RSK-23
* **RSK-22 (Operational Monitoring):** Proves that provider-native PITR capability is enabled, 30-day retention is configured, provider control plane is healthy, and automated monitoring regularly asserts continuity health with fail-closed alerting.
* **RSK-23 (Provider Recovery Assurance):** Proves actual recovery execution against real provider backups via governed restore drills. Governed strictly under Phase `ISO-C3`.

### 13.4 Acceptance Criteria to Transition RSK-22 to PROVEN — OPERATING CONFORMITY
1. **Retention Remediated:** Live Neon branch `rentipid-production` (`br-proud-sunset-ap0ofil2`) updated to `history_retention_seconds: 2592000` (30 days) under separate commercial authorization.
2. **Target Reconfirmed:** Project `holy-shape-01357429` and branch `br-proud-sunset-ap0ofil2` verified active.
3. **Monitor Implemented:** `scripts/monitoring/check-backup-freshness.ts` and `.github/workflows/backup-freshness-monitor.yml` committed to repository.
4. **Active on Default Branch:** Workflow active on `main` branch.
5. **Scheduled Execution Observed:** Real GitHub Actions scheduled runs executed at 15-minute intervals.
6. **Alert Path Verified:** Deduplicated GitHub Issue creation on failure and auto-resolution on healthy recovery proven.
7. **Healthy Scheduled Run:** At least one healthy operating run recorded in GitHub Actions.
8. **Fail-Closed Contract Proven:** Script demonstrably exits code 1 on API errors, bad credentials, missing fields, or unhealthy states.
9. **Zero Silent Failures:** No error suppression or false PASS.
