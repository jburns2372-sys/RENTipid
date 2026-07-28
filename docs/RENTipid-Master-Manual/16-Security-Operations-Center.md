# Chapter 16 — Security Operations Center (SOC)

## 16.1 SOC Purpose and Architecture

The RENTipid Security Operations Center (SOC) is an internal subsystem designed to detect, analyze, and respond to platform abuse, financial fraud, and behavioral anomalies. 

The SOC architecture is event-driven:
1. **Event Ingestion:** Core application modules emit normalized `SecurityEvent` payloads (e.g., `PAYMENT_FAILED`, `LOGIN_ANOMALY`).
2. **Rule Evaluation:** A continuous engine evaluates events against defined `DetectionRule` heuristics.
3. **Alert Generation:** If a rule triggers, a `SecurityAlert` is generated.
4. **Case Management:** Related alerts are grouped into an `IncidentCase` for human investigation.
5. **Response Execution:** Analysts deploy predefined `SecurityResponsePlaybook` actions to mitigate the threat.

## 16.2 SOC Roles and Hierarchy

- **SOC Analyst (`SOC_ANALYST`):** Triage alerts, investigate incident cases, and execute low-risk playbooks (e.g., triggering a password reset).
- **SOC Supervisor (`SOC_SUPERVISOR`):** Oversee analysts, approve high-risk playbook executions (e.g., account suspension), and manage detection rules.

## 16.3 Behavioral Risk Intelligence

The SOC includes a `BehavioralRiskAssessment` module. It aggregates multiple `BehavioralRiskSignal` events (e.g., rapid consecutive booking cancellations, using known VPN IPs) to calculate a cumulative risk score for a user. If the score exceeds the threshold, the system automatically escalates the user for manual review.

## 16.4 Security Response Playbooks

Playbooks are predefined sequences of mitigation actions:
- **`ACCOUNT_LOCKDOWN`**: Invalidates active sessions and suspends the account.
- **`PAYMENT_FREEZE`**: Halts all outbound simulated payouts for a specific user.
- **`REQUIRE_STEP_UP_AUTH`**: Forces the user to re-authenticate or perform MFA before their next action.

*Execution Control:* High-impact actions require multi-party authorization via the `SecurityResponseApprovalRequest` workflow. A SOC Analyst proposes the execution, and a SOC Supervisor must approve it before the system executes the state change.

## 16.5 The Emergency Freeze Protocol

In the event of a catastrophic platform vulnerability or mass exploitation, a Super Admin can trigger a `SYSTEM_WIDE_FREEZE`. This instantly halts:
- All new logins.
- All payment capture and mock escrow releases.
- All listing modifications.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `SecurityEvent`, `IncidentCase`, `SecurityResponsePlaybook` | SOC Data Architecture | Verified |
| REPO-005 | `src/app/dashboard/admin/security` | SOC Dashboard Routes | Operations UI | Verified |
| REPO-007 | `docs/soc` | SOC Documentation | Design Specifications | Verified |

## Related Chapters
- Chapter 13: Administrative and Operations Manual
- Chapter 39: Event-Driven Architecture
