# Final Owner Authorization Matrix

This matrix governs PHASE 17, PHASE 19, and PHASE 19B. All PHASE5 entries are completed, closed, frozen, and excluded.

| Role | Required decision | Evidence required | Authorized action | Prohibited action |
|---|---|---|---|---|
| Owner | Confirm the actual production database connection path and issue final Go/No-Go decisions | Sanitized connection-path evidence; readiness and security sign-off | Unblock later PHASE 17 provisioning and separately approved production actions | Treating Azure PostgreSQL availability as proof of connectivity |
| Database Administrator | Approve and provision PHASE 17 read-only access after architecture resolution | Confirmed `rentipid-postgres-db` / `rentipid_db` path, schema, firewall/network path, restore readiness | Dedicated expiring read-only role | Writes, cleanup, test/shadow database deletion, or provisioning before unblock |
| Security Administrator | Approve network, firewall, secret-delivery, and least-privilege controls | Public-access review, firewall evidence, Key Vault access-policy review | Approve controlled audit path | Raw secret exposure or uncontrolled public access |
| Infrastructure Administrator | Verify Vercel/Azure configuration boundaries | Owner-confirmed Vercel scopes, no deployed Container App, Azure inventory | Sanitized configuration confirmation | Claiming an undeployed backend is active |
| Payment Gateway Administrator | Correct payment environment scopes and manage live keys/webhooks | Production-only live-secret policy; Preview sandbox evidence | Separately authorized Production secret injection | Live secrets or live mode in Preview |
| Finance | Approve PHASE 19 pilot limits and reconciliation | Gateway readiness and approved pilot budget | Approved pilot transactions after prerequisites | Transactions above approved limits |
| Legal and Compliance | Approve live-payment and participant controls | Terms, KYC/AML, and participant evidence | Approved pilot participation | Unauthorized or restricted transactions |

## Current Decisions

- Architecture: `HYBRID_OR_UNRESOLVED`
- PHASE 17: `BLOCKED_ARCHITECTURE_RESOLUTION`
- Azure Container App deployed: NO
- Direct production database connection confirmed: NO
- Neon active: NOT CONFIRMED
- PayMongo Preview-scope risk: RECORDED - REMEDIATION REQUIRED

No entry in this matrix authorizes database access, role creation, deployment, infrastructure modification, secret retrieval, or live payment execution by itself.
