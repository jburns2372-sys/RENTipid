# AI CASE STATE MODEL

## STATUS ENUMERATION
The `AiSupportCase` lifecycle enforces the following strict statuses:

- `OPEN`: Initial state upon creation.
- `UNDERSTANDING`: AI is collecting initial intent from the user.
- `DIAGNOSING`: AI is analyzing the issue context and internal systems.
- `AWAITING_EVIDENCE`: Waiting for the user to upload required documents.
- `AWAITING_USER_CONFIRMATION`: Waiting for explicit user approval for a binding action.
- `POLICY_EVALUATION`: Evaluating the deterministic policy rules (e.g. thresholds, eligibility).
- `EXECUTING`: The AiToolGateway is executing the confirmed action.
- `VERIFYING`: Confirming the successful outcome of the execution.
- `SAFE_HOLD`: An exception occurred, or human/system intervention is required.
- `RESOLVED`: The case issue has been successfully resolved.
- `CLOSED`: The case is completely finalized.
- `SYSTEM_BLOCKED`: Action prohibited by guardrails or policy violations.

## SEVERITY
- `low`
- `medium`
- `high`
- `critical`

## RISK LEVEL
- `safe`
- `consequential`
- `external`
