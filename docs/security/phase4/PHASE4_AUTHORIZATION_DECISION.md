# PHASE 4 AUTHORIZATION DECISION

## Decision
APPROVED IN PRINCIPLE:
- SOC Analyst
- SOC Supervisor

These dedicated roles are approved for the Phase 4 authorization architecture.

## SOC Analyst
Permitted responsibilities:
- View assigned SecurityAlerts
- View assigned incident cases
- Triage cases
- Investigate cases
- Add privacy-safe evidence and comments
- Recommend responses
- Execute approved Level 1 investigation procedures

Prohibited responsibilities:
- Activate threat rules
- Approve own high-impact recommendation
- Execute Level 3 or Level 4 action without approval
- Modify financial records
- Change KYC status
- Activate emergency controls
- Change application roles or permissions

## SOC Supervisor
Permitted responsibilities:
- View SOC operations
- Assign cases
- Validate analyst investigation
- Escalate cases
- Review recommendations
- Approve eligible Level 2 actions
- Oversee simulation and maintenance activity

Prohibited responsibilities:
- Self-approve own high-impact recommendation
- Independently approve financial restrictions
- Independently approve KYC decisions
- Independently activate emergency controls
- Bypass dual control

## Existing roles
Compliance Admin:
- Compliance and KYC response approval
- Privacy-related case review
- No financial approval unless separately authorized

Finance Admin:
- Payment, payout, refund, and financial restriction approval
- No KYC or general security override

Super Admin:
- Platform security oversight
- Threat-rule activation authority where approved
- Selected Level 3 or Level 4 approval
- No default permission to bypass dual control
- No automatic right to approve their own recommendation

## Separation of Duties
A person who recommends a Level 3 or Level 4 response may not be the sole approver or executor of that response.

## Preliminary Permission Groups (Not Implemented)
- `security.cases.*`
- `security.playbooks.*`
- `security.responses.*`
- `security.simulations.*`
- `security.maintenance.*`
- `security.threat_rules.*`

## ROLE IMPLEMENTATION STATUS
APPROVED FOR ARCHITECTURE — NOT YET IMPLEMENTED

## Future Implementation Requirements
- Prisma Role enum assessment
- Migration impact
- Existing-user compatibility
- NextAuth session compatibility
- JWT invalidation or session-version impact
- Permission vocabulary
- Role-permission mapping
- Sidebar and route access
- Test fixtures
- UAT accounts
- Rollback procedure
