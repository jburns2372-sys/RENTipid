# Chapter 13 — Administrative and Operations Manual

## 13.1 Super Admin Capabilities

The Super Admin role (`SUPER_ADMIN`) possesses the highest level of authorization within RENTipid. This role is strictly separated from daily operational tasks and is reserved for structural system management.

Key capabilities include:
- **Feature Toggles:** Activating or deactivating system-wide features via the `SystemSettings` module.
- **Emergency Incident Response:** Deploying the `EMERGENCY_FREEZE` playbook to halt all financial transactions and logins during a severe threat.
- **Role Assignment:** Granting or revoking administrative privileges for other staff members.

## 13.2 General Administrative Dashboard

General Admins monitor the overall health of the marketplace. Their primary responsibilities include:

### 13.2.1 Listing Moderation
Admins review listings flagged by the system or other users. 
- High-risk categories (e.g., Heavy Equipment) are automatically queued in the `Pending Approval` state.
- Admins verify that photos match descriptions and that no prohibited items are listed.

### 13.2.2 Support and Issue Tickets
Renters and Providers can submit `SupportTicket` or `IssueTicket` requests for general platform help. Admins resolve these tickets or escalate them to specialized departments (e.g., Finance or Compliance).

### 13.2.3 Category Management
Admins define the global rental taxonomy by adding or modifying `Category` models. They can enforce dynamic `CategoryRequirement` rules, such as requiring extra insurance documentation for specific categories.

## 13.3 Audit Logging and Traceability

Every significant administrative action is recorded in the `AuditLog`.
- Actions like approving a listing, resolving a ticket, or modifying a user's role are permanently logged.
- The logs capture the `actorId`, `targetId`, `actionType`, and a JSON payload of the changes.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `AuditLog`, `SystemSetting` | Operations models | Verified |
| REPO-005 | `src/app/dashboard/admin` | General Admin Routes | Admin interface | Verified |
| REPO-005 | `src/app/dashboard/super-admin` | Super Admin Routes | Master interface | Verified |

## Related Chapters
- Chapter 3: User Roles
- Chapter 16: Security Operations Center
