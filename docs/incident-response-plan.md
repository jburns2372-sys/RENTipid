# Beta Incident Response & Rollback Plan

## Incident Response Levels

### Low (Cosmetic/Minor Bug)
* **Response**: Log as `BetaFeedback` or `IssueTicket`.
* **Action**: Fix in next patch cycle.

### Medium (Non-critical Workflow Broken)
* **Response**: Alert Admins. Open `IssueTicket` with High priority.
* **Action**: Provide workaround in `/beta-guide`. Hotfix within 24-48 hours.

### High (Data Leak, Unauthorized Access, Major Workflow Failure)
* **Response**: Escalate to Super Admin immediately.
* **Action**: 
  - Super Admin uses Beta Controls to disable affected module (e.g., disable bookings).
  - Suspend affected users to preserve evidence.

### Critical (Widespread DB corruption, Mock Guardrail Failure)
* **Response**: Invoke Emergency Rollback Plan.

---

## Rollback Execution

1. **Lockdown**: Super Admin immediately toggles `BETA_PUBLIC_REGISTRATION` and all other Beta Controls to OFF.
2. **Maintenance Mode**: Redirect traffic to static maintenance page via Vercel/Nginx.
3. **Database Restore**: 
   - Identify time of corruption.
   - Restore PostgreSQL from latest hourly snapshot.
4. **Audit**: Review `AuditLog` and `SystemErrorLog` to identify the vector.
5. **Restart**: Require Super Admin authorization to resume beta operations.
