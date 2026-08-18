# Phase 5L: Disaster Recovery Runbook

## Incident Declaration
- Invoked upon confirmed loss of production data, cloud service outage, or critical configuration corruption.

## Roles
- **Technical Incident Commander**: Leads the recovery process.
- **Application Owner**: Validates application state post-recovery.
- **Security Owner**: Validates security controls and containment.
- **Database Owner**: Executes the data restoration.
- **Communications Owner**: Manages internal and external messaging.

## Service Isolation
- Immediately halt production traffic to prevent partial state corruption.
- Revoke compromised credentials if applicable.

## Recovery Decision Tree
- Assess whether point-in-time recovery (PITR) or full infrastructure recreation is necessary.
- If infrastructure is lost, execute Terraform IaC from the last known good state.

## Infrastructure Recreation
- Use approved Terraform configurations from infrastructure/environments/prod.
- **Do not apply without peer review.**

## Database Recovery
- Restore the database to the designated point-in-time.

## Secret-Reference Recovery
- Rotate secrets via Azure Key Vault.
- Update Container App environment variables.

## Validation Before Reopening
- Perform complete data reconciliation.
- Test authentication and core workflows internally.

## Rollback and Escalation
- If the restored environment is unstable, declare a failed recovery and escalate to executive leadership.
